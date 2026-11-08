import { useEffect, useRef, useState } from "react";
import {
  Archive,
  BookOpen,
  ChevronDown,
  Compass,
  FileText,
  Gamepad2,
  HelpCircle,
  Home as HomeIcon,
  Library,
  NotebookPen,
  Settings2,
} from "lucide-react";
import "./MenuBar.css";
const menus = {
  Home: [
    ["Investigation wall", "desk", Archive],
    ["Bookshelf", "library", Library],
    ["Quest board", "quest", Compass],
    ["Clue ledger", "inventory", NotebookPen],
  ],
  Case: [
    ["Briefing", "briefing", FileText],
    ["Quest board", "quest", Compass],
    ["Field puzzles", "puzzles", Gamepad2],
  ],
  Game: [
    ["How to play", "manual", HelpCircle],
    ["Replay intro", "intro", BookOpen],
    ["Settings & saves", "settings", Settings2],
  ],
} as const;
const menuIcons = { Home: HomeIcon, Case: FileText, Game: Gamepad2 };
export function MenuBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setActive(null);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);
  return (
    <nav
      ref={root}
      className="menu-bar"
      aria-label="Menu bar"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setActive(null);
          e.stopPropagation();
          root.current
            ?.querySelector<HTMLButtonElement>(`[aria-expanded="true"]`)
            ?.focus();
        }
      }}
    >
      {Object.entries(menus).map(([name, entries]) => (
        <div className="menu-group" key={name}>
          <button
            type="button"
            className="menu-trigger"
            aria-expanded={active === name}
            aria-controls={`menu-${name}`}
            onClick={() => setActive(active === name ? null : name)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive(name);
                requestAnimationFrame(() =>
                  root.current
                    ?.querySelector<HTMLButtonElement>(`#menu-${name} button`)
                    ?.focus(),
                );
              }
            }}
          >
            {(() => {
              const Icon = menuIcons[name as keyof typeof menuIcons];
              return <Icon aria-hidden="true" size={17} strokeWidth={1.8} />;
            })()}
            <span>{name}</span>
            <ChevronDown aria-hidden="true" size={14} />
          </button>
          {active === name && (
            <div
              id={`menu-${name}`}
              className="menu-popup"
              onKeyDown={(e) => {
                if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
                e.preventDefault();
                const buttons = [...e.currentTarget.querySelectorAll("button")];
                const index = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                buttons[
                  (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
                    buttons.length
                ]?.focus();
              }}
            >
              {entries.map(([label, id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActive(null);
                    onSelect(id);
                  }}
                >
                  <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <span
        className="menu-version"
        title={`NULL / TRACE build ${__APP_VERSION__}`}
        aria-label={`Version ${__APP_VERSION__}`}
      >
        v{__APP_VERSION__}
      </span>
    </nav>
  );
}
