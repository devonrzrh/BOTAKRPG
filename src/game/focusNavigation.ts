export type FocusDirection = "up" | "down" | "left" | "right";
export type FocusBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Prefer controls in the requested direction; collapsed 3D proxies use DOM order. */
export function directionalIndex(
  boxes: FocusBox[],
  current: number,
  direction: FocusDirection,
) {
  if (!boxes.length) return -1;
  if (current < 0 || current >= boxes.length) return 0;
  const origin = boxes[current];
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  const x = origin.left + origin.width / 2,
    y = origin.top + origin.height / 2;
  let best = -1,
    score = Infinity;
  boxes.forEach((box, index) => {
    if (index === current) return;
    const dx = box.left + box.width / 2 - x,
      dy = box.top + box.height / 2 - y;
    const primary = (horizontal ? dx : dy) * sign;
    const cross = Math.abs(horizontal ? dy : dx);
    if (primary <= 2) return;
    const distance = primary + cross * 3;
    if (distance < score) {
      score = distance;
      best = index;
    }
  });
  return best >= 0 ? best : (current + sign + boxes.length) % boxes.length;
}
