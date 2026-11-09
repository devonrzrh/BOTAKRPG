import { useEffect, useRef } from "react";
import type { SurfaceModel, OfficeAction } from "../game/officeUi";
import { visibleGraphButtons, panGraph } from "../game/questGraph";
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
      data-game-navigation={model.graph ? "native" : undefined}
      aria-label={`${model.title} world controls`}
      inert={blocked}
      onKeyDown={(e) => {
        if (
          !model.graph ||
          e.defaultPrevented ||
          e.ctrlKey ||
          e.altKey ||
          e.metaKey
        )
          return;
        if (
          (e.target as HTMLElement).closest(
            "input,textarea,select,[contenteditable=true]",
          )
        )
          return;
        const delta: Record<string, [number, number]> = {
          ArrowLeft: [60, 0],
          ArrowRight: [-60, 0],
          ArrowUp: [0, 60],
          ArrowDown: [0, -60],
        };
        const d = delta[e.key];
        if (d || ["+", "-", "=", "Home"].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          onAction(
            d
              ? {
                  kind: "graph-view",
                  id: "pan",
                  view: panGraph(model.graph.view, ...d),
                }
              : {
                  kind: "graph-view",
                  id:
                    e.key === "Home"
                      ? "center"
                      : e.key === "-"
                        ? "zoom-out"
                        : "zoom-in",
                },
          );
        }
      }}
    >
      <h2>{model.title}</h2>
      {!model.graph && (
        <div>
          {model.texts.map((text, index) => (
            <p key={index}>{text.text}</p>
          ))}
        </div>
      )}
      {model.graph && (
        <p>
          {
            model.graph.nodes.find((n) => n.id === model.graph!.selected)
              ?.description
          }
        </p>
      )}
      {model.graph && (
        <p>
          Tab to a node and press Enter to inspect it. Arrow keys pan;
          plus/minus zoom; Home centers the selection.
        </p>
      )}
      {visibleGraphButtons(model).map((b) => (
        <button
          key={b.id}
          disabled={b.disabled}
          aria-pressed={
            b.id.startsWith("node-")
              ? b.id === `node-${model.graph?.selected}`
              : undefined
          }
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
              if (e.key === "Enter" && e.ctrlKey) {
                e.preventDefault();
                onAction({ kind: "save-note", id: "" });
              }
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
