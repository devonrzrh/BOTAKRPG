import { expect, it } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Ray } from "@babylonjs/core/Culling/ray.core";
import { attachOfficeSurfaces } from "../src/world/OfficeSurfaces";
import {
  createOfficeUi,
  hitControl,
  plainLesson,
  SURFACE_WIDTH,
  SURFACE_HEIGHT,
  type OfficeUiInput,
} from "../src/game/officeUi";
import { initialSave, completeActivity } from "../src/game/state";
import { adjacentWall } from "../src/ui/RoomTurns";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
const content = validateContent(raw);
const input = (): OfficeUiInput => ({
  save: initialSave(),
  content,
  lessonId: "graph-search",
  page: 0,
  topic: "all",
  search: "",
  noteEditing: null,
  noteDraft: "",
});
it("turns through the room in either direction and wraps at the first wall", () => {
  expect(adjacentWall("investigation", -1)).toBe("desk");
  expect(adjacentWall("investigation", 1)).toBe("bookshelf");
  let wall = adjacentWall("investigation", 1);
  for (let n = 0; n < 3; n++) wall = adjacentWall(wall, 1);
  expect(wall).toBe("investigation");
  expect(adjacentWall(adjacentWall("quests", 1), -1)).toBe("quests");
});
it("registers Babylon ray picking and lets real geometry occlude a UI plane", () => {
  expect(typeof attachOfficeSurfaces).toBe("function");
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const plane = MeshBuilder.CreatePlane("UI", { size: 2 }, scene);
  plane.position.z = 4;
  plane.computeWorldMatrix(true);
  const ray = new Ray(Vector3.Zero(), new Vector3(0, 0, 1));
  const pick = scene.pickWithRay(ray)!;
  expect(pick.pickedMesh).toBe(plane);
  expect(pick.getTextureCoordinates()?.x).toBeCloseTo(0.5);
  expect(pick.getTextureCoordinates()?.y).toBeCloseTo(0.5);
  const blocker = MeshBuilder.CreateBox("desk edge", { size: 1 }, scene);
  blocker.position.z = 2;
  blocker.computeWorldMatrix(true);
  expect(scene.pickWithRay(ray)?.pickedMesh).toBe(blocker);
  scene.dispose();
  engine.dispose();
});
it("keeps all controls inside their physical surfaces and ignores disabled or outside hits", () => {
  for (const model of createOfficeUi(input())) {
    expect(new Set(model.buttons.map((b) => b.id)).size).toBe(
      model.buttons.length,
    );
    for (const b of model.buttons) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.w).toBeLessThanOrEqual(SURFACE_WIDTH);
      expect(b.y + b.h).toBeLessThanOrEqual(SURFACE_HEIGHT);
      expect(hitControl([b], b.x + b.w / 2, b.y + b.h / 2)).toBe(
        b.disabled ? undefined : b,
      );
    }
    expect(hitControl(model.buttons, -10, -10)).toBeUndefined();
  }
});
it("keeps finale and reward gates on the 3D quest board", () => {
  const data = input();
  data.save.story.caseAccepted = true;
  let quest = createOfficeUi(data).find((m) => m.id === "quests")!;
  expect(quest.buttons.find((b) => b.id === "finale")?.disabled).toBe(true);
  for (const id of ["maze-chamber", "guardian-battle", "perceptron-exhibit"])
    data.save = completeActivity(data.save, id);
  quest = createOfficeUi(data).find((m) => m.id === "quests")!;
  expect(quest.buttons.find((b) => b.id === "finale")?.disabled).toBe(false);
  expect(
    quest.buttons.find((b) => b.id === "claim-routing-trace")?.disabled,
  ).toBe(false);
  data.save.claimed.push("routing-trace");
  expect(
    createOfficeUi(data)
      .find((m) => m.id === "quests")!
      .buttons.find((b) => b.id === "claim-routing-trace")?.disabled,
  ).toBe(true);
});
it("paginates and filters materials while preserving Python operators", () => {
  expect(
    plainLesson("# Title\n```python\ny = x * 2\nz = x ** 2\n```"),
  ).toContain("x ** 2");
  expect(plainLesson("```python\ny = a ** 2 + b ** 2\n```")).toContain(
    "a ** 2 + b ** 2",
  );
  const data = input();
  data.page = 999;
  let library = createOfficeUi(data).find((m) => m.id === "bookshelf")!;
  expect(library.buttons.find((b) => b.id === "next-page")?.disabled).toBe(
    true,
  );
  expect(library.buttons.find((b) => b.id === "previous-page")?.disabled).toBe(
    false,
  );
  data.search = "perceptron";
  library = createOfficeUi(data).find((m) => m.id === "bookshelf")!;
  expect(
    library.buttons
      .filter((b) => b.id.startsWith("lesson-"))
      .map((b) => b.action.id),
  ).toEqual(["perceptron-basics"]);
});
it("draws drafts in the world and leaves saved notes unchanged until saving", () => {
  const data = input();
  data.noteEditing = "graph-search";
  data.noteDraft = "A queue explores in layers.";
  const library = createOfficeUi(data).find((m) => m.id === "bookshelf")!;
  expect(library.texts.some((t) => t.text.includes(data.noteDraft))).toBe(true);
  expect(library.buttons.find((b) => b.id === "save-note")?.action.kind).toBe(
    "save-note",
  );
  expect(data.save.notes).toEqual({});
});
