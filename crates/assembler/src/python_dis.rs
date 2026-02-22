use crate::sandbox;
use anatomizer_core::{AsmBlock, AsmInstruction, AssemblyAnalysis};
use regex::Regex;
use std::io::Write;
use std::process::Command;
use std::sync::LazyLock;
use tempfile::NamedTempFile;

static DIS_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s*(\d+)?\s+(\d+)\s+(\w+)\s*(.*)$").expect("dis regex")
});

/// Disassemble Python code using the `dis` module.
///
/// Runs: python3 -c "import dis; exec(open('temp.py').read()); ..."
/// Parses output lines like:
///   2           0 LOAD_CONST               0 (0)
///               2 STORE_NAME               0 (counter)
pub fn disassemble_python(code: &str) -> Result<AssemblyAnalysis, String> {
    sandbox::validate_source(code)?;

    let mut temp = NamedTempFile::new().map_err(|e| format!("Failed to create temp file: {}", e))?;
    temp.write_all(code.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let temp_path = temp.path().to_string_lossy().to_string();

    let mut cmd = Command::new("python3");
    cmd.arg("-c")
        .arg("import dis,sys; code=open(sys.argv[1]).read(); dis.dis(compile(code,'<input>','exec'))")
        .arg(&temp_path);
    let output = sandbox::run_with_timeout(cmd)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python dis failed: {}", stderr));
    }

    let raw = String::from_utf8_lossy(&output.stdout).to_string();
    let blocks = parse_dis_output(&raw);

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
