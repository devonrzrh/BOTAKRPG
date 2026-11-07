import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { parse } from "yaml";
import {
  entitySchema,
  validateContent,
  type Entity,
} from "../src/content/schema";
export function parseMarkdown(source: string, filename = "content"): Entity[] {
  const entities: Entity[] = [];
  let body = source;
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (frontmatter) body = source.slice(frontmatter[0].length);
  body = body.replace(
    /```(question|entity)\s*\r?\n([\s\S]*?)```/g,
    (_, kind, data) => {
      try {
        entities.push({
          ...(kind === "question" ? { type: "question" } : {}),
          ...parse(data),
        });
      } catch (error) {
        throw new Error(`${filename}: ${String(error)}`);
      }
      return "";
    },
  );
  if (frontmatter)
    entities.unshift({ ...parse(frontmatter[1]), body: body.trim() });
  return entities.map((entity) => {
    const result = entitySchema.safeParse(entity);
    if (!result.success)
      throw new Error(
        `${filename}: record '${entity.id ?? "unknown"}': ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
      );
    return result.data;
  });
}
export async function compile() {
  const entities: Entity[] = [];
  async function markdownFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = `${directory}/${entry.name}`;
      if (entry.isDirectory()) files.push(...(await markdownFiles(name)));
      else if (name.endsWith(".md")) files.push(name);
    }
    return files;
  }
  for (const file of await markdownFiles("content")) {
    try {
      entities.push(...parseMarkdown(await readFile(file, "utf8"), file));
    } catch (error) {
      throw new Error(`content/${file}: ${String(error)}`);
    }
  }
  const content = validateContent({ version: 1, entities });
  await mkdir("src/generated", { recursive: true });
  await writeFile(
    "src/generated/content.json",
    JSON.stringify(content, null, 2) + "\n",
  );
  console.log(`Validated ${entities.length} content records.`);
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/compile-content.ts"))
  await compile();
