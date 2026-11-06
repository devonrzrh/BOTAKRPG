import {
  BookOpen,
  Backpack,
  Monitor,
  FolderSearch,
  ArrowUpRight,
} from "lucide-react";
export function HomeBoard({
  onSelect,
  accepted,
  completed,
}: {
  onSelect: (id: string) => void;
  accepted: boolean;
  completed: string[];
}) {
  return (
    <section className="investigation-board" aria-label="Investigation wall">
      <div className="board-label">
        CASE 007 <span>ECHO-7</span>
      </div>
      <svg
        className="evidence-threads"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M200 290L500 135L820 220L500 470L200 290L820 460M500 135L500 470" />
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
          <Backpack />
          <strong>Inventory desk</strong>
          <small>Items & skills</small>
          <ArrowUpRight size={17} />
        </button>
        <button
          className="pinned-paper board-file terminal-note"
          onClick={() => onSelect("network")}
        >
          <span className="paper-pin" />
          <Monitor />
          <strong>Go online</strong>
          <small>Track ECHO-7</small>
          <ArrowUpRight size={17} />
        </button>
      </div>
      <span className="board-stamp">{accepted ? "ACTIVE" : "UNASSIGNED"}</span>
    </section>
  );
}
