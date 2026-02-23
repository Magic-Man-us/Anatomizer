mod routes;

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{Request, State},
    http::{header, HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;

use anatomizer_core::{
    validate_code, validated_language, AnalysisRequest, AnalysisResponse,
};

use routes::ApiError;

// ── Constants ─────────────────────────────────────────────────────────────

/// Maximum request body size: 256 KiB.
/// The core validates at 64 KiB, but deserialization happens first.
const MAX_REQUEST_BODY_BYTES: usize = 256 * 1024;

/// Maximum requests per minute (global).
const RATE_LIMIT_PER_MINUTE: u64 = 30;

/// Hard timeout per request.
const REQUEST_TIMEOUT_SECS: u64 = 45;

/// Default allowed origin for debug builds.
const DEFAULT_DEV_ORIGIN: &str = "http://localhost:5173";

/// Default allowed origin for release builds.
const DEFAULT_PROD_ORIGIN: &str = "https://anatomizer.mimsec.com";

// ── Rate limiter state ────────────────────────────────────────────────────

/// Simple token-bucket rate limiter.
///
/// Tracks remaining tokens and refills once per minute.
/// Good enough for a demo site; no per-IP tracking needed.
#[derive(Clone)]
struct RateLimiter {
    remaining: Arc<AtomicU64>,
}

impl RateLimiter {
    fn new(capacity: u64) -> Self {
        let limiter = Self {
            remaining: Arc::new(AtomicU64::new(capacity)),
        };

        // Spawn a background task to refill tokens every minute
        let remaining = limiter.remaining.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                remaining.store(capacity, Ordering::Relaxed);
            }
        });

        limiter
    }

    fn try_acquire(&self) -> bool {
        // Atomically decrement if > 0
        loop {
            let current = self.remaining.load(Ordering::Relaxed);
            if current == 0 {
                return false;
            }
            if self
                .remaining
                .compare_exchange_weak(current, current - 1, Ordering::Relaxed, Ordering::Relaxed)
                .is_ok()
            {
                return true;
            }
        }
    }
}

// ── Security headers middleware ───────────────────────────────────────────

async fn security_headers(request: Request, next: Next) -> Response {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();

    headers.insert(
        header::HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        header::HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        header::HeaderName::from_static("referrer-policy"),
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        header::HeaderName::from_static("content-security-policy"),
        HeaderValue::from_static("default-src 'none'; frame-ancestors 'none'"),
    );
    headers.insert(
        header::HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );

    response
}

// ── Rate limiting middleware ──────────────────────────────────────────────

async fn rate_limit(
    State(limiter): State<RateLimiter>,
    request: Request,
    next: Next,
) -> Response {
    if !limiter.try_acquire() {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(serde_json::json!({ "error": "Rate limit exceeded. Try again later." })),
        )
            .into_response();
    }
    next.run(request).await
}

// ── CORS configuration ───────────────────────────────────────────────────

fn build_cors_layer() -> CorsLayer {
    let origin = std::env::var("ALLOWED_ORIGIN").unwrap_or_else(|_| {
        if cfg!(debug_assertions) {
            DEFAULT_DEV_ORIGIN.to_string()
        } else {
            DEFAULT_PROD_ORIGIN.to_string()
        }
    });

    let origin_header = HeaderValue::from_str(&origin)
        .expect("ALLOWED_ORIGIN must be a valid header value");

    CorsLayer::new()
        .allow_origin(origin_header)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::ACCEPT])
}

// ── App setup ─────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    let cors = build_cors_layer();
    let limiter = RateLimiter::new(RATE_LIMIT_PER_MINUTE);

    let app = Router::new()
        .route("/analyze", post(analyze))
        .route("/disassemble", post(routes::disassemble))
        .route("/health", get(routes::health))
        .route("/languages", get(routes::languages))
        .layer(middleware::from_fn(security_headers))
        .layer(middleware::from_fn_with_state(limiter.clone(), rate_limit))
        .layer(RequestBodyLimitLayer::new(MAX_REQUEST_BODY_BYTES))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(REQUEST_TIMEOUT_SECS),
        ))
        .layer(cors);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|_| panic!("Failed to bind to {addr} — is the port already in use?"));
    println!("Anatomizer API running on http://localhost:{port}");
    axum::serve(listener, app).await.expect("Server error");
}

async fn analyze(
    Json(req): Json<AnalysisRequest>,
) -> Result<Json<AnalysisResponse>, ApiError> {
    // Validate code
    validate_code(&req.code).map_err(|e| ApiError::bad_request(e.message))?;

    // Validate and resolve language
    let language = validated_language(&req.language)
        .map_err(|e| ApiError::bad_request(e.message))?;

    let lang_str = language
        .map(|l| l.as_str().to_string())
        .unwrap_or_else(|| detect_language(&req.code));

    let response = anatomizer_analyzer::analyze(&req.code, &lang_str);
    Ok(Json(response))
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

    /// Helper: send an AnalysisRequest to POST /analyze.
    async fn post_analyze(req: &AnalysisRequest) -> (StatusCode, Vec<u8>) {
        let app = app();
        let http_req = Request::builder()
            .method("POST")
            .uri("/analyze")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(req).unwrap()))
            .unwrap();

        let response = app.oneshot(http_req).await.unwrap();
        let status = response.status();
        let body = response.into_body().collect().await.unwrap().to_bytes().to_vec();
        (status, body)
    }

    #[tokio::test]
    async fn analyze_python_code_returns_valid_response() {
        let req = AnalysisRequest {
            code: "def greet(name):\n    return f'Hello, {name}'".into(),
            language: None,
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        let resp: AnalysisResponse = serde_json::from_slice(&body)
            .expect("response body should deserialize into AnalysisResponse");
        assert_eq!(resp.language, "python");
        assert!(!resp.execution.summary.is_empty(), "execution summary should not be empty");
    }

    #[tokio::test]
    async fn analyze_rust_code_returns_valid_response() {
        let req = AnalysisRequest {
            code: "fn main() -> i32 {\n    let x = 42;\n    x\n}".into(),
            language: None,
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        let resp: AnalysisResponse = serde_json::from_slice(&body)
            .expect("response body should deserialize into AnalysisResponse");
        assert_eq!(resp.language, "rust");
    }

    #[tokio::test]
    async fn analyze_empty_code_does_not_crash() {
        let req = AnalysisRequest {
            code: String::new(),
            language: None,
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        let resp: AnalysisResponse = serde_json::from_slice(&body)
            .expect("response body should deserialize into AnalysisResponse");
        // Empty code defaults to python via the fallback in detect_language.
        assert!(!resp.language.is_empty(), "language field should not be empty");
    }

    #[tokio::test]
    async fn analyze_with_explicit_language_uses_specified_language() {
        let req = AnalysisRequest {
            code: "some arbitrary code".into(),
            language: Some("go".into()),
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
        let resp: AnalysisResponse = serde_json::from_slice(&body)
            .expect("response body should deserialize into AnalysisResponse");
        assert_eq!(resp.language, "go", "should use the explicitly specified language");
    }

    #[tokio::test]
    async fn analyze_invalid_language_returns_400() {
        let req = AnalysisRequest {
            code: "print('hi')".into(),
            language: Some("../../etc/passwd".into()),
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        let err: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(err["error"].as_str().unwrap().contains("Unsupported language"));
    }

    #[tokio::test]
    async fn analyze_null_bytes_returns_400() {
        let req = AnalysisRequest {
            code: "print('hi')\0rm -rf /".into(),
            language: None,
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        let err: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(err["error"].as_str().unwrap().contains("null bytes"));
    }

    #[tokio::test]
    async fn analyze_oversized_code_returns_400() {
        let req = AnalysisRequest {
            code: "x".repeat(anatomizer_core::MAX_CODE_BYTES + 1),
            language: Some("python".into()),
        };

        let (status, body) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        let err: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(err["error"].as_str().unwrap().contains("too large"));
    }

    #[tokio::test]
    async fn analyze_null_language_auto_detects() {
        let req = AnalysisRequest {
            code: "print('hi')".into(),
            language: None,
        };

        let (status, _) = post_analyze(&req).await;
        assert_eq!(status, StatusCode::OK);
    }

    // --- Security headers tests ---

    /// Build an app with the security headers middleware applied.
    fn app_with_security_headers() -> Router {
        Router::new()
            .route("/analyze", post(analyze))
            .route("/health", get(routes::health))
            .layer(middleware::from_fn(security_headers))
    }

    #[tokio::test]
    async fn security_headers_present_on_success_response() {
        let app = app_with_security_headers();
        let req = Request::builder()
            .method("GET")
            .uri("/health")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);

        let headers = response.headers();
        assert_eq!(
            headers.get("x-content-type-options").unwrap(),
            "nosniff",
        );
        assert_eq!(
            headers.get("x-frame-options").unwrap(),
            "DENY",
        );
        assert_eq!(
            headers.get("referrer-policy").unwrap(),
            "strict-origin-when-cross-origin",
        );
        assert_eq!(
            headers.get("content-security-policy").unwrap(),
            "default-src 'none'; frame-ancestors 'none'",
        );
        assert_eq!(
            headers.get("permissions-policy").unwrap(),
            "camera=(), microphone=(), geolocation=()",
        );
    }

    #[tokio::test]
    async fn security_headers_present_on_error_response() {
        let app = app_with_security_headers();
        let req = AnalysisRequest {
            code: "print('hi')".into(),
            language: Some("../../etc/passwd".into()),
        };
        let http_req = Request::builder()
            .method("POST")
            .uri("/analyze")
            .header("content-type", "application/json")
            .body(Body::from(serde_json::to_string(&req).unwrap()))
            .unwrap();

        let response = app.oneshot(http_req).await.unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        // Security headers must be present even on error responses
        assert!(response.headers().get("x-content-type-options").is_some());
        assert!(response.headers().get("x-frame-options").is_some());
        assert!(response.headers().get("content-security-policy").is_some());
    }

    // --- Rate limiter tests ---

    #[tokio::test]
    async fn rate_limiter_allows_requests_within_limit() {
        let limiter = RateLimiter {
            remaining: Arc::new(AtomicU64::new(5)),
        };
        assert!(limiter.try_acquire());
        assert!(limiter.try_acquire());
        assert!(limiter.try_acquire());
        assert!(limiter.try_acquire());
        assert!(limiter.try_acquire());
    }

    #[tokio::test]
    async fn rate_limiter_rejects_when_exhausted() {
        let limiter = RateLimiter {
            remaining: Arc::new(AtomicU64::new(1)),
        };
        assert!(limiter.try_acquire()); // last token
        assert!(!limiter.try_acquire()); // exhausted
        assert!(!limiter.try_acquire()); // still exhausted
    }

    #[tokio::test]
    async fn rate_limiter_returns_zero_on_empty() {
        let limiter = RateLimiter {
            remaining: Arc::new(AtomicU64::new(0)),
        };
        assert!(!limiter.try_acquire());
    }

    #[tokio::test]
    async fn rate_limit_middleware_returns_429_when_exhausted() {
        let limiter = RateLimiter {
            remaining: Arc::new(AtomicU64::new(0)),
        };

        let app = Router::new()
            .route("/health", get(routes::health))
            .layer(middleware::from_fn_with_state(limiter, rate_limit));

        let req = Request::builder()
            .method("GET")
            .uri("/health")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);

        let body = response.into_body().collect().await.unwrap().to_bytes();
        let err: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(err["error"].as_str().unwrap().contains("Rate limit"));
    }

    #[tokio::test]
    async fn rate_limit_middleware_allows_when_tokens_available() {
        let limiter = RateLimiter {
            remaining: Arc::new(AtomicU64::new(10)),
        };

        let app = Router::new()
            .route("/health", get(routes::health))
            .layer(middleware::from_fn_with_state(limiter, rate_limit));

        let req = Request::builder()
            .method("GET")
            .uri("/health")
            .body(Body::empty())
            .unwrap();

        let response = app.oneshot(req).await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }

    // --- Detect language edge cases ---

    #[test]
    fn test_detect_language_empty_code_defaults_to_python() {
        assert_eq!(detect_language(""), "python");
    }

    #[test]
    fn test_detect_language_no_indicators_defaults_to_python() {
        assert_eq!(detect_language("hello world"), "python");
    }

    #[test]
    fn test_detect_language_javascript_vs_typescript() {
        // "function " is a TypeScript indicator (weak)
        // "console." is a TypeScript indicator (weak)
        // This is intentional: JS and TS share syntax, we lean TypeScript
        assert_eq!(
            detect_language("function greet() { console.log('hi'); }"),
            "typescript"
        );
    }
}
