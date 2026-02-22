use std::collections::HashMap;
use std::sync::LazyLock;

use anatomizer_assembler::cycles::estimate_cycles;
use anatomizer_core::{CostAnalysis, ExecutionAnalysis, Instruction, LineCost};
use anatomizer_parser::{AllocationType, LoopKind, ParsedCode};
use regex::Regex;

// ---------------------------------------------------------------------------
// Constants — no magic numbers
// ---------------------------------------------------------------------------

const DEFAULT_LOOP_ITERATIONS: u32 = 100;
const PYTHON_CALL_OVERHEAD: u32 = 50;
const NATIVE_CALL_OVERHEAD: u32 = 3;
const PYTHON_ALLOC_COST: u32 = 20;
/// Estimated cycle cost for native heap allocation (malloc/new).
const NATIVE_ALLOC_COST: u32 = 40;
const BASE_STATEMENT_COST: u32 = 5;

static RANGE_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"range\(\s*(?:(\d+)\s*,\s*)?(\d+)\s*\)").unwrap()
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Returns `true` when the language string refers to Python.
fn is_python(language: &str) -> bool {
    language == "python"
}

/// Attempt to extract the iteration count from a loop iterator string.
///
/// Recognises patterns like `range(1000)`, `range(50)`, etc.
/// Falls back to [`DEFAULT_LOOP_ITERATIONS`] when parsing fails or no
/// iterator is present.
fn parse_iteration_count(iterator: &Option<String>) -> u32 {
    let Some(iter_str) = iterator.as_deref() else {
        return DEFAULT_LOOP_ITERATIONS;
    };

    // Match range(N) or range(start, N) where N is a positive integer.
    if let Some(caps) = RANGE_RE.captures(iter_str) {
        // Group 2 is always the upper bound; group 1 is the optional start.
        if let Some(m) = caps.get(2) {
            if let Ok(n) = m.as_str().parse::<u32>() {
                if n > 0 {
                    return n;
                }
            }
        }
    }

    DEFAULT_LOOP_ITERATIONS
}

/// Return the cycle-table key for a CALL pseudo-op.
fn call_op(language: &str) -> &'static str {
    if is_python(language) { "call_function" } else { "call" }
}

/// Return the cycle-table key for a LOAD pseudo-op.
fn load_op(language: &str) -> &'static str {
    if is_python(language) { "load_fast" } else { "mov" }
}

/// Return the cycle-table key for a STORE pseudo-op.
fn store_op(language: &str) -> &'static str {
    if is_python(language) { "store_fast" } else { "mov" }
}

/// Return the cycle-table key for a CMP pseudo-op.
fn cmp_op(language: &str) -> &'static str {
    if is_python(language) { "compare_op" } else { "cmp" }
}

/// Map a simple arithmetic pseudo-op name to its cycle-table key.
fn arith_op(pseudo: &str, language: &str) -> &'static str {
    if is_python(language) {
        match pseudo {
            "ADD" => "binary_add",
            "SUB" => "binary_subtract",
            "MUL" => "binary_multiply",
            "DIV" => "binary_true_divide",
            _ => "binary_add",
        }
    } else {
        match pseudo {
            "ADD" => "add",
            "SUB" => "sub",
            "MUL" => "imul",
            "DIV" => "div",
            _ => "add",
        }
    }
}

/// Return the call overhead cost for the given language.
fn call_overhead(language: &str) -> u32 {
    if is_python(language) { PYTHON_CALL_OVERHEAD } else { NATIVE_CALL_OVERHEAD }
}

/// Return the allocation cost for the given language and allocation type.
fn alloc_cost(language: &str, alloc_type: &AllocationType) -> u32 {
    match alloc_type {
        AllocationType::Heap => {
            if is_python(language) {
                PYTHON_ALLOC_COST
            } else {
                NATIVE_ALLOC_COST
            }
        }
        AllocationType::Stack => 1, // stack allocation is nearly free
    }
}

// ---------------------------------------------------------------------------
// execution_analysis
// ---------------------------------------------------------------------------

/// Produce a high-level execution analysis (instruction stream + total cycles).
///
/// Walks parsed functions, loops, and allocations to emit a pseudo-instruction
/// stream, then uses the cycle-cost table to estimate total cycles.
pub fn execution_analysis(parsed: &ParsedCode, _code: &str, language: &str) -> ExecutionAnalysis {
    let mut instructions: Vec<Instruction> = Vec::new();
    let mut total_cycles: u32 = 0;

    // 1. Functions — emit a CALL instruction per function definition.
    for func in &parsed.functions {
        let op_key = call_op(language);
        let cycles = estimate_cycles(op_key).latency;
        let overhead = call_overhead(language);
        let func_cycles = cycles + overhead;

        instructions.push(Instruction {
            op: "CALL".into(),
            detail: format!("call {}({})", func.name, func.params.join(", ")),
            cycles: func_cycles,
        });
        total_cycles = total_cycles.saturating_add(func_cycles);

        // Emit a LOAD for each parameter.
        for param in &func.params {
            let ld = load_op(language);
            let c = estimate_cycles(ld).latency;
            instructions.push(Instruction {
                op: "LOAD".into(),
                detail: format!("load param {}", param),
                cycles: c,
            });
            total_cycles = total_cycles.saturating_add(c);
        }

        // Emit a STORE for the return value.
        let st = store_op(language);
        let c = estimate_cycles(st).latency;
        instructions.push(Instruction {
            op: "STORE".into(),
            detail: format!("store return of {}", func.name),
            cycles: c,
        });
        total_cycles = total_cycles.saturating_add(c);
    }

    // 2. Loops — emit LOOP_START, body pseudo-ops, LOOP_END.
    for lp in &parsed.loops {
        let iterations = parse_iteration_count(&lp.iterator);
        let loop_kind_label = match lp.kind {
            LoopKind::For => "for",
            LoopKind::While => "while",
            LoopKind::Loop => "loop",
            LoopKind::Recursion => "recursion",
        };

        // LOOP_START (iterator setup cost).
        let iter_setup = if is_python(language) {
            estimate_cycles("get_iter").latency
        } else {
            estimate_cycles("cmp").latency
        };
        instructions.push(Instruction {
            op: "LOOP_START".into(),
            detail: format!(
                "{} loop ~{} iterations (lines {}-{})",
                loop_kind_label, iterations, lp.line_start, lp.line_end
            ),
            cycles: iter_setup,
        });
        total_cycles = total_cycles.saturating_add(iter_setup);

        // Body pseudo-ops: emit body_complexity worth of statements per iteration.
        let body_stmts = if lp.body_complexity > 0 { lp.body_complexity } else { 1 };
        for _stmt_idx in 0..body_stmts {
            // Each body statement generates a LOAD, an ADD, and a STORE.
            let ld_c = estimate_cycles(load_op(language)).latency;
            let arith_c = estimate_cycles(arith_op("ADD", language)).latency;
            let st_c = estimate_cycles(store_op(language)).latency;
            let stmt_cost = (ld_c + arith_c + st_c).saturating_mul(iterations);

            instructions.push(Instruction {
                op: "ADD".into(),
                detail: format!("body statement x{}", iterations),
                cycles: stmt_cost,
            });
            total_cycles = total_cycles.saturating_add(stmt_cost);
        }

        // Per-iteration comparison cost.
        let cmp_c = estimate_cycles(cmp_op(language)).latency.saturating_mul(iterations);
        instructions.push(Instruction {
            op: "CMP".into(),
            detail: format!("loop condition x{}", iterations),
            cycles: cmp_c,
        });
        total_cycles = total_cycles.saturating_add(cmp_c);

        instructions.push(Instruction {
            op: "LOOP_END".into(),
            detail: format!("end {} loop", loop_kind_label),
            cycles: 0,
        });
    }

    // 3. Allocations — emit an ALLOC instruction per allocation site.
    for alloc in &parsed.allocations {
        let c = alloc_cost(language, &alloc.alloc_type);
        instructions.push(Instruction {
            op: "ALLOC".into(),
            detail: format!(
                "allocate {} ({:?}) — {}",
                alloc.name, alloc.alloc_type, alloc.detail
            ),
            cycles: c,
        });
        total_cycles = total_cycles.saturating_add(c);
    }

    // Summary.
    let summary = if instructions.is_empty() {
        "No executable constructs detected.".into()
    } else {
        format!(
            "{} pseudo-instructions, {} estimated cycles ({} functions, {} loops, {} allocations)",
            instructions.len(),
            total_cycles,
            parsed.functions.len(),
            parsed.loops.len(),
            parsed.allocations.len(),
        )
    };

    ExecutionAnalysis {
        instructions,
        max_cycles: total_cycles,
        summary,
    }
}

// ---------------------------------------------------------------------------
// cost_analysis
// ---------------------------------------------------------------------------

/// Produce per-line cost estimates.
///
/// Combines AST info + instruction cycle tables:
/// - Per-line cost = sum of estimated instruction costs for that line
/// - Loop cost = iterations * body cost per line
/// - Function call cost = call overhead on the start line
/// - Mark hot paths (highest cumulative cost)
pub fn cost_analysis(parsed: &ParsedCode, _code: &str, language: &str) -> CostAnalysis {
    let mut line_costs: HashMap<usize, u32> = HashMap::new();

    // 1. Function definitions — add call overhead to the start line.
    for func in &parsed.functions {
        let overhead = call_overhead(language);
        *line_costs.entry(func.line_start).or_default() += overhead;
    }

    // 2. Loops — multiply base cost by iterations for each body line.
    for lp in &parsed.loops {
        let iterations = parse_iteration_count(&lp.iterator);

        // Loop header line gets iterator setup cost.
        let setup_cost = if is_python(language) {
            estimate_cycles("get_iter").latency
        } else {
            estimate_cycles("cmp").latency
        };
        *line_costs.entry(lp.line_start).or_default() += setup_cost;

        // Each line in the loop body.
        if lp.line_end > lp.line_start {
            for line in (lp.line_start + 1)..=lp.line_end {
                let line_cost = BASE_STATEMENT_COST.saturating_mul(iterations);
                *line_costs.entry(line).or_default() += line_cost;
            }
        }
    }

    // 3. Allocations — add allocation cost to the allocation line.
    for alloc in &parsed.allocations {
        let c = alloc_cost(language, &alloc.alloc_type);
        *line_costs.entry(alloc.line).or_default() += c;
    }

    // Convert to sorted Vec<LineCost>.
    let mut lines: Vec<LineCost> = line_costs
        .into_iter()
        .map(|(line, cost)| {
            let label = format!("~{} cycles", cost);
            LineCost { line, cost, label }
        })
        .collect();
    lines.sort_by_key(|lc| lc.line);

    let max_cost = lines.iter().map(|lc| lc.cost).max().unwrap_or(0);

    // Identify the hottest line for the insight string.
    let insights = if let Some(hottest) = lines.iter().max_by_key(|lc| lc.cost) {
        format!(
            "Line {} is the hottest at ~{} estimated cycles. \
             {} function(s), {} loop(s), {} allocation(s) contribute to the total cost.",
            hottest.line,
            hottest.cost,
            parsed.functions.len(),
            parsed.loops.len(),
            parsed.allocations.len(),
        )
    } else {
        "No cost-bearing constructs detected.".into()
    };

    CostAnalysis {
        lines,
        max_cost,
        insights,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use anatomizer_parser::{
        AllocationSite, AllocationType, FunctionDef, LoopConstruct, LoopKind, ParsedCode,
    };

    /// Parse real Python code through the parser (integration-level).
    fn parse_python(code: &str) -> ParsedCode {
        anatomizer_parser::parse(code, "python").expect("parse failed")
    }

    /// Build a `ParsedCode` with the given functions, loops, and allocations.
    ///
    /// This decouples cost-analysis tests from the parser implementation status.
    /// Uses the real parser for the tree-sitter `Tree`, then overrides the
    /// extracted fields.
    fn synthetic_parsed(
        code: &str,
        functions: Vec<FunctionDef>,
        loops: Vec<LoopConstruct>,
        allocations: Vec<AllocationSite>,
    ) -> ParsedCode {
        let mut parsed = parse_python(code);
        parsed.functions = functions;
        parsed.loops = loops;
        parsed.allocations = allocations;
        parsed
    }

    #[test]
    fn test_execution_analysis_basic() {
        let code = "def add(a, b):\n    return a + b\nresult = add(1, 2)\n";
        let parsed = synthetic_parsed(
            code,
            vec![FunctionDef {
                name: "add".into(),
                line_start: 1,
                line_end: 2,
                params: vec!["a".into(), "b".into()],
                calls: vec![],
            }],
            vec![],
            vec![],
        );
        let exec = execution_analysis(&parsed, code, "python");
        assert!(!exec.instructions.is_empty());
        assert!(exec.max_cycles > 0);
    }

    #[test]
    fn test_cost_analysis_with_loop() {
        let code = "for i in range(1000):\n    x = i * 2\n";
        let parsed = synthetic_parsed(
            code,
            vec![],
            vec![LoopConstruct {
                kind: LoopKind::For,
                line_start: 1,
                line_end: 2,
                iterator: Some("range(1000)".into()),
                body_complexity: 1,
            }],
            vec![],
        );
        let cost = cost_analysis(&parsed, code, "python");
        assert!(!cost.lines.is_empty());
        assert!(cost.max_cost > 0);
    }

    #[test]
    fn test_empty_code() {
        let parsed = parse_python("");
        let exec = execution_analysis(&parsed, "", "python");
        assert!(exec.instructions.is_empty());
        let cost = cost_analysis(&parsed, "", "python");
        assert!(cost.lines.is_empty());
    }

    #[test]
    fn test_parse_iteration_count_range() {
        assert_eq!(parse_iteration_count(&Some("range(500)".into())), 500);
        assert_eq!(parse_iteration_count(&Some("range( 42 )".into())), 42);
        assert_eq!(
            parse_iteration_count(&Some("some_list".into())),
            DEFAULT_LOOP_ITERATIONS
        );
        assert_eq!(parse_iteration_count(&None), DEFAULT_LOOP_ITERATIONS);
    }

    #[test]
    fn test_alloc_cost_python_heap() {
        assert_eq!(
            alloc_cost("python", &AllocationType::Heap),
            PYTHON_ALLOC_COST
        );
        assert_eq!(alloc_cost("python", &AllocationType::Stack), 1);
    }

    #[test]
    fn test_call_overhead_language_aware() {
        assert_eq!(call_overhead("python"), PYTHON_CALL_OVERHEAD);
        assert_eq!(call_overhead("rust"), NATIVE_CALL_OVERHEAD);
        assert_eq!(call_overhead("go"), NATIVE_CALL_OVERHEAD);
    }

    #[test]
    fn test_cost_analysis_loop_iterations_from_range() {
        let code = "for i in range(10):\n    x = i + 1\n";
        let parsed = synthetic_parsed(
            code,
            vec![],
            vec![LoopConstruct {
                kind: LoopKind::For,
                line_start: 1,
                line_end: 2,
                iterator: Some("range(10)".into()),
                body_complexity: 1,
            }],
            vec![],
        );
        let cost = cost_analysis(&parsed, code, "python");
        // Body line (line 2) should have cost = BASE_STATEMENT_COST * 10 = 50
        let body_line = cost.lines.iter().find(|lc| lc.line == 2);
        assert!(body_line.is_some(), "expected cost entry for line 2");
        assert_eq!(body_line.unwrap().cost, BASE_STATEMENT_COST * 10);
    }

    #[test]
    fn test_execution_summary_format() {
        let code = "def foo():\n    pass\n";
        let parsed = synthetic_parsed(
            code,
            vec![FunctionDef {
                name: "foo".into(),
                line_start: 1,
                line_end: 2,
                params: vec![],
                calls: vec![],
            }],
            vec![],
            vec![],
        );
        let exec = execution_analysis(&parsed, code, "python");
        assert!(exec.summary.contains("pseudo-instructions"));
        assert!(exec.summary.contains("estimated cycles"));
    }

    #[test]
    fn test_execution_analysis_with_allocations() {
        let code = "x = [1, 2, 3]\n";
        let parsed = synthetic_parsed(
            code,
            vec![],
            vec![],
            vec![AllocationSite {
                name: "x".into(),
                alloc_type: AllocationType::Heap,
                line: 1,
                size_hint: None,
                detail: "list literal".into(),
            }],
        );
        let exec = execution_analysis(&parsed, code, "python");
        assert!(exec.instructions.iter().any(|i| i.op == "ALLOC"));
        assert!(exec.max_cycles >= PYTHON_ALLOC_COST);
    }

    #[test]
    fn test_cost_analysis_multiple_constructs() {
        let code = "def f():\n    for i in range(100):\n        x = []\n";
        let parsed = synthetic_parsed(
            code,
            vec![FunctionDef {
                name: "f".into(),
                line_start: 1,
                line_end: 3,
                params: vec![],
                calls: vec![],
            }],
            vec![LoopConstruct {
                kind: LoopKind::For,
                line_start: 2,
                line_end: 3,
                iterator: Some("range(100)".into()),
                body_complexity: 1,
            }],
            vec![AllocationSite {
                name: "x".into(),
                alloc_type: AllocationType::Heap,
                line: 3,
                size_hint: None,
                detail: "list literal".into(),
            }],
        );
        let cost = cost_analysis(&parsed, code, "python");
        // Line 1: function overhead
        // Line 2: loop setup
        // Line 3: loop body (100 * 5) + alloc cost (20) = 520
        let line3 = cost.lines.iter().find(|lc| lc.line == 3);
        assert!(line3.is_some());
        let expected = BASE_STATEMENT_COST * 100 + PYTHON_ALLOC_COST;
        assert_eq!(line3.unwrap().cost, expected);
    }

    #[test]
    fn test_native_language_costs() {
        let code = "fn foo(x: i32) {}\n";
        let parsed = synthetic_parsed(
            code,
            vec![FunctionDef {
                name: "foo".into(),
                line_start: 1,
                line_end: 1,
                params: vec!["x".into()],
                calls: vec![],
            }],
            vec![],
            vec![],
        );
        let exec = execution_analysis(&parsed, code, "rust");
        // Rust uses native call overhead (3) instead of Python's (50)
        assert!(exec.max_cycles > 0);
        assert!(exec.max_cycles < PYTHON_CALL_OVERHEAD + 10);
    }
}
