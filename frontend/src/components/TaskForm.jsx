import { useState } from "react";
import Modal from "./Modal";

const MAX_LENGTH = 120;

export default function TaskForm({ task, saving, onSubmit, onClose }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const isEditing = Boolean(task);
  const trimmed = title.trim();
  const unchanged = isEditing && trimmed === task.title;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!trimmed || unchanged || saving) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      title={isEditing ? "Edit task" : "New task"}
      description={
        isEditing
          ? "Update the name of this task."
          : "Add something you want to get done."
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="task-title">Task name</label>
          <input
            id="task-title"
            className="input"
            autoFocus
            maxLength={MAX_LENGTH}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Write project documentation"
            autoComplete="off"
          />
          <div className="field-hint">
            <span>Press Enter to save</span>
            <span>
              {title.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!trimmed || unchanged || saving}
          >
            {saving && <span className="spinner spinner-sm" />}
            {saving ? "Saving…" : isEditing ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
