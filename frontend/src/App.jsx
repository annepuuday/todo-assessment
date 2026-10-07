import { useEffect, useMemo, useState } from "react";

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

function Icon({ name, size = 20 }) {
  const icons = {
    check: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path
          d="M5 12.5 9.5 17 19 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    dashboard: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
    tasks: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9h8M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    completed: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m8 12 2.7 2.7L16.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    logout: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M14 8l4 4-4 4M9 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    github: (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
        <path d="M12 .7a11.3 11.3 0 0 0-3.57 22.02c.57.1.78-.25.78-.55v-2.12c-3.17.69-3.84-1.34-3.84-1.34-.52-1.31-1.27-1.66-1.27-1.66-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.73-1.53-2.53-.29-5.2-1.27-5.2-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.12 1.17a10.7 10.7 0 0 1 5.68 0c2.16-1.48 3.12-1.17 3.12-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.39-2.68 5.35-5.22 5.63.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [token, setToken] = useState(
    new URLSearchParams(window.location.search).get("token") ||
      localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");

  const user = token ? decodeToken(token) : null;

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTodos([]);
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("token");
    setToken(null);
    setTodos([]);
  };

  const loadTodos = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/todos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load tasks");
      }

      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the Todo service.");
    } finally {
      setLoading(false);
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

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      setTitle("");
      setShowModal(false);
      await loadTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to add task.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = async (todo) => {
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

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      await loadTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to update task.");
    }
  };

  const deleteTodo = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`${API}/api/todos/${deleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setDeleteId(null);
      await loadTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  };

  const completed = todos.filter((todo) => todo.completed).length;
  const pending = todos.length - completed;

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const matchesSearch = todo.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && !todo.completed) ||
        (filter === "completed" && todo.completed);

      return matchesSearch && matchesFilter;
    });
  }, [todos, search, filter]);

  if (!token) {
    return (
      <>
        <style>{globalStyles}</style>

        <div className="login-page">
          <div className="login-decoration decoration-one" />
          <div className="login-decoration decoration-two" />

          <div className="login-card">
            <div className="brand-mark">
              <Icon name="check" size={30} />
            </div>

            <div className="login-brand">TodoFlow</div>

            <h1>Welcome back</h1>

            <p className="login-description">
              Organize your work, manage your tasks, and stay productive.
            </p>

            <button
              className="github-login"
              onClick={() => {
                window.location.href = `${API}/auth/github`;
              }}
            >
              <Icon name="github" size={21} />
              Continue with GitHub
            </button>

            <div className="secure-note">
              <span>●</span>
              Secure authentication powered by GitHub OAuth
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{globalStyles}</style>

      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <div className="sidebar-brand">
              <div className="small-brand-mark">
                <Icon name="check" size={19} />
              </div>
              <div>
                <strong>TodoFlow</strong>
                <span>Task Management</span>
              </div>
            </div>

            <nav className="navigation">
              <div className="nav-label">WORKSPACE</div>

              <button className="nav-item active">
                <Icon name="dashboard" size={19} />
                Dashboard
              </button>

              <button
                className={`nav-item ${
                  filter === "pending" ? "selected" : ""
                }`}
                onClick={() => setFilter("pending")}
              >
                <Icon name="tasks" size={19} />
                Pending Tasks
                <span className="nav-count">{pending}</span>
              </button>

              <button
                className={`nav-item ${
                  filter === "completed" ? "selected" : ""
                }`}
                onClick={() => setFilter("completed")}
              >
                <Icon name="completed" size={19} />
                Completed
                <span className="nav-count">{completed}</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <div className="account-card">
              <div className="account-avatar">
                {(user?.login || "U")[0].toUpperCase()}
              </div>

              <div className="account-info">
                <strong>{user?.login || "User"}</strong>
                <span>GitHub account</span>
              </div>
            </div>

            <button className="logout-sidebar" onClick={logout}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <div className="mobile-brand">TodoFlow</div>
              <p className="topbar-date">YOUR WORKSPACE</p>
              <h2>Dashboard</h2>
            </div>

            <div className="top-user">
              <div className="top-avatar">
                {(user?.login || "U")[0].toUpperCase()}
              </div>
              <div>
                <strong>{user?.login || "User"}</strong>
                <span>GitHub Account</span>
              </div>
            </div>
          </header>

          <section className="content">
            <div className="welcome-row">
              <div>
                <p className="eyebrow">OVERVIEW</p>
                <h1>
                  Good day, {user?.login || "there"} <span>👋</span>
                </h1>
                <p className="welcome-text">
                  Here's what's happening with your tasks today.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setShowModal(true)}
              >
                <Icon name="plus" size={19} />
                Add Task
              </button>
            </div>

            {error && (
              <div className="error-banner">
                <span>{error}</span>
                <button onClick={() => setError("")}>
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Icon name="tasks" size={22} />
                </div>
                <div>
                  <span>Total Tasks</span>
                  <strong>{todos.length}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <Icon name="dashboard" size={22} />
                </div>
                <div>
                  <span>Pending</span>
                  <strong>{pending}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <Icon name="completed" size={22} />
                </div>
                <div>
                  <span>Completed</span>
                  <strong>{completed}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Icon name="check" size={22} />
                </div>
                <div>
                  <span>Completion</span>
                  <strong>
                    {todos.length
                      ? Math.round((completed / todos.length) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              </div>
            </div>

            <section className="tasks-card">
              <div className="tasks-header">
                <div>
                  <h2>My Tasks</h2>
                  <p>Manage and track your daily tasks.</p>
                </div>

                <div className="task-controls">
                  <div className="search-box">
                    <Icon name="search" size={18} />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tasks..."
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="task-list">
                {loading ? (
                  <div className="loading-state">
                    <div className="spinner" />
                    <span>Loading your tasks...</span>
                  </div>
                ) : filteredTodos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <Icon name="check" size={28} />
                    </div>

                    <h3>
                      {search || filter !== "all"
                        ? "No matching tasks"
                        : "No tasks yet"}
                    </h3>

                    <p>
                      {search || filter !== "all"
                        ? "Try changing your search or filter."
                        : "Create your first task and start getting things done."}
                    </p>

                    {!search && filter === "all" && (
                      <button
                        className="secondary-button"
                        onClick={() => setShowModal(true)}
                      >
                        <Icon name="plus" size={17} />
                        Create your first task
                      </button>
                    )}
                  </div>
                ) : (
                  filteredTodos.map((todo) => (
                    <div
                      className={`task-row ${
                        todo.completed ? "task-completed" : ""
                      }`}
                      key={todo.id}
                    >
                      <button
                        className={`task-checkbox ${
                          todo.completed ? "checked" : ""
                        }`}
                        onClick={() => toggleTodo(todo)}
                        aria-label="Toggle task"
                      >
                        {todo.completed && <Icon name="check" size={15} />}
                      </button>

                      <div className="task-details">
                        <strong>{todo.title}</strong>
                        <span>
                          {todo.completed
                            ? "Completed"
                            : "In progress"}
                        </span>
                      </div>

                      <div className="task-status">
                        <span
                          className={
                            todo.completed
                              ? "status completed-status"
                              : "status pending-status"
                          }
                        >
                          {todo.completed ? "Completed" : "Pending"}
                        </span>
                      </div>

                      <button
                        className="delete-button"
                        onClick={() => setDeleteId(todo.id)}
                        aria-label="Delete task"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Create a task</h2>
                <p>Add something you want to accomplish.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <label>Task name</label>

            <input
              className="modal-input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addTodo();
                }
              }}
              placeholder="e.g. Complete project documentation"
            />

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={addTodo}
                disabled={saving || !title.trim()}
              >
                {saving ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">
              <Icon name="trash" size={23} />
            </div>

            <h2>Delete this task?</h2>

            <p>
              This task will be permanently removed from your task list.
            </p>

            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>

              <button className="danger-button" onClick={deleteTodo}>
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const globalStyles = `
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  min-height: 100%;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #172033;
}

body {
  background: #f6f8fc;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 10% 10%, rgba(37, 99, 235, .10), transparent 30%),
    radial-gradient(circle at 90% 90%, rgba(124, 58, 237, .09), transparent 30%),
    #f7f9fc;
}

.login-card {
  width: min(430px, calc(100% - 32px));
  padding: 46px 44px;
  background: rgba(255,255,255,.96);
  border: 1px solid #e7ebf3;
  border-radius: 24px;
  box-shadow: 0 25px 70px rgba(26, 39, 67, .12);
  text-align: center;
  position: relative;
  z-index: 2;
}

.brand-mark,
.small-brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  box-shadow: 0 10px 22px rgba(37, 99, 235, .24);
}

.brand-mark {
  width: 66px;
  height: 66px;
  margin: 0 auto 18px;
  border-radius: 18px;
}

.login-brand {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .08em;
  color: #2563eb;
  text-transform: uppercase;
  margin-bottom: 22px;
}

.login-card h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: -.7px;
}

.login-description {
  margin: 12px auto 30px;
  max-width: 320px;
  color: #68748a;
  line-height: 1.6;
  font-size: 15px;
}

.github-login {
  width: 100%;
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  color: white;
  background: #171b23;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
  transition: transform .2s, box-shadow .2s;
}

.github-login:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(23,27,35,.20);
}

.secure-note {
  margin-top: 20px;
  color: #98a2b3;
  font-size: 12px;
}

.secure-note span {
  color: #22a06b;
  margin-right: 5px;
}

.login-decoration {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
}

.decoration-one {
  width: 320px;
  height: 320px;
  background: rgba(37,99,235,.06);
  top: -100px;
  left: -100px;
}

.decoration-two {
  width: 360px;
  height: 360px;
  background: rgba(124,58,237,.05);
  bottom: -150px;
  right: -120px;
}

.app-shell {
  min-height: 100vh;
  display: flex;
}

.sidebar {
  width: 255px;
  flex-shrink: 0;
  min-height: 100vh;
  padding: 28px 18px;
  background: #111827;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 10px 35px;
}

.small-brand-mark {
  width: 37px;
  height: 37px;
  border-radius: 11px;
  box-shadow: none;
}

.sidebar-brand strong {
  display: block;
  font-size: 16px;
}

.sidebar-brand span {
  display: block;
  color: #8e99ab;
  font-size: 11px;
  margin-top: 3px;
}

.navigation {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-label {
  color: #687386;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .12em;
  padding: 0 12px 10px;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #9ba5b5;
  text-align: left;
  font-size: 14px;
}

.nav-item:hover,
.nav-item.active,
.nav-item.selected {
  color: #fff;
  background: #1e293b;
}

.nav-item.active {
  box-shadow: inset 3px 0 0 #4f7df3;
}

.nav-count {
  margin-left: auto;
  font-size: 11px;
  background: #263247;
  color: #aeb8c8;
  padding: 3px 7px;
  border-radius: 20px;
}

.sidebar-bottom {
  border-top: 1px solid #202a3a;
  padding-top: 20px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 9px;
  margin-bottom: 10px;
}

.account-avatar,
.top-avatar {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.account-avatar {
  width: 35px;
  height: 35px;
  background: #315fd4;
  color: white;
  font-size: 13px;
}

.account-info {
  min-width: 0;
}

.account-info strong,
.account-info span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-info strong {
  font-size: 12px;
}

.account-info span {
  color: #778296;
  font-size: 10px;
  margin-top: 3px;
}

.logout-sidebar {
  width: 100%;
  border: 0;
  background: transparent;
  color: #8994a7;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px;
  border-radius: 9px;
}

.logout-sidebar:hover {
  color: #fff;
  background: #1e293b;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.topbar {
  min-height: 84px;
  padding: 17px 5%;
  background: white;
  border-bottom: 1px solid #e9edf4;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-date {
  margin: 0 0 3px;
  color: #9aa4b4;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .13em;
}

.topbar h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: -.3px;
}

.mobile-brand {
  display: none;
}

.top-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-avatar {
  width: 40px;
  height: 40px;
  background: #edf3ff;
  color: #315fd4;
  font-size: 14px;
}

.top-user strong,
.top-user span {
  display: block;
}

.top-user strong {
  font-size: 13px;
}

.top-user span {
  color: #98a2b3;
  font-size: 10px;
  margin-top: 3px;
}

.content {
  width: min(1180px, calc(100% - 70px));
  margin: 0 auto;
  padding: 42px 0 60px;
}

.welcome-row {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 25px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 7px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .14em;
}

.welcome-row h1 {
  margin: 0;
  font-size: 29px;
  letter-spacing: -.8px;
}

.welcome-text {
  margin: 8px 0 0;
  color: #7b8799;
  font-size: 14px;
}

.primary-button {
  border: 0;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  padding: 12px 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  box-shadow: 0 7px 16px rgba(37,99,235,.20);
  transition: .2s;
}

.primary-button:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: .55;
  cursor: not-allowed;
  transform: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 22px;
}

.stat-card {
  background: white;
  border: 1px solid #e9edf4;
  border-radius: 15px;
  padding: 19px;
  display: flex;
  align-items: center;
  gap: 13px;
  box-shadow: 0 4px 15px rgba(25,39,70,.03);
}

.stat-icon {
  width: 43px;
  height: 43px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue {
  background: #edf3ff;
  color: #2563eb;
}

.stat-icon.orange {
  background: #fff4e8;
  color: #ea8a18;
}

.stat-icon.green {
  background: #eafaf2;
  color: #17945d;
}

.stat-icon.purple {
  background: #f3efff;
  color: #7656d6;
}

.stat-card span,
.stat-card strong {
  display: block;
}

.stat-card span {
  color: #8a95a7;
  font-size: 11px;
}

.stat-card strong {
  margin-top: 4px;
  font-size: 22px;
}

.tasks-card {
  background: white;
  border: 1px solid #e9edf4;
  border-radius: 17px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(25,39,70,.04);
}

.tasks-header {
  padding: 23px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border-bottom: 1px solid #edf0f5;
}

.tasks-header h2 {
  margin: 0;
  font-size: 17px;
}

.tasks-header p {
  margin: 5px 0 0;
  color: #8b96a7;
  font-size: 12px;
}

.task-controls {
  display: flex;
  gap: 9px;
}

.search-box {
  width: 220px;
  height: 39px;
  border: 1px solid #e0e5ed;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  color: #9aa4b4;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  color: #263246;
  font-size: 12px;
}

.task-controls select {
  height: 39px;
  border: 1px solid #e0e5ed;
  border-radius: 9px;
  padding: 0 10px;
  color: #526075;
  background: white;
  outline: 0;
  font-size: 12px;
}

.task-list {
  min-height: 220px;
}

.task-row {
  min-height: 73px;
  padding: 12px 25px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid #f0f2f6;
  transition: background .15s;
}

.task-row:last-child {
  border-bottom: 0;
}

.task-row:hover {
  background: #fafbfe;
}

.task-checkbox {
  width: 22px;
  height: 22px;
  border: 1.7px solid #cbd3df;
  background: white;
  border-radius: 7px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.task-checkbox.checked {
  background: #22a06b;
  border-color: #22a06b;
}

.task-details {
  flex: 1;
  min-width: 0;
}

.task-details strong {
  display: block;
  color: #202b3c;
  font-size: 13px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.task-details span {
  display: block;
  color: #9aa4b4;
  font-size: 10px;
  margin-top: 4px;
}

.task-completed .task-details strong {
  color: #a2aab7;
  text-decoration: line-through;
}

.task-status {
  width: 90px;
}

.status {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.pending-status {
  color: #a66b12;
  background: #fff4df;
}

.completed-status {
  color: #168256;
  background: #e9f8f1;
}

.delete-button {
  border: 0;
  background: transparent;
  color: #b0b8c5;
  padding: 8px;
  border-radius: 7px;
}

.delete-button:hover {
  color: #dc3545;
  background: #fff1f2;
}

.empty-state,
.loading-state {
  min-height: 310px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 35px;
}

.empty-icon {
  width: 58px;
  height: 58px;
  border-radius: 17px;
  background: #eef4ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.empty-state h3 {
  margin: 0;
  font-size: 16px;
}

.empty-state p {
  margin: 7px 0 18px;
  color: #929cad;
  font-size: 12px;
}

.secondary-button {
  border: 1px solid #dce5f7;
  color: #2563eb;
  background: white;
  padding: 9px 13px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
}

.spinner {
  width: 25px;
  height: 25px;
  border: 3px solid #e4eaf3;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin-bottom: 10px;
}

.loading-state span {
  color: #8994a6;
  font-size: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-banner {
  margin-bottom: 18px;
  background: #fff5f5;
  border: 1px solid #ffd8d8;
  color: #c53030;
  border-radius: 10px;
  padding: 11px 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.error-banner button {
  border: 0;
  background: transparent;
  color: inherit;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15,23,42,.48);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal,
.confirm-modal {
  background: white;
  border-radius: 17px;
  box-shadow: 0 25px 70px rgba(15,23,42,.20);
}

.modal {
  width: min(480px, 100%);
  padding: 25px;
}

.confirm-modal {
  width: min(390px, 100%);
  padding: 28px;
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 24px;
}

.modal-header h2,
.confirm-modal h2 {
  margin: 0;
  font-size: 18px;
}

.modal-header p,
.confirm-modal p {
  color: #8b96a7;
  font-size: 12px;
  line-height: 1.5;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: 0;
  background: #f5f7fa;
  color: #667085;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal label {
  display: block;
  margin-bottom: 7px;
  color: #344054;
  font-size: 11px;
  font-weight: 700;
}

.modal-input {
  width: 100%;
  height: 45px;
  border: 1px solid #dce2eb;
  border-radius: 9px;
  outline: 0;
  padding: 0 13px;
  color: #263246;
}

.modal-input:focus {
  border-color: #4f7df3;
  box-shadow: 0 0 0 3px rgba(79,125,243,.10);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 23px;
}

.cancel-button {
  border: 1px solid #dce2eb;
  background: white;
  color: #526075;
  padding: 10px 15px;
  border-radius: 9px;
  font-weight: 650;
  font-size: 12px;
}

.danger-button {
  border: 0;
  background: #dc3545;
  color: white;
  padding: 10px 15px;
  border-radius: 9px;
  font-weight: 700;
  font-size: 12px;
}

.confirm-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc3545;
  background: #fff1f2;
}

@media (max-width: 1050px) {
  .sidebar {
    width: 220px;
  }

  .content {
    width: min(100% - 40px, 1000px);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 760px) {
  .sidebar {
    display: none;
  }

  .topbar {
    padding: 15px 20px;
  }

  .mobile-brand {
    display: block;
    color: #2563eb;
    font-weight: 800;
    font-size: 13px;
    margin-bottom: 3px;
  }

  .topbar-date,
  .topbar h2 {
    display: none;
  }

  .content {
    width: calc(100% - 28px);
    padding: 28px 0 40px;
  }

  .welcome-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .welcome-row h1 {
    font-size: 24px;
  }

  .primary-button {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .tasks-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .task-controls {
    width: 100%;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .task-controls select {
    width: 100%;
  }

  .task-status {
    display: none;
  }

  .task-row {
    padding: 13px 15px;
  }
}

@media (max-width: 480px) {
  .top-user > div:last-child {
    display: none;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .stat-card {
    padding: 13px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-card strong {
    font-size: 18px;
  }

  .stat-card span {
    font-size: 9px;
  }

  .welcome-row h1 {
    font-size: 21px;
  }

  .login-card {
    padding: 35px 25px;
  }
}
`;

export default App;
