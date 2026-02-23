use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

use anatomizer_core::{
    validate_code, validated_language, AnalysisRequest, AssemblyAnalysis,
};

// ── Error type ────────────────────────────────────────────────────────────

/// Structured error type for API responses.
///
/// Never leaks internal paths, process output, or stack traces.
/// All error messages are sanitized before being sent to the client.
pub struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    /// Create a 400 Bad Request error with a sanitized message.
    pub fn bad_request(message: String) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message,
        }
    }

    /// Create an error from an internal failure.
    ///
    /// The raw error message is logged (if tracing is enabled) but NOT
    /// exposed to the client. The client sees a generic message instead.
    fn internal(raw_error: &str) -> Self {
        // Log the full error for operators
        eprintln!("Internal error: {raw_error}");
        Self {
            status: StatusCode::UNPROCESSABLE_ENTITY,
            message: "Analysis failed. The code may contain syntax errors or use unsupported features.".into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorResponse {
                error: self.message,
            }),
        )
            .into_response()
    }
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

// ── Response types ────────────────────────────────────────────────────────

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguagesResponse {
    pub languages: Vec<LanguageInfo>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguageInfo {
    pub id: String,
    pub name: String,
    pub extensions: Vec<String>,
}

// ── Handlers ──────────────────────────────────────────────────────────────

/// GET /health
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
        version: env!("CARGO_PKG_VERSION").into(),
    })
}

/// GET /languages
pub async fn languages() -> Json<LanguagesResponse> {
    Json(LanguagesResponse {
        languages: vec![
            LanguageInfo {
                id: "python".into(),
                name: "Python".into(),
                extensions: vec![".py".into()],
            },
            LanguageInfo {
                id: "rust".into(),
                name: "Rust".into(),
                extensions: vec![".rs".into()],
            },
            LanguageInfo {
                id: "typescript".into(),
                name: "TypeScript".into(),
                extensions: vec![".ts".into(), ".tsx".into()],
            },
            LanguageInfo {
                id: "javascript".into(),
                name: "JavaScript".into(),
                extensions: vec![".js".into(), ".jsx".into()],
            },
            LanguageInfo {
                id: "go".into(),
                name: "Go".into(),
                extensions: vec![".go".into()],
            },
            LanguageInfo {
                id: "cpp".into(),
                name: "C++".into(),
                extensions: vec![
                    ".cpp".into(),
                    ".cc".into(),
                    ".cxx".into(),
                    ".h".into(),
                    ".hpp".into(),
                ],
            },
            LanguageInfo {
                id: "c".into(),
                name: "C".into(),
                extensions: vec![".c".into(), ".h".into()],
            },
        ],
    })
}

/// POST /disassemble
pub async fn disassemble(
    Json(req): Json<AnalysisRequest>,
) -> Result<Json<AssemblyAnalysis>, ApiError> {
    // Validate code
    validate_code(&req.code).map_err(|e| ApiError::bad_request(e.message))?;

    // Validate and resolve language
    let language = validated_language(&req.language)
        .map_err(|e| ApiError::bad_request(e.message))?;

    let lang_str = language
        .map(|l| l.as_str().to_string())
        .unwrap_or_else(|| super::detect_language(&req.code));

    anatomizer_assembler::disassemble(&req.code, &lang_str)
        .map(Json)
        .map_err(|e| ApiError::internal(&e))
}
