import { expect, it } from "vitest";
import { graphicsCheckResult } from "../src/game/graphicsCheck";

it("waits for three windows and reduces graphics only for sustained low frame rates", () => {
  expect(graphicsCheckResult([45, 44])).toBeUndefined();
  expect(graphicsCheckResult([16, 80, 17])).toBe("kept");
  expect(graphicsCheckResult([33.3, 33.4, 33.5])).toBe("kept");
  expect(graphicsCheckResult([50, 43, 21])).toBe("reduced");
});
