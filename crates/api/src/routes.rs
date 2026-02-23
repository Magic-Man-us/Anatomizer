use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::{Deserialize, Serialize};

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

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LanguagesResponse {
    pub languages: Vec<LanguageInfo>,
}

#[derive(Serialize, Deserialize)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::Request;
    use axum::routing::{get, post};
    use axum::Router;
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    // --- ApiError tests ---

    #[test]
    fn api_error_bad_request_preserves_message() {
        let err = ApiError::bad_request("Input too large".into());
        assert_eq!(err.status, StatusCode::BAD_REQUEST);
        assert_eq!(err.message, "Input too large");
    }

    #[test]
    fn api_error_internal_hides_raw_error() {
        let err = ApiError::internal("/tmp/sandbox_abc123/input.py: No such file");
        assert_eq!(err.status, StatusCode::UNPROCESSABLE_ENTITY);
        // Must NOT contain the internal path
        assert!(!err.message.contains("/tmp/"));
        assert!(!err.message.contains("sandbox_abc123"));
        // Must contain the generic message
        assert!(err.message.contains("Analysis failed"));
    }

    #[tokio::test]
    async fn api_error_serializes_to_json() {
        let err = ApiError::bad_request("test error".into());
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["error"], "test error");
    }

    // --- Health endpoint tests ---

    #[tokio::test]
    async fn health_returns_ok_status() {
        let app = Router::new().route("/health", get(health));
        let req = Request::builder()
            .method("GET")
            .uri("/health")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(json["status"], "ok");
        assert!(!json["version"].as_str().unwrap().is_empty());
    }

    // --- Languages endpoint tests ---

    #[tokio::test]
    async fn languages_returns_all_supported_languages() {
        let app = Router::new().route("/languages", get(languages));
        let req = Request::builder()
            .method("GET")
            .uri("/languages")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let json: LanguagesResponse = serde_json::from_slice(&body).unwrap();

        let ids: Vec<&str> = json.languages.iter().map(|l| l.id.as_str()).collect();
        assert!(ids.contains(&"python"));
        assert!(ids.contains(&"rust"));
        assert!(ids.contains(&"go"));
        assert!(ids.contains(&"cpp"));
        assert!(ids.contains(&"c"));
        assert!(ids.contains(&"typescript"));
        assert!(ids.contains(&"javascript"));
        assert_eq!(json.languages.len(), 7);
    }

    // --- Disassemble endpoint validation tests ---

    #[tokio::test]
    async fn disassemble_rejects_invalid_language() {
        let app = Router::new().route("/disassemble", post(disassemble));
        let req_body = serde_json::json!({
            "code": "print('hi')",
            "language": "../../etc/passwd"
        });
        let req = Request::builder()
            .method("POST")
            .uri("/disassemble")
            .header("content-type", "application/json")
            .body(Body::from(req_body.to_string()))
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn disassemble_rejects_null_bytes() {
        let app = Router::new().route("/disassemble", post(disassemble));
        let req_body = serde_json::json!({
            "code": "print('hi')\u{0000}evil",
            "language": "python"
        });
        let req = Request::builder()
            .method("POST")
            .uri("/disassemble")
            .header("content-type", "application/json")
            .body(Body::from(req_body.to_string()))
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn disassemble_rejects_oversized_code() {
        let app = Router::new().route("/disassemble", post(disassemble));
        let req_body = serde_json::json!({
            "code": "x".repeat(anatomizer_core::MAX_CODE_BYTES + 1),
            "language": "python"
        });
        let req = Request::builder()
            .method("POST")
            .uri("/disassemble")
            .header("content-type", "application/json")
            .body(Body::from(req_body.to_string()))
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }
}
