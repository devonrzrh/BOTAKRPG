import {
  BookOpen,
  NotebookPen,
  Monitor,
  FolderSearch,
  ArrowUpRight,
} from "lucide-react";
export function HomeBoard({
  onSelect,
  accepted,
  completed,
  finaleReady,
  caseClosed,
}: {
  onSelect: (id: string) => void;
  accepted: boolean;
  completed: string[];
  finaleReady: boolean;
  caseClosed: boolean;
}) {
  const threads = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = threads.current!;
    const board = svg.parentElement!;
    const pins = [...board.querySelectorAll(".paper-pin")];
    const path = svg.querySelector("path")!;
    const align = () => {
      const matrix = svg.getScreenCTM();
      if (!matrix || !svg.clientWidth || !svg.clientHeight) return;
      const inverse = matrix.inverse();
      const points = pins.map((pin) => {
        const rect = pin.getBoundingClientRect();
        const point = new DOMPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        ).matrixTransform(inverse);
        return `${point.x},${point.y}`;
      });
      const [suspect, quest, books, ledger, terminal] = points;
      path.setAttribute(
        "d",
        `M${suspect}L${quest}L${books}L${ledger}L${suspect}L${terminal}`,
      );
    };
    const observer = new ResizeObserver(align);
    observer.observe(board);
    pins.forEach((pin) => observer.observe(pin.parentElement!));
    align();
    return () => observer.disconnect();
  }, []);

  return (
    <section className="investigation-board" aria-label="Investigation wall">
      <div className="board-label">
        CASE 007 <span>ECHO-7</span>
      </div>
      <svg
        ref={threads}
        className="evidence-threads"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path />
      </svg>
      <button
        className="suspect-note pinned-paper"
        onClick={() => onSelect("briefing")}
        aria-label="ECHO-7 case briefing"
      >
        <span className="paper-pin" />
        <div className="robot-photo">
          <div className="robot-photo-head">
            <i />
          </div>
          <div className="robot-photo-body" />
        </div>
        <strong>ECHO-7</strong>
        <span>Last seen: transit terminal</span>
        <small>Open briefing ↗</small>
      </button>
      <div className="board-links">
        <button
          className="pinned-paper board-file"
          onClick={() => onSelect("quest")}
        >
          <span className="paper-pin" />
          <FolderSearch />
          <strong>Quest board</strong>
          <small>
            {accepted
              ? `${completed.length} / 3 clues recovered`
              : "Case awaiting acceptance"}
          </small>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="pinned-paper board-file"
          onClick={() => onSelect("library")}
        >
          <span className="paper-pin" />
          <BookOpen />
          <strong>Bookshelf</strong>
          <small>Materials & tutorials</small>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="pinned-paper board-file"
          onClick={() => onSelect("inventory")}
        >
          <span className="paper-pin" />
          <NotebookPen />
          <strong>Clue ledger</strong>
          <small>Review recovered evidence</small>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="pinned-paper board-file terminal-note"
          onClick={() => onSelect(finaleReady || caseClosed ? "echo" : "quest")}
        >
          <span className="paper-pin" />
          <Monitor />
          <strong>
            {caseClosed
              ? "Replay ECHO-7"
              : finaleReady
                ? "Confront ECHO-7"
                : "Open quest board"}
          </strong>
          <small>
            {caseClosed
              ? "Case closed"
              : finaleReady
                ? "All clues recovered"
                : "Choose the next lead"}
          </small>
          <ArrowUpRight size={17} />
        </button>
      </div>
      <span className="board-stamp">
        {caseClosed ? "CLOSED" : accepted ? "ACTIVE" : "UNASSIGNED"}
      </span>
    </section>
  );
}
import { useLayoutEffect, useRef } from "react";
