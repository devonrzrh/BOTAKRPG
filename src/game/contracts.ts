export type SceneId = "desk" | "hub" | "maze" | "garden";
export type Direction = "north" | "east" | "south" | "west";
export type Cell = [number, number];
export interface Interaction {
  id: string;
  label: string;
  position: Cell;
  activate: () => void;
}
export interface SceneLifecycle {
  enter(): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}
export interface ActivityCommand {
  runId: number;
  requestId: number;
  method: string;
  args: unknown[];
}
export interface ActivityResult {
  runId: number;
  requestId: number;
  value?: unknown;
  error?: string;
}
export interface LearningObjective {
  id: string;
  lesson: string;
  completed: boolean;
  evidence: string[];
}
export interface RewardEvent {
  id: string;
  xp: number;
  items: string[];
}
export type RendererPreference = "auto" | "webgpu" | "webgl";
