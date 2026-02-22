use anatomizer_core::{Allocation, MemoryAnalysis};
use anatomizer_parser::{AllocationType, ParsedCode};

/// Heap usage threshold (in bytes) above which we emit a warning note.
const HEAVY_HEAP_THRESHOLD: usize = 1024;

/// Analyze memory allocation patterns: stack vs heap, sizes, lifetimes.
///
/// Language-specific knowledge:
/// - Python: All objects heap-allocated. int=28B, float=24B, str=49B+len, list=56B+8*len, dict=64B+entries
/// - Rust: Stack (primitives, fixed arrays) vs heap (Box, Vec, String, Rc, Arc)
/// - C/C++: locals=stack, malloc/new=heap, sizeof for sizing
/// - Go: escape analysis determines stack vs heap
pub fn memory_analysis(parsed: &ParsedCode, _code: &str, _language: &str) -> MemoryAnalysis {
    let allocations: Vec<Allocation> = parsed
        .allocations
        .iter()
        .map(|site| Allocation {
            alloc_type: match site.alloc_type {
                AllocationType::Stack => "stack".into(),
                AllocationType::Heap => "heap".into(),
            },
            name: site.name.clone(),
            detail: site.detail.clone(),
            size: site
                .size_hint
                .clone()
                .unwrap_or_else(|| "unknown".into()),
        })
        .collect();

    let mut stack_bytes: usize = 0;
    let mut heap_bytes: usize = 0;

    for site in &parsed.allocations {
        let size = site
            .size_hint
            .as_deref()
            .map(parse_size_hint)
            .unwrap_or(0);
        match site.alloc_type {
            AllocationType::Stack => stack_bytes += size,
            AllocationType::Heap => heap_bytes += size,
        }
    }

    let alloc_count = allocations.len();
    let notes = build_notes(parsed, heap_bytes);

    MemoryAnalysis {
        allocations,
        stack_total: format_bytes(stack_bytes),
        heap_total: format_bytes(heap_bytes),
        alloc_count,
        notes,
    }
}

/// Format a byte count as a human-readable string ("0 B", "1.5 KB", "3.4 MB").
fn format_bytes(bytes: usize) -> String {
    const KB: usize = 1024;
    const MB: usize = 1024 * 1024;

    if bytes < KB {
        format!("{bytes} B")
    } else if bytes < MB {
        format!("{:.1} KB", bytes as f64 / KB as f64)
    } else {
        format!("{:.1} MB", bytes as f64 / MB as f64)
    }
}

/// Parse a size hint string like "~123 B" or "~1024 B" into a byte count.
///
/// Expects the format produced by the parser: `~<number> B`.
/// Returns 0 for unparseable inputs.
fn parse_size_hint(hint: &str) -> usize {
    hint.trim_start_matches('~')
        .split_whitespace()
        .next()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(0)
}

/// Build a human-readable notes string summarising allocations.
fn build_notes(parsed: &ParsedCode, heap_bytes: usize) -> String {
    if parsed.allocations.is_empty() {
        return "No allocations detected.".into();
    }

    let heap_count = parsed
        .allocations
        .iter()
        .filter(|a| a.alloc_type == AllocationType::Heap)
        .count();
    let stack_count = parsed
        .allocations
        .iter()
        .filter(|a| a.alloc_type == AllocationType::Stack)
        .count();

    let mut parts: Vec<String> = Vec::new();

    if heap_count > 0 {
        parts.push(format!(
            "{heap_count} heap allocation{} totaling ~{}",
            if heap_count == 1 { "" } else { "s" },
            format_bytes(heap_bytes),
        ));
    }
    if stack_count > 0 {
        parts.push(format!(
            "{stack_count} stack allocation{}",
            if stack_count == 1 { "" } else { "s" },
        ));
    }

    // Find the largest allocation by parsed size hint.
    if let Some(largest) = parsed
        .allocations
        .iter()
        .max_by_key(|a| a.size_hint.as_deref().map(parse_size_hint).unwrap_or(0))
    {
        let size_str = largest
            .size_hint
            .as_deref()
            .unwrap_or("unknown size");
        parts.push(format!("Largest: {} ({size_str}).", largest.detail));
    }

    if heap_bytes > HEAVY_HEAP_THRESHOLD {
        parts.push("Warning: heavy heap usage detected.".into());
    }

    parts.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    use anatomizer_parser::AllocationSite;

    fn parse_python(code: &str) -> ParsedCode {
        anatomizer_parser::parse(code, "python").expect("parse failed")
    }

    /// Build a `ParsedCode` with the given allocations (uses a dummy tree from empty Python).
    fn parsed_with_allocations(allocations: Vec<AllocationSite>) -> ParsedCode {
        let mut parsed = parse_python("");
        parsed.allocations = allocations;
        parsed
    }

    #[test]
    fn test_memory_analysis_basic() {
        let allocations = vec![
            AllocationSite {
                name: "x".into(),
                alloc_type: AllocationType::Heap,
                line: 1,
                size_hint: Some("~80 B".into()),
                detail: "list with 3 elements".into(),
            },
            AllocationSite {
                name: "y".into(),
                alloc_type: AllocationType::Heap,
                line: 2,
                size_hint: Some("~232 B".into()),
                detail: "dict with 1 entry".into(),
            },
            AllocationSite {
                name: "s".into(),
                alloc_type: AllocationType::Heap,
                line: 3,
                size_hint: Some("~54 B".into()),
                detail: "str literal".into(),
            },
        ];
        let parsed = parsed_with_allocations(allocations);
        let code = "x = [1, 2, 3]\ny = {\"a\": 1}\ns = \"hello\"\n";
        let mem = memory_analysis(&parsed, code, "python");

        assert_eq!(mem.alloc_count, 3);
        assert!(!mem.allocations.is_empty());
        assert_ne!(mem.heap_total, "0 B");
        assert_eq!(mem.stack_total, "0 B");
        // 80 + 232 + 54 = 366
        assert_eq!(mem.heap_total, "366 B");
    }

    #[test]
    fn test_memory_analysis_mixed_stack_heap() {
        let allocations = vec![
            AllocationSite {
                name: "n".into(),
                alloc_type: AllocationType::Stack,
                line: 1,
                size_hint: Some("~8 B".into()),
                detail: "i64 local".into(),
            },
            AllocationSite {
                name: "v".into(),
                alloc_type: AllocationType::Heap,
                line: 2,
                size_hint: Some("~2048 B".into()),
                detail: "Vec<u8>".into(),
            },
        ];
        let parsed = parsed_with_allocations(allocations);
        let mem = memory_analysis(&parsed, "", "rust");

        assert_eq!(mem.alloc_count, 2);
        assert_eq!(mem.stack_total, "8 B");
        assert_eq!(mem.heap_total, "2.0 KB");
        assert!(mem.notes.contains("Warning: heavy heap usage"));
    }

    #[test]
    fn test_memory_analysis_empty() {
        let parsed = parse_python("");
        let mem = memory_analysis(&parsed, "", "python");
        assert_eq!(mem.alloc_count, 0);
        assert_eq!(mem.heap_total, "0 B");
        assert_eq!(mem.notes, "No allocations detected.");
    }

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(0), "0 B");
        assert_eq!(format_bytes(512), "512 B");
        assert_eq!(format_bytes(1500), "1.5 KB");
        assert_eq!(format_bytes(1024), "1.0 KB");
        assert_eq!(format_bytes(1_048_576), "1.0 MB");
    }

    #[test]
    fn test_parse_size_hint() {
        assert_eq!(parse_size_hint("~123 B"), 123);
        assert_eq!(parse_size_hint("~0 B"), 0);
        assert_eq!(parse_size_hint("unknown"), 0);
        assert_eq!(parse_size_hint("~1024 B"), 1024);
    }

    #[test]
    fn test_notes_empty() {
        let parsed = parse_python("");
        let notes = build_notes(&parsed, 0);
        assert_eq!(notes, "No allocations detected.");
    }

    #[test]
    fn test_notes_largest_allocation() {
        let allocations = vec![
            AllocationSite {
                name: "small".into(),
                alloc_type: AllocationType::Heap,
                line: 1,
                size_hint: Some("~10 B".into()),
                detail: "small object".into(),
            },
            AllocationSite {
                name: "big".into(),
                alloc_type: AllocationType::Heap,
                line: 2,
                size_hint: Some("~500 B".into()),
                detail: "large object".into(),
            },
        ];
        let parsed = parsed_with_allocations(allocations);
        let notes = build_notes(&parsed, 510);
        assert!(notes.contains("Largest: large object"));
        assert!(notes.contains("~500 B"));
    }
}
