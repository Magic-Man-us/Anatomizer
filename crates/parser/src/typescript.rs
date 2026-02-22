use tree_sitter::Tree;

use crate::{
    AllocationSite, AsyncOperation, FunctionDef, LanguageParser, LockOperation, LoopConstruct,
    ParsedCode, SharedAccess,
};

pub struct TypeScriptParser;

impl LanguageParser for TypeScriptParser {
    fn parse(code: &str) -> Result<ParsedCode, String> {
        let mut parser = tree_sitter::Parser::new();
        let language = tree_sitter_javascript::LANGUAGE;
        parser
            .set_language(&language.into())
            .map_err(|e| format!("Failed to set JavaScript language: {}", e))?;

        let tree = parser
            .parse(code, None)
            .ok_or_else(|| "Failed to parse TypeScript/JavaScript code".to_string())?;

        let functions = Self::extract_functions(&tree, code);
        let loops = Self::extract_loops(&tree, code);
        let (locks, shared_accesses, async_ops) = Self::extract_concurrency(&tree, code);
        let allocations = Self::extract_allocations(&tree, code);

        Ok(ParsedCode {
            tree,
            functions,
            loops,
            locks,
            shared_accesses,
            async_ops,
            allocations,
            variables: vec![],
        })
    }

    fn extract_functions(_tree: &Tree, _code: &str) -> Vec<FunctionDef> {
        // TODO: Walk AST for `function_declaration`, `arrow_function`, `method_definition`
        vec![]
    }

    fn extract_loops(_tree: &Tree, _code: &str) -> Vec<LoopConstruct> {
        // TODO: Walk AST for `for_statement`, `for_in_statement`, `while_statement`
        vec![]
    }

    fn extract_concurrency(
        _tree: &Tree,
        _code: &str,
    ) -> (Vec<LockOperation>, Vec<SharedAccess>, Vec<AsyncOperation>) {
        // TODO: Detect Promise, async/await, Worker patterns
        (vec![], vec![], vec![])
    }

    fn extract_allocations(_tree: &Tree, _code: &str) -> Vec<AllocationSite> {
        // TODO: JS is GC-managed; detect object/array literals, new expressions
        vec![]
    }
}
