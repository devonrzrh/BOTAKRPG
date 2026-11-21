import { ScanLine } from "lucide-react";
import "./LoadingScreen.css";

export function LoadingScreen({ journal = false }: { journal?: boolean }) {
  return (
    <div
      className={
        journal ? "loading-screen loading-screen-journal" : "loading-screen"
      }
      role="status"
    >
      <div className="loading-screen-content">
        <ScanLine size={40} strokeWidth={1.5} aria-hidden="true" />
        <span>{journal ? "Loading journal…" : "Loading scene…"}</span>
        <span className="loading-screen-track" aria-hidden="true" />
      </div>
    </div>
  );
}
