import type { EvadeState } from "./evade";
import type { SfxName } from "./soundManager";

/** Use crossings rather than elapsed-time windows so each lane sounds once. */
export function evadeSoundCues(
  before: EvadeState,
  after: EvadeState,
): SfxName[] {
  return after.hazards.flatMap((hazard, index): SfxName[] => {
    const previous = before.hazards[index];
    if (hazard.resolved && !previous.resolved)
      return [hazard.hit ? "hit" : "dodge"];
    if (
      !hazard.resolved &&
      before.elapsed < hazard.at - 0.3 &&
      after.elapsed >= hazard.at - 0.3
    )
      return ["hazard"];
    return [];
  });
}
