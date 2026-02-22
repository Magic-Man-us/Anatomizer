use tree_sitter::Tree;

use crate::util::{collect_nodes_of_kind, count_statements, node_text, truncate_detail, MAX_DETAIL_LEN};
use crate::{
    AllocationSite, AllocationType, AsyncOperation, FunctionDef, LanguageParser, LockOperation,
    LoopConstruct, LoopKind, ParsedCode, SharedAccess, VariableDecl,
};

pub struct TypeScriptParser;

// ---------------------------------------------------------------------------
// extract_params — parameters of a JS function
// ---------------------------------------------------------------------------

fn extract_params(func_node: &tree_sitter::Node<'_>, code: &str) -> Vec<String> {
    let Some(params_node) = func_node.child_by_field_name("parameters") else {
        // Arrow functions can have a single parameter without parens (just an identifier).
        if func_node.kind() == "arrow_function" {
            if let Some(param) = func_node.child_by_field_name("parameter") {
                let text = node_text(param, code);
                if !text.is_empty() {
                    return vec![text.to_string()];
                }
            }
        }
        return vec![];
    };

    let mut params = Vec::new();
    for i in 0..params_node.named_child_count() {
        let Some(child) = params_node.named_child(i) else {
            continue;
        };
        // TypeScript grammar wraps parameters in `required_parameter` or
        // `optional_parameter` nodes.  Unwrap to the inner pattern/identifier
        // so the same extraction logic works for both JS and TS grammars.
        let param = match child.kind() {
            "required_parameter" | "optional_parameter" => {
                // The first named child is the pattern (identifier, object_pattern, etc.)
                match child.child_by_field_name("pattern") {
                    Some(inner) => inner,
                    None => child,
                }
            }
            _ => child,
        };
        match param.kind() {
            "identifier" => {
                let name = node_text(param, code);
                if !name.is_empty() {
                    params.push(name.to_string());
                }
            }
            // Destructuring patterns: `{ a, b }` or `[a, b]`
            "object_pattern" | "array_pattern" => {
                let text = node_text(param, code);
                params.push(text.to_string());
            }
            // `x = defaultValue`
            "assignment_pattern" => {
                if let Some(left) = param.child_by_field_name("left") {
                    let name = node_text(left, code);
                    if !name.is_empty() {
                        params.push(name.to_string());
                    }
                }
            }
            // `...args`
            "rest_pattern" => {
                let text = node_text(param, code);
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
    let call_nodes = collect_nodes_of_kind(body_node, &["call_expression"]);
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
    let func_nodes = collect_nodes_of_kind(
        root,
        &[
            "function_declaration",
            "arrow_function",
            "method_definition",
            "generator_function_declaration",
        ],
    );

    func_nodes
        .iter()
        .map(|node| {
            let name = match node.kind() {
                "arrow_function" => {
                    // Try to get name from parent variable_declarator
                    let parent = node.parent();
                    if let Some(p) = parent {
                        if p.kind() == "variable_declarator" {
                            p.child_by_field_name("name")
                                .map(|n| node_text(n, code))
                                .unwrap_or("anonymous")
                        } else {
                            "anonymous"
                        }
                    } else {
                        "anonymous"
                    }
                }
                _ => node
                    .child_by_field_name("name")
                    .map(|n| node_text(n, code))
                    .unwrap_or("anonymous"),
            }
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
        &[
            "for_statement",
            "for_in_statement",
            "while_statement",
            "do_statement",
        ],
    );

    loop_nodes
        .iter()
        .map(|node| {
            let kind = match node.kind() {
                "for_statement" | "for_in_statement" => LoopKind::For,
                "while_statement" | "do_statement" => LoopKind::While,
                _ => LoopKind::While,
            };

            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            let iterator = if node.kind() == "for_in_statement" {
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
    let locks = Vec::new();
    let shared = Vec::new();
    let mut async_ops = Vec::new();

    // --- Call-based patterns ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        match func_text {
            "Promise.all" => {
                async_ops.push(AsyncOperation {
                    kind: "promise_all".into(),
                    line,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "Promise.race" => {
                async_ops.push(AsyncOperation {
                    kind: "promise_race".into(),
                    line,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "Promise.allSettled" => {
                async_ops.push(AsyncOperation {
                    kind: "promise_all_settled".into(),
                    line,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "setTimeout" => {
                async_ops.push(AsyncOperation {
                    kind: "timer".into(),
                    line,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "setInterval" => {
                async_ops.push(AsyncOperation {
                    kind: "timer".into(),
                    line,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            _ => {}
        }
    }

    // --- new expressions (Worker, SharedArrayBuffer) ---
    let new_exprs = collect_nodes_of_kind(root, &["new_expression"]);
    for new_node in &new_exprs {
        let constructor_text = new_node
            .child_by_field_name("constructor")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = new_node.start_position().row + 1;

        match constructor_text {
            "Worker" => {
                async_ops.push(AsyncOperation {
                    kind: "worker_spawn".into(),
                    line,
                    detail: truncate_detail(node_text(*new_node, code), MAX_DETAIL_LEN),
                });
            }
            "SharedArrayBuffer" => {
                async_ops.push(AsyncOperation {
                    kind: "shared_memory".into(),
                    line,
                    detail: truncate_detail(node_text(*new_node, code), MAX_DETAIL_LEN),
                });
            }
            _ => {}
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

    (locks, shared, async_ops)
}

// ---------------------------------------------------------------------------
// Task #4: extract_allocations
// ---------------------------------------------------------------------------

/// V8 approximate object overhead constants (bytes).
const OBJECT_BASE_BYTES: usize = 56;
const OBJECT_PROPERTY_BYTES: usize = 24;
const ARRAY_BASE_BYTES: usize = 32;
const ARRAY_ELEMENT_BYTES: usize = 8;
const STRING_BASE_BYTES: usize = 20;
const QUOTE_OVERHEAD: usize = 2;
const NEW_OBJECT_MIN_BYTES: usize = 64;
const COLLECTION_BASE_BYTES: usize = 48;

fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
    let root = tree.root_node();
    let mut allocs = Vec::new();

    // Object literals
    for node in collect_nodes_of_kind(root, &["object"]) {
        let prop_count = node.named_child_count();
        let estimated = OBJECT_BASE_BYTES + OBJECT_PROPERTY_BYTES * prop_count;
        allocs.push(AllocationSite {
            name: "object".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: "object literal".into(),
        });
    }

    // Array literals
    for node in collect_nodes_of_kind(root, &["array"]) {
        let elem_count = node.named_child_count();
        let estimated = ARRAY_BASE_BYTES + ARRAY_ELEMENT_BYTES * elem_count;
        allocs.push(AllocationSite {
            name: "array".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("array with {elem_count} elements"),
        });
    }

    // String literals
    for node in collect_nodes_of_kind(root, &["string"]) {
        let text = node_text(node, code);
        let content_len = text.len().saturating_sub(QUOTE_OVERHEAD);
        let estimated = STRING_BASE_BYTES + content_len;
        allocs.push(AllocationSite {
            name: "string".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("string of ~{content_len} chars"),
        });
    }

    // Template strings
    for node in collect_nodes_of_kind(root, &["template_string"]) {
        let text = node_text(node, code);
        let content_len = text.len().saturating_sub(QUOTE_OVERHEAD);
        let estimated = STRING_BASE_BYTES + content_len;
        allocs.push(AllocationSite {
            name: "template_string".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{estimated} B")),
            detail: format!("template string of ~{content_len} chars"),
        });
    }

    // new expressions
    for node in collect_nodes_of_kind(root, &["new_expression"]) {
        let constructor_text = node
            .child_by_field_name("constructor")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        if constructor_text.is_empty() {
            continue;
        }

        let (size_hint, detail) = match constructor_text {
            "Map" | "Set" | "WeakMap" | "WeakSet" => (
                format!("~{COLLECTION_BASE_BYTES}+ B"),
                format!("{constructor_text} collection"),
            ),
            "Array" => (
                format!("~{ARRAY_BASE_BYTES}+ B"),
                "Array constructor".into(),
            ),
            _ => (
                format!("~{NEW_OBJECT_MIN_BYTES}+ B"),
                format!("{constructor_text} instance"),
            ),
        };

        allocs.push(AllocationSite {
            name: constructor_text.to_string(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(size_hint),
            detail,
        });
    }

    // Call expressions that create collections: Array(), Array.from(), etc.
    for node in collect_nodes_of_kind(root, &["call_expression"]) {
        let func_text = node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        match func_text {
            "Array" | "Array.from" | "Array.of" => {
                allocs.push(AllocationSite {
                    name: "Array".into(),
                    alloc_type: AllocationType::Heap,
                    line: node.start_position().row + 1,
                    size_hint: Some(format!("~{ARRAY_BASE_BYTES}+ B")),
                    detail: format!("{func_text}() call"),
                });
            }
            "Object.create" | "Object.assign" => {
                allocs.push(AllocationSite {
                    name: "Object".into(),
                    alloc_type: AllocationType::Heap,
                    line: node.start_position().row + 1,
                    size_hint: Some(format!("~{OBJECT_BASE_BYTES}+ B")),
                    detail: format!("{func_text}() call"),
                });
            }
            _ => {}
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

    // variable_declaration (var) and lexical_declaration (let/const)
    let decl_nodes = collect_nodes_of_kind(
        root,
        &["variable_declaration", "lexical_declaration"],
    );

    for decl_node in &decl_nodes {
        // Determine mutability from the declaration keyword.
        // The first child of the declaration node is the keyword: var, let, or const.
        let is_mutable = decl_node
            .child(0)
            .map(|kw| {
                let kw_text = node_text(kw, code);
                kw_text == "let" || kw_text == "var"
            })
            .unwrap_or(true);

        // Each declaration can have multiple declarators
        for i in 0..decl_node.named_child_count() {
            let Some(declarator) = decl_node.named_child(i) else {
                continue;
            };
            if declarator.kind() != "variable_declarator" {
                continue;
            }

            if let Some(name_node) = declarator.child_by_field_name("name") {
                let name = node_text(name_node, code).to_string();
                let line = declarator.start_position().row + 1;
                vars.push(VariableDecl {
                    name,
                    line,
                    type_hint: None,
                    is_mutable,
                });
            }
        }
    }

    vars
}

// ---------------------------------------------------------------------------
// LanguageParser trait implementation
// ---------------------------------------------------------------------------

impl LanguageParser for TypeScriptParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_typescript::LANGUAGE_TYPESCRIPT;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set TypeScript language: {e}"))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse TypeScript/JavaScript code".to_string())?;

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
    fn test_extract_functions_declaration() {
        let code = r#"
function greet(name) {
    console.log("Hello", name);
}

function add(a, b) {
    return a + b;
}
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 2);

        assert_eq!(parsed.functions[0].name, "greet");
        assert_eq!(parsed.functions[0].params, vec!["name"]);
        assert!(parsed.functions[0].calls.contains(&"console.log".to_string()));
        assert_eq!(parsed.functions[0].line_start, 2);

        assert_eq!(parsed.functions[1].name, "add");
        assert_eq!(parsed.functions[1].params, vec!["a", "b"]);
    }

    #[test]
    fn test_extract_functions_arrow() {
        let code = r#"
const multiply = (x, y) => {
    return x * y;
};

const identity = x => x;
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");

        let arrow_fns: Vec<_> = parsed
            .functions
            .iter()
            .filter(|f| f.name != "anonymous")
            .collect();
        assert!(
            arrow_fns.len() >= 1,
            "expected at least 1 named arrow function, got: {:?}",
            parsed.functions
        );
        assert_eq!(arrow_fns[0].name, "multiply");
        assert_eq!(arrow_fns[0].params, vec!["x", "y"]);
    }

    #[test]
    fn test_extract_functions_method() {
        let code = r#"
const obj = {
    greet(name) {
        console.log(name);
    }
};
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");

        let methods: Vec<_> = parsed
            .functions
            .iter()
            .filter(|f| f.name == "greet")
            .collect();
        assert_eq!(methods.len(), 1);
        assert_eq!(methods[0].params, vec!["name"]);
    }

    #[test]
    fn test_extract_loops_for() {
        let code = r#"
for (let i = 0; i < 10; i++) {
    console.log(i);
}
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert_eq!(parsed.loops[0].iterator, None);
    }

    #[test]
    fn test_extract_loops_for_of() {
        let code = r#"
for (const item of items) {
    process(item);
}
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert_eq!(parsed.loops[0].iterator, Some("items".to_string()));
    }

    #[test]
    fn test_extract_loops_while() {
        let code = r#"
while (running) {
    tick();
}

do {
    step();
} while (active);
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 2);
        assert_eq!(parsed.loops[0].kind, LoopKind::While);
        assert_eq!(parsed.loops[1].kind, LoopKind::While);
    }

    #[test]
    fn test_extract_concurrency_await() {
        let code = r#"
async function fetchData() {
    const result = await fetch("/api");
    const data = await result.json();
    return data;
}
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let await_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "await")
            .collect();
        assert_eq!(await_ops.len(), 2, "expected 2 await ops");
    }

    #[test]
    fn test_extract_concurrency_promise_all() {
        let code = r#"
const results = await Promise.all([fetchA(), fetchB()]);
const winner = await Promise.race([slow(), fast()]);
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");

        let promise_all: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "promise_all")
            .collect();
        assert_eq!(promise_all.len(), 1);

        let promise_race: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "promise_race")
            .collect();
        assert_eq!(promise_race.len(), 1);
    }

    #[test]
    fn test_extract_concurrency_worker() {
        let code = r#"
const worker = new Worker("worker.js");
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let worker_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "worker_spawn")
            .collect();
        assert_eq!(worker_ops.len(), 1);
    }

    #[test]
    fn test_extract_concurrency_timer() {
        let code = r#"
setTimeout(() => console.log("hi"), 1000);
setInterval(() => tick(), 100);
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let timer_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "timer")
            .collect();
        assert_eq!(timer_ops.len(), 2);
    }

    #[test]
    fn test_extract_allocations_object() {
        let code = r#"
const obj = { a: 1, b: 2 };
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let obj_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "object")
            .collect();
        assert!(!obj_allocs.is_empty(), "expected object allocation");
        assert_eq!(obj_allocs[0].alloc_type, AllocationType::Heap);
    }

    #[test]
    fn test_extract_allocations_array() {
        let code = r#"
const arr = [1, 2, 3];
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let arr_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "array")
            .collect();
        assert!(!arr_allocs.is_empty(), "expected array allocation");
        assert!(arr_allocs[0].detail.contains("3 elements"));
    }

    #[test]
    fn test_extract_allocations_new() {
        let code = r#"
const d = new Date();
const m = new Map();
const s = new Set();
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");

        let date_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "Date")
            .collect();
        assert!(!date_allocs.is_empty(), "expected Date allocation");

        let map_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "Map")
            .collect();
        assert!(!map_allocs.is_empty(), "expected Map allocation");
        assert!(map_allocs[0].detail.contains("collection"));
    }

    #[test]
    fn test_extract_allocations_string() {
        let code = r#"
const s = "hello world";
const t = `template ${val}`;
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");

        let str_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "string")
            .collect();
        assert!(!str_allocs.is_empty(), "expected string allocation");

        let tmpl_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "template_string")
            .collect();
        assert!(!tmpl_allocs.is_empty(), "expected template string allocation");
    }

    #[test]
    fn test_extract_variables_const() {
        let code = r#"
const x = 10;
let y = 20;
var z = 30;
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        assert!(parsed.variables.len() >= 3);

        let x_var = parsed.variables.iter().find(|v| v.name == "x").unwrap();
        assert!(!x_var.is_mutable, "const should not be mutable");

        let y_var = parsed.variables.iter().find(|v| v.name == "y").unwrap();
        assert!(y_var.is_mutable, "let should be mutable");

        let z_var = parsed.variables.iter().find(|v| v.name == "z").unwrap();
        assert!(z_var.is_mutable, "var should be mutable");
    }

    #[test]
    fn test_extract_variables_multiple_declarators() {
        let code = r#"
const a = 1, b = 2;
"#;
        let parsed = TypeScriptParser::parse(code).expect("parse failed");
        let var_names: Vec<_> = parsed.variables.iter().map(|v| v.name.as_str()).collect();
        assert!(var_names.contains(&"a"), "expected variable a");
        assert!(var_names.contains(&"b"), "expected variable b");
    }

    #[test]
    fn test_empty_code() {
        let parsed = TypeScriptParser::parse("").expect("parse failed");
        assert!(parsed.functions.is_empty());
        assert!(parsed.loops.is_empty());
        assert!(parsed.locks.is_empty());
        assert!(parsed.shared_accesses.is_empty());
        assert!(parsed.async_ops.is_empty());
        assert!(parsed.allocations.is_empty());
        assert!(parsed.variables.is_empty());
    }
}
