import Icon from "./Icon";

export default function TaskItem({ task, busy, onToggle, onEdit, onDelete }) {
  return (
    <li className={`task ${task.completed ? "is-done" : ""} ${busy ? "is-busy" : ""}`}>
      <button
        className="task-check"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
        onClick={() => onToggle(task)}
        disabled={busy}
      >
        <Icon name="check" size={14} />
      </button>

      <div className="task-body">
        <p className="task-title">{task.title}</p>
        <span className={`badge ${task.completed ? "badge-success" : "badge-warning"}`}>
          <Icon name={task.completed ? "checkCircle" : "clock"} size={12} />
          {task.completed ? "Completed" : "Pending"}
        </span>
      </div>

      <div className="task-actions">
        <button
          className="icon-btn"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          title="Edit"
          disabled={busy}
        >
          <Icon name="edit" size={18} />
        </button>
        <button
          className="icon-btn icon-btn-danger"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
          title="Delete"
          disabled={busy}
        >
          <Icon name="trash" size={18} />
        </button>
      </div>
    </li>
  );
}
