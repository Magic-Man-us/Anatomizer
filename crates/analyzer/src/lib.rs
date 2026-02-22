pub mod compare;
pub mod concurrency;
pub mod cost;
pub mod debugger;
pub mod memory;

use anatomizer_core::AnalysisResponse;

/// Run all analysis engines on the given code and return a full response.
pub fn analyze(code: &str, language: &str) -> AnalysisResponse {
    let parsed = anatomizer_parser::parse(code, language);

    match parsed {
        Ok(parsed_code) => {
            let execution = cost::execution_analysis(&parsed_code, code, language);
            let cost = cost::cost_analysis(&parsed_code, code, language);
            let mem = memory::memory_analysis(&parsed_code, code, language);
            let conc = concurrency::concurrency_analysis(&parsed_code, code, language);
            let dbg = debugger::debugger_analysis(&parsed_code, code, language);
            let cmp = compare::compare_analysis(&parsed_code, code, language);
            let asm = anatomizer_assembler::disassemble(code, language)
                .unwrap_or_else(|e| anatomizer_core::AssemblyAnalysis {
                    arch: "unknown".into(),
                    blocks: vec![],
                    notes: format!("Disassembly failed: {}", e),
                });

            AnalysisResponse {
                language: language.to_string(),
                execution,
                cost,
                memory: mem,
                concurrency: conc,
                assembly: asm,
                debugger: dbg,
                compare: cmp,
            }
        }
        Err(e) => {
            let mut stub = AnalysisResponse::stub(language);
            stub.execution.summary = format!("Parse error: {}", e);
            stub
        }
    }
}
