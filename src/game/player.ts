export const DEFAULT_PLAYER_NAME = "Vale";
export const PLAYER_NAME_LIMIT = 40;
export function normalizePlayerName(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}
export function assertPlayerName(raw: string) {
  const name = normalizePlayerName(raw);
  if (!name) throw new Error("Enter a detective name.");
  if (name.length > PLAYER_NAME_LIMIT)
    throw new Error(`Keep the name under ${PLAYER_NAME_LIMIT} characters.`);
  return name;
}
// Existing saves may already carry the title, so never double it.
export function detectiveAddress(name: string) {
  const value = normalizePlayerName(name) || DEFAULT_PLAYER_NAME;
  return /^detective\b/i.test(value) ? value : `Detective ${value}`;
}
export function playerInitials(name: string) {
  const value = normalizePlayerName(name)
    .replace(/^detective\b/i, "")
    .trim();
  const words = value.split(" ").filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
  return initials || "?";
}
export function personalizeText(text: string, name: string) {
  return text.replace(/\{name\}/g, detectiveAddress(name));
}
// Dialogue authored before names existed labels the player character "Vale".
export function speakerLabel(speaker: string, name?: string) {
  if (!name || speaker !== "Vale") return speaker;
  const value = normalizePlayerName(name)
    .replace(/^detective\b/i, "")
    .trim();
  return value.split(" ").filter(Boolean).at(-1) ?? DEFAULT_PLAYER_NAME;
}
