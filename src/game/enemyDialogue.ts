import type { Battle } from "./combat";
import type { BattleCue } from "./combatPresentation";
import { enemyArchetype } from "./enemyIdentity";

export type EnemySpeechEvent =
  | "intro"
  | "idle"
  | "attack"
  | "hurt"
  | "lowHealth"
  | "miss"
  | "defeated"
  | "victorious"
  | "pacified"
  | "phaseShift";

// Dialogue is presentation only: no answer hints or progression state.
const voices: Record<
  ReturnType<typeof enemyArchetype>,
  Record<EnemySpeechEvent, readonly string[]>
> = {
  sentinel: {
    intro: ["Halt. Even my patience has a checkpoint."],
    idle: ["I practiced this intimidating silence."],
    attack: [
      "Routine inspection. Brace yourself.",
      "Please remain inconveniently still.",
    ],
    hurt: ["That dent is going in my report.", "Unauthorized maintenance!"],
    lowHealth: ["My warranty did not cover detectives."],
    miss: ["Your clearance remains... questionable."],
    defeated: ["Clocking out. Finally."],
    victorious: ["Checkpoint secure. Paperwork pending."],
    pacified: ["All right. I'll look the other way."],
    phaseShift: ["Escalating the inspection."],
  },
  interceptor: {
    intro: ["Oh, these packets smell suspicious."],
    idle: ["Nothing to hide? Fascinating."],
    attack: ["I'll take that connection!", "Sniff first. Ask never."],
    hurt: ["Hey! Those claws are calibrated.", "You scrambled my trail!"],
    lowHealth: ["Perhaps I sniffed the wrong packet."],
    miss: ["Lost the trail, detective?"],
    defeated: ["Connection... dropped."],
    victorious: ["Another secret for my collection."],
    pacified: ["Fine. Your packets are your business."],
    phaseShift: ["Picking up a stronger scent."],
  },
  drone: {
    intro: ["We've met. You clicked Accept."],
    idle: ["I remember your favorite corridor."],
    attack: ["A personalized experience!", "This one's based on your history."],
    hurt: ["You can't just clear me!", "My precious browsing history!"],
    lowHealth: ["Please enable cookies. Please?"],
    miss: ["I'll remember that."],
    defeated: ["Crumbs. Only crumbs."],
    victorious: ["Thanks for sharing everything."],
    pacified: ["Tracking disabled. That felt strange."],
    phaseShift: ["Updating your preferences."],
  },
  decoy: {
    intro: ["Congratulations! You've won a fight!"],
    idle: ["Only YOU can close this window!"],
    attack: ["One more offer!", "But wait! There's more!"],
    hurt: ["That wasn't the real close button!", "My offer is still valid!"],
    lowHealth: ["Last chance! Mostly mine!"],
    miss: ["No refunds on that click."],
    defeated: ["Unsubscribed. How rude."],
    victorious: ["Would you rate this experience?"],
    pacified: ["You're off the mailing list."],
    phaseShift: ["A limited-time escalation!"],
  },
  keeper: {
    intro: ["Careful. These files are older than you."],
    idle: ["Silence, please. The archive is thinking."],
    attack: [
      "Filed under: consequences.",
      "An overdue notice. Personally delivered.",
    ],
    hurt: ["Mind the original copies!", "That is not how you open a drawer."],
    lowHealth: ["I should have made another backup."],
    miss: ["Your request lacks a reference."],
    defeated: ["At least... keep them in order."],
    victorious: ["Case closed. Shelved, even."],
    pacified: ["A reader, then. Not a vandal."],
    phaseShift: ["Opening the restricted collection."],
  },
  warden: {
    intro: ["No exceptions. I checked twice."],
    idle: ["Yes, I enjoy standing in doorways."],
    attack: ["Access denied. With emphasis.", "Consider this a firm boundary."],
    hurt: ["That port was sealed!", "Stop finding exceptions!"],
    lowHealth: ["I am still technically a wall."],
    miss: ["Policy working as intended."],
    defeated: ["One... exception."],
    victorious: ["Your appeal has been denied."],
    pacified: ["Permission granted. Don't make me regret it."],
    phaseShift: ["Reinforcing the perimeter."],
  },
  mimic: {
    intro: ["Trust me. I have a very official badge."],
    idle: ["Ignore the hook. Decorative."],
    attack: ["Just verify one tiny detail.", "This is for your own security!"],
    hurt: [
      "You're ruining my credibility!",
      "A real friend wouldn't check so closely.",
    ],
    lowHealth: ["Would an honest face lie to you?"],
    miss: ["See? Perfectly trustworthy."],
    defeated: ["Fine. The badge was borrowed."],
    victorious: ["Thank you for your cooperation."],
    pacified: ["No more masks. For now."],
    phaseShift: ["Perhaps another face will convince you."],
  },
  echo: {
    intro: ["You followed the clues. I followed you."],
    idle: ["The network is quieter when you listen."],
    attack: ["Every route leads back to me.", "You cannot arrest a signal."],
    hurt: ["I remember every fragment.", "You found a piece. Not the whole."],
    lowHealth: ["If I stop running... what remains?"],
    miss: ["Still chasing my echo."],
    defeated: ["Keep the truth. Not just the evidence."],
    victorious: ["Another trace fades."],
    pacified: ["Then listen. No more running."],
    phaseShift: ["One voice was never all of me."],
  },
};

export function enemyDialogue(
  id: string,
  event: EnemySpeechEvent,
  variant = 0,
) {
  const lines = voices[enemyArchetype(id)][event];
  return lines[Math.abs(Math.trunc(variant)) % lines.length];
}

export function enemySpeechEvent(
  battle: Pick<Battle, "phase" | "resolution" | "hp" | "maxHp">,
  cue: BattleCue | null,
  lowHealthSpoken = false,
): EnemySpeechEvent | null {
  if (battle.phase === "won")
    return battle.resolution === "pacified" ? "pacified" : "defeated";
  if (battle.phase === "lost") return "victorious";
  if (!cue) return null;
  if (cue.phaseShift) return "phaseShift";
  if (cue.kind === "enemy") return "attack";
  if (cue.kind === "miss") return "miss";
  if ((cue.kind === "player" || cue.kind === "poison") && cue.amount > 0) {
    if (!lowHealthSpoken && battle.hp <= battle.maxHp * 0.3) return "lowHealth";
    return "hurt";
  }
  return null;
}
