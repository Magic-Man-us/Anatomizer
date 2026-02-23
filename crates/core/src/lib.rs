use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ── Constants ─────────────────────────────────────────────────────────────

/// Maximum source code size accepted by the API (64 KiB).
pub const MAX_CODE_BYTES: usize = 64 * 1024;

// ── Language enum ─────────────────────────────────────────────────────────

/// Supported programming languages.
///
/// Used internally after validation; the wire format remains `Option<String>`
/// for backwards compatibility.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Language {
    Python,
    Rust,
    Go,
    Cpp,
    C,
    TypeScript,
    JavaScript,
}

impl Language {
    /// Parse a language string into a typed enum variant.
    ///
    /// Accepts lowercase identifiers matching the serde representation plus
    /// common aliases (`"c++"`).
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_ascii_lowercase().as_str() {
            "python" => Some(Language::Python),
            "rust" => Some(Language::Rust),
            "go" | "golang" => Some(Language::Go),
            "cpp" | "c++" => Some(Language::Cpp),
            "c" => Some(Language::C),
            "typescript" | "ts" => Some(Language::TypeScript),
            "javascript" | "js" => Some(Language::JavaScript),
            _ => None,
        }
    }

    /// Return the canonical string identifier used in the rest of the pipeline.
    pub fn as_str(self) -> &'static str {
        match self {
            Language::Python => "python",
            Language::Rust => "rust",
            Language::Go => "go",
            Language::Cpp => "cpp",
            Language::C => "c",
            Language::TypeScript => "typescript",
            Language::JavaScript => "javascript",
        }
    }
}

impl std::fmt::Display for Language {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

// ── Input validation ──────────────────────────────────────────────────────

/// Validation error returned when user input fails checks.
#[derive(Debug, Clone)]
pub struct ValidationError {
    pub message: String,
}

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for ValidationError {}

/// Validate source code before processing.
///
/// Checks:
/// - Size does not exceed [`MAX_CODE_BYTES`]
/// - No null bytes (prevents C-string truncation attacks)
/// - Valid UTF-8 (guaranteed by Rust's `&str`, but we reject suspicious patterns)
pub fn validate_code(code: &str) -> Result<(), ValidationError> {
    if code.len() > MAX_CODE_BYTES {
        return Err(ValidationError {
            message: format!(
                "Source code too large: {} bytes (maximum {} bytes)",
                code.len(),
                MAX_CODE_BYTES,
            ),
        });
    }

    if code.as_bytes().contains(&0) {
        return Err(ValidationError {
            message: "Source code contains null bytes".into(),
        });
    }

    Ok(())
}

/// Parse and validate an optional language string from the wire format.
///
/// - `None` => Ok(None) — caller should auto-detect.
/// - `Some("python")` => Ok(Some(Language::Python))
/// - `Some("../../etc/passwd")` => Err — unknown language, prevents path traversal.
pub fn validated_language(raw: &Option<String>) -> Result<Option<Language>, ValidationError> {
    match raw {
        None => Ok(None),
        Some(s) if s.is_empty() => Ok(None),
        Some(s) => Language::parse(s).map(Some).ok_or_else(|| ValidationError {
            message: format!("Unsupported language: '{}'", sanitize_for_error(s)),
        }),
    }
}

/// Sanitize a user string for inclusion in error messages.
///
/// Truncates long strings and strips control characters to prevent
/// log injection or overly verbose error responses.
fn sanitize_for_error(s: &str) -> String {
    const MAX_ERROR_SNIPPET: usize = 32;
    let truncated: String = s
        .chars()
        .filter(|c| !c.is_control())
        .take(MAX_ERROR_SNIPPET)
        .collect();
    if s.len() > MAX_ERROR_SNIPPET {
        format!("{}...", truncated)
    } else {
        truncated
    }
}

// --- Request / Response ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisRequest {
    pub code: String,
    pub language: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResponse {
    pub language: String,
    pub execution: ExecutionAnalysis,
    pub cost: CostAnalysis,
    pub memory: MemoryAnalysis,
    pub concurrency: ConcurrencyAnalysis,
    pub assembly: AssemblyAnalysis,
    pub debugger: DebuggerAnalysis,
    pub compare: CompareAnalysis,
}

// --- Execution View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionAnalysis {
    pub instructions: Vec<Instruction>,
    pub max_cycles: u32,
    pub summary: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Instruction {
    pub op: String,
    pub detail: String,
    pub cycles: u32,
}

// --- Cost View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CostAnalysis {
    pub lines: Vec<LineCost>,
    pub max_cost: u32,
    pub insights: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LineCost {
    pub line: usize,
    pub cost: u32,
    pub label: String,
}

// --- Memory View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MemoryAnalysis {
    pub allocations: Vec<Allocation>,
    pub stack_total: String,
    pub heap_total: String,
    pub alloc_count: usize,
    pub notes: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Allocation {
    #[serde(rename = "type")]
    pub alloc_type: String,
    pub name: String,
    pub detail: String,
    pub size: String,
}

// --- Concurrency View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ConcurrencyAnalysis {
    pub threads: Vec<ThreadLane>,
    pub warnings: Vec<String>,
    pub analysis: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ThreadLane {
    pub name: String,
    pub events: Vec<ThreadEvent>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ThreadEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub label: String,
}

// --- Assembly View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AssemblyAnalysis {
    pub arch: String,
    pub blocks: Vec<AsmBlock>,
    pub notes: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AsmBlock {
    pub label: String,
    pub instructions: Vec<AsmInstruction>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AsmInstruction {
    pub addr: String,
    pub op: String,
    pub operands: String,
    pub comment: String,
}

// --- Debugger View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DebuggerAnalysis {
    pub steps: Vec<DebugStep>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DebugStep {
    pub line: usize,
    pub description: String,
    pub registers: HashMap<String, String>,
    pub stack: Vec<String>,
}

// --- Compare View ---

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CompareAnalysis {
    pub comparisons: Vec<Comparison>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Comparison {
    pub title: String,
    pub patterns: Vec<Pattern>,
    pub winner: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Pattern {
    pub label: String,
    pub code: String,
    pub cycles: String,
    pub memory: String,
    pub notes: String,
}

// --- Stub constructor for empty/default responses ---

impl AnalysisResponse {
    pub fn stub(language: &str) -> Self {
        Self {
            language: language.to_string(),
            execution: ExecutionAnalysis {
                instructions: vec![],
                max_cycles: 0,
                summary: "No analysis available yet.".into(),
            },
            cost: CostAnalysis {
                lines: vec![],
                max_cost: 0,
                insights: "No cost analysis available yet.".into(),
            },
            memory: MemoryAnalysis {
                allocations: vec![],
                stack_total: "0 B".into(),
                heap_total: "0 B".into(),
                alloc_count: 0,
                notes: "No memory analysis available yet.".into(),
            },
            concurrency: ConcurrencyAnalysis {
                threads: vec![],
                warnings: vec![],
                analysis: "No concurrency analysis available yet.".into(),
            },
            assembly: AssemblyAnalysis {
                arch: "unknown".into(),
                blocks: vec![],
                notes: "No assembly analysis available yet.".into(),
            },
            debugger: DebuggerAnalysis { steps: vec![] },
            compare: CompareAnalysis {
                comparisons: vec![],
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn language_parse_valid() {
        assert_eq!(Language::parse("python"), Some(Language::Python));
        assert_eq!(Language::parse("Python"), Some(Language::Python));
        assert_eq!(Language::parse("RUST"), Some(Language::Rust));
        assert_eq!(Language::parse("go"), Some(Language::Go));
        assert_eq!(Language::parse("golang"), Some(Language::Go));
        assert_eq!(Language::parse("cpp"), Some(Language::Cpp));
        assert_eq!(Language::parse("c++"), Some(Language::Cpp));
        assert_eq!(Language::parse("c"), Some(Language::C));
        assert_eq!(Language::parse("typescript"), Some(Language::TypeScript));
        assert_eq!(Language::parse("ts"), Some(Language::TypeScript));
        assert_eq!(Language::parse("javascript"), Some(Language::JavaScript));
        assert_eq!(Language::parse("js"), Some(Language::JavaScript));
    }

    #[test]
    fn language_parse_invalid() {
        assert_eq!(Language::parse("../../etc/passwd"), None);
        assert_eq!(Language::parse("brainfuck"), None);
        assert_eq!(Language::parse(""), None);
    }

    #[test]
    fn language_as_str_roundtrip() {
        for lang in [
            Language::Python,
            Language::Rust,
            Language::Go,
            Language::Cpp,
            Language::C,
            Language::TypeScript,
            Language::JavaScript,
        ] {
            assert_eq!(Language::parse(lang.as_str()), Some(lang));
        }
    }

    #[test]
    fn validate_code_ok() {
        assert!(validate_code("print('hello')").is_ok());
    }

    #[test]
    fn validate_code_at_limit() {
        let code = "x".repeat(MAX_CODE_BYTES);
        assert!(validate_code(&code).is_ok());
    }

    #[test]
    fn validate_code_too_large() {
        let code = "x".repeat(MAX_CODE_BYTES + 1);
        let err = validate_code(&code).unwrap_err();
        assert!(err.message.contains("too large"));
    }

    #[test]
    fn validate_code_null_bytes() {
        let code = "print('hi')\0hidden";
        let err = validate_code(code).unwrap_err();
        assert!(err.message.contains("null bytes"));
    }

    #[test]
    fn validated_language_none() {
        assert_eq!(validated_language(&None).unwrap(), None);
    }

    #[test]
    fn validated_language_empty() {
        assert_eq!(validated_language(&Some(String::new())).unwrap(), None);
    }

    #[test]
    fn validated_language_valid() {
        let result = validated_language(&Some("python".into())).unwrap();
        assert_eq!(result, Some(Language::Python));
    }

    #[test]
    fn validated_language_path_traversal() {
        let result = validated_language(&Some("../../etc/passwd".into()));
        assert!(result.is_err());
    }

    #[test]
    fn sanitize_for_error_truncates() {
        let long = "a".repeat(100);
        let sanitized = sanitize_for_error(&long);
        assert!(sanitized.len() < 40); // 32 + "..."
        assert!(sanitized.ends_with("..."));
    }

    #[test]
    fn sanitize_for_error_strips_control() {
        let s = "hello\x00\x01world";
        let sanitized = sanitize_for_error(s);
        assert!(!sanitized.contains('\x00'));
        assert!(!sanitized.contains('\x01'));
    }
}
