import Icon from "./Icon";
import Modal from "./Modal";

export default function ConfirmDelete({ task, deleting, onConfirm, onClose }) {
  return (
    <Modal onClose={onClose} size="sm">
      <div className="confirm">
        <div className="confirm-icon">
          <Icon name="trash" size={24} />
        </div>
        <h2 id="modal-title">Delete task?</h2>
        <p>
          <strong>“{task.title}”</strong> will be permanently removed. This
          action cannot be undone.
        </p>
      </div>

      <div className="modal-actions modal-actions-stretch">
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting && <span className="spinner spinner-sm" />}
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
