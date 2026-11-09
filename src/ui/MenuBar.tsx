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
const menuNames = Object.keys(menus);
export function MenuBar({ onSelect }: { onSelect: (id: string) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const focusTrigger = (name: string) =>
    root.current
      ?.querySelector<HTMLButtonElement>(`[data-menu-trigger="${name}"]`)
      ?.focus();
  const openMenu = (name: string, last = false) => {
    setActive(name);
    requestAnimationFrame(() => {
      const items = root.current?.querySelectorAll<HTMLButtonElement>(
        `#menu-${name} button`,
      );
      items?.[last ? items.length - 1 : 0]?.focus();
    });
  };
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
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setActive(null);
      }}
      onKeyDown={(e) => {
        if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
        const target = e.target as HTMLElement;
        if (target.closest("input,textarea,select,[contenteditable=true]"))
          return;
        const name =
          target.closest<HTMLElement>("[data-menu-name]")?.dataset.menuName;
        if (!name) return;
        const popup = target.closest(".menu-popup");
        if (e.key === "Escape" && active) {
          e.preventDefault();
          e.stopPropagation();
          focusTrigger(active);
          setActive(null);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          e.stopPropagation();
          const next =
            menuNames[
              (menuNames.indexOf(name) +
                (e.key === "ArrowRight" ? 1 : -1) +
                menuNames.length) %
                menuNames.length
            ];
          if (active) openMenu(next);
          else focusTrigger(next);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          e.stopPropagation();
          if (!popup) openMenu(name, e.key === "ArrowUp");
          else {
            const items = [
              ...popup.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            ];
            const index = items.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            items[
              (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                items.length
            ]?.focus();
          }
        } else if (e.key === "Home" || e.key === "End") {
          e.preventDefault();
          e.stopPropagation();
          if (popup) {
            const items = popup.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            );
            items[e.key === "Home" ? 0 : items.length - 1]?.focus();
          } else
            focusTrigger(
              menuNames[e.key === "Home" ? 0 : menuNames.length - 1],
            );
        }
      }}
    >
      {Object.entries(menus).map(([name, entries]) => (
        <div className="menu-group" key={name} data-menu-name={name}>
          <button
            type="button"
            className="menu-trigger"
            data-menu-trigger={name}
            aria-haspopup="menu"
            aria-expanded={active === name}
            aria-controls={`menu-${name}`}
            onClick={() => (active === name ? setActive(null) : openMenu(name))}
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
              role="menu"
              aria-label={`${name} menu`}
            >
              {entries.map(([label, id, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    focusTrigger(name);
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
