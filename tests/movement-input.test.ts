import { describe, expect, it } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Viewport } from "@babylonjs/core/Maths/math.viewport";
import {
  cameraRelativeDirection,
  createMovementInput,
  movementKey,
} from "../src/game/movementInput";
import { directions, mazeCommand, move, type Maze } from "../src/game/maze";

describe("screen-relative movement", () => {
  it.each([
    -Math.PI / 2.8,
    -Math.PI / 2,
    0,
    Math.PI / 2,
    Math.PI,
    (5 * Math.PI) / 4,
  ])(
    "maps up and right to their projected screen axes at camera alpha %s",
    (alpha) => {
      const engine = new NullEngine();
      const scene = new Scene(engine);
      const camera = new ArcRotateCamera(
        "test",
        alpha,
        0.76,
        21,
        Vector3.Zero(),
        scene,
      );
      camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
      camera.orthoLeft = -12;
      camera.orthoRight = 12;
      camera.orthoTop = 9;
      camera.orthoBottom = -9;
      const transform = camera
        .getViewMatrix()
        .multiply(camera.getProjectionMatrix());
      const viewport = new Viewport(0, 0, 800, 600);
      const project = (x: number, z: number) =>
        Vector3.Project(
          new Vector3(x, 0, z),
          Matrix.Identity(),
          transform,
          viewport,
        );
      const origin = project(0, 0);
      const up = cameraRelativeDirection("north", alpha);
      const right = cameraRelativeDirection("east", alpha);
      const [ux, uz] = directions[up],
        [rx, rz] = directions[right];
      expect(project(ux, uz).y).toBeLessThan(origin.y);
      expect(project(rx, rz).x).toBeGreaterThan(origin.x);
      expect(ux * rx + uz * rz).toBeCloseTo(0);
      expect(cameraRelativeDirection("south", alpha)).not.toBe(up);
      expect(cameraRelativeDirection("west", alpha)).not.toBe(right);
      scene.dispose();
      engine.dispose();
    },
  );

  it("keeps screen right perpendicular after up, without changing Python cardinal moves", () => {
    const maze: Maze = {
      seed: 1,
      size: 5,
      grid: Array.from({ length: 5 }, () => Array(5).fill(0)),
      start: [2, 2],
      goal: [4, 4],
      position: [2, 2],
      steps: 0,
      commands: 0,
    };
    const alpha = -Math.PI / 2;
    const up = move(maze, cameraRelativeDirection("north", alpha));
    const right = move(up, cameraRelativeDirection("east", alpha));
    expect(up.position).toEqual([2, 3]);
    expect(right.position).toEqual([3, 3]);
    expect(mazeCommand(maze, "move", ["north"]).maze.position).toEqual([2, 1]);
  });
});

describe("held movement keys", () => {
  it("supports uppercase WASD and arrow keys", () => {
    expect(movementKey("W")).toBe("north");
    expect(movementKey("D")).toBe("east");
    expect(movementKey("ArrowDown")).toBe("south");
    expect(movementKey("ArrowLeft")).toBe("west");
    expect(movementKey("Enter")).toBeUndefined();
  });

  it("turns immediately when right is pressed while up remains held", () => {
    const held = createMovementInput();
    expect(held.press("w", 0)).toBe("north");
    expect(held.tick(169)).toBeUndefined();
    expect(held.tick(170)).toBe("north");
    expect(held.press("ArrowRight", 180)).toBe("east");
    // The OS may continue repeating the old key; it must not steal direction.
    expect(held.press("w", 181)).toBeUndefined();
    expect(held.tick(349)).toBeUndefined();
    expect(held.tick(350)).toBe("east");
    held.release("ArrowRight", 360);
    expect(held.tick(485)).toBe("north");
    held.release("w", 490);
    expect(held.tick(1000)).toBeUndefined();
  });

  it("clears held keys on interruption and never catches up a backlog", () => {
    const held = createMovementInput();
    held.press("a", 0);
    expect(held.tick(5000)).toBe("west");
    expect(held.tick(5000)).toBeUndefined();
    held.clear();
    expect(held.tick(6000)).toBeUndefined();
    expect(held.press("A", 6001)).toBe("west");
  });
});
