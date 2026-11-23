import { execFileSync } from "node:child_process";
import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = execFileSync(
  "git",
  [
    "ls-files",
    "-z",
    "--",
    "content/",
    "public/",
    "sounds/",
    "src/",
    "scripts/compile-content.ts",
    "scripts/sync-runtime.mjs",
    "index.html",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "run-dev.bat",
    "RUN-GAME.txt",
  ],
  { cwd: root },
);
const staging = mkdtempSync(join(root, ".export-"));
const archive = join(staging, "BOTAKRPG.zip");
try {
  execFileSync(
    process.platform === "linux" ? "bsdtar" : "tar",
    ["-a", "-cf", archive, "--null", "-T", "-"],
    { cwd: root, input: files, stdio: ["pipe", "inherit", "inherit"] },
  );
  renameSync(archive, join(root, "BOTAKRPG.zip"));
  console.log("Created BOTAKRPG.zip");
} finally {
  rmSync(staging, { force: true, recursive: true });
}
