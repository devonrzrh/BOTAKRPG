import { createRoot } from "react-dom/client";
import App from "./App";
import { GameSoundProvider } from "./ui/GameSound";
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
createRoot(document.getElementById("root")!).render(
  <GameSoundProvider>
    <App />
  </GameSoundProvider>,
);
