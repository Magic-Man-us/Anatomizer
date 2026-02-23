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
