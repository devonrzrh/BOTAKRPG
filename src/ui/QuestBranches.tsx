import type { Content, Quest } from "../content/schema";
import type { Save } from "../game/state";
import { pendingStory } from "../game/questStory";
import {
  finaleAvailable,
  questComplete,
  nextObjective,
} from "../game/investigation";
export function QuestBranches({
  save,
  content,
  onActivity,
  onLesson,
  onClaim,
}: {
  save: Save;
  content: Content;
  onActivity: (id: string) => void;
  onLesson: (id: string) => void;
  onClaim: (q: Quest) => void;
}) {
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  return (
    <section className="branch-quests" aria-label="Clue quest branches">
      {branches.map((branch, index) => {
        const done = questComplete(save, branch),
          lesson = content.entities.find(
            (e) => e.type === "lesson" && e.id === branch.lesson,
          );
        return (
          <article className="branch-card" key={branch.id}>
            <span className="branch-status">
              BRANCH {index + 1} · {done ? "CLUE RECOVERED" : "OPEN"}
            </span>
            <h3>{branch.title}</h3>
            <p>{branch.description}</p>
            <div className="branch-actions">
              <button
                disabled={!save.story.caseAccepted}
                onClick={() => onActivity(nextObjective(save, branch))}
              >
                {done
                  ? pendingStory(
                      save,
                      content,
                      branch.objectives.at(-1)!,
                      "after",
                    )
                    ? "Read conclusion"
                    : "Replay activity"
                  : "Pursue lead"}
              </button>
              <button onClick={() => onLesson(branch.lesson!)}>
                Materials: {lesson?.title}
              </button>
              <button
                disabled={!done || save.claimed.includes(branch.id)}
                onClick={() => onClaim(branch)}
              >
                {save.claimed.includes(branch.id)
                  ? "Reward claimed"
                  : `Claim ${branch.xp} XP`}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
export function FinaleCard({
  save,
  content,
  onStart,
  onClaim,
}: {
  save: Save;
  content: Content;
  onStart: () => void;
  onClaim: (q: Quest) => void;
}) {
  const finale = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  )!;
  const branches = content.entities.filter(
    (e): e is Quest =>
      e.type === "quest" && finale.prerequisites.includes(e.id),
  );
  const count = branches.filter((q) => questComplete(save, q)).length,
    done = questComplete(save, finale);
  return (
    <section className="finale-card" aria-label="Final encounter">
      <h3>Final encounter: ECHO-7</h3>
      {done ? (
        <p className="case-closed">Robot contained. Case closed.</p>
      ) : (
        <p>
          {count === branches.length
            ? "All clues recovered. ECHO-7 is in the abandoned subnet."
            : `${count} / ${branches.length} clues recovered. Follow the remaining branches to locate the robot.`}
        </p>
      )}
      <button
        className="primary"
        disabled={!finaleAvailable(save, content)}
        onClick={onStart}
      >
        {done ? "Replay final encounter" : "Confront ECHO-7"}
      </button>
      {done && (
        <button
          disabled={save.claimed.includes(finale.id)}
          onClick={() => onClaim(finale)}
        >
          {save.claimed.includes(finale.id)
            ? "Case reward claimed"
            : `Claim ${finale.xp} XP`}
        </button>
      )}
    </section>
  );
}
