pub mod cpp;
pub mod go_lang;
pub mod python;
pub mod rust_lang;
pub mod typescript;

use tree_sitter::Tree;

/// A function definition extracted from the AST.
#[derive(Debug, Clone)]
pub struct FunctionDef {
    pub name: String,
    pub line_start: usize,
    pub line_end: usize,
    pub params: Vec<String>,
    pub calls: Vec<String>,
}

/// A loop construct extracted from the AST.
#[derive(Debug, Clone)]
pub struct LoopConstruct {
    pub kind: LoopKind,
    pub line_start: usize,
    pub line_end: usize,
    pub iterator: Option<String>,
    pub body_complexity: u32,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LoopKind {
    For,
    While,
    Loop,
    Recursion,
}

/// A lock acquire/release extracted from the AST.
#[derive(Debug, Clone)]
pub struct LockOperation {
    pub kind: LockKind,
    pub lock_name: String,
    pub line: usize,
    pub scope_end: Option<usize>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LockKind {
    Acquire,
    Release,
}

/// A shared variable access (read or write).
#[derive(Debug, Clone)]
pub struct SharedAccess {
    pub variable: String,
    pub access_type: AccessType,
    pub line: usize,
    pub in_locked_region: bool,
    pub thread_context: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AccessType {
    Read,
    Write,
}

/// An async operation (spawn, await, etc.).
#[derive(Debug, Clone)]
pub struct AsyncOperation {
    pub kind: String,
    pub line: usize,
    pub detail: String,
}

/// A memory allocation site.
#[derive(Debug, Clone)]
pub struct AllocationSite {
    pub name: String,
    pub alloc_type: AllocationType,
    pub line: usize,
    pub size_hint: Option<String>,
    pub detail: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AllocationType {
    Stack,
    Heap,
}

/// A variable declaration.
#[derive(Debug, Clone)]
pub struct VariableDecl {
    pub name: String,
    pub line: usize,
    pub type_hint: Option<String>,
    pub is_mutable: bool,
}

/// Full parse result for a source file.
#[derive(Debug)]
pub struct ParsedCode {
    pub tree: Tree,
    pub functions: Vec<FunctionDef>,
    pub loops: Vec<LoopConstruct>,
    pub locks: Vec<LockOperation>,
    pub shared_accesses: Vec<SharedAccess>,
    pub async_ops: Vec<AsyncOperation>,
    pub allocations: Vec<AllocationSite>,
    pub variables: Vec<VariableDecl>,
}

/// Trait that each language module implements.
pub trait LanguageParser {
    fn parse(code: &str) -> Result<ParsedCode, String>;
    fn extract_functions(tree: &Tree, code: &str) -> Vec<FunctionDef>;
    fn extract_loops(tree: &Tree, code: &str) -> Vec<LoopConstruct>;
    fn extract_concurrency(
        tree: &Tree,
        code: &str,
    ) -> (Vec<LockOperation>, Vec<SharedAccess>, Vec<AsyncOperation>);
    fn extract_allocations(tree: &Tree, code: &str) -> Vec<AllocationSite>;
}

/// Parse source code for a given language, returning a `ParsedCode`.
pub fn parse(code: &str, language: &str) -> Result<ParsedCode, String> {
    match language {
        "python" => python::PythonParser::parse(code),
        "rust" => rust_lang::RustParser::parse(code),
        "typescript" | "javascript" => typescript::TypeScriptParser::parse(code),
        "go" => go_lang::GoParser::parse(code),
        "cpp" | "c" => cpp::CppParser::parse(code),
        _ => Err(format!("Unsupported language: {}", language)),
    }
}
