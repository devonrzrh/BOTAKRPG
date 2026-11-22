import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { renderLessonMarkdown } from "../game/markdown";
import DOMPurify from "dompurify";
import type { Lesson } from "../content/schema";
import type { Save } from "../game/state";
import {
  Library,
  Bookmark,
  NotebookPen,
  Swords,
  X,
  BookOpen,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { bookLayout, clampSpread, nextBookChapter } from "../game/reading";
import { useGameSound } from "./GameSound";
import { BOOK_READER_FADE_MS } from "../game/bookAnimation";

function readingOffset(element: Element, frame: HTMLElement) {
  const bounds = frame.getBoundingClientRect();
  return (
    (element.getBoundingClientRect().left - bounds.left) *
      (frame.offsetWidth / Math.max(1, bounds.width)) +
    frame.scrollLeft
  );
}

function readingProgress(frame: HTMLElement) {
  return Math.round(
    (100 * frame.scrollTop) /
      Math.max(1, frame.scrollHeight - frame.clientHeight),
  );
}

export function BookReader(p: {
  lessons: Lesson[];
  lesson: Lesson;
  reducedMotion: boolean;
  bookmarked: boolean;
  note: string;
  reading: Save["reading"];
  onPreferences: (mode: "book" | "fullscreen", size: 20 | 22 | 24) => void;
  onPosition: (id: string, position: { block: number; offset: number }) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  onClosing?: () => void;
  onBookmark: () => void;
  onNote: (value: string) => void;
  onEncounter: () => void;
}) {
  const sound = useGameSound();
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const reducedMotion = p.reducedMotion || osReduced;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setOsReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const [closing, setClosing] = useState(false);
  const [mode, setMode] = useState<"book" | "fullscreen">(p.reading.mode);
  const [drawer, setDrawer] = useState<"contents" | "tools" | "notes" | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [fontSize, setFontSize] = useState<20 | 22 | 24>(p.reading.fontSize);
  const [contentsTab, setContentsTab] = useState<"chapter" | "library">(
    "chapter",
  );
  const [topicFilter, setTopicFilter] = useState("all");
  const [jumpOpen, setJumpOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [spread, setSpread] = useState(0);
  const [layout, setLayout] = useState({
    pages: 1,
    columns: 2,
    step: 1,
    extent: 1,
  });
  const [pageInput, setPageInput] = useState("1");
  const [sheet, setSheet] = useState<{
    direction: "next" | "previous";
    html: string;
    width: number;
    height: number;
    gap: string;
    front: number;
    back: number;
    stationary: number;
  } | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const nextChapter = nextBookChapter(p.lessons, p.lesson);
  const [diagram, setDiagram] = useState<{ src: string; alt: string } | null>(
    null,
  );
  const [diagramZoom, setDiagramZoom] = useState(100);
  const selectedImage = useRef<HTMLImageElement | null>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  type Position = { block: number; offset: number };
  const currentAnchor = useRef<Position>({ block: 0, offset: 0 });
  const pendingAnchor = useRef<Position | null>(null);
  const pagination = useRef({ step: 0, height: 0 });
  const displayedSpread = useRef(0);
  const displayedScrollTop = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const capturePosition = () => {
    const frame = viewport.current,
      page = article.current;
    if (!frame || !page || pendingAnchor.current) return;
    const bounds = frame.getBoundingClientRect();
    const children = Array.from(page.children);
    for (let block = 0; block < children.length; block++) {
      const rects = Array.from(children[block].getClientRects());
      const index = rects.findIndex(
        (rect) =>
          rect.bottom > bounds.top + 5 &&
          rect.top < bounds.bottom &&
          rect.right > bounds.left + 5 &&
          rect.left < bounds.right,
      );
      if (index < 0) continue;
      const rect = rects[index];
      const offset =
        (index +
          Math.max(
            0,
            Math.min(0.999, (bounds.top - rect.top) / Math.max(1, rect.height)),
          )) /
        rects.length;
      return { block, offset };
    }
  };
  const savePosition = () => {
    const position = capturePosition();
    if (position) {
      currentAnchor.current = position;
      p.onPosition(p.lesson.id, position);
    }
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const html = useMemo(
    () =>
      DOMPurify.sanitize(
        renderLessonMarkdown(
          reducedMotion
            ? p.lesson.body.replace(
                /\/materials\/([^\s)]+\/Animated\/[^\s)]+)/g,
                "/materials-still/$1",
              )
            : p.lesson.body,
        ),
      ),
    [p.lesson.body, reducedMotion],
  );

  useEffect(() => {
    sound("bookOpen");
  }, [sound]);
  useEffect(() => {
    if (reducedMotion) setSheet(null);
  }, [reducedMotion]);
  const closeBook = () => {
    if (closing) return;
    sound("bookClose");
    if (
      mode === "fullscreen" &&
      viewport.current?.scrollTop !== displayedScrollTop.current
    )
      savePosition();
    setClosing(true);
    p.onClosing?.();
    if (reducedMotion) {
      p.onClose();
      return;
    }
    closeTimer.current = setTimeout(p.onClose, BOOK_READER_FADE_MS);
  };
  const measure = useCallback(
    (contentChanged = false) => {
      const frame = viewport.current,
        page = article.current;
      if (!frame || !page) return;
      if (mode !== "book") {
        setAtEnd(
          frame.scrollHeight - frame.clientHeight - frame.scrollTop <= 8,
        );
        return;
      }
      const style = getComputedStyle(page);
      const next = bookLayout(
        frame.clientWidth,
        page.scrollWidth,
        parseFloat(style.columnGap) || 0,
        Number(style.columnCount) || 1,
      );
      const before = pagination.current;
      if (
        before.step &&
        (contentChanged ||
          before.step !== next.step ||
          before.height !== frame.clientHeight)
      )
        pendingAnchor.current ??= currentAnchor.current;
      pagination.current = { step: next.step, height: frame.clientHeight };
      setLayout(next);
      if (next.columns === 1) setSheet(null);
      setSpread((current) => clampSpread(current, next.pages, next.columns));
    },
    [mode],
  );
  useLayoutEffect(() => {
    const frame = viewport.current!;
    const observer = new ResizeObserver(() => measure());
    observer.observe(frame);
    const onToggle = () => measure(true);
    frame.addEventListener("toggle", onToggle, true);
    measure();
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) measure(true);
    });
    return () => {
      active = false;
      observer.disconnect();
      frame.removeEventListener("toggle", onToggle, true);
    };
  }, [measure, html, fontSize]);
  useEffect(() => {
    article.current?.querySelectorAll("img").forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute(
        "aria-label",
        `Enlarge diagram: ${img.alt || "Illustration"}`,
      );
    });
  }, [html]);
  useLayoutEffect(() => {
    const frame = viewport.current!,
      page = article.current!;
    frame.scrollTo(0, 0);
    setSpread(0);
    setProgress(0);
    setAtEnd(false);
    setSheet(null);
    setPageInput("1");
    setDrawer(null);
    setDiagram(null);
    currentAnchor.current = p.reading.positions[p.lesson.id] ?? {
      block: 0,
      offset: 0,
    };
    pendingAnchor.current = currentAnchor.current;
    setJumpOpen(false);
    page.focus({ preventScroll: true });
  }, [p.lesson.id]);
  useLayoutEffect(() => {
    const frame = viewport.current;
    if (!frame || mode !== "book" || pendingAnchor.current !== null) return;
    frame.scrollLeft = spread * layout.step;
    setPageInput(String(spread * layout.columns + 1));
    if (displayedSpread.current !== spread) {
      displayedSpread.current = spread;
      savePosition();
    }
  }, [spread, layout, mode]);
  useLayoutEffect(() => {
    const frame = viewport.current,
      page = article.current;
    if (!frame || !page || pendingAnchor.current === null) return;
    const child = page.children[pendingAnchor.current.block] as
      HTMLElement | undefined;
    const anchor = pendingAnchor.current;
    pendingAnchor.current = null;
    if (!child) {
      currentAnchor.current = { block: 0, offset: 0 };
      displayedSpread.current = 0;
      displayedScrollTop.current = 0;
      frame.scrollTo(0, 0);
      setSpread(0);
      return;
    }
    currentAnchor.current = anchor;
    const rects = Array.from(child.getClientRects());
    const fragment = Math.min(
      rects.length - 1,
      Math.floor(anchor.offset * rects.length),
    );
    const rect = rects[fragment] ?? child.getBoundingClientRect(),
      bounds = frame.getBoundingClientRect();
    if (mode === "fullscreen") {
      if (anchor.block === 0 && anchor.offset === 0) {
        frame.scrollTop = 0;
      } else {
        frame.scrollTop +=
          (rect.top -
            bounds.top +
            (anchor.offset * rects.length - fragment) * rect.height) *
          (frame.offsetHeight / Math.max(1, bounds.height));
      }
      displayedScrollTop.current = frame.scrollTop;
      setProgress(readingProgress(frame));
      setAtEnd(frame.scrollHeight - frame.clientHeight - frame.scrollTop <= 8);
    } else {
      const style = getComputedStyle(page);
      const next = bookLayout(
        frame.clientWidth,
        page.scrollWidth,
        parseFloat(style.columnGap) || 0,
        Number(style.columnCount) || 1,
      );
      const target = clampSpread(
        Math.floor(
          ((rect.left - bounds.left) *
            (frame.offsetWidth / Math.max(1, bounds.width)) +
            frame.scrollLeft +
            1) /
            next.step,
        ),
        next.pages,
        next.columns,
      );
      displayedSpread.current = target;
      frame.scrollLeft = target * next.step;
      setSpread(target);
    }
  }, [mode, fontSize, p.lesson.id, layout]);
  const rememberAnchor = () => {
    pendingAnchor.current = capturePosition() ?? { block: 0, offset: 0 };
  };
  const switchMode = (next: typeof mode) => {
    if (sheet || closing) return;
    setDiagram(null);
    if (next !== mode) {
      rememberAnchor();
      setMode(next);
      p.onPreferences(next, fontSize);
      setDrawer(null);
    }
  };
  const enlarge = (img: HTMLImageElement) => {
    sound("open");
    selectedImage.current = img;
    setDiagramZoom(100);
    setDiagram({ src: img.src, alt: img.alt });
    setDrawer(null);
  };
  const closeDiagram = () => {
    sound("close");
    restoreFocus.current = selectedImage.current;
    setDiagram(null);
  };
  const closeDrawer = () => {
    restoreFocus.current = article.current;
    setDrawer(null);
  };
  useLayoutEffect(() => {
    if (!diagram && !drawer && restoreFocus.current) {
      restoreFocus.current.focus({ preventScroll: true });
      restoreFocus.current = null;
    }
  }, [diagram, drawer]);
  const flip = (next: number) => {
    if (sheet || closing) return;
    setDiagram(null);
    const target = clampSpread(next, layout.pages, layout.columns);
    if (target === spread) return;
    sound("page");
    const direction = target > spread ? "next" : "previous";
    const frame = viewport.current,
      page = article.current;
    if (
      !reducedMotion &&
      frame &&
      page &&
      layout.columns === 2 &&
      Math.abs(target - spread) === 1
    ) {
      const clone = page.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("[id]")
        .forEach((element) => element.removeAttribute("id"));
      const half = frame.clientWidth / 2;
      setSheet({
        direction,
        html: clone.innerHTML,
        width: frame.clientWidth,
        height: frame.clientHeight,
        gap: getComputedStyle(page).columnGap,
        front: frame.scrollLeft + (direction === "next" ? half : 0),
        back: target * layout.step + (direction === "previous" ? half : 0),
        stationary: frame.scrollLeft + (direction === "previous" ? half : 0),
      });
    } else if (!reducedMotion) {
      page?.animate([{ opacity: 0.55 }, { opacity: 1 }], 150);
    }
    setSpread(target);
  };
  const pageStart = spread * layout.columns + 1;
  const pageEnd = Math.min(layout.pages, pageStart + layout.columns - 1);
  const selectChapter = (id: string) => {
    if (closing || sheet || id === p.lesson.id) return;
    sound("page");
    p.onSelect(id);
  };
  const continueChapter = () => {
    if (nextChapter) selectChapter(nextChapter.id);
  };
  const topics = useMemo(
    () =>
      p.lessons.filter(
        (l) =>
          `${l.title} ${l.body}`.toLowerCase().includes(query.toLowerCase()) &&
          (topicFilter === "all" || l.topic === topicFilter),
      ),
    [p.lessons, query, topicFilter],
  );
  const sectionLinks = useMemo(
    () =>
      Array.from(html.matchAll(/<h([123])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g))
        .map((match, index) => ({
          index,
          level: Number(match[1]),
          title: match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"),
        }))
        .filter(
          (section) => section.level > 1 && !/^contents$/i.test(section.title),
        ),
    [html],
  );
  const jumpSection = (index: number, allHeadings = false) => {
    const heading = article.current?.querySelectorAll(
      allHeadings ? "h1,h2,h3,h4,h5,h6" : "h1,h2,h3",
    )[index];
    const frame = viewport.current;
    if (!heading || !frame) return;
    if (mode === "book")
      flip(Math.floor((readingOffset(heading, frame) + 1) / layout.step));
    else {
      sound("page");
      frame.scrollTop +=
        (heading.getBoundingClientRect().top -
          frame.getBoundingClientRect().top) *
        (frame.clientHeight /
          Math.max(1, frame.getBoundingClientRect().height));
    }
    setDrawer(null);
  };
  const turnInk = (offset: number) =>
    sheet && (
      <article
        className="markdown reader-content"
        style={{
          width: sheet.width,
          height: sheet.height,
          columnGap: sheet.gap,
          transform: `translateX(-${offset}px)`,
        }}
        dangerouslySetInnerHTML={{ __html: sheet.html }}
      />
    );
  return (
    <section
      className={`book-reader reader-${mode}${reducedMotion ? " reader-reduced-motion" : ""}${closing ? " reader-closing" : ""}`}
      data-sfx-silent
      aria-label="Open book"
      style={{ "--reading-size": `${fontSize}px` } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          if (diagram) closeDiagram();
          else if (drawer) closeDrawer();
          else if (jumpOpen) setJumpOpen(false);
          else closeBook();
        }
        if (diagram) return;
        if (
          mode !== "book" ||
          drawer ||
          (e.target as HTMLElement).closest(
            "input,textarea,select,a,summary,pre",
          )
        )
          return;
        if (["ArrowRight", "PageDown", "ArrowLeft", "PageUp"].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          flip(spread + (["ArrowRight", "PageDown"].includes(e.key) ? 1 : -1));
        }
      }}
    >
      <div className="reader-layout">
        <header className="reader-toolbar">
          <button
            aria-expanded={drawer === "contents"}
            onClick={() => {
              setDiagram(null);
              setDrawer(drawer === "contents" ? null : "contents");
            }}
          >
            <Library size={20} />
            Contents
          </button>
          <strong className="reader-title">{p.lesson.title}</strong>
          <div className="reader-view-options" aria-label="Reading view">
            <button
              aria-pressed={mode === "book"}
              onClick={() => switchMode("book")}
            >
              <BookOpen size={20} />
              Book
            </button>
            <button
              aria-pressed={mode === "fullscreen"}
              onClick={() => switchMode("fullscreen")}
            >
              <Maximize2 size={20} />
              Fullscreen
            </button>
          </div>
          <button
            aria-label={p.bookmarked ? "Remove bookmark" : "Bookmark chapter"}
            title={p.bookmarked ? "Remove bookmark" : "Bookmark chapter"}
            aria-pressed={p.bookmarked}
            onClick={p.onBookmark}
          >
            <Bookmark size={20} />
          </button>
          <button
            aria-label="Personal notes"
            title="Personal notes"
            aria-expanded={drawer === "notes"}
            onClick={() => {
              setDiagram(null);
              setDrawer(drawer === "notes" ? null : "notes");
            }}
          >
            <NotebookPen size={20} />
          </button>
          <button
            aria-label="Reading tools"
            aria-expanded={drawer === "tools"}
            onClick={() => {
              setDiagram(null);
              setDrawer(drawer === "tools" ? null : "tools");
            }}
          >
            <SlidersHorizontal size={20} />
            <span>Tools</span>
          </button>
          <button aria-label="Close book" onClick={closeBook}>
            <X size={22} />
          </button>
        </header>
        <div className="reader-body">
          <div className="reader-paper">
            <div
              className="reader-viewport"
              ref={viewport}
              onLoadCapture={() => measure(true)}
              onScroll={() => {
                if (mode !== "fullscreen" || pendingAnchor.current) return;
                const frame = viewport.current!;
                if (frame.scrollTop === displayedScrollTop.current) return;
                displayedScrollTop.current = frame.scrollTop;
                setProgress(readingProgress(frame));
                setAtEnd(
                  frame.scrollHeight - frame.clientHeight - frame.scrollTop <=
                    8,
                );
                savePosition();
              }}
            >
              <article
                ref={article}
                className="markdown reader-content"
                tabIndex={0}
                inert={Boolean(drawer || diagram)}
                aria-hidden={drawer || diagram ? true : undefined}
                aria-label={p.lesson.title}
                onClick={(e) => {
                  if (e.target instanceof HTMLImageElement) {
                    e.preventDefault();
                    enlarge(e.target);
                    return;
                  }
                  const link = (e.target as HTMLElement).closest("a");
                  if (link?.hash.startsWith("#lesson=")) {
                    e.preventDefault();
                    const id = link.hash.slice(8);
                    if (p.lessons.some((l) => l.id === id)) {
                      selectChapter(id);
                    }
                  } else if (link?.hash) {
                    const id = decodeURIComponent(link.hash.slice(1));
                    const index = Array.from(
                      article.current?.querySelectorAll("h1,h2,h3,h4,h5,h6") ??
                        [],
                    ).findIndex((heading) => heading.id === id);
                    if (index >= 0) {
                      e.preventDefault();
                      jumpSection(index, true);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.target instanceof HTMLImageElement &&
                    ["Enter", " "].includes(e.key)
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    enlarge(e.target);
                  }
                }}
                onFocusCapture={(e) => {
                  if (
                    mode !== "book" ||
                    e.target === article.current ||
                    !viewport.current
                  )
                    return;
                  const frame = viewport.current;
                  const offset =
                    readingOffset(e.target as HTMLElement, frame) + 1;
                  setSpread(
                    clampSpread(
                      Math.floor(offset / layout.step),
                      layout.pages,
                      layout.columns,
                    ),
                  );
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
              {mode === "book" && (
                <span
                  className="reader-spread-end"
                  aria-hidden="true"
                  style={{ left: layout.extent - 1 }}
                />
              )}
            </div>
            {sheet && !reducedMotion && (
              <div
                className={`reader-turn-layer turn-${sheet.direction}`}
                aria-hidden="true"
                inert
              >
                <div className="reader-turn-stationary">
                  {turnInk(sheet.stationary)}
                </div>
                <div
                  className="reader-turn-sheet"
                  onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget) setSheet(null);
                  }}
                >
                  <div className="reader-turn-face">{turnInk(sheet.front)}</div>
                  <div className="reader-turn-face reader-turn-back">
                    {turnInk(sheet.back)}
                  </div>
                </div>
              </div>
            )}
          </div>
          {diagram && (
            <section className="reader-diagram" aria-label="Enlarged diagram">
              <div className="reader-diagram-controls">
                <span>Diagram · {diagramZoom}%</span>
                <button
                  aria-label="Zoom diagram out"
                  disabled={diagramZoom === 100}
                  onClick={() => setDiagramZoom((z) => z - 25)}
                >
                  −
                </button>
                <button
                  aria-label="Zoom diagram in"
                  disabled={diagramZoom === 200}
                  onClick={() => setDiagramZoom((z) => z + 25)}
                >
                  +
                </button>
                <button autoFocus onClick={closeDiagram}>
                  Close diagram
                </button>
              </div>
              <div className="reader-diagram-canvas">
                <img
                  src={diagram.src}
                  alt={diagram.alt}
                  style={{ width: `${diagramZoom}%` }}
                />
              </div>
            </section>
          )}
          {drawer && (
            <aside
              className="reader-drawer"
              aria-label={
                drawer === "contents"
                  ? "Book contents"
                  : drawer === "notes"
                    ? "Book notes"
                    : "Reading tools"
              }
            >
              <div className="reader-drawer-heading">
                <h2>
                  {drawer === "contents"
                    ? "Contents"
                    : drawer === "notes"
                      ? "Personal notes"
                      : "Reading tools"}
                </h2>
                <button aria-label="Close reading panel" onClick={closeDrawer}>
                  <X size={20} />
                </button>
              </div>
              {drawer === "contents" ? (
                <>
                  <div
                    className="reader-contents-tabs"
                    aria-label="Contents view"
                  >
                    <button
                      autoFocus
                      aria-pressed={contentsTab === "chapter"}
                      onClick={() => setContentsTab("chapter")}
                    >
                      This chapter
                    </button>
                    <button
                      aria-pressed={contentsTab === "library"}
                      onClick={() => setContentsTab("library")}
                    >
                      Library
                    </button>
                  </div>
                  {contentsTab === "chapter" ? (
                    <nav aria-label="Sections in this chapter">
                      {sectionLinks.length ? (
                        sectionLinks.map((section) => (
                          <button
                            className={
                              section.level === 3 ? "reader-subsection" : ""
                            }
                            key={section.index}
                            onClick={() => jumpSection(section.index)}
                          >
                            {section.title}
                          </button>
                        ))
                      ) : (
                        <p>No sections in this chapter.</p>
                      )}
                    </nav>
                  ) : (
                    <>
                      <label>
                        Find a chapter
                        <input
                          aria-label="Search all materials"
                          placeholder="Title or topic…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </label>
                      <label>
                        Subject
                        <select
                          aria-label="Filter library by subject"
                          value={topicFilter}
                          onChange={(e) => setTopicFilter(e.target.value)}
                        >
                          <option value="all">All subjects</option>
                          <option value="algorithms">Algorithms</option>
                          <option value="structures">Data structures</option>
                          <option value="ai">Connectionist AI</option>
                        </select>
                      </label>
                      <nav aria-label="Book chapters">
                        {(["algorithms", "structures", "ai"] as const).map(
                          (topic) =>
                            topics.some((l) => l.topic === topic) && (
                              <div key={topic}>
                                <h3>
                                  {topic === "ai"
                                    ? "Connectionist AI"
                                    : topic === "structures"
                                      ? "Data structures"
                                      : "Algorithms"}
                                </h3>
                                {topics
                                  .filter((l) => l.topic === topic)
                                  .map((l) => (
                                    <button
                                      key={l.id}
                                      aria-current={
                                        l.id === p.lesson.id
                                          ? "page"
                                          : undefined
                                      }
                                      onClick={() => {
                                        selectChapter(l.id);
                                        setDrawer(null);
                                      }}
                                    >
                                      {l.title}
                                    </button>
                                  ))}
                              </div>
                            ),
                        )}
                        {!topics.length && <p>No matching chapters.</p>}
                      </nav>
                    </>
                  )}
                </>
              ) : drawer === "notes" ? (
                <label>
                  Saved with this chapter
                  <textarea
                    autoFocus
                    aria-label="Personal notes"
                    maxLength={20000}
                    value={p.note}
                    onChange={(e) => p.onNote(e.target.value)}
                  />
                </label>
              ) : (
                <>
                  <label>
                    Text size
                    <select
                      autoFocus
                      aria-label="Reading text size"
                      value={fontSize}
                      onChange={(e) => {
                        rememberAnchor();
                        const size = Number(e.target.value) as 20 | 22 | 24;
                        setFontSize(size);
                        p.onPreferences(mode, size);
                      }}
                    >
                      <option value={20}>Regular · 20</option>
                      <option value={22}>Large · 22</option>
                      <option value={24}>Larger · 24</option>
                    </select>
                  </label>
                  {p.lesson.prerequisites.length > 0 && (
                    <>
                      <h3>Read first</h3>
                      {p.lesson.prerequisites.map((id) => (
                        <button
                          key={id}
                          onClick={() => {
                            selectChapter(id);
                          }}
                        >
                          {p.lessons.find((l) => l.id === id)?.title}
                        </button>
                      ))}
                    </>
                  )}
                  {p.lesson.source &&
                    !["source-guide", "source-test-bank"].includes(
                      p.lesson.id,
                    ) && (
                      <button onClick={p.onEncounter}>
                        <Swords size={20} />
                        Enter encounter
                      </button>
                    )}
                </>
              )}
            </aside>
          )}
        </div>
        <footer className="reader-footer">
          {mode === "book" ? (
            <>
              <button
                aria-disabled={spread === 0 || Boolean(sheet)}
                onClick={() => flip(spread - 1)}
              >
                <ChevronLeft size={22} />
                Previous
              </button>
              {jumpOpen ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = Number(pageInput);
                    if (Number.isInteger(value) && value > 0)
                      flip(Math.floor((value - 1) / layout.columns));
                    else setPageInput(String(pageStart));
                    setJumpOpen(false);
                  }}
                >
                  <label>
                    Page
                    <input
                      autoFocus
                      aria-label="Page number"
                      inputMode="numeric"
                      type="number"
                      min={1}
                      max={layout.pages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                    />
                  </label>
                  <button type="submit">Go</button>
                  <button type="button" onClick={() => setJumpOpen(false)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  className="reader-page-status"
                  title="Jump to page"
                  aria-label={`Pages ${pageStart} to ${pageEnd} of ${layout.pages}. Jump to page`}
                  onClick={() => setJumpOpen(true)}
                >
                  {pageStart === pageEnd
                    ? `Page ${pageStart}`
                    : `Pages ${pageStart}–${pageEnd}`}{" "}
                  of {layout.pages}
                </button>
              )}
              <button
                aria-disabled={
                  Boolean(sheet) || (pageEnd >= layout.pages && !nextChapter)
                }
                onClick={() =>
                  pageEnd >= layout.pages ? continueChapter() : flip(spread + 1)
                }
                title={pageEnd >= layout.pages ? nextChapter?.title : undefined}
              >
                {pageEnd >= layout.pages && nextChapter
                  ? "Next chapter"
                  : "Next"}
                <ChevronRight size={22} />
              </button>
            </>
          ) : (
            <>
              <span role="status">{progress}% read</span>
              {atEnd && nextChapter && (
                <button onClick={continueChapter} title={nextChapter.title}>
                  Next chapter <ChevronRight size={22} />
                </button>
              )}
              <button
                onClick={() =>
                  viewport.current?.scrollTo({ top: 0, behavior: "instant" })
                }
              >
                Back to top
              </button>
            </>
          )}
        </footer>
      </div>
    </section>
  );
}
