use crate::sandbox;
use crate::x86_parse::parse_x86_asm;
use anatomizer_core::AssemblyAnalysis;
use std::process::Command;
use tempfile::TempDir;

/// Disassemble C/C++ code using `gcc -S` or `g++ -S`.
///
/// Validates source size and enforces a timeout on the compiler subprocess.
///
/// Writes source to a temp file, compiles with:
///   gcc -S -O2 -fverbose-asm -o temp.s temp.c
/// Then parses the .s file into labeled blocks.
///
/// Automatically detects C++ via heuristics (class, template, std::, etc.)
/// and switches to `g++` with a `.cpp` extension when appropriate.
pub fn disassemble_c(code: &str) -> Result<AssemblyAnalysis, String> {
    sandbox::validate_source(code)?;

    let dir = TempDir::new().map_err(|e| format!("Failed to create temp dir: {}", e))?;

    let is_cpp = detect_cpp(code);
    let ext = if is_cpp { "cpp" } else { "c" };
    let compiler = if is_cpp { "g++" } else { "gcc" };
    let src_path = dir.path().join(format!("input.{}", ext));
    let asm_path = dir.path().join("output.s");

    // Wrap in a main function if one is not present, so the compiler
    // can produce a complete translation unit.
    let full_code = if code.contains("main(") || code.contains("main (") {
        code.to_string()
    } else {
        format!("{}\n\nint main() {{ return 0; }}", code)
    };

    std::fs::write(&src_path, &full_code)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let mut cmd = Command::new(compiler);
    cmd.args(["-S", "-O2", "-fverbose-asm", "-o"])
        .arg(&asm_path)
        .arg(&src_path);
    let output = sandbox::run_with_timeout(cmd)?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("{} failed: {}", compiler, stderr));
    }

    let raw = std::fs::read_to_string(&asm_path)
        .map_err(|e| format!("Failed to read assembly: {}", e))?;

    let blocks = parse_x86_asm(&raw);
    let lang_label = if is_cpp { "C++" } else { "C" };

    Ok(AssemblyAnalysis {
        arch: "x86-64".into(),
        blocks,
        notes: format!(
            "{} assembly via {} -S -O2 -fverbose-asm",
            lang_label, compiler
        ),
    })
}

/// Simple heuristic: if the source uses any C++-specific constructs,
/// treat it as C++ so we invoke g++ instead of gcc.
fn detect_cpp(code: &str) -> bool {
    const CPP_INDICATORS: &[&str] = &[
        "class ", "template", "std::", "iostream", "namespace", "cout", "cin",
        "vector<", "string ", "unique_ptr", "shared_ptr", "nullptr",
    ];
    CPP_INDICATORS.iter().any(|kw| code.contains(kw))
}

#[cfg(test)]
mod tests {
    use super::*;
    use anatomizer_core::AsmInstruction;

    /// Sample GCC -S output for parse testing (no compiler required).
    const SAMPLE_GCC_ASM: &str = "\
\t.file\t\"input.c\"
\t.text
\t.globl\tmain
\t.type\tmain, @function
main:
\tendbr64
\txorl\t%eax, %eax\t# return 0
\tret
.LFE0:
\t.size\tmain, .-main
";

    #[test]
    fn parse_x86_asm_produces_blocks() {
        let blocks = parse_x86_asm(SAMPLE_GCC_ASM);
        assert!(!blocks.is_empty(), "should produce at least one block");

        // The 'main' label should appear
        let main_block = blocks.iter().find(|b| b.label == "main");
        assert!(main_block.is_some(), "expected a 'main' block");
    }

    #[test]
    fn parse_x86_asm_extracts_instructions() {
        let blocks = parse_x86_asm(SAMPLE_GCC_ASM);
        let all_instructions: Vec<&AsmInstruction> =
            blocks.iter().flat_map(|b| &b.instructions).collect();

        assert!(!all_instructions.is_empty(), "should have instructions");

        let has_ret = all_instructions.iter().any(|i| i.op == "ret");
        assert!(has_ret, "expected a 'ret' instruction");
    }

    #[test]
    fn parse_x86_asm_extracts_comments() {
        let blocks = parse_x86_asm(SAMPLE_GCC_ASM);
        let all_instructions: Vec<&AsmInstruction> =
            blocks.iter().flat_map(|b| &b.instructions).collect();

        let xorl = all_instructions.iter().find(|i| i.op == "xorl");
        assert!(xorl.is_some(), "expected an 'xorl' instruction");
        assert_eq!(xorl.unwrap().comment, "return 0");
    }

    #[test]
    fn detect_cpp_identifies_cpp_code() {
        assert!(detect_cpp("#include <iostream>\nusing namespace std;"));
        assert!(detect_cpp("class Foo {};"));
        assert!(detect_cpp("template<typename T> T add(T a, T b);"));
        assert!(detect_cpp("std::vector<int> v;"));
    }

    #[test]
    fn detect_cpp_rejects_plain_c() {
        assert!(!detect_cpp("#include <stdio.h>\nint main() { return 0; }"));
        assert!(!detect_cpp("void foo(int x) { }"));
    }

    #[test]
    fn parse_x86_asm_handles_empty_input() {
        let blocks = parse_x86_asm("");
        assert!(blocks.is_empty());
    }

    #[test]
    fn parse_x86_asm_handles_local_labels() {
        let asm = "\
main:
\tmovl\t$1, %eax
.L2:
\taddl\t$1, %eax
\tret
";
        let blocks = parse_x86_asm(asm);
        assert!(blocks.len() >= 2, "expected blocks for main and .L2");

        let l2_block = blocks.iter().find(|b| b.label == ".L2");
        assert!(l2_block.is_some(), "expected a '.L2' block");
    }

    /// Integration test: requires gcc to be installed on the system.
    #[test]
    #[ignore]
    fn disassemble_c_simple_program() {
        let code = r#"
#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(3, 4);
    printf("%d\n", result);
    return 0;
}
"#;
        let result = disassemble_c(code);
        assert!(result.is_ok(), "disassemble_c failed: {:?}", result.err());

        let analysis = result.unwrap();
        assert_eq!(analysis.arch, "x86-64");
        assert!(!analysis.blocks.is_empty(), "expected assembly blocks");
    }

    /// Integration test: requires g++ to be installed on the system.
    #[test]
    #[ignore]
    fn disassemble_cpp_simple_program() {
        let code = r#"
#include <iostream>

class Greeter {
public:
    void greet() {
        std::cout << "hello" << std::endl;
    }
};

int main() {
    Greeter g;
    g.greet();
    return 0;
}
"#;
        let result = disassemble_c(code);
        assert!(result.is_ok(), "disassemble_c (C++) failed: {:?}", result.err());

        let analysis = result.unwrap();
        assert!(analysis.notes.contains("C++"));
        assert!(analysis.notes.contains("g++"));
    }
}
