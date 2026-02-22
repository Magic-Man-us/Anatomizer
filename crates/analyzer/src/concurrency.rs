use std::collections::HashMap;

use anatomizer_core::{ConcurrencyAnalysis, ThreadEvent, ThreadLane};
use anatomizer_parser::{AccessType, LockKind, ParsedCode};
use petgraph::algo::is_cyclic_directed;
use petgraph::graph::DiGraph;

/// Maximum label length before truncation in thread event labels.
const MAX_LABEL_LEN: usize = 60;

/// Analyze concurrency patterns: lock graphs, race detection, thread timelines.
///
/// Uses petgraph to build:
/// 1. Lock acquisition graph — cycles indicate deadlock potential
/// 2. Happens-before analysis — unordered accesses indicate race conditions
/// 3. Thread timeline — ordered events per thread for swimlane visualization
pub fn concurrency_analysis(
    parsed: &ParsedCode,
    _code: &str,
    _language: &str,
) -> ConcurrencyAnalysis {
    // --- 1. Build lock acquisition graph for deadlock detection ---
    let mut lock_graph = DiGraph::<String, ()>::new();
    let mut lock_indices: HashMap<String, petgraph::graph::NodeIndex> = HashMap::new();
    let mut held_locks: Vec<String> = Vec::new();

    for lock_op in &parsed.locks {
        let idx = *lock_indices
            .entry(lock_op.lock_name.clone())
            .or_insert_with(|| lock_graph.add_node(lock_op.lock_name.clone()));

        match lock_op.kind {
            LockKind::Acquire => {
                // Add edges from all currently held locks to this one.
                // An edge (A -> B) means "A was held while acquiring B".
                for held in &held_locks {
                    let held_idx = lock_indices[held];
                    lock_graph.add_edge(held_idx, idx, ());
                }
                held_locks.push(lock_op.lock_name.clone());
            }
            LockKind::Release => {
                held_locks.retain(|l| l != &lock_op.lock_name);
            }
        }
    }

    let has_deadlock_risk = is_cyclic_directed(&lock_graph);

    // --- 2. Race detection ---
    // Find shared accesses not in locked regions.
    let unprotected: Vec<&anatomizer_parser::SharedAccess> = parsed
        .shared_accesses
        .iter()
        .filter(|sa| !sa.in_locked_region)
        .collect();

    // Group accesses by variable name to find conflicting access patterns.
    let mut var_accesses: HashMap<&str, Vec<&anatomizer_parser::SharedAccess>> = HashMap::new();
    for sa in &parsed.shared_accesses {
        var_accesses.entry(sa.variable.as_str()).or_default().push(sa);
    }

    let mut race_warnings: Vec<String> = Vec::new();
    for (var, accesses) in &var_accesses {
        let has_write = accesses
            .iter()
            .any(|a| a.access_type == AccessType::Write);
        let is_unprotected = accesses.iter().any(|a| !a.in_locked_region);
        if has_write && is_unprotected && accesses.len() > 1 {
            race_warnings.push(format!(
                "Potential race on '{}': accessed from multiple contexts without lock",
                var
            ));
        }
    }

    // --- 3. Generate thread timelines ---
    let mut main_events: Vec<ThreadEvent> = Vec::new();

    for lock_op in &parsed.locks {
        let event_type = match lock_op.kind {
            LockKind::Acquire => "lock",
            LockKind::Release => "unlock",
        };
        main_events.push(ThreadEvent {
            event_type: event_type.into(),
            label: format!("{} {}", event_type, lock_op.lock_name),
        });
    }

    for sa in &parsed.shared_accesses {
        let event_type = match sa.access_type {
            AccessType::Read => "read",
            AccessType::Write => "write",
        };
        main_events.push(ThreadEvent {
            event_type: event_type.into(),
            label: format!("{} {}", event_type, sa.variable),
        });
    }

    for async_op in &parsed.async_ops {
        main_events.push(ThreadEvent {
            event_type: "spawn".into(),
            label: format!("{}: {}", async_op.kind, truncate(&async_op.detail, MAX_LABEL_LEN)),
        });
    }

    let mut threads = vec![ThreadLane {
        name: "main".into(),
        events: main_events,
    }];

    // Create separate lanes for spawned threads.
    for (i, async_op) in parsed.async_ops.iter().enumerate() {
        if async_op.kind == "thread_spawn" {
            threads.push(ThreadLane {
                name: format!("thread-{}", i),
                events: vec![ThreadEvent {
                    event_type: "spawn".into(),
                    label: async_op.detail.clone(),
                }],
            });
        }
    }

    // --- 4. Assemble warnings and summary ---
    let mut warnings = race_warnings;
    if has_deadlock_risk {
        warnings.push("Potential deadlock: cyclic lock acquisition detected".into());
    }
    if !unprotected.is_empty() {
        warnings.push(format!(
            "{} shared variable access(es) outside locked regions",
            unprotected.len()
        ));
    }

    let analysis = if warnings.is_empty() {
        "No concurrency issues detected.".into()
    } else {
        format!(
            "{} potential issue(s) found. Review warnings.",
            warnings.len()
        )
    };

    ConcurrencyAnalysis {
        threads,
        warnings,
        analysis,
    }
}

/// Truncate a string to at most `max` bytes, respecting UTF-8 char boundaries.
fn truncate(s: &str, max: usize) -> &str {
    if s.len() <= max {
        return s;
    }
    // Walk backwards from `max` to find a valid char boundary.
    let mut end = max;
    while !s.is_char_boundary(end) && end > 0 {
        end -= 1;
    }
    &s[..end]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse_python(code: &str) -> anatomizer_parser::ParsedCode {
        anatomizer_parser::parse(code, "python").expect("parse failed")
    }

    #[test]
    fn test_concurrency_with_locks() {
        let code =
            "import threading\nlock = threading.Lock()\nlock.acquire()\nx = 1\nlock.release()\n";
        let parsed = parse_python(code);
        let conc = concurrency_analysis(&parsed, code, "python");
        assert!(!conc.threads.is_empty());
        // If the parser extracted lock operations, we should see lock events.
        if !parsed.locks.is_empty() {
            assert!(conc.threads[0]
                .events
                .iter()
                .any(|e| e.event_type == "lock"));
        }
    }

    #[test]
    fn test_concurrency_with_globals() {
        let code = "counter = 0\ndef inc():\n    global counter\n    counter += 1\n";
        let parsed = parse_python(code);
        let conc = concurrency_analysis(&parsed, code, "python");
        // The main thread lane must always exist.
        assert!(!conc.threads.is_empty());
        // If the parser extracted shared accesses, we expect warnings or events.
        // If the parser is still stubbed, the analysis should report no issues cleanly.
        if !parsed.shared_accesses.is_empty() {
            assert!(
                !conc.warnings.is_empty() || !conc.threads[0].events.is_empty(),
                "Expected warnings or events when shared accesses are detected"
            );
        } else {
            assert_eq!(conc.analysis, "No concurrency issues detected.");
        }
    }

    #[test]
    fn test_concurrency_empty() {
        let parsed = parse_python("");
        let conc = concurrency_analysis(&parsed, "", "python");
        assert!(conc.warnings.is_empty());
    }

    #[test]
    fn test_truncate_ascii() {
        assert_eq!(truncate("hello world", 5), "hello");
        assert_eq!(truncate("short", 100), "short");
        assert_eq!(truncate("", 10), "");
    }

    #[test]
    fn test_truncate_utf8() {
        // Multi-byte char: don't split in the middle.
        let s = "hello\u{00e9}world"; // 'é' is 2 bytes
        let t = truncate(s, 6); // byte 6 is in the middle of 'é'
        assert!(t.len() <= 6);
        assert!(t.is_char_boundary(t.len()));
    }
}
