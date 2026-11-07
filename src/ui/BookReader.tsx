import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type { Lesson } from "../content/schema";

export function BookReader(p: {
  lessons: Lesson[];
  lesson: Lesson;
  reducedMotion: boolean;
  bookmarked: boolean;
  note: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onBookmark: () => void;
  onNote: (value: string) => void;
  onEncounter: () => void;
}) {
  const [ready, setReady] = useState(p.reducedMotion),
    [contents, setContents] = useState(false),
    [notes, setNotes] = useState(false),
    [query, setQuery] = useState("");
  const article = useRef<HTMLElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), p.reducedMotion ? 0 : 900);
    return () => clearTimeout(timer);
  }, [p.reducedMotion]);
  useEffect(() => {
    article.current?.scrollTo(0, 0);
    setNotes(false);
  }, [p.lesson.id]);
  useEffect(() => {
    if (ready) article.current?.focus();
  }, [ready, p.lesson.id]);
  if (!ready) return null;
  const matches = p.lessons.filter((l) =>
    `${l.title} ${l.body}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section
      className="book-reader"
      aria-label="Open book"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          p.onClose();
        }
      }}
    >
      <header>
        <button onClick={() => setContents(!contents)} aria-expanded={contents}>
          Contents
        </button>
        <strong>{p.lesson.title}</strong>
        <button onClick={p.onBookmark} aria-pressed={p.bookmarked}>
          {p.bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <button onClick={() => setNotes(!notes)} aria-expanded={notes}>
          Notes
        </button>
        {p.lesson.source &&
          p.lesson.id !== "source-test-bank" &&
          p.lesson.id !== "source-guide" && (
            <button onClick={p.onEncounter}>Enter encounter</button>
          )}
        <button onClick={p.onClose}>Close book</button>
      </header>
      <div className="book-reader-pages">
        {contents && (
          <nav aria-label="Book chapters">
            <input
              aria-label="Search all materials"
              placeholder="Find a chapter…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {(["algorithms", "structures", "ai"] as const).map((topic) => (
              <div key={topic}>
                <h2>
                  {topic === "ai"
                    ? "Connectionist AI"
                    : topic === "structures"
                      ? "Data structures"
                      : "Algorithms"}
                </h2>
                {matches
                  .filter((l) => l.topic === topic)
                  .map((l) => (
                    <button
                      key={l.id}
                      aria-current={l.id === p.lesson.id ? "page" : undefined}
                      onClick={() => {
                        p.onSelect(l.id);
                        setContents(false);
                      }}
                    >
                      {l.title}
                    </button>
                  ))}
              </div>
            ))}
            {!matches.length && <p>No matching chapters.</p>}
          </nav>
        )}
        <article ref={article} tabIndex={-1} aria-label={p.lesson.title}>
          {notes ? (
            <label>
              Personal notes
              <textarea
                maxLength={20000}
                aria-label="Personal notes"
                value={p.note}
                onChange={(e) => p.onNote(e.target.value)}
              />
            </label>
          ) : (
            <>
              {p.lesson.prerequisites.length > 0 && (
                <p className="book-prerequisites">
                  Read first:{" "}
                  {p.lesson.prerequisites.map((id) => (
                    <button key={id} onClick={() => p.onSelect(id)}>
                      {p.lessons.find((l) => l.id === id)?.title}
                    </button>
                  ))}
                </p>
              )}
              <div
                className="markdown"
                onClick={(e) => {
                  const a = (e.target as HTMLElement).closest("a");
                  if (a?.hash.startsWith("#lesson=")) {
                    e.preventDefault();
                    const id = a.hash.slice(8);
                    if (p.lessons.some((l) => l.id === id)) p.onSelect(id);
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    marked.parse(
                      p.reducedMotion
                        ? p.lesson.body.replace(
                            /\/materials\/([^\s)]+\/Animated\/[^\s)]+)/g,
                            "/materials-still/$1",
                          )
                        : p.lesson.body,
                      { async: false },
                    ) as string,
                  ),
                }}
              />
            </>
          )}
        </article>
      </div>
    </section>
  );
}
