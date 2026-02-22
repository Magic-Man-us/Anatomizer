mod routes;

use axum::{
    http::Method,
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;

use anatomizer_core::{AnalysisRequest, AnalysisResponse};

/// Maximum request body size: 256 KiB.
/// The assembler validates at 64 KiB, but deserialization happens first.
/// 256 KiB is generous enough to cover all valid use cases while preventing
/// memory exhaustion from oversized payloads.
const MAX_REQUEST_BODY_BYTES: usize = 256 * 1024;

#[tokio::main]
async fn main() {
    // CORS: Allow all origins for local development.
    // For production deployments, restrict to the frontend origin via ALLOWED_ORIGIN env var.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        .route("/analyze", post(analyze))
        .route("/disassemble", post(routes::disassemble))
        .route("/health", get(routes::health))
        .route("/languages", get(routes::languages))
        .layer(RequestBodyLimitLayer::new(MAX_REQUEST_BODY_BYTES))
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect(&format!(
            "Failed to bind to {} — is the port already in use?",
            addr
        ));
    println!("Anatomizer API running on http://localhost:{}", port);
    axum::serve(listener, app).await.expect("Server error");
}

async fn analyze(Json(req): Json<AnalysisRequest>) -> Json<AnalysisResponse> {
    let lang = req
        .language
        .unwrap_or_else(|| detect_language(&req.code));

    let response = anatomizer_analyzer::analyze(&req.code, &lang);
    Json(response)
}

pub(crate) fn detect_language(code: &str) -> String {
    // Score-based detection across supported languages.
    let mut scores: [(&str, i32); 5] = [
        ("python", 0),
        ("rust", 0),
        ("go", 0),
        ("cpp", 0),
        ("typescript", 0),
    ];

    let mut add_score = |lang: &str, points: i32| {
        if let Some(entry) = scores.iter_mut().find(|(l, _)| *l == lang) {
            entry.1 += points;
        }
    };

    // Strong indicators (5 points)
    if code.contains("def ") && code.contains(":") {
        add_score("python", 5);
    }
    if code.contains("fn ") && code.contains("->") {
        add_score("rust", 5);
    }
    if code.contains("func ") && code.contains("package ") {
        add_score("go", 5);
    }
    if code.contains("#include") {
        add_score("cpp", 5);
    }

    // Medium indicators (3 points)
    if code.contains("import ") && !code.contains("use ") {
        add_score("python", 3);
    }
    if code.contains("let ") && code.contains(";") {
        add_score("rust", 3);
    }
    if code.contains("let ") && !code.contains(";") {
        add_score("typescript", 1);
    }
    if code.contains(":=") {
        add_score("go", 3);
    }
    if code.contains("const ") || code.contains("=> ") {
        add_score("typescript", 3);
    }
    if code.contains("int main") || code.contains("void ") {
        add_score("cpp", 3);
    }

    // Weak indicators (1 point)
    if code.contains("self.") || code.contains("self,") {
        add_score("python", 1);
    }
    if code.contains("println!") || code.contains("use std::") {
        add_score("rust", 1);
    }
    if code.contains("go ") || code.contains("chan ") {
        add_score("go", 1);
    }
    if code.contains("console.") || code.contains("function ") {
        add_score("typescript", 1);
    }
    if code.contains("printf") || code.contains("sizeof") {
        add_score("cpp", 1);
    }

    scores.sort_by(|a, b| b.1.cmp(&a.1));
    if scores[0].1 > 0 {
        scores[0].0.to_string()
    } else {
        "python".into() // default fallback
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::ServiceExt;

    #[test]
    fn test_detect_python() {
        assert_eq!(detect_language("def foo():\n    pass"), "python");
    }

    #[test]
    fn test_detect_rust() {
        assert_eq!(
            detect_language("fn main() -> i32 {\n    let x = 5;\n}"),
            "rust"
        );
    }

    #[test]
    fn test_detect_go() {
        assert_eq!(
            detect_language("package main\n\nfunc main() {\n    x := 5\n}"),
            "go"
        );
    }

    #[test]
    fn test_detect_cpp() {
        assert_eq!(
            detect_language("#include <stdio.h>\nint main() { return 0; }"),
            "cpp"
        );
    }

    #[test]
    fn test_detect_typescript() {
        assert_eq!(
            detect_language("const add = (a: number) => a + 1;"),
            "typescript"
        );
    }

    // --- Integration tests for POST /analyze ---

    /// Build the app router used by all integration tests.
    fn app() -> Router {
        Router::new().route("/analyze", post(analyze))
    }

    /// Helper: send an AnalysisRequest to POST /analyze and return (status, deserialized response).
    async fn post_analyze(req: &AnalysisRequest) -> (StatusCode, AnalysisResponse) {
        let app = app();
        let http_req = Request::builder()
            .method("POST")
            .uri("/analyze")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(req).unwrap()))
            .unwrap();

        let response = app.oneshot(http_req).await.unwrap();
        let status = response.status();
        let body = response.into_body().collect().await.unwrap().to_bytes();
        let resp: AnalysisResponse = serde_json::from_slice(&body)
            .expect("response body should deserialize into AnalysisResponse");
        (status, resp)
    }

    #[tokio::test]
    async fn analyze_python_code_returns_valid_response() {
        let req = AnalysisRequest {
            code: "def greet(name):\n    return f'Hello, {name}'".into(),
            language: None,
        };

        let (status, resp) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(resp.language, "python");
        assert!(!resp.execution.summary.is_empty(), "execution summary should not be empty");
    }

    #[tokio::test]
    async fn analyze_rust_code_returns_valid_response() {
        let req = AnalysisRequest {
            code: "fn main() -> i32 {\n    let x = 42;\n    x\n}".into(),
            language: None,
        };

        let (status, resp) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(resp.language, "rust");
    }

    #[tokio::test]
    async fn analyze_empty_code_does_not_crash() {
        let req = AnalysisRequest {
            code: String::new(),
            language: None,
        };

        let (status, resp) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        // Empty code defaults to python via the fallback in detect_language.
        assert!(!resp.language.is_empty(), "language field should not be empty");
    }

    #[tokio::test]
    async fn analyze_with_explicit_language_uses_specified_language() {
        let req = AnalysisRequest {
            code: "some arbitrary code".into(),
            language: Some("go".into()),
        };

        let (status, resp) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(resp.language, "go", "should use the explicitly specified language");
    }
}
