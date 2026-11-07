export function typewriterTimeline(text: string) {
  const characters =
    typeof Intl.Segmenter === "function"
      ? [
          ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            text,
          ),
        ].map((part) => part.segment)
      : Array.from(text);
  let time = 0;
  const times = characters.map((_, index) => {
    const previous = characters[index - 1] ?? "";
    time += /[.!?]/.test(previous)
      ? 150
      : /[,;:]/.test(previous)
        ? 70
        : previous === "\n"
          ? 100
          : 18;
    return time;
  });
  return { characters, times };
}
export function revealedCharacters(times: number[], elapsed: number) {
  let low = 0,
    high = times.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (times[middle] <= elapsed) low = middle + 1;
    else high = middle;
  }
  return low;
}
