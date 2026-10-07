import { useEffect } from "react";
import Icon from "./Icon";

export default function Modal({ title, description, onClose, children, size = "md" }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <div>
              <h2 id="modal-title">{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
              <Icon name="close" size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
