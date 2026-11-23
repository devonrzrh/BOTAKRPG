import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import type { InvestigationProgress } from "../game/investigation";

export function InvestigationBreakdown({
  progress,
  onClose,
}: {
  progress: InvestigationProgress;
  onClose: () => void;
}) {
  const root = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = root.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={root}
      className="investigation-breakdown"
      role="dialog"
      aria-modal="true"
      aria-labelledby="investigation-breakdown-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id="investigation-breakdown-title">Investigation progress</h2>
        <button
          className="icon-button"
          aria-label="Close investigation progress"
          data-sfx-silent
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <p className="investigation-overall">
        <strong>{progress.percent}%</strong>
        <span>{progress.stage}</span>
      </p>
      <ul>
        {progress.categories.map(({ id, title, percent, done, total }) => (
          <li key={id}>
            <span>{title}</span>
            <progress
              aria-label={title}
              aria-valuetext={`${percent}%, ${done} of ${total} complete`}
              value={percent}
              max={100}
            />
            <span aria-hidden="true">{percent}%</span>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
