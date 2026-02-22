pub mod c_asm;
pub mod cycles;
pub mod go_asm;
pub mod python_dis;
pub mod rust_asm;
pub mod sandbox;
pub mod x86_parse;

use anatomizer_core::AssemblyAnalysis;

/// Disassemble source code to assembly/bytecode for the given language.
pub fn disassemble(code: &str, language: &str) -> Result<AssemblyAnalysis, String> {
    match language {
        "python" => python_dis::disassemble_python(code),
        "rust" => rust_asm::disassemble_rust(code),
        "c" | "cpp" => c_asm::disassemble_c(code),
        "go" => go_asm::disassemble_go(code),
        _ => Err(format!("Unsupported language for disassembly: {}", language)),
    }
}
