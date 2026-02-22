use tree_sitter::Tree;

use crate::util::{collect_nodes_of_kind, count_statements, node_text, truncate_detail, MAX_DETAIL_LEN};
use crate::{
    AccessType, AllocationSite, AllocationType, AsyncOperation, FunctionDef, LanguageParser,
    LockKind, LockOperation, LoopConstruct, LoopKind, ParsedCode, SharedAccess, VariableDecl,
};

pub struct GoParser;

// ---------------------------------------------------------------------------
// Go-specific allocation size constants (bytes)
// ---------------------------------------------------------------------------

const INT_BYTES: usize = 8;
const FLOAT64_BYTES: usize = 8;
const STRING_HEADER_BYTES: usize = 16;
const SLICE_HEADER_BYTES: usize = 24;
const POINTER_BYTES: usize = 8;
const MAP_BASE_BYTES: usize = 64;
const CHANNEL_BASE_BYTES: usize = 96;

// ---------------------------------------------------------------------------
// extract_params — parameters of a Go function/method
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
        // In Go tree-sitter, parameter_declaration has name identifiers as children
        if child.kind() == "parameter_declaration" {
            for j in 0..child.named_child_count() {
                if let Some(name_node) = child.named_child(j) {
                    if name_node.kind() == "identifier" {
                        params.push(node_text(name_node, code).to_string());
                    }
                }
            }
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
    let func_nodes =
        collect_nodes_of_kind(root, &["function_declaration", "method_declaration"]);

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
    let loop_nodes = collect_nodes_of_kind(root, &["for_statement"]);

    loop_nodes
        .iter()
        .map(|node| {
            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            // Check for range_clause child to detect range loops
            let range_clauses = collect_nodes_of_kind(*node, &["range_clause"]);
            let has_range = !range_clauses.is_empty();

            // Check for for_clause child (traditional for loops)
            let for_clauses = collect_nodes_of_kind(*node, &["for_clause"]);
            let has_for_clause = !for_clauses.is_empty();

            // Determine loop kind and iterator
            let (kind, iterator) = if has_range {
                let iter = range_clauses
                    .first()
                    .and_then(|rc| rc.child_by_field_name("right"))
                    .map(|n| node_text(n, code).to_string());
                (LoopKind::For, iter)
            } else if has_for_clause {
                // Traditional for loop: for i := 0; i < n; i++
                // Also covers: for ; condition ; { } (while-like with for_clause)
                (LoopKind::For, None)
            } else {
                // Check if there is a bare expression child (while-like: for condition { })
                let has_expression_child = (0..node.named_child_count()).any(|i| {
                    node.named_child(i)
                        .map(|c| c.kind() != "block")
                        .unwrap_or(false)
                });
                if has_expression_child {
                    (LoopKind::While, None)
                } else {
                    // Infinite: for { }
                    (LoopKind::Loop, None)
                }
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

    // --- Goroutine spawns: go_statement ---
    let go_stmts = collect_nodes_of_kind(root, &["go_statement"]);
    for go_node in &go_stmts {
        let line = go_node.start_position().row + 1;
        let detail = truncate_detail(node_text(*go_node, code), MAX_DETAIL_LEN);
        async_ops.push(AsyncOperation {
            kind: "goroutine".into(),
            line,
            detail,
        });

        // Heuristic: identifiers used inside goroutine body are shared accesses
        let identifiers = collect_nodes_of_kind(*go_node, &["identifier"]);
        let mut seen = std::collections::HashSet::new();
        for ident in &identifiers {
            let var_name = node_text(*ident, code).to_string();
            if is_go_keyword(&var_name) || var_name.is_empty() {
                continue;
            }
            if seen.insert(var_name.clone()) {
                shared.push(SharedAccess {
                    variable: var_name,
                    access_type: AccessType::Read,
                    line: ident.start_position().row + 1,
                    in_locked_region: false,
                    thread_context: Some("goroutine".into()),
                });
            }
        }
    }

    // --- Channel operations ---
    // send_statement: ch <- val
    let sends = collect_nodes_of_kind(root, &["send_statement"]);
    for send_node in &sends {
        let line = send_node.start_position().row + 1;
        let detail = truncate_detail(node_text(*send_node, code), MAX_DETAIL_LEN);
        async_ops.push(AsyncOperation {
            kind: "channel_send".into(),
            line,
            detail,
        });
    }

    // receive_expression: <-ch (unary_expression with operator "<-")
    let unary_exprs = collect_nodes_of_kind(root, &["unary_expression"]);
    for node in &unary_exprs {
        let text = node_text(*node, code);
        if text.starts_with("<-") {
            let line = node.start_position().row + 1;
            async_ops.push(AsyncOperation {
                kind: "channel_receive".into(),
                line,
                detail: text.to_string(),
            });
        }
    }

    // --- Call-based patterns: Lock/Unlock, WaitGroup ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        if func_text.ends_with(".Lock") {
            let lock_name = func_text
                .strip_suffix(".Lock")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".Unlock") {
            let lock_name = func_text
                .strip_suffix(".Unlock")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".RLock") {
            let lock_name = func_text
                .strip_suffix(".RLock")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name: format!("{lock_name} (read)"),
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".RUnlock") {
            let lock_name = func_text
                .strip_suffix(".RUnlock")
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name: format!("{lock_name} (read)"),
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".Add")
            || func_text.ends_with(".Done")
            || func_text.ends_with(".Wait")
        {
            // WaitGroup methods
            let method = if func_text.ends_with(".Add") {
                "waitgroup_add"
            } else if func_text.ends_with(".Done") {
                "waitgroup_done"
            } else {
                "waitgroup_wait"
            };
            async_ops.push(AsyncOperation {
                kind: method.into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        }
    }

    (locks, shared, async_ops)
}

/// Returns true if the given identifier is a Go keyword or builtin that should
/// not be treated as a shared variable.
fn is_go_keyword(s: &str) -> bool {
    matches!(
        s,
        "break"
            | "case"
            | "chan"
            | "const"
            | "continue"
            | "default"
            | "defer"
            | "else"
            | "fallthrough"
            | "for"
            | "func"
            | "go"
            | "goto"
            | "if"
            | "import"
            | "interface"
            | "map"
            | "package"
            | "range"
            | "return"
            | "select"
            | "struct"
            | "switch"
            | "type"
            | "var"
            | "true"
            | "false"
            | "nil"
            | "iota"
            | "int"
            | "int8"
            | "int16"
            | "int32"
            | "int64"
            | "uint"
            | "uint8"
            | "uint16"
            | "uint32"
            | "uint64"
            | "float32"
            | "float64"
            | "complex64"
            | "complex128"
            | "string"
            | "bool"
            | "byte"
            | "rune"
            | "error"
            | "fmt"
            | "sync"
            | "make"
            | "new"
            | "append"
            | "len"
            | "cap"
            | "close"
            | "delete"
            | "copy"
            | "println"
            | "print"
            | "panic"
            | "recover"
            | "Println"
            | "Printf"
            | "Sprintf"
    )
}

// ---------------------------------------------------------------------------
// Task #4: extract_allocations
// ---------------------------------------------------------------------------

fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
    let root = tree.root_node();
    let mut allocs = Vec::new();

    // --- Heap: make(), new(), append() ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        match func_text {
            "make" => {
                let detail = truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN);
                // Inspect the first argument's tree-sitter node type to
                // determine whether this is a map, channel, or slice.
                let first_arg_kind = call_node
                    .child_by_field_name("arguments")
                    .and_then(|args| args.named_child(0))
                    .map(|n| n.kind())
                    .unwrap_or("");
                let size_hint = if first_arg_kind == "map_type" {
                    Some(format!("~{MAP_BASE_BYTES}+ B"))
                } else if first_arg_kind == "channel_type" {
                    Some(format!("~{CHANNEL_BASE_BYTES}+ B"))
                } else {
                    // Slice or other
                    Some(format!("~{SLICE_HEADER_BYTES}+ B"))
                };
                allocs.push(AllocationSite {
                    name: "make".into(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint,
                    detail,
                });
            }
            "new" => {
                let detail = truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN);
                allocs.push(AllocationSite {
                    name: "new".into(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: Some(format!("~{POINTER_BYTES}+ B")),
                    detail,
                });
            }
            "append" => {
                let detail = truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN);
                allocs.push(AllocationSite {
                    name: "append".into(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: Some("~dynamic B".into()),
                    detail,
                });
            }
            _ => {}
        }
    }

    // --- Heap: composite_literal (struct/slice/map initialization) ---
    let composites = collect_nodes_of_kind(root, &["composite_literal"]);
    for node in &composites {
        let line = node.start_position().row + 1;
        let type_name = node
            .child_by_field_name("type")
            .map(|n| node_text(n, code).to_string())
            .unwrap_or_else(|| "composite".into());

        let detail = truncate_detail(node_text(*node, code), MAX_DETAIL_LEN);

        allocs.push(AllocationSite {
            name: type_name,
            alloc_type: AllocationType::Heap,
            line,
            size_hint: Some("~dynamic B".into()),
            detail,
        });
    }

    // --- Stack: short_var_declaration and var_declaration for primitive types ---
    let short_decls = collect_nodes_of_kind(root, &["short_var_declaration"]);
    for node in &short_decls {
        let line = node.start_position().row + 1;
        let right_text = node
            .child_by_field_name("right")
            .map(|n| node_text(n, code))
            .unwrap_or("");
        let left_text = node
            .child_by_field_name("left")
            .map(|n| node_text(n, code))
            .unwrap_or("unknown");

        if let Some(size_hint) = infer_primitive_size(right_text) {
            allocs.push(AllocationSite {
                name: left_text.to_string(),
                alloc_type: AllocationType::Stack,
                line,
                size_hint: Some(size_hint),
                detail: format!("{} := {}", left_text, truncate_detail(right_text, MAX_DETAIL_LEN)),
            });
        }
    }

    let var_decls = collect_nodes_of_kind(root, &["var_declaration"]);
    for var_decl in &var_decls {
        let specs = collect_nodes_of_kind(*var_decl, &["var_spec"]);
        for spec in &specs {
            let line = spec.start_position().row + 1;
            let name = spec
                .child_by_field_name("name")
                .map(|n| node_text(n, code))
                .unwrap_or("unknown");
            let type_text = spec
                .child_by_field_name("type")
                .map(|n| node_text(n, code))
                .unwrap_or("");

            if let Some(size_hint) = infer_type_size(type_text) {
                allocs.push(AllocationSite {
                    name: name.to_string(),
                    alloc_type: AllocationType::Stack,
                    line,
                    size_hint: Some(size_hint),
                    detail: format!("var {} {}", name, type_text),
                });
            }
        }
    }

    allocs
}

/// Infer size from a right-hand-side value expression (heuristic).
fn infer_primitive_size(rhs: &str) -> Option<String> {
    let trimmed = rhs.trim();
    if trimmed.is_empty() {
        return None;
    }
    // Integer literal
    if trimmed.parse::<i64>().is_ok() {
        return Some(format!("~{INT_BYTES} B"));
    }
    // Float literal
    if trimmed.contains('.') && trimmed.parse::<f64>().is_ok() {
        return Some(format!("~{FLOAT64_BYTES} B"));
    }
    // String literal
    if trimmed.starts_with('"') || trimmed.starts_with('`') {
        let content_len = trimmed.len().saturating_sub(2);
        let estimated = STRING_HEADER_BYTES + content_len;
        return Some(format!("~{estimated} B"));
    }
    // Bool
    if trimmed == "true" || trimmed == "false" {
        return Some("~1 B".into());
    }
    None
}

/// Infer size from a Go type name.
fn infer_type_size(type_name: &str) -> Option<String> {
    match type_name {
        "int" | "int64" | "uint" | "uint64" | "float64" | "uintptr" => {
            Some(format!("~{INT_BYTES} B"))
        }
        "int8" | "uint8" | "byte" | "bool" => Some("~1 B".into()),
        "int16" | "uint16" => Some("~2 B".into()),
        "int32" | "uint32" | "float32" | "rune" => Some("~4 B".into()),
        "string" => Some(format!("~{STRING_HEADER_BYTES} B")),
        _ => {
            if !type_name.is_empty() {
                Some("~dynamic B".into())
            } else {
                None
            }
        }
    }
}


// ---------------------------------------------------------------------------
// Task #5: extract_variables
// ---------------------------------------------------------------------------

fn extract_variables(tree: &Tree, code: &str) -> Vec<VariableDecl> {
    let root = tree.root_node();
    let mut vars = Vec::new();

    // short_var_declaration: x := expr
    let short_decls = collect_nodes_of_kind(root, &["short_var_declaration"]);
    for node in &short_decls {
        if let Some(left) = node.child_by_field_name("left") {
            // left can be an expression_list with multiple identifiers
            let idents = collect_nodes_of_kind(left, &["identifier"]);
            for ident in &idents {
                let name = node_text(*ident, code).to_string();
                vars.push(VariableDecl {
                    name,
                    line: ident.start_position().row + 1,
                    type_hint: None,
                    is_mutable: true,
                });
            }
        }
    }

    // var_declaration -> var_spec
    let var_decls = collect_nodes_of_kind(root, &["var_declaration"]);
    for var_decl in &var_decls {
        let specs = collect_nodes_of_kind(*var_decl, &["var_spec"]);
        for spec in &specs {
            let type_hint = spec
                .child_by_field_name("type")
                .map(|n| node_text(n, code).to_string());

            if let Some(name_node) = spec.child_by_field_name("name") {
                let name = node_text(name_node, code).to_string();
                vars.push(VariableDecl {
                    name,
                    line: spec.start_position().row + 1,
                    type_hint,
                    is_mutable: true,
                });
            }
        }
    }

    vars
}

// ---------------------------------------------------------------------------
// LanguageParser trait implementation
// ---------------------------------------------------------------------------

impl LanguageParser for GoParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_go::LANGUAGE;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set Go language: {e}"))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse Go code".to_string())?;

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
package main

func greet(name string) {
    fmt.Println("Hello", name)
}

func add(a int, b int) int {
    return a + b
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 2);

        assert_eq!(parsed.functions[0].name, "greet");
        assert_eq!(parsed.functions[0].params, vec!["name"]);
        assert!(
            parsed.functions[0]
                .calls
                .iter()
                .any(|c| c.contains("Println")),
            "expected a call containing Println"
        );

        assert_eq!(parsed.functions[1].name, "add");
        assert_eq!(parsed.functions[1].params, vec!["a", "b"]);
    }

    #[test]
    fn test_extract_methods() {
        let code = r#"
package main

type Server struct {
    port int
}

func (s *Server) Start() {
    fmt.Println("Starting on", s.port)
}

func (s *Server) Stop() {
    fmt.Println("Stopping")
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let methods: Vec<_> = parsed
            .functions
            .iter()
            .filter(|f| f.name == "Start" || f.name == "Stop")
            .collect();
        assert_eq!(methods.len(), 2);
    }

    #[test]
    fn test_extract_loops_range() {
        let code = r#"
package main

func main() {
    items := []int{1, 2, 3}
    for i, v := range items {
        fmt.Println(i, v)
    }
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        // There may be nested loops from composite literal, find the range loop
        let range_loops: Vec<_> = parsed
            .loops
            .iter()
            .filter(|l| l.iterator.is_some())
            .collect();
        assert!(!range_loops.is_empty(), "expected a range loop");
        assert_eq!(range_loops[0].kind, LoopKind::For);
        assert_eq!(range_loops[0].iterator.as_deref(), Some("items"));
    }

    #[test]
    fn test_extract_loops_traditional() {
        let code = r#"
package main

func main() {
    for i := 0; i < 10; i++ {
        fmt.Println(i)
    }
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert!(parsed.loops[0].iterator.is_none());
    }

    #[test]
    fn test_extract_loops_infinite() {
        let code = r#"
package main

func main() {
    for {
        break
    }
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::Loop);
    }

    #[test]
    fn test_extract_goroutines() {
        let code = r#"
package main

func main() {
    go worker()
    go func() {
        fmt.Println("anonymous goroutine")
    }()
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let goroutines: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "goroutine")
            .collect();
        assert_eq!(goroutines.len(), 2);
    }

    #[test]
    fn test_extract_mutex_lock_unlock() {
        let code = r#"
package main

import "sync"

func main() {
    var mu sync.Mutex
    mu.Lock()
    counter++
    mu.Unlock()
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        assert!(parsed.locks.len() >= 2);
        assert_eq!(parsed.locks[0].kind, LockKind::Acquire);
        assert_eq!(parsed.locks[0].lock_name, "mu");
        assert_eq!(parsed.locks[1].kind, LockKind::Release);
        assert_eq!(parsed.locks[1].lock_name, "mu");
    }

    #[test]
    fn test_extract_channel_ops() {
        let code = r#"
package main

func main() {
    ch := make(chan int)
    ch <- 42
    val := <-ch
    _ = val
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");

        let sends: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "channel_send")
            .collect();
        assert_eq!(sends.len(), 1);

        let recvs: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "channel_receive")
            .collect();
        assert_eq!(recvs.len(), 1);
    }

    #[test]
    fn test_extract_allocations_make() {
        let code = r#"
package main

func main() {
    s := make([]int, 10)
    m := make(map[string]int)
    ch := make(chan int, 5)
    _ = s
    _ = m
    _ = ch
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let make_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "make")
            .collect();
        assert_eq!(make_allocs.len(), 3);
        assert!(make_allocs
            .iter()
            .all(|a| a.alloc_type == AllocationType::Heap));
    }

    #[test]
    fn test_extract_allocations_new() {
        let code = r#"
package main

func main() {
    p := new(int)
    _ = p
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let new_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "new")
            .collect();
        assert_eq!(new_allocs.len(), 1);
        assert_eq!(new_allocs[0].alloc_type, AllocationType::Heap);
    }

    #[test]
    fn test_extract_allocations_composite_literal() {
        let code = r#"
package main

type Point struct {
    X int
    Y int
}

func main() {
    p := Point{X: 1, Y: 2}
    _ = p
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let composite_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.alloc_type == AllocationType::Heap && a.name.contains("Point"))
            .collect();
        assert!(
            !composite_allocs.is_empty(),
            "expected composite literal allocation for Point"
        );
    }

    #[test]
    fn test_extract_variables() {
        let code = r#"
package main

func main() {
    x := 10
    var y int
    _ = x
    _ = y
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let var_names: Vec<_> = parsed.variables.iter().map(|v| v.name.as_str()).collect();
        assert!(var_names.contains(&"x"), "expected variable x");
        assert!(var_names.contains(&"y"), "expected variable y");
        // All Go variables are mutable
        assert!(parsed.variables.iter().all(|v| v.is_mutable));
    }

    #[test]
    fn test_empty_code() {
        let code = "package main\n";
        let parsed = GoParser::parse(code).expect("parse failed");
        assert!(parsed.functions.is_empty());
        assert!(parsed.loops.is_empty());
        assert!(parsed.locks.is_empty());
        assert!(parsed.shared_accesses.is_empty());
        assert!(parsed.async_ops.is_empty());
    }

    #[test]
    fn test_waitgroup_ops() {
        let code = r#"
package main

import "sync"

func main() {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
    }()
    wg.Wait()
}
"#;
        let parsed = GoParser::parse(code).expect("parse failed");
        let wg_ops: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind.starts_with("waitgroup"))
            .collect();
        assert!(
            wg_ops.len() >= 2,
            "expected at least Add + Wait/Done ops, got {}",
            wg_ops.len()
        );
    }
}
