use crate::sandbox;
use crate::x86_parse::parse_x86_asm;
use anatomizer_core::AssemblyAnalysis;
use std::process::Command;
use tempfile::TempDir;

/// Disassemble Rust code using `rustc --emit asm`.
///
/// Validates source size and enforces a timeout on the rustc subprocess.
///
/// Writes source to a temp file, compiles with:
///   rustc --emit asm -C opt-level=2 -o temp.s temp.rs
/// Then parses the .s file into labeled blocks.
pub fn disassemble_rust(code: &str) -> Result<AssemblyAnalysis, String> {
    sandbox::validate_source(code)?;

    let dir = TempDir::new().map_err(|e| format!("Failed to create temp dir: {}", e))?;
    let src_path = dir.path().join("input.rs");
    let asm_path = dir.path().join("output.s");

    // Wrap in a main function if one is not present, so rustc can produce
    // a complete compilation unit.
    let full_code = if code.contains("fn main") {
        code.to_string()
    } else {
        format!("{}\n\nfn main() {{}}", code)
    };

    std::fs::write(&src_path, &full_code)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let mut cmd = Command::new("rustc");
    cmd.args(["--emit", "asm", "-C", "opt-level=2", "-o"])
        .arg(&asm_path)
        .arg(&src_path);
    let output = sandbox::run_with_timeout(cmd)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("rustc failed: {}", stderr));
    }

    let raw = std::fs::read_to_string(&asm_path)
        .map_err(|e| format!("Failed to read assembly: {}", e))?;

    let blocks = parse_x86_asm(&raw);

    Ok(AssemblyAnalysis {
        arch: "x86-64".into(),
        blocks,
        notes: "Rust assembly via rustc --emit asm -C opt-level=2".into(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use anatomizer_core::AsmInstruction;

    const SAMPLE_RUST_ASM: &str = "\
\t.text
\t.file\t\"input.rs\"
\t.section\t.text._ZN5input3add17h1234567890abcdefE
\t.globl\t_ZN5input3add17h1234567890abcdefE
_ZN5input3add17h1234567890abcdefE:
\tpushq\t%rbp
\tmovq\t%rsp, %rbp
\taddl\t%esi, %edi\t# add the args
\tmovl\t%edi, %eax
\tpopq\t%rbp
\tretq
.LBB0_1:
\txorl\t%eax, %eax
\tretq
";

    #[test]
    fn test_parse_x86_asm() {
        let blocks = parse_x86_asm(SAMPLE_RUST_ASM);
        assert!(!blocks.is_empty(), "should produce at least one block");
    }

    #[test]
    fn test_parse_asm_multiple_blocks() {
        let blocks = parse_x86_asm(SAMPLE_RUST_ASM);
        assert!(
            blocks.len() >= 2,
            "expected at least 2 blocks (function + .LBB0_1), got {}",
            blocks.len()
        );
    }

    #[test]
    fn test_parse_asm_comment_splitting() {
        let blocks = parse_x86_asm(SAMPLE_RUST_ASM);
        let all_instrs: Vec<&AsmInstruction> =
            blocks.iter().flat_map(|b| &b.instructions).collect();
        let addl = all_instrs.iter().find(|i| i.op == "addl");
        assert!(addl.is_some(), "expected an addl instruction");
        assert_eq!(addl.unwrap().comment, "add the args");
    }

    #[test]
    fn test_parse_asm_skips_directives() {
        let blocks = parse_x86_asm(SAMPLE_RUST_ASM);
        let all_ops: Vec<&str> = blocks
            .iter()
            .flat_map(|b| b.instructions.iter().map(|i| i.op.as_str()))
            .collect();
        // .text, .file, .section, .globl should not appear as instructions
        assert!(
            !all_ops.contains(&".text"),
            "directives should not appear as instructions"
        );
    }

    #[test]
    fn test_parse_asm_handles_empty_input() {
        let blocks = parse_x86_asm("");
        assert!(blocks.is_empty());
    }

    /// Integration test: requires the Rust toolchain to be installed.
    #[test]
    #[ignore]
    fn test_disassemble_rust_basic() {
        let code = r#"
fn add(a: i32, b: i32) -> i32 {
    a + b
}
"#;
        let result = disassemble_rust(code);
        assert!(
            result.is_ok(),
            "disassemble_rust failed: {:?}",
            result.err()
        );

        let analysis = result.unwrap();
        assert_eq!(analysis.arch, "x86-64");
        assert!(!analysis.blocks.is_empty(), "expected assembly blocks");
    }
}
