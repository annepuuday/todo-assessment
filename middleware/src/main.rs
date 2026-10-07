use axum::{
    body::Bytes,
    extract::{Path, Query, State},
    http::{header::AUTHORIZATION, HeaderMap, StatusCode},
    response::{IntoResponse, Redirect},
    routing::{delete, get, post, put},
    Router,
};
use dotenvy::dotenv;
use jsonwebtoken::{encode, EncodingKey, Header};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use tower_http::cors::CorsLayer;

#[derive(Clone)]
struct AppState {
    client: Client,
    github_client_id: String,
    github_client_secret: String,
    jwt_secret: String,
    frontend_url: String,
}

#[derive(Debug, Deserialize)]
struct GithubCallback {
    code: String,
}

#[derive(Debug, Deserialize)]
struct GithubTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct GithubUser {
    id: u64,
    login: String,
    name: Option<String>,
    email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    login: String,
    exp: usize,
}

async fn hello() -> &'static str {
    "Hello World"
}

async fn health() -> &'static str {
    "Middleware is running"
}

async fn github_login(State(state): State<AppState>) -> Redirect {
    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&scope=user:email",
        state.github_client_id
    );

    Redirect::to(&url)
}

async fn github_callback(
    State(state): State<AppState>,
    Query(query): Query<GithubCallback>,
) -> Result<Redirect, (StatusCode, String)> {
    let token_response = state
        .client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", state.github_client_id.as_str()),
            ("client_secret", state.github_client_secret.as_str()),
            ("code", query.code.as_str()),
        ])
        .send()
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_GATEWAY,
                "GitHub token request failed".to_string(),
            )
        })?;

    let token: GithubTokenResponse = token_response
        .json()
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_GATEWAY,
                "Invalid GitHub token response".to_string(),
            )
        })?;

    let user_response = state
        .client
        .get("https://api.github.com/user")
        .header("Accept", "application/vnd.github+json")
        .header("User-Agent", "todo-assessment")
        .bearer_auth(&token.access_token)
        .send()
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_GATEWAY,
                "GitHub user request failed".to_string(),
            )
        })?;

    let user: GithubUser = user_response
        .json()
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_GATEWAY,
                "Invalid GitHub user response".to_string(),
            )
        })?;

    let claims = Claims {
        sub: user.id.to_string(),
        login: user.login.clone(),
        exp: (chrono::Utc::now().timestamp() + 3600) as usize,
    };

    let jwt = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "JWT creation failed".to_string(),
        )
    })?;

    let redirect_url = format!("{}/?token={}", state.frontend_url, jwt);

    Ok(Redirect::to(&redirect_url))
}

/* ---------------- TODO PROXY ---------------- */

fn add_auth(
    request: reqwest::RequestBuilder,
    headers: &HeaderMap,
) -> Result<reqwest::RequestBuilder, StatusCode> {
    let auth = headers
        .get(AUTHORIZATION)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    Ok(request.header(AUTHORIZATION, auth))
}

async fn proxy_get_todos(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let request = state
        .client
        .get("http://127.0.0.1:5000/api/todos");

    let request = add_auth(request, &headers)?;

    let response = request
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    let status = response.status();
    let body = response
        .bytes()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, body))
}

async fn proxy_create_todo(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, StatusCode> {
    let request = state
        .client
        .post("http://127.0.0.1:5000/api/todos")
        .header("Content-Type", "application/json")
        .body(body);

    let request = add_auth(request, &headers)?;

    let response = request
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    let status = response.status();
    let body = response
        .bytes()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, body))
}

async fn proxy_update_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, StatusCode> {
    let url = format!("http://127.0.0.1:5000/api/todos/{}", id);

    let request = state
        .client
        .put(url)
        .header("Content-Type", "application/json")
        .body(body);

    let request = add_auth(request, &headers)?;

    let response = request
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    let status = response.status();
    let body = response
        .bytes()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, body))
}

async fn proxy_delete_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let url = format!("http://127.0.0.1:5000/api/todos/{}", id);

    let request = state.client.delete(url);

    let request = add_auth(request, &headers)?;

    let response = request
        .send()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    let status = response.status();

    let body = response
        .bytes()
        .await
        .map_err(|_| StatusCode::BAD_GATEWAY)?;

    Ok((status, body))
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let state = AppState {
        client: Client::new(),
        github_client_id: env::var("GITHUB_CLIENT_ID")
            .expect("GITHUB_CLIENT_ID missing"),
        github_client_secret: env::var("GITHUB_CLIENT_SECRET")
            .expect("GITHUB_CLIENT_SECRET missing"),
        jwt_secret: env::var("JWT_SECRET")
            .expect("JWT_SECRET missing"),
        frontend_url: env::var("FRONTEND_URL")
            .expect("FRONTEND_URL missing"),
    };

    let app = Router::new()
        .route("/api/hello", get(hello))
        .route("/health", get(health))
        .route("/auth/github", get(github_login))
        .route("/auth/github/callback", get(github_callback))
        .route(
            "/api/todos",
            get(proxy_get_todos).post(proxy_create_todo),
        )
        .route(
            "/api/todos/{id}",
            put(proxy_update_todo).delete(proxy_delete_todo),
        )
        .with_state(state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:4000")
        .await
        .expect("Failed to bind port 4000");

    println!("Middleware running on port 4000");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
