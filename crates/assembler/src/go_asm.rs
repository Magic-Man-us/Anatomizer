use crate::sandbox;
use anatomizer_core::{AsmBlock, AsmInstruction, AssemblyAnalysis};
use regex::Regex;
use std::process::Command;
use std::sync::LazyLock;
use tempfile::TempDir;

static FUNC_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"^(?:""\.|[\w\-]+\.)?(\w+)\s+STEXT"#).expect("function header regex")
});
static INSTR_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s+0x[\da-fA-F]+\s+\d+\s+\([^)]*\)\s+(\w+)\s*(.*)$").expect("instr regex")
});
static SIMPLE_INSTR_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s+([A-Z]\w*)\s+(.*)$").expect("simple instr regex")
});

/// Disassemble Go code using `go tool compile -S`.
///
/// Validates source size and enforces a timeout on the go subprocess.
///
/// Writes source to a temp file, compiles with:
///   go tool compile -S temp.go
/// Then parses the Plan 9 assembly output into labeled blocks.
///
/// Ensures a `package` declaration is present; defaults to `package main`
/// if one is missing.
pub fn disassemble_go(code: &str) -> Result<AssemblyAnalysis, String> {
    sandbox::validate_source(code)?;

    let dir = TempDir::new().map_err(|e| format!("Failed to create temp dir: {}", e))?;
    let src_path = dir.path().join("input.go");

    // Ensure a package declaration exists so `go tool compile` accepts it.
    let full_code = if code.contains("package ") {
        code.to_string()
    } else {
        format!("package main\n\n{}", code)
    };

    std::fs::write(&src_path, &full_code)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let mut cmd = Command::new("go");
    cmd.args(["tool", "compile", "-S"]).arg(&src_path);
    let output = sandbox::run_with_timeout(cmd)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("go tool compile failed: {}", stderr));
    }

    // `go tool compile -S` writes assembly to stderr (not stdout).
    // Combine both to be safe.
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let raw = if !stdout.is_empty() { stdout } else { stderr };

    let blocks = parse_go_asm(&raw);

    Ok(AssemblyAnalysis {
        arch: "go-asm".into(),
        blocks,
        notes: "Go assembly via go tool compile -S (Plan 9 assembly)".into(),
    })
}

/// Parse Go compiler `-S` output into labeled blocks.
///
/// Go asm output has two common formats:
/// 1. Function headers: `"".funcname STEXT ...` or `command-line-arguments.funcname STEXT ...`
/// 2. Instructions with hex offsets: `  0x0000 00000 (input.go:4)  MOVQ  AX, BX`
/// 3. Simple indented instructions: `  FUNCDATA  $0, ...`
///
/// We group instructions under their parent function header as blocks.
fn parse_go_asm(raw: &str) -> Vec<AsmBlock> {
    let mut blocks: Vec<AsmBlock> = Vec::new();
    let mut current_label = String::new();
    let mut current_instructions: Vec<AsmInstruction> = Vec::new();

    for line in raw.lines() {
        if let Some(caps) = FUNC_RE.captures(line) {
            // Flush previous block
            if !current_instructions.is_empty() {
                blocks.push(AsmBlock {
                    label: if current_label.is_empty() {
                        "init".into()
                    } else {
                        current_label.clone()
                    },
                    instructions: std::mem::take(&mut current_instructions),
                });
            }
            current_label = caps[1].to_string();
        } else if let Some(caps) = INSTR_RE.captures(line) {
            current_instructions.push(AsmInstruction {
                addr: String::new(),
                op: caps[1].to_string(),
                operands: caps.get(2).map_or("", |m| m.as_str()).trim().to_string(),
                comment: String::new(),
            });
        } else if let Some(caps) = SIMPLE_INSTR_RE.captures(line) {
            // The regex `[A-Z]\w*` already guarantees uppercase-first.
            current_instructions.push(AsmInstruction {
                addr: String::new(),
                op: caps[1].to_string(),
                operands: caps.get(2).map_or("", |m| m.as_str()).trim().to_string(),
                comment: String::new(),
            });
        }
    }

    // Flush final block
    if !current_instructions.is_empty() {
        blocks.push(AsmBlock {
            label: if current_label.is_empty() {
                "main".into()
            } else {
                current_label
            },
            instructions: current_instructions,
        });
    }

    blocks
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Sample Go compiler -S output for parse testing (no Go toolchain required).
    const SAMPLE_GO_ASM: &str = r#""".add STEXT nosplit size=7 args=0x10 locals=0x0 funcid=0x0 align=0x0
	0x0000 00000 (input.go:4)	TEXT	"".add(SB), NOSPLIT|ABIInternal, $0-16
	0x0000 00000 (input.go:4)	FUNCDATA	$0, gclocals·g2BeySu+wFnoycgXfElmcg==(SB)
	0x0000 00000 (input.go:5)	ADDQ	BX, AX
	0x0003 00003 (input.go:5)	RET
"".main STEXT size=68 args=0x0 locals=0x18 funcid=0x0 align=0x0
	0x0000 00000 (input.go:8)	TEXT	"".main(SB), ABIInternal, $24-0
	0x0000 00000 (input.go:8)	PUSHQ	BP
	0x0001 00001 (input.go:8)	MOVQ	SP, BP
	0x0004 00004 (input.go:9)	MOVL	$3, AX
	0x0009 00009 (input.go:9)	MOVL	$4, BX
	0x000e 00014 (input.go:9)	CALL	"".add(SB)
	0x0013 00019 (input.go:10)	POPQ	BP
	0x0014 00020 (input.go:10)	RET
"#;

    #[test]
    fn parse_go_asm_produces_blocks() {
        let blocks = parse_go_asm(SAMPLE_GO_ASM);
        assert!(!blocks.is_empty(), "should produce at least one block");
        assert!(blocks.len() >= 2, "expected blocks for 'add' and 'main'");
    }

    #[test]
    fn parse_go_asm_extracts_function_names() {
        let blocks = parse_go_asm(SAMPLE_GO_ASM);
        let labels: Vec<&str> = blocks.iter().map(|b| b.label.as_str()).collect();

        assert!(labels.contains(&"add"), "expected 'add' block, got {:?}", labels);
        assert!(
            labels.contains(&"main"),
            "expected 'main' block, got {:?}",
            labels
        );
    }

    #[test]
    fn parse_go_asm_extracts_instructions() {
        let blocks = parse_go_asm(SAMPLE_GO_ASM);

        let main_block = blocks.iter().find(|b| b.label == "main");
        assert!(main_block.is_some(), "expected 'main' block");

        let instrs = &main_block.unwrap().instructions;
        assert!(!instrs.is_empty(), "main block should have instructions");

        let has_ret = instrs.iter().any(|i| i.op == "RET");
        assert!(has_ret, "expected RET in main block");
    }

    #[test]
    fn parse_go_asm_handles_empty_input() {
        let blocks = parse_go_asm("");
        assert!(blocks.is_empty());
    }

    #[test]
    fn parse_go_asm_add_block_has_addq() {
        let blocks = parse_go_asm(SAMPLE_GO_ASM);
        let add_block = blocks.iter().find(|b| b.label == "add").unwrap();

        let has_addq = add_block.instructions.iter().any(|i| i.op == "ADDQ");
        assert!(has_addq, "expected ADDQ in add block");
    }

    #[test]
    fn parse_go_asm_with_package_prefix() {
        let asm = r#"command-line-arguments.hello STEXT size=10 args=0x0 locals=0x0
	0x0000 00000 (input.go:3)	TEXT	command-line-arguments.hello(SB), $0-0
	0x0000 00000 (input.go:3)	RET
"#;
        let blocks = parse_go_asm(asm);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].label, "hello");
    }

    /// Integration test: requires the Go toolchain to be installed.
    #[test]
    #[ignore]
    fn disassemble_go_simple_program() {
        let code = r#"
package main

func add(a, b int) int {
    return a + b
}

func main() {
    _ = add(3, 4)
}
"#;
        let result = disassemble_go(code);
        assert!(result.is_ok(), "disassemble_go failed: {:?}", result.err());

        let analysis = result.unwrap();
        assert_eq!(analysis.arch, "go-asm");
        assert!(!analysis.blocks.is_empty(), "expected assembly blocks");
    }
}
