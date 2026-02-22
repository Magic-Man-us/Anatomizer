use tree_sitter::Tree;

use crate::util::{collect_nodes_of_kind, count_statements, node_text, truncate_detail, MAX_DETAIL_LEN};
use crate::{
    AccessType, AllocationSite, AllocationType, AsyncOperation, FunctionDef, LanguageParser,
    LockKind, LockOperation, LoopConstruct, LoopKind, ParsedCode, SharedAccess, VariableDecl,
};

pub struct RustParser;

/// Primitive types that live on the stack.
const PRIMITIVE_TYPES: &[&str] = &[
    "i8", "i16", "i32", "i64", "i128", "isize", "u8", "u16", "u32", "u64", "u128", "usize",
    "f32", "f64", "bool", "char",
];

/// Size hints for primitive types (bytes).
fn primitive_size_hint(type_name: &str) -> Option<&'static str> {
    match type_name {
        "bool" => Some("1 B"),
        "i8" | "u8" => Some("1 B"),
        "i16" | "u16" => Some("2 B"),
        "i32" | "u32" | "f32" | "char" => Some("4 B"),
        "i64" | "u64" | "f64" | "isize" | "usize" => Some("8 B"),
        "i128" | "u128" => Some("16 B"),
        _ => None,
    }
}

/// Heap-allocating constructors: (function text pattern, name, size hint, detail).
const HEAP_CONSTRUCTORS: &[(&str, &str, &str, &str)] = &[
    ("Box::new", "Box::new", "8+ B", "heap-allocated Box"),
    ("Vec::new", "Vec::new", "24+ B", "heap-allocated Vec"),
    (
        "String::new",
        "String::new",
        "24+ B",
        "heap-allocated String",
    ),
    (
        "String::from",
        "String::from",
        "24+ B",
        "heap-allocated String",
    ),
    ("Rc::new", "Rc::new", "8+ B", "reference-counted allocation"),
    (
        "Arc::new",
        "Arc::new",
        "8+ B",
        "atomic reference-counted allocation",
    ),
    (
        "HashMap::new",
        "HashMap::new",
        "48+ B",
        "heap-allocated HashMap",
    ),
    (
        "HashSet::new",
        "HashSet::new",
        "48+ B",
        "heap-allocated HashSet",
    ),
];

/// Heap-allocating macros.
const HEAP_MACROS: &[(&str, &str, &str, &str)] = &[
    ("vec", "vec!", "24+ B", "heap-allocated Vec via macro"),
    (
        "format",
        "format!",
        "24+ B",
        "heap-allocated String via macro",
    ),
];

// ---------------------------------------------------------------------------
// extract_params -- parameters of a function_item
// ---------------------------------------------------------------------------

fn extract_params(func_node: &tree_sitter::Node<'_>, code: &str) -> Vec<String> {
    let Some(params_node) = func_node.child_by_field_name("parameters") else {
        return vec![];
    };

    let mut params = Vec::new();
    for i in 0..params_node.named_child_count() {
        let Some(child) = params_node.named_child(i) else {
            continue;
        };
        match child.kind() {
            // `self`, `&self`, `&mut self`, `mut self`
            "self_parameter" => {
                // Skip self parameters entirely.
            }
            // Regular parameter: `x: Type`
            "parameter" => {
                if let Some(pattern) = child.child_by_field_name("pattern") {
                    let name = node_text(pattern, code);
                    // Strip leading `mut ` if present (e.g. `mut x: i32`)
                    let name = name.strip_prefix("mut ").unwrap_or(name);
                    params.push(name.to_string());
                }
            }
            _ => {}
        }
    }
    params
}

// ---------------------------------------------------------------------------
// extract_call_names -- function/method names called within a subtree
// ---------------------------------------------------------------------------

fn extract_call_names(body_node: tree_sitter::Node<'_>, code: &str) -> Vec<String> {
    let mut names = Vec::new();

    // Regular call expressions: foo(), Bar::new(), obj.method(), etc.
    let call_nodes = collect_nodes_of_kind(body_node, &["call_expression"]);
    for call_node in &call_nodes {
        if let Some(func_node) = call_node.child_by_field_name("function") {
            let text = node_text(func_node, code);
            if !text.is_empty() {
                names.push(text.to_string());
            }
        }
    }

    // Macro invocations: println!(), vec![], etc.
    let macro_nodes = collect_nodes_of_kind(body_node, &["macro_invocation"]);
    for mac_node in &macro_nodes {
        if let Some(macro_name_node) = mac_node.child_by_field_name("macro") {
            let text = node_text(macro_name_node, code);
            if !text.is_empty() {
                names.push(format!("{text}!"));
            }
        }
    }

    names
}

// ---------------------------------------------------------------------------
// find_enclosing_block_end -- for RAII scope detection
// ---------------------------------------------------------------------------

fn find_enclosing_block_end(node: tree_sitter::Node<'_>) -> Option<usize> {
    let mut current = node;
    while let Some(parent) = current.parent() {
        if parent.kind() == "block" {
            return Some(parent.end_position().row + 1);
        }
        current = parent;
    }
    None
}

// ---------------------------------------------------------------------------
// Task #1: extract_functions
// ---------------------------------------------------------------------------

fn extract_functions(tree: &Tree, code: &str) -> Vec<FunctionDef> {
    let root = tree.root_node();
    let func_nodes = collect_nodes_of_kind(root, &["function_item"]);

    func_nodes
        .iter()
        .map(|node| {
            let name = node
                .child_by_field_name("name")
                .map(|n| node_text(n, code))
                .unwrap_or("anonymous")
                .to_string();

            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            let params = extract_params(node, code);

            let calls = node
                .child_by_field_name("body")
                .map(|b| extract_call_names(b, code))
                .unwrap_or_default();

            FunctionDef {
                name,
                line_start,
                line_end,
                params,
                calls,
            }
        })
        .collect()
}

// ---------------------------------------------------------------------------
// Task #2: extract_loops
// ---------------------------------------------------------------------------

fn extract_loops(tree: &Tree, code: &str) -> Vec<LoopConstruct> {
    let root = tree.root_node();
    let loop_nodes = collect_nodes_of_kind(
        root,
        &["for_expression", "while_expression", "loop_expression"],
    );

    loop_nodes
        .iter()
        .map(|node| {
            let kind = match node.kind() {
                "for_expression" => LoopKind::For,
                "while_expression" => LoopKind::While,
                "loop_expression" => LoopKind::Loop,
                _ => LoopKind::Loop,
            };

            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            let iterator = if kind == LoopKind::For {
                node.child_by_field_name("value")
                    .map(|n| node_text(n, code).to_string())
            } else {
                None
            };

            let body_complexity = node
                .child_by_field_name("body")
                .map(count_statements)
                .unwrap_or(0);

            LoopConstruct {
                kind,
                line_start,
                line_end,
                iterator,
                body_complexity,
            }
        })
        .collect()
}

// ---------------------------------------------------------------------------
// Task #3: extract_concurrency
// ---------------------------------------------------------------------------

fn extract_concurrency(
    tree: &Tree,
    code: &str,
) -> (Vec<LockOperation>, Vec<SharedAccess>, Vec<AsyncOperation>) {
    let root = tree.root_node();
    let mut locks = Vec::new();
    let mut shared = Vec::new();
    let mut async_ops = Vec::new();

    // --- Call expressions: lock(), read(), write(), thread::spawn ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        // Mutex::lock(), RwLock::read(), RwLock::write()
        if func_text.ends_with(".lock") {
            let lock_name = func_text
                .strip_suffix(".lock")
                .unwrap_or("")
                .to_string();
            let scope_end = find_enclosing_block_end(*call_node);
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name,
                line,
                scope_end,
            });
        } else if func_text.ends_with(".read") || func_text.ends_with(".write") {
            // Only treat as lock if receiver looks like an RwLock
            let receiver = func_text.rsplit_once('.').map(|(r, _)| r).unwrap_or("");
            let lower = receiver.to_lowercase();
            if lower.contains("rw") || lower.contains("lock") || lower.contains("mutex") {
                let lock_name = receiver.to_string();
                let scope_end = find_enclosing_block_end(*call_node);
                locks.push(LockOperation {
                    kind: LockKind::Acquire,
                    lock_name,
                    line,
                    scope_end,
                });
            }
        }

        // thread::spawn / std::thread::spawn
        if func_text == "thread::spawn" || func_text == "std::thread::spawn" {
            let detail = truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN);
            async_ops.push(AsyncOperation {
                kind: "thread_spawn".into(),
                line,
                detail,
            });
        }

        // .clone() on something -- mark as shared access hint
        if func_text.ends_with(".clone") {
            let receiver = func_text.strip_suffix(".clone").unwrap_or("");
            shared.push(SharedAccess {
                variable: receiver.to_string(),
                access_type: AccessType::Read,
                line,
                in_locked_region: false,
                thread_context: Some("clone".into()),
            });
        }
    }

    // --- Macro invocations: tokio::spawn!, spawn! ---
    let macros = collect_nodes_of_kind(root, &["macro_invocation"]);
    for mac_node in &macros {
        let macro_name = mac_node
            .child_by_field_name("macro")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = mac_node.start_position().row + 1;
        let detail = truncate_detail(node_text(*mac_node, code), MAX_DETAIL_LEN);

        if macro_name == "tokio::spawn" || macro_name == "spawn" {
            async_ops.push(AsyncOperation {
                kind: "spawn".into(),
                line,
                detail,
            });
        }
    }

    // --- Await expressions ---
    let awaits = collect_nodes_of_kind(root, &["await_expression"]);
    for await_node in &awaits {
        let detail = node_text(*await_node, code).to_string();
        async_ops.push(AsyncOperation {
            kind: "await".into(),
            line: await_node.start_position().row + 1,
            detail,
        });
    }

    // --- Shared access: Arc in type annotations ---
    let let_decls = collect_nodes_of_kind(root, &["let_declaration"]);
    for let_node in &let_decls {
        if let Some(type_node) = let_node.child_by_field_name("type") {
            let type_text = node_text(type_node, code);
            if type_text.contains("Arc") {
                let var_name = let_node
                    .child_by_field_name("pattern")
                    .map(|n| node_text(n, code))
                    .unwrap_or("unknown")
                    .to_string();
                shared.push(SharedAccess {
                    variable: var_name,
                    access_type: AccessType::Write,
                    line: let_node.start_position().row + 1,
                    in_locked_region: false,
                    thread_context: Some("Arc".into()),
                });
            }
        }
    }

    (locks, shared, async_ops)
}

// ---------------------------------------------------------------------------
// Task #4: extract_allocations
// ---------------------------------------------------------------------------

fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
    let root = tree.root_node();
    let mut allocs = Vec::new();

    // --- Stack allocations: let declarations with primitive types ---
    let let_decls = collect_nodes_of_kind(root, &["let_declaration"]);
    for let_node in &let_decls {
        if let Some(type_node) = let_node.child_by_field_name("type") {
            let type_text = node_text(type_node, code).trim();
            if PRIMITIVE_TYPES.contains(&type_text) {
                let var_name = let_node
                    .child_by_field_name("pattern")
                    .map(|n| node_text(n, code))
                    .unwrap_or("unknown")
                    .to_string();
                let size_hint = primitive_size_hint(type_text).map(|s| s.to_string());
                allocs.push(AllocationSite {
                    name: var_name,
                    alloc_type: AllocationType::Stack,
                    line: let_node.start_position().row + 1,
                    size_hint,
                    detail: format!("stack-allocated {type_text}"),
                });
            }
        }
    }

    // --- Heap allocations: call expressions matching known constructors ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        for &(pattern, name, size, detail) in HEAP_CONSTRUCTORS {
            if func_text == pattern {
                allocs.push(AllocationSite {
                    name: name.to_string(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: Some(size.to_string()),
                    detail: detail.to_string(),
                });
                break;
            }
        }
    }

    // --- Heap allocations: macro invocations (vec!, format!) ---
    let macros = collect_nodes_of_kind(root, &["macro_invocation"]);
    for mac_node in &macros {
        let macro_name = mac_node
            .child_by_field_name("macro")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = mac_node.start_position().row + 1;

        for &(pattern, name, size, detail) in HEAP_MACROS {
            if macro_name == pattern {
                allocs.push(AllocationSite {
                    name: name.to_string(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: Some(size.to_string()),
                    detail: detail.to_string(),
                });
                break;
            }
        }
    }

    allocs
}

// ---------------------------------------------------------------------------
// Task #5: extract_variables
// ---------------------------------------------------------------------------

fn extract_variables(tree: &Tree, code: &str) -> Vec<VariableDecl> {
    let root = tree.root_node();
    let mut vars = Vec::new();

    let let_decls = collect_nodes_of_kind(root, &["let_declaration"]);
    for let_node in &let_decls {
        let Some(pattern) = let_node.child_by_field_name("pattern") else {
            continue;
        };

        let name = node_text(pattern, code).to_string();
        let line = let_node.start_position().row + 1;

        // In tree-sitter-rust, `let mut x` has a `mutable_specifier` child node
        // as a sibling of the pattern, not wrapping it. Check all children for it.
        let is_mutable = {
            let mut found = false;
            for i in 0..let_node.child_count() {
                if let Some(child) = let_node.child(i) {
                    if child.kind() == "mutable_specifier" {
                        found = true;
                        break;
                    }
                }
            }
            found
        };

        let type_hint = let_node
            .child_by_field_name("type")
            .map(|n| node_text(n, code).to_string());

        vars.push(VariableDecl {
            name,
            line,
            type_hint,
            is_mutable,
        });
    }

    vars
}

// ---------------------------------------------------------------------------
// LanguageParser trait implementation
// ---------------------------------------------------------------------------

impl LanguageParser for RustParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_rust::LANGUAGE;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set Rust language: {e}"))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Rust code".to_string())?;

        let functions = extract_functions(&tree, code);
        let loops = extract_loops(&tree, code);
        let (locks, shared_accesses, async_ops) = extract_concurrency(&tree, code);
        let allocations = extract_allocations(&tree, code);
        let variables = extract_variables(&tree, code);

        Ok(ParsedCode {
            tree,
            functions,
            loops,
            locks,
            shared_accesses,
            async_ops,
            allocations,
            variables,
        })
    }

    fn extract_functions(tree: &Tree, code: &str) -> Vec<FunctionDef> {
        extract_functions(tree, code)
    }

    fn extract_loops(tree: &Tree, code: &str) -> Vec<LoopConstruct> {
        extract_loops(tree, code)
    }

    fn extract_concurrency(
        tree: &Tree,
        code: &str,
    ) -> (Vec<LockOperation>, Vec<SharedAccess>, Vec<AsyncOperation>) {
        extract_concurrency(tree, code)
    }

    fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
        extract_allocations(tree, code)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::LanguageParser;

    #[test]
    fn test_extract_functions_basic() {
        let code = r#"
fn greet(name: &str) {
    println!("Hello, {}", name);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 2);

        assert_eq!(parsed.functions[0].name, "greet");
        assert_eq!(parsed.functions[0].params, vec!["name"]);
        assert!(parsed.functions[0].calls.contains(&"println!".to_string()));
        assert_eq!(parsed.functions[0].line_start, 2);

        assert_eq!(parsed.functions[1].name, "add");
        assert_eq!(parsed.functions[1].params, vec!["a", "b"]);
    }

    #[test]
    fn test_extract_functions_impl_methods() {
        let code = r#"
struct Counter {
    value: i32,
}

impl Counter {
    fn new() -> Self {
        Counter { value: 0 }
    }

    fn increment(&mut self) {
        self.value += 1;
    }

    fn get_value(&self) -> i32 {
        self.value
    }
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 3);

        assert_eq!(parsed.functions[0].name, "new");
        assert!(
            parsed.functions[0].params.is_empty(),
            "new has no self param"
        );

        assert_eq!(parsed.functions[1].name, "increment");
        assert!(
            parsed.functions[1].params.is_empty(),
            "&mut self should be excluded"
        );

        assert_eq!(parsed.functions[2].name, "get_value");
        assert!(
            parsed.functions[2].params.is_empty(),
            "&self should be excluded"
        );
    }

    #[test]
    fn test_extract_loops_for() {
        let code = r#"
fn main() {
    for i in 0..10 {
        println!("{}", i);
    }
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert_eq!(parsed.loops[0].iterator, Some("0..10".to_string()));
    }

    #[test]
    fn test_extract_loops_while() {
        let code = r#"
fn main() {
    let mut x = 0;
    while x < 10 {
        x += 1;
    }
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let while_loops: Vec<_> = parsed
            .loops
            .iter()
            .filter(|l| l.kind == LoopKind::While)
            .collect();
        assert_eq!(while_loops.len(), 1);
        assert!(while_loops[0].iterator.is_none());
    }

    #[test]
    fn test_extract_loops_loop() {
        let code = r#"
fn main() {
    loop {
        break;
    }
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::Loop);
    }

    #[test]
    fn test_extract_concurrency_mutex_lock() {
        let code = r#"
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(0);
    let guard = m.lock().unwrap();
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let acquire_locks: Vec<_> = parsed
            .locks
            .iter()
            .filter(|l| l.kind == LockKind::Acquire)
            .collect();
        assert!(
            !acquire_locks.is_empty(),
            "expected at least one lock acquire"
        );
        assert_eq!(acquire_locks[0].lock_name, "m");
    }

    #[test]
    fn test_extract_concurrency_thread_spawn() {
        let code = r#"
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        println!("Hello from thread!");
    });
    handle.join().unwrap();
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let spawns: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "thread_spawn")
            .collect();
        assert_eq!(spawns.len(), 1);
    }

    #[test]
    fn test_extract_concurrency_await() {
        let code = r#"
async fn fetch_data() -> String {
    let result = client.get("http://example.com").await;
    result.text().await
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let await_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "await")
            .collect();
        assert!(
            await_ops.len() >= 2,
            "expected at least 2 await ops, got {}",
            await_ops.len()
        );
    }

    #[test]
    fn test_extract_concurrency_arc_shared() {
        let code = r#"
use std::sync::Arc;

fn main() {
    let data: Arc<i32> = Arc::new(42);
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let arc_accesses: Vec<_> = parsed
            .shared_accesses
            .iter()
            .filter(|a| a.thread_context == Some("Arc".into()))
            .collect();
        assert!(!arc_accesses.is_empty(), "expected Arc shared access");
    }

    #[test]
    fn test_extract_allocations_stack() {
        let code = r#"
fn main() {
    let x: i32 = 42;
    let y: f64 = 3.14;
    let flag: bool = true;
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let stack_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.alloc_type == AllocationType::Stack)
            .collect();
        assert_eq!(stack_allocs.len(), 3, "expected 3 stack allocations");

        let i32_alloc = stack_allocs.iter().find(|a| a.name == "x");
        assert!(i32_alloc.is_some(), "expected x allocation");
        assert_eq!(i32_alloc.unwrap().size_hint, Some("4 B".to_string()));
    }

    #[test]
    fn test_extract_allocations_heap_constructors() {
        let code = r#"
fn main() {
    let b = Box::new(42);
    let v = Vec::new();
    let s = String::from("hello");
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let heap_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.alloc_type == AllocationType::Heap)
            .collect();
        assert!(
            heap_allocs.len() >= 3,
            "expected at least 3 heap allocations, got {}",
            heap_allocs.len()
        );

        let box_alloc = heap_allocs.iter().find(|a| a.name == "Box::new");
        assert!(box_alloc.is_some(), "expected Box::new allocation");

        let vec_alloc = heap_allocs.iter().find(|a| a.name == "Vec::new");
        assert!(vec_alloc.is_some(), "expected Vec::new allocation");

        let string_alloc = heap_allocs.iter().find(|a| a.name == "String::from");
        assert!(string_alloc.is_some(), "expected String::from allocation");
    }

    #[test]
    fn test_extract_allocations_heap_macros() {
        let code = r#"
fn main() {
    let v = vec![1, 2, 3];
    let s = format!("hello {}", 42);
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        let heap_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.alloc_type == AllocationType::Heap)
            .collect();
        assert!(
            heap_allocs.len() >= 2,
            "expected at least 2 heap allocations from macros"
        );

        let vec_alloc = heap_allocs.iter().find(|a| a.name == "vec!");
        assert!(vec_alloc.is_some(), "expected vec! allocation");

        let format_alloc = heap_allocs.iter().find(|a| a.name == "format!");
        assert!(format_alloc.is_some(), "expected format! allocation");
    }

    #[test]
    fn test_extract_variables_let() {
        let code = r#"
fn main() {
    let x: i32 = 10;
    let mut y = 20;
    let z = "hello";
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert!(parsed.variables.len() >= 3, "expected at least 3 variables");

        let var_x = parsed.variables.iter().find(|v| v.name == "x");
        assert!(var_x.is_some(), "expected variable x");
        assert!(!var_x.unwrap().is_mutable);
        assert_eq!(var_x.unwrap().type_hint, Some("i32".to_string()));

        let var_y = parsed.variables.iter().find(|v| v.name == "y");
        assert!(var_y.is_some(), "expected variable y");
        assert!(var_y.unwrap().is_mutable);
    }

    #[test]
    fn test_extract_variables_immutable() {
        let code = r#"
fn main() {
    let name = "world";
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.variables.len(), 1);
        assert_eq!(parsed.variables[0].name, "name");
        assert!(!parsed.variables[0].is_mutable);
    }

    #[test]
    fn test_empty_code() {
        let parsed = RustParser::parse("").expect("parse failed");
        assert!(parsed.functions.is_empty());
        assert!(parsed.loops.is_empty());
        assert!(parsed.locks.is_empty());
        assert!(parsed.shared_accesses.is_empty());
        assert!(parsed.async_ops.is_empty());
        assert!(parsed.allocations.is_empty());
        assert!(parsed.variables.is_empty());
    }

    #[test]
    fn test_all_loop_types() {
        let code = r#"
fn main() {
    for i in vec.iter() {
        println!("{}", i);
    }
    while running {
        check();
    }
    loop {
        if done { break; }
    }
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 3);

        let kinds: Vec<_> = parsed.loops.iter().map(|l| l.kind.clone()).collect();
        assert!(kinds.contains(&LoopKind::For));
        assert!(kinds.contains(&LoopKind::While));
        assert!(kinds.contains(&LoopKind::Loop));
    }

    #[test]
    fn test_function_with_calls() {
        let code = r#"
fn process() {
    let data = fetch_data();
    let result = transform(data);
    println!("done: {}", result);
    save(result);
}
"#;
        let parsed = RustParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 1);
        let calls = &parsed.functions[0].calls;
        assert!(calls.contains(&"fetch_data".to_string()));
        assert!(calls.contains(&"transform".to_string()));
        assert!(calls.contains(&"println!".to_string()));
        assert!(calls.contains(&"save".to_string()));
    }
}
