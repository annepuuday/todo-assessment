use axum::{
    extract::{Path, State},
    http::{header::AUTHORIZATION, HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, put},
    Json, Router,
};

use jsonwebtoken::{decode, DecodingKey, Validation};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
struct AppState {
    db: Arc<Mutex<Connection>>,
    jwt_secret: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    login: String,
    exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct Todo {
    id: i64,
    title: String,
    completed: bool,
}

#[derive(Debug, Deserialize)]
struct CreateTodo {
    title: String,
}

#[derive(Debug, Deserialize)]
struct UpdateTodo {
    title: String,
    completed: bool,
}

fn get_user_id(headers: &HeaderMap, jwt_secret: &str) -> Result<String, StatusCode> {
    let auth_header = headers
        .get(AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| StatusCode::UNAUTHORIZED)?;

    Ok(token_data.claims.sub)
}

async fn health() -> &'static str {
    "Downstream is running"
}

async fn hello() -> &'static str {
    "Hello from Downstream"
}

async fn get_todos(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<Vec<Todo>>, StatusCode> {
    let user_id = get_user_id(&headers, &state.jwt_secret)?;

    let db = state.db.lock().unwrap();

    let mut stmt = db
        .prepare(
            "SELECT id, title, completed
             FROM todos
             WHERE user_id = ?1
             ORDER BY id DESC",
        )
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let rows = stmt
        .query_map(params![user_id], |row| {
            Ok(Todo {
                id: row.get(0)?,
                title: row.get(1)?,
                completed: row.get::<_, i64>(2)? != 0,
            })
        })
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let mut todos = Vec::new();

    for todo in rows {
        todos.push(todo.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?);
    }

    Ok(Json(todos))
}

async fn create_todo(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateTodo>,
) -> Result<(StatusCode, Json<Todo>), StatusCode> {
    let user_id = get_user_id(&headers, &state.jwt_secret)?;

    let title = payload.title.trim();

    if title.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let db = state.db.lock().unwrap();

    db.execute(
        "INSERT INTO todos (user_id, title, completed)
         VALUES (?1, ?2, 0)",
        params![user_id, title],
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let id = db.last_insert_rowid();

    Ok((
        StatusCode::CREATED,
        Json(Todo {
            id,
            title: title.to_string(),
            completed: false,
        }),
    ))
}

async fn update_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
    Json(payload): Json<UpdateTodo>,
) -> Result<Json<Todo>, StatusCode> {
    let user_id = get_user_id(&headers, &state.jwt_secret)?;

    let title = payload.title.trim();

    if title.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let db = state.db.lock().unwrap();

    let affected = db
        .execute(
            "UPDATE todos
             SET title = ?1, completed = ?2
             WHERE id = ?3 AND user_id = ?4",
            params![
                title,
                if payload.completed { 1 } else { 0 },
                id,
                user_id
            ],
        )
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(Json(Todo {
        id,
        title: title.to_string(),
        completed: payload.completed,
    }))
}

async fn delete_todo(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, StatusCode> {
    let user_id = get_user_id(&headers, &state.jwt_secret)?;

    let db = state.db.lock().unwrap();

    let affected = db
        .execute(
            "DELETE FROM todos
             WHERE id = ?1 AND user_id = ?2",
            params![id, user_id],
        )
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if affected == 0 {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(StatusCode::NO_CONTENT)
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let jwt_secret =
        std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");

    let db = Connection::open("../database/todo.db")
        .expect("Failed to open database");

    db.execute(
        "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        )",
        [],
    )
    .expect("Failed to create todos table");

    let state = AppState {
        db: Arc::new(Mutex::new(db)),
        jwt_secret,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/downstream/hello", get(hello))
        .route("/api/todos", get(get_todos).post(create_todo))
        .route(
            "/api/todos/{id}",
            put(update_todo).delete(delete_todo),
        )
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:5000")
        .await
        .expect("Failed to bind port 5000");

    println!("Downstream running on port 5000");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
