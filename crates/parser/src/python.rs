use tree_sitter::Tree;

use crate::util::{collect_nodes_of_kind, count_statements, node_text, truncate_detail, MAX_DETAIL_LEN};
use crate::{
    AccessType, AllocationSite, AllocationType, AsyncOperation, FunctionDef, LanguageParser,
    LockKind, LockOperation, LoopConstruct, LoopKind, ParsedCode, SharedAccess, VariableDecl,
};

pub struct PythonParser;

// ---------------------------------------------------------------------------
// extract_params — parameters of a function_definition
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
            // Plain `x`
            "identifier" => {
                let name = node_text(child, code);
                if name != "self" && name != "cls" {
                    params.push(name.to_string());
                }
            }
            // `x: int`
            "typed_parameter" => {
                if let Some(name_node) = child.child_by_field_name("name") {
                    let name = node_text(name_node, code);
                    if name != "self" && name != "cls" {
                        params.push(name.to_string());
                    }
                }
            }
            // `x=5`
            "default_parameter" => {
                if let Some(name_node) = child.child_by_field_name("name") {
                    let name = node_text(name_node, code);
                    if name != "self" && name != "cls" {
                        params.push(name.to_string());
                    }
                }
            }
            // `x: int = 5`
            "typed_default_parameter" => {
                if let Some(name_node) = child.child_by_field_name("name") {
                    let name = node_text(name_node, code);
                    if name != "self" && name != "cls" {
                        params.push(name.to_string());
                    }
                }
            }
            // *args
            "list_splat_pattern" => {
                let text = node_text(child, code);
                params.push(text.to_string());
            }
            // **kwargs
            "dictionary_splat_pattern" => {
                let text = node_text(child, code);
                params.push(text.to_string());
            }
            _ => {}
        }
    }
    params
}

// ---------------------------------------------------------------------------
// extract_call_names — function/method names called within a subtree
// ---------------------------------------------------------------------------

fn extract_call_names(body_node: tree_sitter::Node<'_>, code: &str) -> Vec<String> {
    let call_nodes = collect_nodes_of_kind(body_node, &["call"]);
    let mut names = Vec::new();
    for call_node in &call_nodes {
        if let Some(func_node) = call_node.child_by_field_name("function") {
            let text = node_text(func_node, code);
            if !text.is_empty() {
                names.push(text.to_string());
            }
        }
    }
    names
}

// ---------------------------------------------------------------------------
// Task #1: extract_functions
// ---------------------------------------------------------------------------

fn extract_functions(tree: &Tree, code: &str) -> Vec<FunctionDef> {
    let root = tree.root_node();
    let func_nodes = collect_nodes_of_kind(root, &["function_definition"]);

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
    let loop_nodes = collect_nodes_of_kind(root, &["for_statement", "while_statement"]);

    loop_nodes
        .iter()
        .map(|node| {
            let kind = match node.kind() {
                "for_statement" => LoopKind::For,
                "while_statement" => LoopKind::While,
                _ => LoopKind::While,
            };

            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            let iterator = if kind == LoopKind::For {
                node.child_by_field_name("right")
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

    // --- Call-based patterns ---
    let calls = collect_nodes_of_kind(root, &["call"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        if func_text.ends_with(".acquire") {
            let lock_name = func_text
                .strip_suffix(".acquire")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".release") {
            let lock_name = func_text
                .strip_suffix(".release")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text == "threading.Thread" || func_text == "Thread" {
            async_ops.push(AsyncOperation {
                kind: "thread_spawn".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        } else if func_text == "asyncio.gather" || func_text == "gather" {
            async_ops.push(AsyncOperation {
                kind: "async_gather".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        } else if func_text == "asyncio.create_task" || func_text == "create_task" {
            async_ops.push(AsyncOperation {
                kind: "async_task".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        }
    }

    // --- Await expressions ---
    let awaits = collect_nodes_of_kind(root, &["await"]);
    for await_node in &awaits {
        let detail = node_text(*await_node, code).to_string();
        async_ops.push(AsyncOperation {
            kind: "await".into(),
            line: await_node.start_position().row + 1,
            detail,
        });
    }

    // --- Global statements → shared access ---
    let globals = collect_nodes_of_kind(root, &["global_statement"]);
    for global_node in &globals {
        for i in 0..global_node.named_child_count() {
            if let Some(child) = global_node.named_child(i) {
                if child.kind() == "identifier" {
                    let var_name = node_text(child, code).to_string();
                    shared.push(SharedAccess {
                        variable: var_name,
                        access_type: AccessType::Write,
                        line: child.start_position().row + 1,
                        in_locked_region: false,
                        thread_context: None,
                    });
                }
            }
        }
    }

    // --- With statements (lock context managers) ---
    let withs = collect_nodes_of_kind(root, &["with_statement"]);
    for with_node in &withs {
        let with_text = node_text(*with_node, code);
        if with_text.contains("lock")
            || with_text.contains("Lock")
            || with_text.contains("mutex")
            || with_text.contains("Mutex")
        {
            let line = with_node.start_position().row + 1;
            let scope_end = Some(with_node.end_position().row + 1);
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name: "context_manager_lock".into(),
                line,
                scope_end,
            });
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name: "context_manager_lock".into(),
                line: with_node.end_position().row + 1,
                scope_end: None,
            });
        }
    }

    (locks, shared, async_ops)
}

// ---------------------------------------------------------------------------
// Task #4: extract_allocations
// ---------------------------------------------------------------------------

/// CPython object overhead constants (bytes).
const LIST_BASE_BYTES: usize = 56;
const LIST_ELEMENT_BYTES: usize = 8;
const DICT_BASE_BYTES: usize = 64;
const DICT_ENTRY_BYTES: usize = 56;
const SET_BASE_BYTES: usize = 200;
const SET_ELEMENT_BYTES: usize = 8;
const STR_BASE_BYTES: usize = 49;
const OBJECT_MIN_BYTES: usize = 64;
const QUOTE_OVERHEAD: usize = 2;

fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
    let root = tree.root_node();
    let mut allocs = Vec::new();

    // List literals
    for node in collect_nodes_of_kind(root, &["list"]) {
        let elem_count = node.named_child_count();
        let estimated = LIST_BASE_BYTES + LIST_ELEMENT_BYTES * elem_count;
        allocs.push(AllocationSite {
            name: "list".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("list with {elem_count} elements"),
        });
    }

    // Dict literals
    for node in collect_nodes_of_kind(root, &["dictionary"]) {
        let pair_count = node.named_child_count();
        let estimated = DICT_BASE_BYTES + DICT_ENTRY_BYTES * pair_count;
        allocs.push(AllocationSite {
            name: "dict".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("dict with {pair_count} entries"),
        });
    }

    // Set literals
    for node in collect_nodes_of_kind(root, &["set"]) {
        let elem_count = node.named_child_count();
        let estimated = SET_BASE_BYTES + SET_ELEMENT_BYTES * elem_count;
        allocs.push(AllocationSite {
            name: "set".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("set with {elem_count} elements"),
        });
    }

    // String literals
    for node in collect_nodes_of_kind(root, &["string"]) {
        let text = node_text(node, code);
        let content_len = text.len().saturating_sub(QUOTE_OVERHEAD);
        let estimated = STR_BASE_BYTES + content_len;
        allocs.push(AllocationSite {
            name: "str".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("string of ~{content_len} chars"),
        });
    }

    // List comprehensions
    for node in collect_nodes_of_kind(root, &["list_comprehension"]) {
        allocs.push(AllocationSite {
            name: "list_comprehension".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some("~dynamic B".into()),
            detail: "list comprehension (size depends on input)".into(),
        });
    }

    // Dict comprehensions
    for node in collect_nodes_of_kind(root, &["dictionary_comprehension"]) {
        allocs.push(AllocationSite {
            name: "dict_comprehension".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some("~dynamic B".into()),
            detail: "dict comprehension (size depends on input)".into(),
        });
    }

    // Set comprehensions
    for node in collect_nodes_of_kind(root, &["set_comprehension"]) {
        allocs.push(AllocationSite {
            name: "set_comprehension".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some("~dynamic B".into()),
            detail: "set comprehension (size depends on input)".into(),
        });
    }

    // Class instantiation (uppercase-first-letter heuristic) and known constructors
    for node in collect_nodes_of_kind(root, &["call"]) {
        let func_text = node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        if func_text
            .chars()
            .next()
            .map_or(false, |c| c.is_uppercase())
        {
            allocs.push(AllocationSite {
                name: func_text.to_string(),
                alloc_type: AllocationType::Heap,
                line: node.start_position().row + 1,
                size_hint: Some(format!("~{OBJECT_MIN_BYTES}+ B")),
                detail: format!("{func_text} instance"),
            });
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

    // Assignment statements: `x = ...`
    let assignments = collect_nodes_of_kind(root, &["assignment"]);
    for node in &assignments {
        if let Some(left) = node.child_by_field_name("left") {
            let name = node_text(left, code).to_string();
            let line = node.start_position().row + 1;
            let type_hint = node
                .child_by_field_name("type")
                .map(|n| node_text(n, code).to_string());
            vars.push(VariableDecl {
                name,
                line,
                type_hint,
                is_mutable: true,
            });
        }
    }

    // Augmented assignments: `x += ...`
    let aug_assignments = collect_nodes_of_kind(root, &["augmented_assignment"]);
    for node in &aug_assignments {
        if let Some(left) = node.child_by_field_name("left") {
            let name = node_text(left, code).to_string();
            vars.push(VariableDecl {
                name,
                line: node.start_position().row + 1,
                type_hint: None,
                is_mutable: true,
            });
        }
    }

    // For loop iterator variables
    let for_loops = collect_nodes_of_kind(root, &["for_statement"]);
    for node in &for_loops {
        if let Some(left) = node.child_by_field_name("left") {
            let name = node_text(left, code).to_string();
            vars.push(VariableDecl {
                name,
                line: node.start_position().row + 1,
                type_hint: None,
                is_mutable: true,
            });
        }
    }

    vars
}

// ---------------------------------------------------------------------------
// LanguageParser trait implementation
// ---------------------------------------------------------------------------

impl LanguageParser for PythonParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_python::LANGUAGE;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set Python language: {e}"))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Python code".to_string())?;

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
def greet(name):
    print("Hello", name)

def add(a, b):
    return a + b
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 2);

        assert_eq!(parsed.functions[0].name, "greet");
        assert_eq!(parsed.functions[0].params, vec!["name"]);
        assert_eq!(parsed.functions[0].calls, vec!["print"]);
        assert_eq!(parsed.functions[0].line_start, 2);

        assert_eq!(parsed.functions[1].name, "add");
        assert_eq!(parsed.functions[1].params, vec!["a", "b"]);
    }

    #[test]
    fn test_extract_functions_with_self() {
        let code = r#"
class Foo:
    def method(self, x):
        self.bar(x)
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 1);
        assert_eq!(parsed.functions[0].name, "method");
        // self should be excluded from params
        assert_eq!(parsed.functions[0].params, vec!["x"]);
    }

    #[test]
    fn test_extract_loops() {
        let code = r#"
for i in range(10):
    print(i)

while True:
    break
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 2);

        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert_eq!(parsed.loops[0].iterator, Some("range(10)".to_string()));

        assert_eq!(parsed.loops[1].kind, LoopKind::While);
        assert_eq!(parsed.loops[1].iterator, None);
    }

    #[test]
    fn test_extract_concurrency_locks() {
        let code = r#"
import threading
lock = threading.Lock()
lock.acquire()
counter += 1
lock.release()
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        assert!(parsed.locks.len() >= 2);
        assert_eq!(parsed.locks[0].kind, LockKind::Acquire);
        assert_eq!(parsed.locks[0].lock_name, "lock");
        assert_eq!(parsed.locks[1].kind, LockKind::Release);
        assert_eq!(parsed.locks[1].lock_name, "lock");
    }

    #[test]
    fn test_extract_concurrency_async() {
        let code = r#"
import asyncio

async def main():
    result = await fetch_data()
    task = asyncio.create_task(worker())
    gathered = await asyncio.gather(a(), b())
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        // Should have awaits and async ops
        let await_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "await")
            .collect();
        assert!(await_ops.len() >= 2, "expected at least 2 await ops");

        let task_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "async_task")
            .collect();
        assert_eq!(task_ops.len(), 1);
    }

    #[test]
    fn test_extract_concurrency_globals() {
        let code = r#"
counter = 0

def increment():
    global counter
    counter += 1
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        assert!(!parsed.shared_accesses.is_empty());
        assert_eq!(parsed.shared_accesses[0].variable, "counter");
        assert_eq!(parsed.shared_accesses[0].access_type, AccessType::Write);
    }

    #[test]
    fn test_extract_allocations() {
        let code = r#"
x = [1, 2, 3]
y = {"a": 1}
s = "hello"
obj = MyClass()
comp = [i for i in range(10)]
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");

        let list_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "list")
            .collect();
        assert!(!list_allocs.is_empty(), "expected list allocation");

        let dict_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "dict")
            .collect();
        assert!(!dict_allocs.is_empty(), "expected dict allocation");

        let str_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "str")
            .collect();
        assert!(!str_allocs.is_empty(), "expected str allocation");

        let class_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "MyClass")
            .collect();
        assert!(!class_allocs.is_empty(), "expected class instantiation");

        let comp_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "list_comprehension")
            .collect();
        assert!(!comp_allocs.is_empty(), "expected list comprehension");
    }

    #[test]
    fn test_extract_variables() {
        let code = r#"
x = 10
y: int = 20
z += 1
for i in range(5):
    pass
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        let var_names: Vec<_> = parsed.variables.iter().map(|v| v.name.as_str()).collect();
        assert!(var_names.contains(&"x"), "expected variable x");
        assert!(var_names.contains(&"y"), "expected variable y");
        assert!(var_names.contains(&"z"), "expected variable z");
        assert!(var_names.contains(&"i"), "expected variable i");
    }

    #[test]
    fn test_empty_code() {
        let parsed = PythonParser::parse("").expect("parse failed");
        assert!(parsed.functions.is_empty());
        assert!(parsed.loops.is_empty());
        assert!(parsed.locks.is_empty());
        assert!(parsed.shared_accesses.is_empty());
        assert!(parsed.async_ops.is_empty());
        assert!(parsed.allocations.is_empty());
        assert!(parsed.variables.is_empty());
    }

    #[test]
    fn test_with_lock_context_manager() {
        let code = r#"
import threading
lock = threading.Lock()
with lock:
    counter += 1
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        let ctx_locks: Vec<_> = parsed
            .locks
            .iter()
            .filter(|l| l.lock_name == "context_manager_lock")
            .collect();
        assert!(
            ctx_locks.len() >= 2,
            "expected acquire+release for context manager lock"
        );
    }

    #[test]
    fn test_thread_spawn() {
        let code = r#"
import threading
t = threading.Thread(target=worker)
t.start()
"#;
        let parsed = PythonParser::parse(code).expect("parse failed");
        let spawns: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "thread_spawn")
            .collect();
        assert_eq!(spawns.len(), 1);
    }
}
