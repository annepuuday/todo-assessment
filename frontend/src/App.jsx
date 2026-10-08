import { useCallback, useEffect, useMemo, useState } from "react";
import { UnauthorizedError, decodeToken, request } from "./api";
import ConfirmDelete from "./components/ConfirmDelete";
import Icon from "./components/Icon";
import LoginPage from "./components/LoginPage";
import Sidebar from "./components/Sidebar";
import TaskForm from "./components/TaskForm";
import TaskItem from "./components/TaskItem";
import { FILTERS } from "./filters";
import "./App.css";

function readInitialToken() {
  const urlToken = new URLSearchParams(window.location.search).get("token");
  if (urlToken) {
    localStorage.setItem("token", urlToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    return urlToken;
  }
  return localStorage.getItem("token");
}

function readInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const EMPTY_STATES = {
  all: {
    title: "No tasks yet",
    text: "Create your first task and start getting things done.",
  },
  pending: {
    title: "You're all caught up",
    text: "There are no pending tasks. Enjoy the free time!",
  },
  completed: {
    title: "Nothing completed yet",
    text: "Tasks you complete will show up here.",
  },
};

function App() {
  const [token, setToken] = useState(readInitialToken);
  const [theme, setTheme] = useState(readInitialTheme);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyIds, setBusyIds] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sessionNotice, setSessionNotice] = useState("");

  const user = token ? decodeToken(token) : null;
  const username = user?.login || "User";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, type = "success") => setToast({ message, type, id: Date.now() });

  const signOut = useCallback((notice = "") => {
    localStorage.removeItem("token");
    setToken(null);
    setTodos([]);
    setModal(null);
    setMenuOpen(false);
    setSessionNotice(notice);
  }, []);

  const handleError = useCallback(
    (error, message) => {
      if (error instanceof UnauthorizedError) {
        signOut("Your session has expired. Please sign in again.");
        return;
      }
      console.error(error);
      setToast({ message, type: "error", id: Date.now() });
    },
    [signOut]
  );

  const loadTodos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await request("/api/todos", token);
      setTodos(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        handleError(error);
      } else {
        console.error(error);
        setLoadError("We couldn't reach the TodoFlow service. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, handleError]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const setBusy = (id, isBusy) =>
    setBusyIds((ids) => (isBusy ? [...ids, id] : ids.filter((value) => value !== id)));

  const closeModal = useCallback(() => setModal(null), []);

  const createTask = async (title) => {
    setSaving(true);
    try {
      await request("/api/todos", token, { method: "POST", body: { title } });
      setModal(null);
      notify("Task added");
      await loadTodos();
    } catch (error) {
      handleError(error, "Couldn't add the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renameTask = async (title) => {
    const task = modal.task;
    setSaving(true);
    try {
      await request(`/api/todos/${task.id}`, token, {
        method: "PUT",
        body: { title, completed: task.completed },
      });
      setTodos((items) => items.map((item) => (item.id === task.id ? { ...item, title } : item)));
      setModal(null);
      notify("Task updated");
    } catch (error) {
      handleError(error, "Couldn't update the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    const completed = !task.completed;
    setBusy(task.id, true);
    setTodos((items) => items.map((item) => (item.id === task.id ? { ...item, completed } : item)));
    try {
      await request(`/api/todos/${task.id}`, token, {
        method: "PUT",
        body: { title: task.title, completed },
      });
      if (completed) notify("Nice work! Task completed");
    } catch (error) {
      setTodos((items) =>
        items.map((item) => (item.id === task.id ? { ...item, completed: task.completed } : item))
      );
      handleError(error, "Couldn't update the task. Please try again.");
    } finally {
      setBusy(task.id, false);
    }
  };

  const deleteTask = async () => {
    const task = modal.task;
    setSaving(true);
    try {
      await request(`/api/todos/${task.id}`, token, { method: "DELETE" });
      setTodos((items) => items.filter((item) => item.id !== task.id));
      setModal(null);
      notify("Task deleted");
    } catch (error) {
      handleError(error, "Couldn't delete the task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const completed = todos.filter((todo) => todo.completed).length;
    return { all: todos.length, pending: todos.length - completed, completed };
  }, [todos]);

  const progress = counts.all ? Math.round((counts.completed / counts.all) * 100) : 0;

  const visibleTodos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return todos
      .filter((todo) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "pending" && !todo.completed) ||
          (filter === "completed" && todo.completed);
        return matchesFilter && todo.title.toLowerCase().includes(query);
      })
      .sort((a, b) => Number(a.completed) - Number(b.completed) || b.id - a.id);
  }, [todos, search, filter]);

  if (!token) {
    return <LoginPage notice={sessionNotice} />;
  }

  const stats = [
    { label: "Total tasks", value: counts.all, icon: "list", tone: "primary" },
    { label: "Pending", value: counts.pending, icon: "clock", tone: "warning" },
    { label: "Completed", value: counts.completed, icon: "checkCircle", tone: "success" },
    { label: "Completion rate", value: `${progress}%`, icon: "target", tone: "info" },
  ];

  const activeFilter = FILTERS.find((item) => item.id === filter);
  const emptyState = search.trim()
    ? { title: "No matching tasks", text: `Nothing matches “${search.trim()}”. Try a different search.` }
    : EMPTY_STATES[filter];

  return (
    <div className="app">
      <Sidebar
        open={menuOpen}
        filter={filter}
        counts={counts}
        username={username}
        onSelectFilter={(id) => {
          setFilter(id);
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
        onSignOut={() => signOut()}
      />

      <div className="main">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="icon-btn menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="menu" size={22} />
            </button>
            <div className="topbar-title">
              <span className="topbar-crumb">TodoFlow</span>
              <h1>{activeFilter.label}</h1>
            </div>
          </div>

          <div className="topbar-end">
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
            </button>
            <div className="topbar-user">
              <div className="avatar avatar-soft">{username[0].toUpperCase()}</div>
              <div className="topbar-user-info">
                <strong>{username}</strong>
                <span>Login in with GitHub</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="page-header">
            <div>
              <p className="page-date">
                <Icon name="calendar" size={15} />
                {todayLabel}
              </p>
              <h2>
                {greeting()}, {username}
              </h2>
              <p className="page-subtitle">
                {counts.all === 0
                  ? "Let's plan your day — add your first task to get started."
                  : counts.pending === 0
                    ? "Everything is done. Great job staying on top of things!"
                    : `You have ${counts.pending} pending ${counts.pending === 1 ? "task" : "tasks"} to work on.`}
              </p>
            </div>
            <button className="btn btn-primary btn-add" onClick={() => setModal({ type: "create" })}>
              <Icon name="plus" size={19} />
              Add task
            </button>
          </section>

          <section className="stats" aria-label="Task summary">
            {stats.map((stat) => (
              <article className="stat" key={stat.label}>
                <div className={`stat-icon tone-${stat.tone}`}>
                  <Icon name={stat.icon} size={22} />
                </div>
                <div className="stat-body">
                  <span className="stat-label">{stat.label}</span>
                  <strong className="stat-value">{stat.value}</strong>
                </div>
              </article>
            ))}
          </section>

          <section className="progress-card" aria-label="Overall progress">
            <div className="progress-head">
              <span>Overall progress</span>
              <span>
                {counts.completed} of {counts.all} completed
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div className="tabs" role="tablist" aria-label="Filter tasks">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={filter === item.id}
                    className={`tab ${filter === item.id ? "is-active" : ""}`}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                    <span className="tab-count">{counts[item.id]}</span>
                  </button>
                ))}
              </div>

              <div className="search">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks"
                  aria-label="Search tasks"
                />
                {search && (
                  <button className="search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            </div>

            {loading && todos.length === 0 ? (
              <div className="state">
                <span className="spinner" />
                <p className="state-text">Loading your tasks…</p>
              </div>
            ) : loadError ? (
              <div className="state">
                <div className="state-icon tone-danger">
                  <Icon name="alert" size={26} />
                </div>
                <h3>Connection problem</h3>
                <p className="state-text">{loadError}</p>
                <button className="btn btn-secondary" onClick={loadTodos}>
                  <Icon name="refresh" size={17} />
                  Try again
                </button>
              </div>
            ) : visibleTodos.length === 0 ? (
              <div className="state">
                <div className="state-icon tone-primary">
                  <Icon name={search.trim() ? "search" : "inbox"} size={26} />
                </div>
                <h3>{emptyState.title}</h3>
                <p className="state-text">{emptyState.text}</p>
                {!search.trim() && filter === "all" && (
                  <button className="btn btn-primary" onClick={() => setModal({ type: "create" })}>
                    <Icon name="plus" size={17} />
                    Create your first task
                  </button>
                )}
              </div>
            ) : (
              <ul className="task-list">
                {visibleTodos.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    busy={busyIds.includes(task.id)}
                    onToggle={toggleTask}
                    onEdit={(item) => setModal({ type: "edit", task: item })}
                    onDelete={(item) => setModal({ type: "delete", task: item })}
                  />
                ))}
              </ul>
            )}

            {visibleTodos.length > 0 && !loadError && (
              <div className="panel-footer">
                Showing {visibleTodos.length} of {counts.all} {counts.all === 1 ? "task" : "tasks"}
              </div>
            )}
          </section>
        </main>

        <footer className="app-footer">TodoFlow · Stay organized, get things done.</footer>
      </div>

      <button
        className="fab"
        onClick={() => setModal({ type: "create" })}
        aria-label="Add task"
      >
        <Icon name="plus" size={26} />
      </button>

      {(modal?.type === "create" || modal?.type === "edit") && (
        <TaskForm
          key={modal.task?.id ?? "new"}
          task={modal.task}
          saving={saving}
          onSubmit={modal.type === "edit" ? renameTask : createTask}
          onClose={closeModal}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDelete task={modal.task} deleting={saving} onConfirm={deleteTask} onClose={closeModal} />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} role="status" key={toast.id}>
          <Icon name={toast.type === "error" ? "alert" : "checkCircle"} size={18} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;
