import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const staging = mkdtempSync(join(root, ".export-"));
const archive = join(staging, "BOTAKRPG.zip");
try {
  execFileSync(
    process.platform === "linux" ? "bsdtar" : "tar",
    [
      "-a",
      "-cf",
      archive,
      "-C",
      root,
      "dist",
      "RUN-GAME.txt",
      "-C",
      join(root, "scripts"),
      "export-preview.config.mjs",
    ],
    { stdio: "inherit" },
  );
  renameSync(archive, join(root, "BOTAKRPG.zip"));
  console.log("Created BOTAKRPG.zip");
} finally {
  rmSync(staging, { force: true, recursive: true });
}
