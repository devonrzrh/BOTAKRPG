import { marked, Renderer } from "marked";

export function headingSlug(text: string) {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&(?:quot|apos);|&#(?:39|34);/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Stable chapter anchors; callers still sanitize the resulting HTML. */
export function renderLessonMarkdown(body: string) {
  const renderer = new Renderer();
  const counts = new Map<string, number>();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const base = headingSlug(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    const id = count ? `${base}-${count}` : base;
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };
  const html = marked.parse(body, { renderer, async: false }) as string;
  const ids = new Set(
    Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]),
  );
  const aliases = new Map<string, string | null>();
  for (const id of ids) {
    for (const key of [
      id.replace(/-+/g, "-"),
      id.replace(/^\d+(?:-\d+)*-/, ""),
    ]) {
      aliases.set(key, aliases.has(key) && aliases.get(key) !== id ? null : id);
    }
  }
  // Source chapters retain a few pre-numbering fragments. Repair only unique matches.
  return html.replace(/href="#([^"=]+)"/g, (original, fragment: string) => {
    const id = decodeURIComponent(fragment);
    const target = ids.has(id) ? id : aliases.get(id.replace(/-+/g, "-"));
    return target ? `href="#${target}"` : original;
  });
}
