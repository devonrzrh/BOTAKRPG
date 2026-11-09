import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeWall } from "../world/Office";
const walls: HomeWall[] = ["investigation", "bookshelf", "quests", "desk"];
const labels: Record<HomeWall, string> = {
  investigation: "Investigation wall",
  bookshelf: "Bookshelf",
  quests: "Quest board",
  desk: "Clue ledger",
};
const destination: Record<HomeWall, string> = {
  investigation: "desk",
  bookshelf: "library",
  quests: "quest",
  desk: "inventory",
};
export function adjacentWall(wall: HomeWall, direction: -1 | 1) {
  return walls[(walls.indexOf(wall) + direction + walls.length) % walls.length];
}
export function RoomTurns({
  wall,
  disabled,
  allowHover,
  onTurn,
}: {
  wall: HomeWall;
  disabled: boolean;
  allowHover: boolean;
  onTurn: (id: string) => void;
}) {
  const latest = useRef({ wall, disabled, allowHover, onTurn });
  latest.current = { wall, disabled, allowHover, onTurn };
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    consumed = useRef(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const turn = (direction: -1 | 1) => {
    cancel();
    if (latest.current.disabled) return;
    consumed.current = true;
    const target = adjacentWall(latest.current.wall, direction);
    latest.current.onTurn(destination[target]);
  };
  useEffect(() => () => cancel(), []);
  useEffect(() => {
    if (disabled) cancel();
  }, [disabled]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        latest.current.disabled ||
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input,textarea,select,button,a,summary,[role="menu"],[role="dialog"],[contenteditable="true"],.topbar,.dialogue-box,.prologue',
        )
      )
        return;
      const direction =
        e.key === "ArrowLeft" || e.key.toLowerCase() === "a"
          ? -1
          : e.key === "ArrowRight" || e.key.toLowerCase() === "d"
            ? 1
            : 0;
      if (direction) {
        e.preventDefault();
        turn(direction);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <nav className="room-turns" aria-label="Turn around the room">
      {([-1, 1] as const).map((direction) => {
        const target = adjacentWall(wall, direction),
          Icon = direction === -1 ? ChevronLeft : ChevronRight;
        return (
          <button
            key={direction}
            className={direction === -1 ? "turn-left" : "turn-right"}
            disabled={disabled}
            aria-label={`Turn ${direction === -1 ? "left" : "right"} to ${labels[target]}`}
            onClick={() => turn(direction)}
            onPointerEnter={(e) => {
              if (
                e.pointerType === "touch" ||
                !allowHover ||
                disabled ||
                consumed.current
              )
                return;
              cancel();
              timer.current = setTimeout(() => turn(direction), 90);
            }}
            onPointerLeave={() => {
              cancel();
              consumed.current = false;
            }}
            onPointerDown={cancel}
          >
            <Icon size={32} />
            <span>{labels[target]}</span>
          </button>
        );
      })}
    </nav>
  );
}
