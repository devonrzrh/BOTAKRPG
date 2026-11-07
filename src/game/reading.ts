/** CSS multicolumn pages, grouped into spreads. Includes the inter-spread gap. */
export function bookLayout(
  width: number,
  scrollWidth: number,
  gap: number,
  columns: number,
) {
  const count = Math.max(1, Math.floor(columns));
  const columnWidth = (Math.max(1, width) - gap * (count - 1)) / count;
  const pages = Math.max(
    1,
    Math.ceil((scrollWidth + gap - 1) / (columnWidth + gap)),
  );
  const step = Math.max(1, width) + gap;
  return {
    pages,
    columns: count,
    step,
    extent: Math.ceil(pages / count) * step - gap,
  };
}
export function clampSpread(spread: number, pages: number, columns: number) {
  return Math.max(
    0,
    Math.min(Math.floor(spread), Math.ceil(pages / columns) - 1),
  );
}
