import { createRoot } from "react-dom/client";
import App from "./App";
import { GameSoundProvider } from "./ui/GameSound";
import { GameParticlesProvider } from "./ui/GameParticles";
import { GameInput } from "./ui/GameInput";
import "./styles.css";
import "./noir.css";
import "./office.css";
import "./typography.css";
import "./world-ui.css";
import "./gameplay.css";
import "./ui/BattleScreen.css";
import "./ui/XpMeter.css";
import "./ui/BookReader.css";
import "./ui/Dialogue.css";
import "./ui/LearningQuest.css";
import "./investigation.css";
import "./ui/CombatRevamp.css";
import "./ui/BattlePolish.css";
import "./onboarding.css";
import "./ui/Blocks.css";
import "./ui/Feedback.css";

const consoleHeading =
  "font: bold 28px monospace; color: #ffd782; background: #211a12; padding: 6px 10px;";
const consoleCredit =
  "font: 18px monospace; color: #f5e6d1; background: #211a12; padding: 3px 10px;";

console.log("%cHey.. no peeking ;)", consoleHeading);
console.log(
  "%cCreated for the Computer Science and AI class at Beijing Institute of Technology",
  consoleCredit,
);
console.log("%cCreated with love by team B.O.T.A.K", consoleCredit);
console.log("%cDevelopment lead by Devon", consoleCredit);

createRoot(document.getElementById("root")!).render(
  <GameSoundProvider>
    <GameParticlesProvider>
      <GameInput>
        <App />
      </GameInput>
    </GameParticlesProvider>
  </GameSoundProvider>,
);
