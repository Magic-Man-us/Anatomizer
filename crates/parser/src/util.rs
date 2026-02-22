/// Maximum length for detail text before truncation.
pub const MAX_DETAIL_LEN: usize = 120;

/// Iteratively collect all descendant nodes matching any of the given kinds.
///
/// Uses an explicit stack instead of recursion to avoid stack overflow on
/// deeply nested ASTs.
pub fn collect_nodes_of_kind<'a>(
    node: tree_sitter::Node<'a>,
    kinds: &[&str],
) -> Vec<tree_sitter::Node<'a>> {
    let mut results = Vec::new();
    let mut stack = vec![node];
    while let Some(current) = stack.pop() {
        if kinds.contains(&current.kind()) {
            results.push(current);
        }
        for i in (0..current.named_child_count()).rev() {
            if let Some(child) = current.named_child(i) {
                stack.push(child);
            }
        }
    }
    results
}

/// Safe text extraction from a node via byte range.
pub fn node_text<'a>(node: tree_sitter::Node<'a>, code: &'a str) -> &'a str {
    &code[node.byte_range()]
}

/// Truncate text to `max_len`, respecting UTF-8 char boundaries, and append
/// "..." if truncation occurred.
pub fn truncate_detail(text: &str, max_len: usize) -> String {
    if text.len() <= max_len {
        return text.to_string();
    }
    // Find a valid char boundary at or before max_len
    let mut end = max_len;
    while end > 0 && !text.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}...", &text[..end])
}

/// Count named children of a block node, excluding comments.
pub fn count_statements(block: tree_sitter::Node<'_>) -> u32 {
    let mut count = 0u32;
    for i in 0..block.named_child_count() {
        if let Some(child) = block.named_child(i) {
            if !child.kind().starts_with("comment") {
                count += 1;
            }
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_truncate_detail_short() {
        let text = "short";
        assert_eq!(truncate_detail(text, 120), "short");
    }

    #[test]
    fn test_truncate_detail_exact_boundary() {
        let text = "a".repeat(120);
        assert_eq!(truncate_detail(&text, 120), text);
    }

    #[test]
    fn test_truncate_detail_long() {
        let text = "a".repeat(200);
        let result = truncate_detail(&text, 120);
        assert_eq!(result.len(), 123); // 120 + "..."
        assert!(result.ends_with("..."));
    }

    #[test]
    fn test_truncate_detail_utf8_boundary() {
        // Multi-byte char at the boundary: each CJK char is 3 bytes
        let text = "\u{4e00}".repeat(50); // 150 bytes total
        let result = truncate_detail(&text, 120);
        assert!(result.ends_with("..."));
        // Should truncate at a valid char boundary (120 / 3 = 40 chars = 120 bytes)
        assert_eq!(result, format!("{}...", "\u{4e00}".repeat(40)));
    }
}
