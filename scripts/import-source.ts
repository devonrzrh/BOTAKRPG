import { readFile, readdir, mkdir, writeFile, cp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { stringify } from "yaml";

// Explicit refresh only. Builds consume the committed Markdown snapshot.
const root = "Source";
const groupSpecs = [
  ["Algorithm", "algorithms", "alg"],
  ["Data-Structures", "structures", "ds"],
  ["Connectionist-AI", "ai", "ai"],
] as const;
const folderKey = (name: string) =>
  name
    .replace(/^\d+[_ -]+/, "")
    .toLowerCase()
    .replace("connetionist", "connectionist");
const subjectFolders = (
  await readdir(`${root}/Content/Markdown`, { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const groups = groupSpecs.map(([subject, topic, prefix]) => {
  const matches = subjectFolders.filter(
    (folder) => folderKey(folder) === folderKey(subject),
  );
  if (matches.length !== 1)
    throw new Error(
      `Source/Content/Markdown: expected one folder for ${subject}, found ${matches.length}. Check numbered subject folder names.`,
    );
  return [matches[0], topic, prefix] as const;
});
const sourcePath = (file: string) =>
  file.replace(
    /^(Content\/Markdown\/)([^/]+)(\/)/,
    (original, base, folder, slash) => {
      const match = groups.find(
        ([candidate]) => folderKey(candidate) === folderKey(folder),
      );
      return match ? `${base}${match[0]}${slash}` : original;
    },
  );
const previousManifest = JSON.parse(
  await readFile("content/source-manifest.json", "utf8"),
) as { files: { path: string }[] };
export const sourceId = (prefix: string, file: string) =>
  `source-${prefix}-${file.match(/^\d+/)![0]}`;
await mkdir("content/source", { recursive: true });
await mkdir("public/materials", { recursive: true });
await cp(root, "public/materials", { recursive: true });
const lookup = new Map<string, string>();
const chapters: { id: string; title: string; topic: string; file: string }[] =
  [];
for (const [folder, topic, prefix] of groups) {
  const directory = `Content/Markdown/${folder}`;
  for (const file of (await readdir(`${root}/${directory}`))
    .filter((f) => /^\d+.*\.md$/.test(f))
    .sort()) {
    const body = await readFile(`${root}/${directory}/${file}`, "utf8");
    const id = sourceId(prefix, file);
    const title =
      body.match(/^#\s+(.+)$/m)?.[1].replace(/^Chapter\s+\d+:\s*/i, "") ??
      file.slice(3, -3);
    lookup.set(`${directory}/${file}`, id);
    chapters.push({ id, title, topic, file: `${directory}/${file}` });
  }
}
function rewriteLinks(body: string, origin: string) {
  return body.replace(
    /(!?\[[^\]]*\]\()([^\s)]+)(\))/g,
    (_, before, href, after) => {
      if (/^(https?:|#|mailto:)/.test(href)) return before + href + after;
      const resolved = sourcePath(
        path.posix.normalize(
          path.posix.join(
            path.posix.dirname(origin),
            decodeURIComponent(href.split("#")[0]),
          ),
        ),
      );
      return (
        before +
        (lookup.has(resolved)
          ? `#lesson=${lookup.get(resolved)}`
          : `/materials/${encodeURI(resolved)}`) +
        after
      );
    },
  );
}
for (const chapter of chapters) {
  let body = rewriteLinks(
    await readFile(`${root}/${chapter.file}`, "utf8"),
    chapter.file,
  );
  // Correct concrete errors called out by the supplied reviews in the game edition.
  // The downloadable originals stay byte-for-byte intact.
  if (chapter.id === "source-alg-02")
    body = body.replace("Random order | 10 | 5", "Random order | 9 | 4");
  if (chapter.id === "source-alg-03")
    body = body.replace("mid = [left+ right / 2]", "mid = (left + right) // 2");
  if (chapter.id === "source-ds-01")
    body = body.replace(
      "Data Versioning (planned; a dedicated lesson is still needed).",
      "[Data Versioning](#lesson=source-ds-10).",
    );
  if (chapter.id === "source-ai-06")
    body = body.replace(
      '(A forecast of "between 0 and infinity" is perfectly calibrated and useless.)',
      "For a nonnegative target, an interval from zero to infinity has 100% coverage. It is not a calibrated 80% or 90% interval and is uninformative.",
    );
  if (chapter.id === "source-ai-09")
    body = body.replace(
      "Updates the policy but **clips** how far it can change per step, which keeps training stable.",
      "PPO clips its surrogate objective to discourage excessively large policy updates. This does not impose a strict bound on policy change.",
    );
  const notes: Record<string, string> = {
    "source-ds-03":
      "Python lists are dynamic arrays of object references, not fixed-size typed arrays. The diagrams describe the abstract contiguous-index model; insertion may shift references and resizing may allocate a new backing array.",
    "source-ai-02":
      "A positive weight raises the preactivation when its input increases, holding other inputs fixed. The sign of the contribution w × x also depends on the input's sign.",
    "source-ai-04":
      "ReLU is not differentiable at zero. Using a derivative of zero there is a common implementation convention, not a unique mathematical derivative.",
    "source-ai-05":
      "A target stock level is not an order quantity. An order must also account for inventory on hand, outstanding orders and backorders.",
    "source-ai-10":
      "The PyTorch loop below requires an external Python environment with PyTorch installed. Its inputs have shape [batch, 10] and targets [batch, 1]. Provide train_loader and val_loader before running it. For validation with unequal batch sizes, accumulate batch mean loss multiplied by batch size, then divide by the total number of examples; averaging batch means equally overweights a smaller final batch.",
  };
  if (notes[chapter.id])
    body += `\n\n## Reading note\n\n${notes[chapter.id]}\n`;
  const sameTopic = chapters.filter((c) => c.topic === chapter.topic);
  const index = sameTopic.findIndex((c) => c.id === chapter.id);
  const meta = {
    type: "lesson",
    id: chapter.id,
    title: chapter.title,
    topic: chapter.topic,
    summary: `Chapter ${index + 1} · ${chapter.title}`,
    prerequisites: index ? [sameTopic[index - 1].id] : [],
    source: `Source/${chapter.file}`,
  };
  await writeFile(
    `content/source/${chapter.id}.md`,
    `---\n${stringify(meta)}---\n\n${body.trim()}\n`,
  );
}
let outline = await readFile(
  `${root}/Content/Markdown/Module Outline.md`,
  "utf8",
);
outline = rewriteLinks(outline, "Content/Markdown/Module Outline.md");
const supporting: string[] = [];
for (const [folder] of groups)
  for (const file of (
    await readdir(`${root}/Content/Markdown/${folder}`)
  ).filter((f) => !/^\d/.test(f))) {
    supporting.push(
      `### ${folder}: ${file.replace(/\.md$/, "")}\n\n${rewriteLinks(await readFile(`${root}/Content/Markdown/${folder}/${file}`, "utf8"), `Content/Markdown/${folder}/${file}`)}`,
    );
  }
const supplementary: string[] = [];
for (const directory of [
  "Content/Videos",
  "Content/PPT Slides",
  "Content/Test Bank",
]) {
  for (const entry of (
    await readdir(`${root}/${directory}`, { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile()) continue;
    const file = `${directory}/${entry.name}`;
    if (!(await readFile(`${root}/${file}`)).length) continue;
    supplementary.push(
      `- [${entry.name.replace(/\.[^.]+$/, "")}](/materials/${encodeURI(file)})`,
    );
  }
}
await writeFile(
  "content/source/guide.md",
  `---\n${stringify({ type: "lesson", id: "source-guide", title: "Module guide and review notes", topic: "algorithms", summary: "Curriculum map, source reviews and original resources", source: "Source/Content/Markdown/Module Outline.md" })}---\n\n${outline}\n\n## Reading and running examples\n\nStart with the Python chapter. Maze scripts run in the game's Python worker using its maze API. General examples may use normal Python; PyTorch examples need a separate Python environment with PyTorch installed. The maze worker does not provide PyTorch or arbitrary application data.\n\n[Full test bank](#lesson=source-test-bank)\n\n## Source review notes\n\nThe following are the supplied peer reviews. They are retained as review records; their recommendations are not claims that every source issue has been corrected. Original files are preserved unchanged.\n\n${supporting.join("\n\n")}\n\n## Supplementary materials\n\n${supplementary.join("\n")}\n`,
);

const pdf = "BOTAK_Stage2_TestBank_V1_Robot_InstantAnswers.pdf";
const raw = execFileSync(
  "pdftotext",
  ["-raw", "-enc", "UTF-8", `${root}/${pdf}`, "-"],
  { encoding: "utf8" },
);
const clean = raw
  .split("\f")
  .map((page) =>
    page
      .split(/\r?\n/)
      .filter((line) => {
        const s = line.trim();
        return !/^(?:[ABCK★]|\d+|B\.O\.T\.A\.K\..*|TEST BANK V1\.0.*|MISSION MAP|MISSION PROGRESS|ANSWER KEY|PART [ABC] ·.*|‹ BACK|KEY ›|SHOW|SHOW MODEL ANSWER|NEXT PAGE >>|▌ .*|More questions on the next page\.|You've got this!|Botak-Bot believes in you!|Systems check: all green!)$/.test(
          s,
        );
      })
      .join("\n"),
  )
  .join("\n");
const firstKey = clean.indexOf("A1 TRUE ");
if (firstKey < 0) throw new Error("PDF: missing answer key");
const questionText = clean.slice(0, firstKey);
const keyText = clean.slice(firstKey);
const missionLesson: Record<number, string> = {
  1: "source-alg-01",
  2: "source-alg-02",
  3: "source-alg-03",
  4: "source-alg-06",
  5: "source-ds-03",
  6: "source-ds-05",
  7: "source-ds-08",
  8: "source-ai-02",
  9: "source-ai-04",
  10: "source-ai-05",
  11: "source-ai-07",
  12: "source-ai-09",
};
const questions = [];
const study = [];
for (const part of ["A", "B", "C"]) {
  const count = part === "A" ? 40 : part === "B" ? 42 : 13;
  for (let n = 1; n <= count; n++) {
    const code = `${part}${n}`;
    const match = questionText.match(
      new RegExp(
        `(?:^|\\n)${code}\\n((?:M\\d+\\n)+)([\\s\\S]*?)(?=TRUE FALSE|Pick an option|WORD COUNTER|SELECT ALL THAT APPLY)`,
      ),
    );
    if (!match) throw new Error(`PDF: cannot extract ${code}`);
    const mission = Number(match[1].match(/M(\d+)/)![1]);
    let text = match[2].trim().replace(/\n+/g, " ");
    let answer: number[] = [],
      explanation = "",
      options: string[] = [];
    if (part !== "C") {
      const key = keyText.match(
        new RegExp(
          `(?:^|\\n)${code} (${part === "A" ? "TRUE|FALSE" : "[A-D](?:, [A-D])*"}) ([\\s\\S]*?)(?=\\n[ABC]\\d+(?: |\\n)|$)`,
        ),
      );
      if (!key) throw new Error(`PDF: cannot extract key ${code}`);
      explanation = key[2]
        .split("▶ PART")[0]
        .replace(/‹ BACK/g, "")
        .trim()
        .replace(/\n+/g, " ");
      if (part === "A") {
        options = ["True", "False"];
        answer = [key[1] === "TRUE" ? 0 : 1];
      } else {
        const original = match[2].trim();
        const optionStart = [...original.matchAll(/^A /gm)].at(-1)?.index ?? -1;
        if (optionStart < 0) throw new Error(`PDF: missing options ${code}`);
        const optionText = original
          .slice(optionStart)
          .trim()
          .replace(/\n+/g, " ");
        text = original.slice(0, optionStart).trim().replace(/\n+/g, " ");
        const parts = optionText.match(/^A (.*?) B (.*?) C (.*?) D (.*)$/);
        if (!parts)
          throw new Error(`PDF: ambiguous options ${code}: ${optionText}`);
        options = parts!.slice(1);
        // A vertex named D is text, not the fourth option label.
        if (code === "B12")
          options = [
            "A, B, D, E, C, F",
            "A, B, C, D, E, F",
            "A, C, F, B, E, D",
            "D, E, B, F, C, A",
          ];
        answer = key[1].split(", ").map((c) => c.charCodeAt(0) - 65);
      }
      if (code === "B13")
        text = text.replace(
          "Using the same tree",
          "A tree has root A; A's children are B and C; B's children are D and E; C's child is F. Using this tree",
        );
      const overrides: Record<string, string> = {
        A22: "source-alg-04",
        A23: "source-ds-06",
        A25: "source-ds-09",
        A32: "source-ai-03",
        A34: "source-ai-06",
        A37: "source-ai-08",
        A40: "source-ai-10",
        B23: "source-ds-06",
        B24: "source-ds-09",
        B27: "source-ds-09",
        B30: "source-ai-10",
        B33: "source-ai-03",
        B35: "source-ai-06",
        B36: "source-ai-06",
        B38: "source-ai-08",
        B39: "source-ai-08",
        B42: "source-ai-10",
      };
      questions.push({
        type: "question",
        id: `bank-${code.toLowerCase()}`,
        title: `Test bank ${code}`,
        lesson: overrides[code] ?? missionLesson[mission],
        format: answer.length > 1 ? "multiple" : "choice",
        prompt: text,
        options,
        answer,
        explanation,
      });
    } else {
      const key = keyText.match(
        new RegExp(
          `(?:^|\\n)${code}\\n(?:M\\d+\\n)+KEY POINTS[^\\n]*\\n([\\s\\S]*?)(?=\\nC\\d+\\n|REVIEW RECORD|$)`,
        ),
      );
      if (!key) throw new Error(`PDF: cannot extract model answer ${code}`);
      explanation = key[1].trim();
    }
    study.push(
      `## ${code}\n\n${text}\n\n${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}\n\n<details><summary>Answer and explanation</summary>\n\n${answer.length ? `**${answer.map((i) => options[i]).join("; ")}**\n\n` : ""}${explanation}\n\n</details>`,
    );
  }
}
await writeFile(
  "content/source/test-bank.md",
  `---\n${stringify({ type: "lesson", id: "source-test-bank", title: "Test bank", topic: "algorithms", summary: "95 questions and explained answers", source: `Source/${pdf}` })}---\n\n[Open the original illustrated test bank](/materials/${pdf})\n\nOpen-ended exercises are self-assessed. Use your book notes to keep your answers.\n\n${study.join("\n\n")}\n\n${questions.map((q) => `\`\`\`question\n${stringify(q)}\`\`\``).join("\n\n")}\n`,
);
const files: {
  path: string;
  sha256: string;
  bytes: number;
  lesson?: string;
}[] = [];
async function inventory(dir: string) {
  for (const file of (
    await readdir(`${root}/${dir}`, { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = dir ? `${dir}/${file.name}` : file.name;
    if (file.isDirectory()) await inventory(relative);
    else {
      const data = await readFile(`${root}/${relative}`);
      files.push({
        path: relative,
        sha256: createHash("sha256").update(data).digest("hex"),
        bytes: data.length,
        lesson: lookup.get(relative),
      });
    }
  }
}
await inventory("");
// Remove only obsolete files owned by the previous archive manifest.
const archiveRoot = path.resolve("public/materials");
const currentPaths = new Set(files.map((file) => file.path));
for (const previous of previousManifest.files.filter(
  (file) => !currentPaths.has(file.path),
)) {
  const target = path.resolve(archiveRoot, previous.path);
  if (!target.startsWith(archiveRoot + path.sep))
    throw new Error(`Unsafe archive path: ${previous.path}`);
  await rm(target, { force: true });
}
for (const file of files.filter(
  (f) => f.path.includes("/Animated/") && f.path.endsWith(".svg"),
)) {
  const stillPath = file.path.replace("/Animated/", "/Static/");
  const original = await readFile(
    `${root}/${files.some((f) => f.path === stillPath) ? stillPath : file.path}`,
    "utf8",
  );
  const still = original
    .replace(
      /<(?:animate|animateTransform|animateMotion|set)\b[^>]*(?:\/>|>[\s\S]*?<\/(?:animate|animateTransform|animateMotion|set)>)/g,
      "",
    )
    .replace(
      "</svg>",
      "<style>* { animation: none !important; transition: none !important; }</style></svg>",
    )
    .replace(/[ \t]+$/gm, "");
  const output = `public/materials-still/${file.path}`;
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, still);
}
await writeFile(
  "content/source-manifest.json",
  JSON.stringify(
    { chapters, questions: questions.length, openEnded: 13, files },
    null,
    2,
  ) + "\n",
);
console.log(
  `Imported ${chapters.length} chapters, ${questions.length} battle questions, 13 written exercises, ${files.length} original files.`,
);
