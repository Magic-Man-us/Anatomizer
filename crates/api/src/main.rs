use axum::{http::Method, routing::post, Json, Router};
use tower_http::cors::{Any, CorsLayer};

use anatomizer_core::{AnalysisRequest, AnalysisResponse};

#[tokio::main]
async fn main() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let app = Router::new()
        .route("/analyze", post(analyze))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .unwrap();
    println!("Anatomizer API running on http://localhost:3001");
    axum::serve(listener, app).await.unwrap();
}

async fn analyze(Json(req): Json<AnalysisRequest>) -> Json<AnalysisResponse> {
    let lang = req
        .language
        .unwrap_or_else(|| detect_language(&req.code));

    let response = anatomizer_analyzer::analyze(&req.code, &lang);
    Json(response)
}

fn detect_language(code: &str) -> String {
    // Simple heuristic-based detection; tree-sitter multi-grammar detection can be added later.
    if code.contains("def ") && code.contains(":") {
        return "python".into();
    }
    if code.contains("fn ") && code.contains("let ") {
        return "rust".into();
    }
    if code.contains("func ") && (code.contains("package ") || code.contains("go ")) {
        return "go".into();
    }
    if code.contains("#include") || code.contains("int main") {
        return "cpp".into();
    }
    if code.contains("const ") || code.contains("=> ") || code.contains("function ") {
        return "typescript".into();
    }
    "python".into()
}
