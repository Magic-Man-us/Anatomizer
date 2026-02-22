use anatomizer_core::{AsmBlock, AsmInstruction};
use regex::Regex;
use std::sync::LazyLock;

static LABEL_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^([a-zA-Z_.][a-zA-Z0-9_.]*):\s*$").expect("label regex")
});
static INSTR_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\s+(\w+)\s*(.*)$").expect("instruction regex")
});

/// Parse x86 assembly (GCC/rustc `-S`) output into labeled blocks.
///
/// Labels (e.g. `main:`, `.LBB0_1:`, `.L2:`) start new blocks.
/// Indented lines with a mnemonic are instructions.
/// Assembler directives (lines starting with `.` that are not labels) are
/// skipped.
pub fn parse_x86_asm(raw: &str) -> Vec<AsmBlock> {
    let mut blocks: Vec<AsmBlock> = Vec::new();
    let mut current_label = String::new();
    let mut current_instructions: Vec<AsmInstruction> = Vec::new();

    for line in raw.lines() {
        let trimmed = line.trim();

        // Skip assembler directives; preserve labels (which end with ':').
        if trimmed.starts_with('.') && !trimmed.ends_with(':') {
            continue;
        }

        if let Some(caps) = LABEL_RE.captures(line) {
            // Flush previous block
            if !current_instructions.is_empty() || !current_label.is_empty() {
                blocks.push(AsmBlock {
                    label: if current_label.is_empty() {
                        "prologue".into()
                    } else {
                        current_label.clone()
                    },
                    instructions: std::mem::take(&mut current_instructions),
                });
            }
            current_label = caps[1].to_string();
        } else if let Some(caps) = INSTR_RE.captures(line) {
            let op = caps[1].to_string();
            let rest = caps.get(2).map_or("", |m| m.as_str());

            let (operands, comment) = match rest.find('#') {
                Some(idx) => (
                    rest[..idx].trim().to_string(),
                    rest[idx + 1..].trim().to_string(),
                ),
                None => (rest.trim().to_string(), String::new()),
            };

            current_instructions.push(AsmInstruction {
                addr: String::new(),
                op,
                operands,
                comment,
            });
        }
    }

    // Flush final block
    if !current_instructions.is_empty() {
        blocks.push(AsmBlock {
            label: if current_label.is_empty() {
                "epilogue".into()
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

    const SAMPLE_ASM: &str = "\
\t.text
\t.file\t\"input.c\"
\t.globl\tmain
\t.type\tmain, @function
main:
\tendbr64
\txorl\t%eax, %eax\t# return 0
\tret
.L2:
\taddl\t$1, %eax
\tret
";

    #[test]
    fn parse_produces_blocks() {
        let blocks = parse_x86_asm(SAMPLE_ASM);
        assert!(!blocks.is_empty(), "should produce at least one block");

        let main_block = blocks.iter().find(|b| b.label == "main");
        assert!(main_block.is_some(), "expected a 'main' block");
    }

    #[test]
    fn parse_extracts_instructions() {
        let blocks = parse_x86_asm(SAMPLE_ASM);
        let all_instructions: Vec<&AsmInstruction> =
            blocks.iter().flat_map(|b| &b.instructions).collect();

        assert!(!all_instructions.is_empty(), "should have instructions");

        let has_ret = all_instructions.iter().any(|i| i.op == "ret");
        assert!(has_ret, "expected a 'ret' instruction");
    }

    #[test]
    fn parse_extracts_comments() {
        let blocks = parse_x86_asm(SAMPLE_ASM);
        let all_instructions: Vec<&AsmInstruction> =
            blocks.iter().flat_map(|b| &b.instructions).collect();

        let xorl = all_instructions.iter().find(|i| i.op == "xorl");
        assert!(xorl.is_some(), "expected an 'xorl' instruction");
        assert_eq!(xorl.unwrap().comment, "return 0");
    }

    #[test]
    fn parse_handles_local_labels() {
        let blocks = parse_x86_asm(SAMPLE_ASM);
        let l2_block = blocks.iter().find(|b| b.label == ".L2");
        assert!(l2_block.is_some(), "expected a '.L2' block");
    }

    #[test]
    fn parse_skips_directives() {
        let blocks = parse_x86_asm(SAMPLE_ASM);
        let all_ops: Vec<&str> = blocks
            .iter()
            .flat_map(|b| b.instructions.iter().map(|i| i.op.as_str()))
            .collect();
        assert!(
            !all_ops.contains(&".text"),
            "directives should not appear as instructions"
        );
    }

    #[test]
    fn parse_handles_empty_input() {
        let blocks = parse_x86_asm("");
        assert!(blocks.is_empty());
    }
}
