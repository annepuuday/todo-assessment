import { FILTERS } from "../filters";
import Icon from "./Icon";

export default function Sidebar({
  open,
  filter,
  counts,
  username,
  onSelectFilter,
  onClose,
  onSignOut,
}) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? "is-visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? "is-open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-logo">
              <Icon name="check" size={18} />
            </div>
            <div>
              <strong>TodoFlow</strong>
              <span>Task Manager</span>
            </div>
          </div>

          <button
            className="icon-btn sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">My Tasks</p>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${filter === item.id ? "is-active" : ""}`}
              aria-current={filter === item.id ? "page" : undefined}
              onClick={() => onSelectFilter(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              <span className="nav-count">{counts[item.id]}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account">
            <div className="avatar">{username[0].toUpperCase()}</div>
            <div className="account-info">
              <strong>{username}</strong>
              <span>
                <Icon name="github" size={11} />
                GitHub account
              </span>
            </div>
          </div>

          <button className="nav-item nav-signout" onClick={onSignOut}>
            <Icon name="logout" size={19} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
