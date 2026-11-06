import { useEffect, useRef } from "react";
import type { SurfaceModel, OfficeAction } from "../game/officeUi";
export function WorldUiControls({
  model,
  blocked,
  focused,
  onAction,
  onFocus,
  noteEditing,
  noteDraft,
  onNoteDraft,
  searchEditing,
  search,
  onSearch,
}: {
  model: SurfaceModel;
  blocked: boolean;
  focused: string | null;
  onAction: (a: OfficeAction) => void;
  onFocus: (id: string | null) => void;
  noteEditing: boolean;
  noteDraft: string;
  onNoteDraft: (v: string) => void;
  searchEditing: boolean;
  search: string;
  onSearch: (v: string) => void;
}) {
  const note = useRef<HTMLTextAreaElement>(null),
    searchField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (noteEditing) note.current?.focus();
  }, [noteEditing]);
  useEffect(() => {
    if (searchEditing) searchField.current?.focus();
  }, [searchEditing]);
  return (
    <section
      className="world-keyboard-ui"
      aria-label={`${model.title} world controls`}
      inert={blocked}
    >
      <h2>{model.title}</h2>
      <div>
        {model.texts.map((text, index) => (
          <p key={index}>{text.text}</p>
        ))}
      </div>
      {model.buttons.map((b) => (
        <button
          key={b.id}
          disabled={b.disabled}
          onClick={() => onAction(b.action)}
          onFocus={() => onFocus(b.id)}
          onBlur={() => {
            if (focused === b.id) onFocus(null);
          }}
        >
          {b.label}
        </button>
      ))}
      {noteEditing && (
        <label>
          World notes
          <textarea
            maxLength={20000}
            ref={note}
            value={noteDraft}
            onChange={(e) => onNoteDraft(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") onAction({ kind: "cancel-note", id: "" });
              if (e.key === "Enter" && e.ctrlKey)
                onAction({ kind: "save-note", id: "" });
            }}
          />
        </label>
      )}
      {searchEditing && (
        <label>
          Search world library
          <input
            ref={searchField}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </label>
      )}
    </section>
  );
}
