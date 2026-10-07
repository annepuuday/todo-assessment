import { useEffect, useState } from "react";

const API = "http://3.110.228.166:4000";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
  } catch {
    return null;
  }
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  const [token, setToken] = useState(
    new URLSearchParams(window.location.search).get("token") ||
      localStorage.getItem("token")
  );

  const user = token ? decodeToken(token) : null;

  const loginWithGitHub = () => {
    window.location.href = `${API}/auth/github`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTodos([]);
  };

  const loadTodos = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
        }
        return;
      }

      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to load todos:", error);
    }
  };

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");

    if (urlToken) {
      localStorage.setItem("token", urlToken);
      setToken(urlToken);

      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadTodos();
    }
  }, [token]);

  const addTodo = async () => {
    if (!title.trim() || !token) return;

    try {
      const response = await fetch(`${API}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      if (!response.ok) {
        alert("Failed to add task");
        return;
      }

      setTitle("");
      await loadTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const toggleTodo = async (todo) => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/todos/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: todo.title,
          completed: !todo.completed,
        }),
      });

      if (!response.ok) {
        alert("Failed to update task");
        return;
      }

      await loadTodos();
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const deleteTodo = async (id) => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/todos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Failed to delete task");
        return;
      }

      await loadTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  if (!token) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>✓</div>

          <h1 style={styles.loginTitle}>Todo Application</h1>

          <p style={styles.loginSubtitle}>
            Organize your tasks. Stay productive.
          </p>

          <button
            onClick={loginWithGitHub}
            style={styles.githubButton}
          >
            <span style={styles.githubIcon}>●</span>
            Login with GitHub
          </button>

          <p style={styles.loginNote}>
            Secure authentication powered by GitHub OAuth
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div>
          <h2 style={styles.brand}>Todo Application</h2>
          <span style={styles.brandSub}>Task Management</span>
        </div>

        <div style={styles.userArea}>
          <div style={styles.avatar}>
            {(user?.login || "U")[0].toUpperCase()}
          </div>

          <div style={styles.userInfo}>
            <strong>{user?.login || "User"}</strong>
            <span>GitHub Account</span>
          </div>

          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.welcome}>
          <div>
            <h1>Welcome, {user?.login || "User"} 👋</h1>
            <p>Manage your tasks and stay organized.</p>
          </div>

          <div style={styles.stats}>
            <div>
              <strong>{todos.length}</strong>
              <span>Total Tasks</span>
            </div>

            <div>
              <strong>
                {todos.filter((todo) => todo.completed).length}
              </strong>
              <span>Completed</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>My Tasks</h2>

          <div style={styles.inputRow}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTodo();
                }
              }}
              placeholder="What do you need to do?"
              style={styles.input}
            />

            <button onClick={addTodo} style={styles.addButton}>
              + Add Task
            </button>
          </div>

          <div style={styles.list}>
            {todos.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyIcon}>✓</div>
                <h3>No tasks yet</h3>
                <p>Add your first task above.</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} style={styles.todo}>
                  <div style={styles.todoLeft}>
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo)}
                      style={styles.checkbox}
                    />

                    <span
                      style={{
                        ...styles.todoTitle,
                        ...(todo.completed ? styles.completed : {}),
                      }}
                    >
                      {todo.title}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteTodo(todo.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  loginContainer: {
    minHeight: "100vh",
    background: "#f4f7fb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },

  loginCard: {
    background: "#ffffff",
    width: "420px",
    padding: "50px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 15px 40px rgba(0,0,0,0.10)",
  },

  logo: {
    width: "60px",
    height: "60px",
    margin: "0 auto 20px",
    borderRadius: "16px",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: "bold",
  },

  loginTitle: {
    marginBottom: "10px",
    color: "#111827",
  },

  loginSubtitle: {
    color: "#6b7280",
    marginBottom: "30px",
  },

  githubButton: {
    width: "100%",
    padding: "14px",
    background: "#24292f",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  githubIcon: {
    marginRight: "10px",
  },

  loginNote: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#9ca3af",
  },

  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    background: "white",
    padding: "18px 50px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
  },

  brand: {
    margin: 0,
    color: "#111827",
  },

  brandSub: {
    fontSize: "12px",
    color: "#9ca3af",
  },

  userArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
  },

  logoutButton: {
    marginLeft: "15px",
    padding: "9px 16px",
    border: "1px solid #dc3545",
    background: "white",
    color: "#dc3545",
    borderRadius: "7px",
    cursor: "pointer",
  },

  main: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "45px 25px",
  },

  welcome: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  stats: {
    display: "flex",
    gap: "25px",
  },

  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
  },

  cardTitle: {
    marginTop: 0,
  },

  inputRow: {
    display: "flex",
    gap: "12px",
  },

  input: {
    flex: 1,
    padding: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "15px",
  },

  addButton: {
    padding: "14px 22px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  list: {
    marginTop: "25px",
  },

  todo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "17px 5px",
    borderBottom: "1px solid #edf0f3",
  },

  todoLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  checkbox: {
    width: "18px",
    height: "18px",
  },

  todoTitle: {
    fontSize: "15px",
  },

  completed: {
    textDecoration: "line-through",
    color: "#9ca3af",
  },

  deleteButton: {
    background: "#fff1f2",
    color: "#dc3545",
    border: "none",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "50px",
    color: "#9ca3af",
  },

  emptyIcon: {
    margin: "auto",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#e8f5e9",
    color: "#2e7d32",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
  },
};

export default App;
