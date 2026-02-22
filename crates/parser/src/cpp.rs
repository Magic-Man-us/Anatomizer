use tree_sitter::Tree;

use crate::util::{collect_nodes_of_kind, count_statements, node_text, truncate_detail, MAX_DETAIL_LEN};
use crate::{
    AccessType, AllocationSite, AllocationType, AsyncOperation, FunctionDef, LanguageParser,
    LockKind, LockOperation, LoopConstruct, LoopKind, ParsedCode, SharedAccess, VariableDecl,
};

pub struct CppParser;

// ---------------------------------------------------------------------------
// Helper: extract the function name from a C/C++ declarator
// ---------------------------------------------------------------------------

/// Drill into a declarator to find the function name identifier.
/// C++ declarators can be nested: `function_declarator` wraps an identifier,
/// or a `qualified_identifier`, or a `field_identifier`, etc.
fn extract_declarator_name<'a>(node: tree_sitter::Node<'a>, code: &'a str) -> &'a str {
    match node.kind() {
        "identifier" | "field_identifier" | "destructor_name" => node_text(node, code),
        "qualified_identifier" | "template_function" => {
            // e.g. MyClass::method — grab the name field or last named child
            if let Some(name) = node.child_by_field_name("name") {
                extract_declarator_name(name, code)
            } else {
                let count = node.named_child_count();
                if count > 0 {
                    if let Some(last) = node.named_child(count - 1) {
                        return extract_declarator_name(last, code);
                    }
                }
                node_text(node, code)
            }
        }
        "function_declarator" | "pointer_declarator" | "reference_declarator"
        | "parenthesized_declarator" => {
            if let Some(inner) = node.child_by_field_name("declarator") {
                extract_declarator_name(inner, code)
            } else if let Some(first) = node.named_child(0) {
                extract_declarator_name(first, code)
            } else {
                node_text(node, code)
            }
        }
        "operator_name" => node_text(node, code),
        _ => {
            // Fallback: try declarator field, then first named child
            if let Some(inner) = node.child_by_field_name("declarator") {
                extract_declarator_name(inner, code)
            } else if let Some(first) = node.named_child(0) {
                extract_declarator_name(first, code)
            } else {
                node_text(node, code)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Helper: extract parameters from a function_declarator's parameter_list
// ---------------------------------------------------------------------------

fn extract_params(func_node: &tree_sitter::Node<'_>, code: &str) -> Vec<String> {
    let Some(declarator) = func_node.child_by_field_name("declarator") else {
        return vec![];
    };

    // Find the parameter_list within the declarator subtree
    let param_lists = collect_nodes_of_kind(declarator, &["parameter_list"]);
    let Some(param_list) = param_lists.first() else {
        return vec![];
    };

    let mut params = Vec::new();
    for i in 0..param_list.named_child_count() {
        let Some(child) = param_list.named_child(i) else {
            continue;
        };
        match child.kind() {
            "parameter_declaration" | "optional_parameter_declaration" => {
                if let Some(decl) = child.child_by_field_name("declarator") {
                    let name = extract_declarator_name(decl, code);
                    if !name.is_empty() {
                        params.push(name.to_string());
                    }
                }
                // Type-only param like `void foo(int)` — skip
            }
            "variadic_parameter_declaration" => {
                if let Some(decl) = child.child_by_field_name("declarator") {
                    let name = extract_declarator_name(decl, code);
                    if !name.is_empty() {
                        params.push(format!("...{name}"));
                    }
                } else {
                    params.push("...".to_string());
                }
            }
            _ => {}
        }
    }
    params
}

// ---------------------------------------------------------------------------
// Helper: extract call names from a subtree
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
// C/C++ type size constants (bytes)
// ---------------------------------------------------------------------------

const INT_BYTES: usize = 4;
const FLOAT_BYTES: usize = 4;
const DOUBLE_BYTES: usize = 8;
const CHAR_BYTES: usize = 1;
const LONG_BYTES: usize = 8;
const SHORT_BYTES: usize = 2;
const POINTER_BYTES: usize = 8;

/// Primitive types we consider stack-allocated.
const PRIMITIVE_TYPES: &[&str] = &[
    "int", "float", "double", "char", "bool", "long", "short", "unsigned", "signed", "void",
    "size_t", "ssize_t", "int8_t", "int16_t", "int32_t", "int64_t", "uint8_t", "uint16_t",
    "uint32_t", "uint64_t",
];

fn size_hint_for_type(type_text: &str) -> Option<String> {
    let trimmed = type_text.trim();
    if trimmed.contains("double") || trimmed.contains("int64") || trimmed.contains("long long") {
        Some(format!("~{DOUBLE_BYTES} B"))
    } else if trimmed.contains("long") {
        Some(format!("~{LONG_BYTES} B"))
    } else if trimmed.contains("short") || trimmed.contains("int16") {
        Some(format!("~{SHORT_BYTES} B"))
    } else if trimmed.contains("float") {
        Some(format!("~{FLOAT_BYTES} B"))
    } else if trimmed.contains("char") || trimmed.contains("int8") || trimmed.contains("bool") {
        Some(format!("~{CHAR_BYTES} B"))
    } else if trimmed.contains("int") || trimmed.contains("int32") {
        Some(format!("~{INT_BYTES} B"))
    } else if trimmed.contains('*') {
        Some(format!("~{POINTER_BYTES} B"))
    } else {
        None
    }
}

fn is_primitive_type(type_text: &str) -> bool {
    let trimmed = type_text.trim();
    PRIMITIVE_TYPES.iter().any(|p| trimmed.contains(p))
        || trimmed.contains("unsigned")
        || trimmed.contains("signed")
}

// ---------------------------------------------------------------------------
// RAII lock guard type names
// ---------------------------------------------------------------------------

const RAII_LOCK_TYPES: &[&str] = &[
    "lock_guard",
    "unique_lock",
    "scoped_lock",
    "shared_lock",
    "std::lock_guard",
    "std::unique_lock",
    "std::scoped_lock",
    "std::shared_lock",
];

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
                .child_by_field_name("declarator")
                .map(|d| extract_declarator_name(d, code))
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
        &[
            "for_statement",
            "while_statement",
            "do_statement",
            "for_range_loop",
        ],
    );

    loop_nodes
        .iter()
        .map(|node| {
            let kind = match node.kind() {
                "for_statement" | "for_range_loop" => LoopKind::For,
                "while_statement" | "do_statement" => LoopKind::While,
                _ => LoopKind::While,
            };

            let line_start = node.start_position().row + 1;
            let line_end = node.end_position().row + 1;

            let iterator = match node.kind() {
                "for_range_loop" => {
                    // for (auto x : container) — "right" field is the container
                    node.child_by_field_name("right")
                        .map(|n| node_text(n, code).to_string())
                }
                "for_statement" => None,
                _ => None,
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
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        // Lock acquire via method call: obj.lock(), obj.try_lock()
        if func_text.ends_with(".lock") || func_text.ends_with(".try_lock") {
            let lock_name = func_text
                .rsplit_once('.')
                .map(|(obj, _)| obj)
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text == "pthread_mutex_lock"
            || func_text == "pthread_spin_lock"
            || func_text == "pthread_rwlock_rdlock"
            || func_text == "pthread_rwlock_wrlock"
        {
            let lock_name = extract_pthread_lock_arg(call_node, code);
            locks.push(LockOperation {
                kind: LockKind::Acquire,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text.ends_with(".unlock") {
            let lock_name = func_text
                .rsplit_once('.')
                .map(|(obj, _)| obj)
                .unwrap_or("")
                .to_string();
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name,
                line,
                scope_end: None,
            });
        } else if func_text == "pthread_mutex_unlock"
            || func_text == "pthread_spin_unlock"
            || func_text == "pthread_rwlock_unlock"
        {
            let lock_name = extract_pthread_lock_arg(call_node, code);
            locks.push(LockOperation {
                kind: LockKind::Release,
                lock_name,
                line,
                scope_end: None,
            });
        }

        // Thread/async spawn detection via call expression
        if func_text == "std::async" {
            async_ops.push(AsyncOperation {
                kind: "std_async".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        } else if func_text == "pthread_create" {
            async_ops.push(AsyncOperation {
                kind: "thread_spawn".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        } else if func_text == "std::thread" || func_text == "std::jthread" {
            async_ops.push(AsyncOperation {
                kind: "thread_spawn".into(),
                line,
                detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
            });
        }
    }

    // --- RAII lock guards in declarations ---
    let declarations = collect_nodes_of_kind(root, &["declaration"]);
    for decl_node in &declarations {
        let decl_text = node_text(*decl_node, code);

        // Check for RAII lock type usage
        for raii_type in RAII_LOCK_TYPES {
            if decl_text.contains(raii_type) {
                let line = decl_node.start_position().row + 1;
                let scope_end = find_enclosing_block_end(decl_node);
                let lock_name = extract_raii_lock_name(*decl_node, code)
                    .unwrap_or_else(|| "raii_lock".to_string());

                locks.push(LockOperation {
                    kind: LockKind::Acquire,
                    lock_name: lock_name.clone(),
                    line,
                    scope_end,
                });

                if let Some(end) = scope_end {
                    locks.push(LockOperation {
                        kind: LockKind::Release,
                        lock_name,
                        line: end,
                        scope_end: None,
                    });
                }

                break; // One lock type match per declaration
            }
        }

        // Detect `std::thread t(func)` or `std::jthread t(func)` declarations
        if decl_text.contains("std::thread") || decl_text.contains("std::jthread") {
            // Avoid double-counting if already caught by RAII lock detection
            if !RAII_LOCK_TYPES.iter().any(|rt| decl_text.contains(rt)) {
                let line = decl_node.start_position().row + 1;
                async_ops.push(AsyncOperation {
                    kind: "thread_spawn".into(),
                    line,
                    detail: truncate_detail(decl_text, MAX_DETAIL_LEN),
                });
            }
        }
    }

    // --- new std::thread(...) expressions ---
    let new_exprs = collect_nodes_of_kind(root, &["new_expression"]);
    for new_node in &new_exprs {
        let new_text = node_text(*new_node, code);
        if new_text.contains("std::thread") || new_text.contains("std::jthread") {
            async_ops.push(AsyncOperation {
                kind: "thread_spawn".into(),
                line: new_node.start_position().row + 1,
                detail: truncate_detail(new_text, MAX_DETAIL_LEN),
            });
        }
    }

    // --- Shared accesses: volatile, std::atomic declarations ---
    for decl_node in &declarations {
        let decl_text = node_text(*decl_node, code);
        if decl_text.contains("volatile")
            || decl_text.contains("std::atomic")
            || decl_text.contains("atomic<")
        {
            let line = decl_node.start_position().row + 1;
            let var_name = decl_node
                .child_by_field_name("declarator")
                .map(|d| extract_declarator_name(d, code).to_string())
                .unwrap_or_else(|| {
                    let init_decls = collect_nodes_of_kind(*decl_node, &["init_declarator"]);
                    init_decls
                        .first()
                        .and_then(|id| id.child_by_field_name("declarator"))
                        .map(|d| extract_declarator_name(d, code).to_string())
                        .unwrap_or_else(|| "unknown".to_string())
                });

            shared.push(SharedAccess {
                variable: var_name,
                access_type: AccessType::Write,
                line,
                in_locked_region: false,
                thread_context: None,
            });
        }
    }

    (locks, shared, async_ops)
}

/// Extract the lock name argument from pthread_mutex_lock(&mtx) style calls.
fn extract_pthread_lock_arg(call_node: &tree_sitter::Node<'_>, code: &str) -> String {
    call_node
        .child_by_field_name("arguments")
        .and_then(|args| args.named_child(0))
        .map(|arg| {
            node_text(arg, code)
                .trim_start_matches('&')
                .to_string()
        })
        .unwrap_or_default()
}

/// Find the end line of the enclosing compound_statement (block).
fn find_enclosing_block_end(node: &tree_sitter::Node<'_>) -> Option<usize> {
    let mut current = node.parent();
    while let Some(parent) = current {
        if parent.kind() == "compound_statement" {
            return Some(parent.end_position().row + 1);
        }
        current = parent.parent();
    }
    None
}

/// Extract the mutex name from a RAII lock guard declaration.
/// e.g. `std::lock_guard<std::mutex> lg(mtx);` -> "mtx"
///
/// tree-sitter-cpp may parse `lg(mtx)` as a function_declarator with a
/// parameter_list, or as an init_declarator with an argument_list. We handle
/// both cases.
fn extract_raii_lock_name(decl_node: tree_sitter::Node<'_>, code: &str) -> Option<String> {
    // Look for argument_list in the declarator subtree
    let arg_lists = collect_nodes_of_kind(decl_node, &["argument_list"]);
    if let Some(args) = arg_lists.first() {
        if let Some(first_arg) = args.named_child(0) {
            return Some(node_text(first_arg, code).to_string());
        }
    }

    // Handle brace initialization: `std::lock_guard<std::mutex> lg{mtx};`
    let init_lists = collect_nodes_of_kind(decl_node, &["initializer_list"]);
    if let Some(init) = init_lists.first() {
        if let Some(first) = init.named_child(0) {
            return Some(node_text(first, code).to_string());
        }
    }

    // tree-sitter-cpp may parse `lg(mtx)` as a function_declarator with a
    // parameter_list containing a parameter_declaration whose type is `mtx`.
    let param_lists = collect_nodes_of_kind(decl_node, &["parameter_list"]);
    if let Some(params) = param_lists.first() {
        if let Some(first_param) = params.named_child(0) {
            // The parameter_declaration has a `type` field with the mutex name
            if let Some(type_node) = first_param.child_by_field_name("type") {
                return Some(node_text(type_node, code).to_string());
            }
            // Fallback: use the full text of the first param
            let text = node_text(first_param, code).trim().to_string();
            if !text.is_empty() {
                return Some(text);
            }
        }
    }

    None
}

// ---------------------------------------------------------------------------
// Task #4: extract_allocations
// ---------------------------------------------------------------------------

fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite> {
    let root = tree.root_node();
    let mut allocs = Vec::new();

    // --- Heap: new expressions ---
    let new_exprs = collect_nodes_of_kind(root, &["new_expression"]);
    for node in &new_exprs {
        let new_text = node_text(*node, code);
        allocs.push(AllocationSite {
            name: "new".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: Some(format!("~{POINTER_BYTES}+ B")),
            detail: truncate_detail(new_text, MAX_DETAIL_LEN),
        });
    }

    // --- Heap: delete expressions ---
    let delete_exprs = collect_nodes_of_kind(root, &["delete_expression"]);
    for node in &delete_exprs {
        let del_text = node_text(*node, code);
        allocs.push(AllocationSite {
            name: "delete".into(),
            alloc_type: AllocationType::Heap,
            line: node.start_position().row + 1,
            size_hint: None,
            detail: truncate_detail(del_text, MAX_DETAIL_LEN),
        });
    }

    // --- Heap: malloc/calloc/realloc/free and smart pointer calls ---
    let calls = collect_nodes_of_kind(root, &["call_expression"]);
    for call_node in &calls {
        let func_text = call_node
            .child_by_field_name("function")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        let line = call_node.start_position().row + 1;

        // Strip template arguments: "std::make_unique<int>" -> "std::make_unique"
        let func_base = func_text
            .find('<')
            .map(|i| &func_text[..i])
            .unwrap_or(func_text);

        match func_base {
            "malloc" | "calloc" | "realloc" => {
                allocs.push(AllocationSite {
                    name: func_text.to_string(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: extract_size_arg(&call_node, code),
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "free" => {
                allocs.push(AllocationSite {
                    name: "free".into(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: None,
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            "std::make_unique" | "make_unique" | "std::make_shared" | "make_shared"
            | "std::make_unique_for_overwrite" | "std::allocate_shared" => {
                let kind = if func_text.contains("shared") {
                    "shared_ptr"
                } else {
                    "unique_ptr"
                };
                allocs.push(AllocationSite {
                    name: kind.into(),
                    alloc_type: AllocationType::Heap,
                    line,
                    size_hint: Some(format!("~{POINTER_BYTES}+ B")),
                    detail: truncate_detail(node_text(*call_node, code), MAX_DETAIL_LEN),
                });
            }
            _ => {}
        }
    }

    // --- Stack: local variable declarations with primitive types ---
    let declarations = collect_nodes_of_kind(root, &["declaration"]);
    for decl_node in &declarations {
        let type_text = decl_node
            .child_by_field_name("type")
            .map(|n| node_text(n, code))
            .unwrap_or("");

        if type_text.is_empty() {
            continue;
        }

        // Skip heap-related declarations (smart pointers)
        let full_text = node_text(*decl_node, code);
        if full_text.contains("unique_ptr")
            || full_text.contains("shared_ptr")
            || full_text.contains("weak_ptr")
        {
            continue;
        }

        // Only treat primitive types as stack allocations
        if is_primitive_type(type_text) {
            let init_decls = collect_nodes_of_kind(*decl_node, &["init_declarator"]);
            if !init_decls.is_empty() {
                for init_decl in &init_decls {
                    let var_name = init_decl
                        .child_by_field_name("declarator")
                        .map(|d| extract_declarator_name(d, code).to_string())
                        .unwrap_or_else(|| "unknown".to_string());

                    allocs.push(AllocationSite {
                        name: var_name,
                        alloc_type: AllocationType::Stack,
                        line: decl_node.start_position().row + 1,
                        size_hint: size_hint_for_type(type_text),
                        detail: format!("stack {type_text}"),
                    });
                }
            } else {
                // Plain declaration without initializer: `int x;`
                let var_name = decl_node
                    .child_by_field_name("declarator")
                    .map(|d| extract_declarator_name(d, code).to_string())
                    .unwrap_or_else(|| "unknown".to_string());

                allocs.push(AllocationSite {
                    name: var_name,
                    alloc_type: AllocationType::Stack,
                    line: decl_node.start_position().row + 1,
                    size_hint: size_hint_for_type(type_text),
                    detail: format!("stack {type_text}"),
                });
            }
        }
    }

    allocs
}

/// Try to extract a size argument from malloc/calloc calls.
fn extract_size_arg(call_node: &tree_sitter::Node<'_>, code: &str) -> Option<String> {
    let args = call_node.child_by_field_name("arguments")?;
    let first_arg = args.named_child(0)?;
    let text = node_text(first_arg, code);
    Some(format!("{text} bytes"))
}

// ---------------------------------------------------------------------------
// Task #5: extract_variables
// ---------------------------------------------------------------------------

fn extract_variables(tree: &Tree, code: &str) -> Vec<VariableDecl> {
    let root = tree.root_node();
    let mut vars = Vec::new();

    let declarations = collect_nodes_of_kind(root, &["declaration"]);
    for decl_node in &declarations {
        let type_text = decl_node
            .child_by_field_name("type")
            .map(|n| node_text(n, code).to_string())
            .unwrap_or_default();

        let full_text = node_text(*decl_node, code);
        let is_const = full_text.contains("const ");

        // Look for init_declarator children
        let init_decls = collect_nodes_of_kind(*decl_node, &["init_declarator"]);
        if !init_decls.is_empty() {
            for init_decl in &init_decls {
                let name = init_decl
                    .child_by_field_name("declarator")
                    .map(|d| extract_declarator_name(d, code).to_string())
                    .unwrap_or_default();

                if name.is_empty() {
                    continue;
                }

                vars.push(VariableDecl {
                    name,
                    line: decl_node.start_position().row + 1,
                    type_hint: if type_text.is_empty() {
                        None
                    } else {
                        Some(type_text.clone())
                    },
                    is_mutable: !is_const,
                });
            }
        } else {
            // Plain declaration: `int x;`
            let name = decl_node
                .child_by_field_name("declarator")
                .map(|d| extract_declarator_name(d, code).to_string())
                .unwrap_or_default();

            if name.is_empty() {
                continue;
            }

            vars.push(VariableDecl {
                name,
                line: decl_node.start_position().row + 1,
                type_hint: if type_text.is_empty() {
                    None
                } else {
                    Some(type_text.clone())
                },
                is_mutable: !is_const,
            });
        }
    }

    vars
}

// ---------------------------------------------------------------------------
// LanguageParser trait implementation
// ---------------------------------------------------------------------------

impl LanguageParser for CppParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_cpp::LANGUAGE;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set C++ language: {e}"))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse C/C++ code".to_string())?;

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
int add(int a, int b) {
    return a + b;
}

void greet(const char* name) {
    printf("Hello %s\n", name);
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 2);

        assert_eq!(parsed.functions[0].name, "add");
        assert_eq!(parsed.functions[0].params, vec!["a", "b"]);
        assert!(parsed.functions[0].line_start >= 2);

        assert_eq!(parsed.functions[1].name, "greet");
        assert_eq!(parsed.functions[1].params, vec!["name"]);
        assert!(parsed.functions[1].calls.iter().any(|c| c == "printf"));
    }

    #[test]
    fn test_extract_functions_no_params() {
        let code = r#"
void do_nothing() {
    return;
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 1);
        assert_eq!(parsed.functions[0].name, "do_nothing");
        assert!(parsed.functions[0].params.is_empty());
    }

    #[test]
    fn test_extract_loops_for() {
        let code = r#"
void foo() {
    for (int i = 0; i < 10; i++) {
        printf("%d\n", i);
    }
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert!(parsed.loops[0].iterator.is_none(), "C-style for loops should not have an iterator");
    }

    #[test]
    fn test_extract_loops_while() {
        let code = r#"
void foo() {
    while (running) {
        process();
    }
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::While);
    }

    #[test]
    fn test_extract_loops_do_while() {
        let code = r#"
void foo() {
    do {
        process();
    } while (condition);
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::While);
    }

    #[test]
    fn test_extract_loops_range_for() {
        let code = r#"
void foo() {
    for (auto& item : container) {
        process(item);
    }
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 1);
        assert_eq!(parsed.loops[0].kind, LoopKind::For);
        assert_eq!(
            parsed.loops[0].iterator,
            Some("container".to_string())
        );
    }

    #[test]
    fn test_extract_concurrency_mutex_lock_unlock() {
        let code = r#"
void foo() {
    mtx.lock();
    counter++;
    mtx.unlock();
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert!(parsed.locks.len() >= 2);
        assert_eq!(parsed.locks[0].kind, LockKind::Acquire);
        assert_eq!(parsed.locks[0].lock_name, "mtx");
        assert_eq!(parsed.locks[1].kind, LockKind::Release);
        assert_eq!(parsed.locks[1].lock_name, "mtx");
    }

    #[test]
    fn test_extract_concurrency_lock_guard() {
        let code = r#"
void foo() {
    std::lock_guard<std::mutex> lg(mtx);
    counter++;
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let acquires: Vec<_> = parsed
            .locks
            .iter()
            .filter(|l| l.kind == LockKind::Acquire)
            .collect();
        assert!(
            !acquires.is_empty(),
            "expected at least one acquire from lock_guard"
        );
        assert_eq!(acquires[0].lock_name, "mtx");
        assert!(acquires[0].scope_end.is_some());
    }

    #[test]
    fn test_extract_concurrency_pthread() {
        let code = r#"
void foo() {
    pthread_mutex_lock(&mtx);
    counter++;
    pthread_mutex_unlock(&mtx);
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert!(parsed.locks.len() >= 2);
        assert_eq!(parsed.locks[0].kind, LockKind::Acquire);
        assert!(
            parsed.locks[0].lock_name.contains("mtx"),
            "expected lock name to contain mtx, got: {}",
            parsed.locks[0].lock_name
        );
        assert_eq!(parsed.locks[1].kind, LockKind::Release);
    }

    #[test]
    fn test_extract_concurrency_thread_spawn() {
        let code = r#"
void foo() {
    std::thread t(worker);
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        let spawns: Vec<_> = parsed
            .async_ops
            .iter()
            .filter(|op| op.kind == "thread_spawn")
            .collect();
        assert!(
            !spawns.is_empty(),
            "expected at least one thread_spawn, got: {:?}",
            parsed.async_ops
        );
    }

    #[test]
    fn test_extract_allocations_new() {
        let code = r#"
void foo() {
    int* p = new int(42);
    delete p;
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let new_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "new")
            .collect();
        assert!(!new_allocs.is_empty(), "expected new allocation");
        assert_eq!(new_allocs[0].alloc_type, AllocationType::Heap);

        let del_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "delete")
            .collect();
        assert!(!del_allocs.is_empty(), "expected delete");
    }

    #[test]
    fn test_extract_allocations_malloc() {
        let code = r#"
void foo() {
    int* p = (int*)malloc(sizeof(int) * 10);
    free(p);
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let malloc_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "malloc")
            .collect();
        assert!(!malloc_allocs.is_empty(), "expected malloc allocation");
        assert_eq!(malloc_allocs[0].alloc_type, AllocationType::Heap);

        let free_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "free")
            .collect();
        assert!(!free_allocs.is_empty(), "expected free");
    }

    #[test]
    fn test_extract_allocations_make_unique() {
        let code = r#"
void foo() {
    auto p = std::make_unique<int>(42);
    auto q = std::make_shared<std::string>("hello");
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let unique_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "unique_ptr")
            .collect();
        assert!(
            !unique_allocs.is_empty(),
            "expected unique_ptr allocation, got: {:?}",
            parsed.allocations
        );

        let shared_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.name == "shared_ptr")
            .collect();
        assert!(
            !shared_allocs.is_empty(),
            "expected shared_ptr allocation, got: {:?}",
            parsed.allocations
        );
    }

    #[test]
    fn test_extract_allocations_stack() {
        let code = r#"
void foo() {
    int x = 10;
    double y = 3.14;
    char c = 'a';
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let stack_allocs: Vec<_> = parsed
            .allocations
            .iter()
            .filter(|a| a.alloc_type == AllocationType::Stack)
            .collect();
        assert!(
            stack_allocs.len() >= 3,
            "expected at least 3 stack allocations, got {}: {:?}",
            stack_allocs.len(),
            stack_allocs
        );
    }

    #[test]
    fn test_extract_variables() {
        let code = r#"
void foo() {
    int x = 10;
    const double PI = 3.14;
    char c = 'a';
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let var_names: Vec<_> = parsed.variables.iter().map(|v| v.name.as_str()).collect();
        assert!(var_names.contains(&"x"), "expected variable x, got: {:?}", var_names);
        assert!(var_names.contains(&"PI"), "expected variable PI, got: {:?}", var_names);
        assert!(var_names.contains(&"c"), "expected variable c, got: {:?}", var_names);

        // PI should be immutable (const)
        let pi_var = parsed.variables.iter().find(|v| v.name == "PI").unwrap();
        assert!(!pi_var.is_mutable, "PI should be immutable (const)");

        // x should be mutable
        let x_var = parsed.variables.iter().find(|v| v.name == "x").unwrap();
        assert!(x_var.is_mutable, "x should be mutable");
    }

    #[test]
    fn test_extract_variables_type_hints() {
        let code = r#"
void foo() {
    int count = 0;
    float ratio = 1.5f;
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");

        let count_var = parsed
            .variables
            .iter()
            .find(|v| v.name == "count")
            .expect("expected variable count");
        assert_eq!(count_var.type_hint, Some("int".to_string()));

        let ratio_var = parsed
            .variables
            .iter()
            .find(|v| v.name == "ratio")
            .expect("expected variable ratio");
        assert_eq!(ratio_var.type_hint, Some("float".to_string()));
    }

    #[test]
    fn test_empty_code() {
        let parsed = CppParser::parse("").expect("parse failed");
        assert!(parsed.functions.is_empty());
        assert!(parsed.loops.is_empty());
        assert!(parsed.locks.is_empty());
        assert!(parsed.shared_accesses.is_empty());
        assert!(parsed.async_ops.is_empty());
        assert!(parsed.allocations.is_empty());
        assert!(parsed.variables.is_empty());
    }

    #[test]
    fn test_multiple_loops() {
        let code = r#"
void foo() {
    for (int i = 0; i < 10; i++) {
        while (running) {
            do {
                step();
            } while (active);
        }
    }
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.loops.len(), 3, "expected 3 loops (for, while, do-while)");
    }

    #[test]
    fn test_function_with_calls() {
        let code = r#"
int compute(int n) {
    printf("computing\n");
    int result = calculate(n);
    log_result(result);
    return result;
}
"#;
        let parsed = CppParser::parse(code).expect("parse failed");
        assert_eq!(parsed.functions.len(), 1);
        let calls = &parsed.functions[0].calls;
        assert!(calls.contains(&"printf".to_string()), "expected printf call");
        assert!(
            calls.contains(&"calculate".to_string()),
            "expected calculate call"
        );
        assert!(
            calls.contains(&"log_result".to_string()),
            "expected log_result call"
        );
    }
}
