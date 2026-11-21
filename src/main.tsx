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

console.log("Hey.. no peeking ;)");
console.log("Created for the Computer Science and AI class at Beijing Institute of Technology");
console.log("Created with love by team B.O.T.A.K");
console.log("Development lead by Devon");

createRoot(document.getElementById("root")!).render(
  <GameSoundProvider>
    <GameParticlesProvider>
      <GameInput>
        <App />
      </GameInput>
    </GameParticlesProvider>
  </GameSoundProvider>,
);
