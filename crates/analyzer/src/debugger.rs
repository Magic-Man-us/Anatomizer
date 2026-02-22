use std::collections::HashMap;

use anatomizer_core::{DebugStep, DebuggerAnalysis};
use anatomizer_parser::{LoopConstruct, LoopKind, ParsedCode};

/// Maximum number of debug steps to prevent runaway simulations.
const MAX_STEPS: usize = 100;

/// Maximum iterations to simulate for any single loop.
const MAX_LOOP_ITERATIONS: usize = 3;

/// Maximum length of a displayed RHS value before truncation.
const MAX_RHS_DISPLAY_LEN: usize = 40;

/// Internal state tracker for the debugger simulation.
struct DebugState {
    variables: HashMap<String, String>,
    call_stack: Vec<String>,
    steps: Vec<DebugStep>,
}

impl DebugState {
    fn new() -> Self {
        Self {
            variables: HashMap::new(),
            call_stack: vec!["<module>".into()],
            steps: Vec::new(),
        }
    }

    fn snapshot(&self, line: usize, description: String) -> DebugStep {
        DebugStep {
            line,
            description,
            registers: self.variables.clone(),
            stack: self.call_stack.clone(),
        }
    }

    fn at_limit(&self) -> bool {
        self.steps.len() >= MAX_STEPS
    }
}

/// Simulate step-by-step execution for the debugger view.
///
/// Walks the source code lines in execution order:
/// - Track variable state at each step
/// - Simulate stack frames (function calls push, returns pop)
/// - For each step: line number, description, current variable values, stack state
/// - Simulate loops up to `MAX_LOOP_ITERATIONS`
/// - Cap total steps at `MAX_STEPS`
///
/// When the parser provides extracted constructs (functions, loops, variables),
/// those are used. Otherwise, lightweight line-based heuristics detect assignments
/// and loops directly from source text.
pub fn debugger_analysis(parsed: &ParsedCode, code: &str, _language: &str) -> DebuggerAnalysis {
    let code_lines: Vec<&str> = code.lines().collect();
    let mut state = DebugState::new();

    // Build line -> construct lookup tables from parser output
    let mut line_to_function: HashMap<usize, usize> = HashMap::new();
    for (idx, func) in parsed.functions.iter().enumerate() {
        line_to_function.insert(func.line_start, idx);
    }

    let mut line_to_loop: HashMap<usize, usize> = HashMap::new();
    for (idx, lp) in parsed.loops.iter().enumerate() {
        line_to_loop.insert(lp.line_start, idx);
    }

    // Collect line ranges that belong to function bodies so we skip them
    // during top-level walking (they're entered only via calls).
    let mut inside_function: Vec<(usize, usize)> = Vec::new();
    for func in &parsed.functions {
        inside_function.push((func.line_start, func.line_end));
    }

    // Build a set of lines with parser-known variables for quick lookup
    let variable_lines: HashMap<usize, &str> = parsed
        .variables
        .iter()
        .map(|v| (v.line, v.name.as_str()))
        .collect();

    let mut line_idx = 0;
    while line_idx < code_lines.len() {
        if state.at_limit() {
            break;
        }
        let line_num = line_idx + 1;
        let line_text = code_lines[line_idx];
        let trimmed = line_text.trim();

        // Skip blank lines and comments
        if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with("//") {
            line_idx += 1;
            continue;
        }

        // Skip lines inside function bodies (entered via call simulation)
        if is_inside_function_body(&inside_function, line_num) {
            line_idx += 1;
            continue;
        }

        // Skip function/class definitions (declarations only)
        if trimmed.starts_with("def ")
            || trimmed.starts_with("class ")
            || trimmed.starts_with("fn ")
            || trimmed.starts_with("func ")
        {
            line_idx += 1;
            continue;
        }

        // --- Check for parser-provided loop ---
        if let Some(&lp_idx) = line_to_loop.get(&line_num) {
            let lp = &parsed.loops[lp_idx];
            simulate_loop(&mut state, lp, &code_lines, trimmed);
            // Skip past the loop body
            line_idx = lp.line_end;
            continue;
        }

        // --- Fallback: detect loop from source text ---
        if is_loop_header(trimmed) {
            let body_end = find_indented_block_end(&code_lines, line_idx);
            let fallback_lp = build_fallback_loop(trimmed, line_num, body_end);
            simulate_loop(&mut state, &fallback_lp, &code_lines, trimmed);
            line_idx = body_end;
            continue;
        }

        // --- Check for parser-provided variable assignment ---
        if let Some(var_name) = variable_lines.get(&line_num) {
            let value = extract_rhs(trimmed);
            state.variables.insert(var_name.to_string(), value);
            let desc = format!(
                "Assign {} = {}",
                var_name, state.variables[*var_name]
            );
            let step = state.snapshot(line_num, desc);
            state.steps.push(step);
            line_idx += 1;
            continue;
        }

        // --- Fallback: detect assignment from source text ---
        if let Some((var_name, _rhs)) = detect_assignment(trimmed) {
            let value = extract_rhs(trimmed);
            let var_name = var_name.to_string();
            state.variables.insert(var_name.clone(), value);
            let desc = format!(
                "Assign {} = {}",
                var_name, state.variables[&var_name]
            );
            let step = state.snapshot(line_num, desc);
            state.steps.push(step);
            line_idx += 1;
            continue;
        }

        // --- Check for function calls (parser-provided functions) ---
        if let Some(func) = parsed
            .functions
            .iter()
            .find(|f| trimmed.contains(&format!("{}(", f.name)))
        {
            simulate_call(&mut state, func, &code_lines, line_num);
            line_idx += 1;
            continue;
        }

        // Generic statement
        let step = state.snapshot(line_num, trimmed.to_string());
        state.steps.push(step);
        line_idx += 1;
    }

    DebuggerAnalysis {
        steps: state.steps,
    }
}

/// Returns true if `line_num` falls strictly inside a function body
/// (i.e., after the definition line and up to the end line).
fn is_inside_function_body(ranges: &[(usize, usize)], line_num: usize) -> bool {
    ranges
        .iter()
        .any(|&(start, end)| line_num > start && line_num <= end)
}

/// Detect whether a line is a loop header (Python `for`/`while`, etc.).
fn is_loop_header(trimmed: &str) -> bool {
    trimmed.starts_with("for ") || trimmed.starts_with("while ")
}

/// Find the end of an indented block starting after `start_idx`.
/// Returns the 1-based line number of the last line in the block.
fn find_indented_block_end(code_lines: &[&str], start_idx: usize) -> usize {
    if start_idx + 1 >= code_lines.len() {
        return start_idx + 1; // 1-based
    }

    // Determine the indentation of the first body line
    let body_start = start_idx + 1;
    let body_indent = leading_spaces(code_lines.get(body_start).unwrap_or(&""));

    if body_indent == 0 {
        // No indented body found; block is just the header
        return start_idx + 1;
    }

    let mut last_body = body_start;
    for i in body_start..code_lines.len() {
        let line = code_lines[i];
        if line.trim().is_empty() {
            continue;
        }
        if leading_spaces(line) >= body_indent {
            last_body = i;
        } else {
            break;
        }
    }

    last_body + 1 // convert to 1-based
}

/// Count leading spaces in a line.
fn leading_spaces(line: &str) -> usize {
    line.len() - line.trim_start().len()
}

/// Build a fallback `LoopConstruct` from source text analysis.
fn build_fallback_loop(trimmed: &str, line_start: usize, line_end: usize) -> LoopConstruct {
    let (kind, iterator) = if trimmed.starts_with("for ") {
        let iter_text = if let Some(in_pos) = trimmed.find(" in ") {
            let after_in = &trimmed[in_pos + 4..];
            let iter_part = after_in.trim_end_matches(':').trim();
            Some(iter_part.to_string())
        } else {
            None
        };
        (LoopKind::For, iter_text)
    } else {
        (LoopKind::While, None)
    };

    LoopConstruct {
        kind,
        line_start,
        line_end,
        iterator,
        body_complexity: 1,
    }
}

/// Simulate a loop by iterating its body up to `MAX_LOOP_ITERATIONS` times.
fn simulate_loop(
    state: &mut DebugState,
    lp: &LoopConstruct,
    code_lines: &[&str],
    header_text: &str,
) {
    let iter_desc = match &lp.iterator {
        Some(it) => format!("over {}", it),
        None => "while condition".into(),
    };

    let iterations = estimate_iterations(lp).min(MAX_LOOP_ITERATIONS);

    for i in 0..iterations {
        if state.at_limit() {
            break;
        }

        // For `for` loops, set the iterator variable before the snapshot
        // so the snapshot reflects the current iteration's variable state.
        if lp.kind == LoopKind::For {
            if let Some(var_name) = extract_for_variable(header_text) {
                state.variables.insert(var_name, format!("{}", i));
            }
        }

        let step = state.snapshot(
            lp.line_start,
            format!("Loop iteration {} {}", i + 1, iter_desc),
        );
        state.steps.push(step);

        // Step through body lines
        for body_line in (lp.line_start + 1)..=lp.line_end {
            if state.at_limit() {
                break;
            }
            if let Some(body_text) = code_lines.get(body_line - 1) {
                let bt = body_text.trim();
                if bt.is_empty() || bt.starts_with('#') || bt.starts_with("//") {
                    continue;
                }
                let step = state.snapshot(body_line, format!("  {}", bt));
                state.steps.push(step);
            }
        }
    }
}

/// Simulate a function call: push frame, walk body, pop frame.
fn simulate_call(
    state: &mut DebugState,
    func: &anatomizer_parser::FunctionDef,
    code_lines: &[&str],
    call_line: usize,
) {
    state.call_stack.push(format!("{}()", func.name));

    let step = state.snapshot(call_line, format!("Call {}", func.name));
    state.steps.push(step);

    // Step through function body
    for fl in (func.line_start + 1)..=func.line_end {
        if state.at_limit() {
            break;
        }
        if let Some(ft) = code_lines.get(fl - 1) {
            let ftt = ft.trim();
            if ftt.is_empty() || ftt.starts_with('#') || ftt.starts_with("//") {
                continue;
            }
            let step = state.snapshot(fl, format!("  {}", ftt));
            state.steps.push(step);
        }
    }

    state.call_stack.pop();

    if !state.at_limit() {
        let step = state.snapshot(func.line_end, format!("Return from {}", func.name));
        state.steps.push(step);
    }
}

/// Detect a simple assignment pattern: `name = value` (not `==`, `!=`, etc.).
/// Also detects augmented assignments (`+=`, `-=`, `*=`, `/=`) as updates to
/// existing variables. Returns `(variable_name, rhs_value)` if this is an
/// assignment.
fn detect_assignment(trimmed: &str) -> Option<(&str, &str)> {
    // Find the first '=' character
    let eq_pos = trimmed.find('=')?;
    if eq_pos == 0 {
        return None;
    }

    let before = trimmed.as_bytes()[eq_pos - 1];

    // Skip comparison operators (==, !=, <=, >=)
    if before == b'!' || before == b'<' || before == b'>' {
        return None;
    }
    if eq_pos + 1 < trimmed.len() && trimmed.as_bytes()[eq_pos + 1] == b'=' {
        return None;
    }

    // Handle augmented assignments (+=, -=, *=, /=)
    let var_end = if before == b'+' || before == b'-' || before == b'*' || before == b'/' {
        eq_pos - 1
    } else {
        eq_pos
    };

    let lhs = trimmed[..var_end].trim();
    let rhs = trimmed[eq_pos + 1..].trim();

    if lhs.is_empty() || rhs.is_empty() {
        return None;
    }
    // Skip if lhs contains spaces (likely not a simple variable)
    if lhs.contains(' ') {
        return None;
    }

    // Simple identifier check: must be a valid variable name (letters, digits, underscores)
    if lhs
        .chars()
        .all(|c| c.is_alphanumeric() || c == '_')
        && lhs
            .chars()
            .next()
            .map_or(false, |c| c.is_alphabetic() || c == '_')
    {
        return Some((lhs, rhs));
    }

    None
}

/// Extract the right-hand side of an assignment line, truncating if long.
fn extract_rhs(line: &str) -> String {
    if let Some(pos) = line.find('=') {
        // Guard against `==`, `!=`, `<=`, `>=`
        let before = if pos > 0 {
            line.as_bytes().get(pos - 1).copied()
        } else {
            None
        };
        let after = line.as_bytes().get(pos + 1).copied();
        if before == Some(b'!')
            || before == Some(b'<')
            || before == Some(b'>')
            || after == Some(b'=')
        {
            return "?".into();
        }

        let rhs = line[pos + 1..].trim();
        if rhs.len() > MAX_RHS_DISPLAY_LEN {
            let mut end = MAX_RHS_DISPLAY_LEN;
            while end > 0 && !rhs.is_char_boundary(end) {
                end -= 1;
            }
            format!("{}...", &rhs[..end])
        } else {
            rhs.to_string()
        }
    } else {
        "?".into()
    }
}

/// Extract the loop variable from a Python-style `for x in ...` line.
fn extract_for_variable(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if trimmed.starts_with("for ") {
        if let Some(in_pos) = trimmed.find(" in ") {
            let var_part = trimmed[4..in_pos].trim();
            return Some(var_part.to_string());
        }
    }
    None
}

/// Estimate the number of iterations for a loop based on its iterator text.
fn estimate_iterations(lp: &LoopConstruct) -> usize {
    if let Some(ref it) = lp.iterator {
        if let Some(start) = it.find("range(") {
            let after = &it[start + 6..];
            if let Some(end) = after.find(')') {
                let inner = &after[..end];
                let parts: Vec<&str> = inner.split(',').collect();
                match parts.len() {
                    1 => {
                        return parts[0]
                            .trim()
                            .parse()
                            .unwrap_or(MAX_LOOP_ITERATIONS);
                    }
                    2 | 3 => {
                        let start_val: usize =
                            parts[0].trim().parse().unwrap_or(0);
                        let end_val: usize = parts[1]
                            .trim()
                            .parse()
                            .unwrap_or(MAX_LOOP_ITERATIONS);
                        return end_val.saturating_sub(start_val);
                    }
                    _ => {}
                }
            }
        }
    }
    MAX_LOOP_ITERATIONS
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_python(code: &str) -> ParsedCode {
        anatomizer_parser::parse(code, "python").expect("parse failed")
    }

    #[test]
    fn test_debugger_basic() {
        let code = "x = 5\ny = 10\nz = x + y\n";
        let parsed = parse_python(code);
        let dbg = debugger_analysis(&parsed, code, "python");
        assert!(!dbg.steps.is_empty());
        let last = dbg.steps.last().unwrap();
        assert!(
            last.registers.contains_key("x") || last.registers.contains_key("y"),
            "expected variable tracking, got registers: {:?}",
            last.registers
        );
    }

    #[test]
    fn test_debugger_with_loop() {
        let code = "for i in range(5):\n    print(i)\n";
        let parsed = parse_python(code);
        let dbg = debugger_analysis(&parsed, code, "python");
        assert!(
            dbg.steps.len() >= 3,
            "expected at least 3 steps for loop, got {}",
            dbg.steps.len()
        );
    }

    #[test]
    fn test_debugger_empty() {
        let parsed = parse_python("");
        let dbg = debugger_analysis(&parsed, "", "python");
        assert!(dbg.steps.is_empty());
    }

    #[test]
    fn test_debugger_max_steps() {
        let code = "for i in range(10000):\n    x = i\n";
        let parsed = parse_python(code);
        let dbg = debugger_analysis(&parsed, code, "python");
        assert!(
            dbg.steps.len() <= MAX_STEPS,
            "expected at most {} steps, got {}",
            MAX_STEPS,
            dbg.steps.len()
        );
    }

    #[test]
    fn test_debugger_comments_skipped() {
        let code = "# comment\nx = 1\n# another\n";
        let parsed = parse_python(code);
        let dbg = debugger_analysis(&parsed, code, "python");
        assert_eq!(dbg.steps.len(), 1, "only one assignment step expected");
        assert_eq!(dbg.steps[0].line, 2);
    }

    #[test]
    fn test_debugger_loop_sets_iterator_variable() {
        let code = "for i in range(2):\n    print(i)\n";
        let parsed = parse_python(code);
        let dbg = debugger_analysis(&parsed, code, "python");
        // After first iteration, i should be "0"
        let has_i = dbg.steps.iter().any(|s| s.registers.get("i") == Some(&"0".to_string()));
        assert!(has_i, "expected iterator variable 'i' to be tracked");
    }

    #[test]
    fn test_extract_rhs_simple() {
        assert_eq!(extract_rhs("x = 5"), "5");
        assert_eq!(extract_rhs("name = \"hello\""), "\"hello\"");
    }

    #[test]
    fn test_extract_rhs_comparison() {
        assert_eq!(extract_rhs("x == 5"), "?");
        assert_eq!(extract_rhs("x != 5"), "?");
    }

    #[test]
    fn test_extract_for_variable() {
        assert_eq!(
            extract_for_variable("for i in range(10):"),
            Some("i".into())
        );
        assert_eq!(extract_for_variable("for x in items:"), Some("x".into()));
        assert_eq!(extract_for_variable("while True:"), None);
    }

    #[test]
    fn test_estimate_iterations_range() {
        let lp = LoopConstruct {
            kind: LoopKind::For,
            line_start: 1,
            line_end: 2,
            iterator: Some("range(5)".into()),
            body_complexity: 1,
        };
        assert_eq!(estimate_iterations(&lp), 5);
    }

    #[test]
    fn test_estimate_iterations_range_with_start() {
        let lp = LoopConstruct {
            kind: LoopKind::For,
            line_start: 1,
            line_end: 2,
            iterator: Some("range(2, 8)".into()),
            body_complexity: 1,
        };
        assert_eq!(estimate_iterations(&lp), 6);
    }

    #[test]
    fn test_estimate_iterations_no_iterator() {
        let lp = LoopConstruct {
            kind: LoopKind::While,
            line_start: 1,
            line_end: 2,
            iterator: None,
            body_complexity: 1,
        };
        assert_eq!(estimate_iterations(&lp), MAX_LOOP_ITERATIONS);
    }

    #[test]
    fn test_detect_assignment() {
        assert_eq!(detect_assignment("x = 5"), Some(("x", "5")));
        assert_eq!(detect_assignment("name = \"hello\""), Some(("name", "\"hello\"")));
        assert_eq!(detect_assignment("x == 5"), None);
        assert_eq!(detect_assignment("x != 5"), None);
        assert_eq!(detect_assignment("x += 1"), Some(("x", "1")));
        assert_eq!(detect_assignment("x -= 10"), Some(("x", "10")));
        assert_eq!(detect_assignment("x *= 2"), Some(("x", "2")));
        assert_eq!(detect_assignment("x /= 3"), Some(("x", "3")));
        assert_eq!(detect_assignment("print(x)"), None);
    }

    #[test]
    fn test_find_indented_block_end() {
        let lines = vec!["for i in range(3):", "    print(i)", "    x = i", "y = 1"];
        assert_eq!(find_indented_block_end(&lines, 0), 3); // 1-based line 3
    }
}
