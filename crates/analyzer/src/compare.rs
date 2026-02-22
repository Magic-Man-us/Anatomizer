use anatomizer_core::{CompareAnalysis, Comparison, Pattern};
use anatomizer_parser::{LockKind, LoopKind, ParsedCode};

/// Detect equivalent patterns in the AST and compare their performance characteristics.
///
/// Pattern pairs to detect:
/// - `for` loop accumulator vs list comprehension (Python)
/// - Manual lock/unlock vs context manager (`with`)
/// - Sequential awaits vs `gather`/`join_all`
/// - String concatenation in loop vs `join`
pub fn compare_analysis(parsed: &ParsedCode, code: &str, language: &str) -> CompareAnalysis {
    let mut comparisons = vec![];

    match language {
        "python" | "typescript" | "javascript" => {
            comparisons.extend(detect_loop_accumulator(parsed, code));
            comparisons.extend(detect_manual_lock(parsed));
            comparisons.extend(detect_sequential_awaits(parsed));
            comparisons.extend(detect_string_concat_in_loop(parsed, code));
        }
        _ => {}
    }

    CompareAnalysis { comparisons }
}

/// Extract lines from source code by 1-based line numbers (inclusive).
fn get_lines(code: &str, start: usize, end: usize) -> Vec<String> {
    code.lines()
        .enumerate()
        .filter(|(i, _)| (*i + 1) >= start && (*i + 1) <= end)
        .map(|(_, l)| l.to_string())
        .collect()
}

/// Detect for-loop + `.append()` patterns that could be list comprehensions.
fn detect_loop_accumulator(parsed: &ParsedCode, code: &str) -> Vec<Comparison> {
    let mut comparisons = vec![];

    for lp in &parsed.loops {
        if lp.kind != LoopKind::For {
            continue;
        }
        let body_lines = get_lines(code, lp.line_start, lp.line_end);
        if body_lines.iter().any(|l| l.contains(".append(")) {
            comparisons.push(Comparison {
                title: "For Loop + Append vs List Comprehension".into(),
                patterns: vec![
                    Pattern {
                        label: "Current: for loop with append".into(),
                        code: body_lines.join("\n"),
                        cycles: "~N * (loop_overhead + append_cost)".into(),
                        memory: "Two allocations: list + loop".into(),
                        notes: "Slower due to method call overhead per iteration".into(),
                    },
                    Pattern {
                        label: "Alternative: list comprehension".into(),
                        code: "[expr for x in iterable]".into(),
                        cycles: "~N * expr_cost (optimized C loop internally)".into(),
                        memory: "Single allocation, pre-sized".into(),
                        notes: "~30-50% faster for simple transformations".into(),
                    },
                ],
                winner: "List comprehension — fewer method calls, C-level loop".into(),
            });
        }
    }

    comparisons
}

/// Detect explicit `lock.acquire()` / `lock.release()` pairs that lack a context manager scope.
fn detect_manual_lock(parsed: &ParsedCode) -> Vec<Comparison> {
    let manual_acquires: Vec<_> = parsed
        .locks
        .iter()
        .filter(|l| l.kind == LockKind::Acquire && l.scope_end.is_none())
        .collect();

    if manual_acquires.is_empty() {
        return vec![];
    }

    vec![Comparison {
        title: "Manual lock.acquire/release vs with Statement".into(),
        patterns: vec![
            Pattern {
                label: "Current: manual acquire/release".into(),
                code: "lock.acquire()\ntry:\n    ...\nfinally:\n    lock.release()".into(),
                cycles: "Same".into(),
                memory: "Same".into(),
                notes: "Risk of forgetting release on exception path".into(),
            },
            Pattern {
                label: "Alternative: context manager".into(),
                code: "with lock:\n    ...".into(),
                cycles: "Same".into(),
                memory: "Same".into(),
                notes: "Exception-safe, guaranteed release".into(),
            },
        ],
        winner: "Context manager — exception-safe, less error-prone".into(),
    }]
}

/// Detect multiple sequential `await` expressions that could use `asyncio.gather`.
fn detect_sequential_awaits(parsed: &ParsedCode) -> Vec<Comparison> {
    let await_ops: Vec<_> = parsed
        .async_ops
        .iter()
        .filter(|op| op.kind == "await")
        .collect();

    if await_ops.len() < 2 {
        return vec![];
    }

    // Skip if there is already a gather in use.
    let has_gather = parsed.async_ops.iter().any(|op| op.kind == "async_gather");
    if has_gather {
        return vec![];
    }

    vec![Comparison {
        title: "Sequential Awaits vs asyncio.gather".into(),
        patterns: vec![
            Pattern {
                label: "Current: sequential awaits".into(),
                code: "a = await fetch_a()\nb = await fetch_b()".into(),
                cycles: "Total = time_a + time_b (serial)".into(),
                memory: "Same".into(),
                notes: "Each await blocks until completion before starting next".into(),
            },
            Pattern {
                label: "Alternative: concurrent with gather".into(),
                code: "a, b = await asyncio.gather(fetch_a(), fetch_b())".into(),
                cycles: "Total = max(time_a, time_b) (parallel)".into(),
                memory: "Slightly more (task objects)".into(),
                notes: "Independent operations run concurrently".into(),
            },
        ],
        winner: "asyncio.gather — parallel execution for independent operations".into(),
    }]
}

/// Detect `+=` string concatenation inside loops that could use `str.join`.
fn detect_string_concat_in_loop(parsed: &ParsedCode, code: &str) -> Vec<Comparison> {
    let mut comparisons = Vec::new();
    for lp in &parsed.loops {
        let body = get_lines(code, lp.line_start, lp.line_end);
        let has_string_concat = body
            .iter()
            .any(|l| l.contains("+=") && (l.contains('"') || l.contains("str(")));
        if has_string_concat {
            comparisons.push(Comparison {
                title: "String Concatenation in Loop vs str.join".into(),
                patterns: vec![
                    Pattern {
                        label: "Current: += concatenation in loop".into(),
                        code: "result = \"\"\nfor s in items:\n    result += s".into(),
                        cycles: "O(n^2) — new string allocation each iteration".into(),
                        memory: "O(n^2) — intermediate strings".into(),
                        notes: "Each += creates a new string object".into(),
                    },
                    Pattern {
                        label: "Alternative: str.join".into(),
                        code: "result = \"\".join(items)".into(),
                        cycles: "O(n) — single pass, pre-allocated".into(),
                        memory: "O(n) — single allocation".into(),
                        notes: "Calculates total size first, then copies once".into(),
                    },
                ],
                winner: "str.join — O(n) vs O(n^2) for concatenation".into(),
            });
        }
    }
    comparisons
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_python(code: &str) -> ParsedCode {
        anatomizer_parser::parse(code, "python").expect("parse failed")
    }

    #[test]
    fn test_detect_loop_accumulator() {
        let code = "result = []\nfor x in items:\n    result.append(x * 2)\n";
        let parsed = parse_python(code);
        let cmp = compare_analysis(&parsed, code, "python");
        assert!(
            !cmp.comparisons.is_empty(),
            "should detect loop+append pattern"
        );
        assert!(cmp.comparisons[0].title.contains("List Comprehension"));
    }

    #[test]
    fn test_detect_manual_lock() {
        let code =
            "import threading\nlock = threading.Lock()\nlock.acquire()\nx = 1\nlock.release()\n";
        let parsed = parse_python(code);
        let cmp = compare_analysis(&parsed, code, "python");
        assert!(
            !cmp.comparisons.is_empty(),
            "should detect manual lock pattern"
        );
    }

    #[test]
    fn test_no_patterns() {
        let code = "x = 1\ny = 2\n";
        let parsed = parse_python(code);
        let cmp = compare_analysis(&parsed, code, "python");
        assert!(cmp.comparisons.is_empty());
    }
}
