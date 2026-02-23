use crate::sandbox;
use anatomizer_core::{AsmBlock, AsmInstruction, AssemblyAnalysis};
use regex::Regex;
use std::sync::LazyLock;

static DIS_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s*(\d+)?\s+(\d+)\s+(\w+)\s*(.*)$").expect("dis regex")
});

/// Python dis script fed via stdin.
///
/// Reads code from stdin, compiles it, and disassembles the bytecode.
/// This avoids creating temp files on disk.
const PYTHON_DIS_SCRIPT: &str =
    "import dis,sys; dis.dis(compile(sys.stdin.read(),'<input>','exec'))";

/// Disassemble Python code using the `dis` module.
///
/// Feeds code via stdin to avoid temp files entirely:
///   python3 -c "import dis,sys; dis.dis(compile(sys.stdin.read(),'<input>','exec'))"
///
/// Parses output lines like:
///   2           0 LOAD_CONST               0 (0)
///               2 STORE_NAME               0 (counter)
pub fn disassemble_python(code: &str) -> Result<AssemblyAnalysis, String> {
    sandbox::validate_source(code)?;

    let output = sandbox::run_command(
        "python3",
        &["-c", PYTHON_DIS_SCRIPT],
        Some(code.as_bytes()),
    )?;

    if !output.success {
        return Err("Python disassembly failed".into());
    }

    let blocks = parse_dis_output(&output.stdout);

    Ok(AssemblyAnalysis {
        arch: "cpython-bytecode".into(),
        blocks,
        notes: "Python bytecode via dis module.".into(),
    })
}

fn parse_dis_output(raw: &str) -> Vec<AsmBlock> {
    let mut blocks = vec![];
    let mut current_instructions = vec![];
    let mut current_label = "module".to_string();

    for line in raw.lines() {
        if let Some(caps) = DIS_RE.captures(line) {
            let addr = caps.get(2).map_or("", |m| m.as_str()).to_string();
            let op = caps.get(3).map_or("", |m| m.as_str()).to_string();
            let operands = caps.get(4).map_or("", |m| m.as_str()).trim().to_string();

            current_instructions.push(AsmInstruction {
                addr,
                op,
                operands,
                comment: String::new(),
            });
        } else if line.starts_with("Disassembly of") {
            if !current_instructions.is_empty() {
                blocks.push(AsmBlock {
                    label: current_label.clone(),
                    instructions: std::mem::take(&mut current_instructions),
                });
            }
            current_label = line
                .trim_start_matches("Disassembly of ")
                .trim_end_matches(':')
                .to_string();
        }
    }

    if !current_instructions.is_empty() {
        blocks.push(AsmBlock {
            label: current_label,
            instructions: current_instructions,
        });
    }

    blocks
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Sample Python 3.12+ dis output for `x = 1 + 2`.
    const SAMPLE_DIS_SIMPLE: &str = "\
  1           0 LOAD_CONST               0 (1)
              2 LOAD_CONST               1 (2)
              4 BINARY_ADD
              6 STORE_NAME               0 (x)
              8 LOAD_CONST               2 (None)
             10 RETURN_VALUE
";

    /// Sample dis output with function disassembly block headers.
    const SAMPLE_DIS_WITH_FUNCTION: &str = "\
  1           0 LOAD_CONST               0 (<code object greet>)
              2 MAKE_FUNCTION            0
              4 STORE_NAME               0 (greet)
              6 LOAD_CONST               1 (None)
              8 RETURN_VALUE

Disassembly of <code object greet at 0x7f>:
  2           0 LOAD_CONST               1 ('hello')
              2 RETURN_VALUE
";

    #[test]
    fn parse_dis_output_simple_module() {
        let blocks = parse_dis_output(SAMPLE_DIS_SIMPLE);
        assert_eq!(blocks.len(), 1);
        assert_eq!(blocks[0].label, "module");
        assert!(!blocks[0].instructions.is_empty());
    }

    #[test]
    fn parse_dis_output_extracts_opcodes() {
        let blocks = parse_dis_output(SAMPLE_DIS_SIMPLE);
        let ops: Vec<&str> = blocks[0].instructions.iter().map(|i| i.op.as_str()).collect();
        assert!(ops.contains(&"LOAD_CONST"));
        assert!(ops.contains(&"BINARY_ADD"));
        assert!(ops.contains(&"STORE_NAME"));
        assert!(ops.contains(&"RETURN_VALUE"));
    }

    #[test]
    fn parse_dis_output_extracts_operands() {
        let blocks = parse_dis_output(SAMPLE_DIS_SIMPLE);
        let first = &blocks[0].instructions[0];
        assert_eq!(first.op, "LOAD_CONST");
        assert!(first.operands.contains("(1)"));
    }

    #[test]
    fn parse_dis_output_extracts_addresses() {
        let blocks = parse_dis_output(SAMPLE_DIS_SIMPLE);
        let addrs: Vec<&str> = blocks[0].instructions.iter().map(|i| i.addr.as_str()).collect();
        assert_eq!(addrs[0], "0");
        assert_eq!(addrs[1], "2");
        assert_eq!(addrs[2], "4");
    }

    #[test]
    fn parse_dis_output_with_function_creates_two_blocks() {
        let blocks = parse_dis_output(SAMPLE_DIS_WITH_FUNCTION);
        assert_eq!(blocks.len(), 2);
        assert_eq!(blocks[0].label, "module");
        assert!(blocks[1].label.contains("greet"));
    }

    #[test]
    fn parse_dis_output_empty_input() {
        let blocks = parse_dis_output("");
        assert!(blocks.is_empty());
    }

    #[test]
    fn parse_dis_output_only_header_no_instructions() {
        let blocks = parse_dis_output("Disassembly of <code object foo>:\n");
        assert!(blocks.is_empty(), "no instructions means no blocks");
    }

    #[test]
    fn parse_dis_output_non_matching_lines_ignored() {
        let input = "some random text\nanother line\n";
        let blocks = parse_dis_output(input);
        assert!(blocks.is_empty());
    }
}
