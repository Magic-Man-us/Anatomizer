use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

use anatomizer_core::{AnalysisRequest, AssemblyAnalysis};

/// Error type for API responses.
pub struct ApiError {
    status: StatusCode,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(serde_json::json!({ "error": self.message })),
        )
            .into_response()
    }
}

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
    let lang = req
        .language
        .unwrap_or_else(|| super::detect_language(&req.code));

    anatomizer_assembler::disassemble(&req.code, &lang)
        .map(Json)
        .map_err(|e| ApiError {
            status: StatusCode::UNPROCESSABLE_ENTITY,
            message: e,
        })
}
