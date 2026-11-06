import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
const menus = {
  Home: [
    ["Investigation wall", "desk"],
    ["Bookshelf", "library"],
    ["Quest board", "quest"],
    ["Inventory desk", "inventory"],
  ],
  Case: [
    ["Briefing", "briefing"],
    ["Go online", "network"],
    ["Quest board", "quest"],
  ],
  Game: [
    ["Replay intro", "intro"],
    ["Settings & saves", "settings"],
  ],
};
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
            {name}
            <ChevronDown size={12} />
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
              {entries.map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => {
                    setActive(null);
                    onSelect(id);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
