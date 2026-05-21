import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dir, "../..");

/** v6 已移除的 /traveltrust 锚点（勿在 app/components 复活） */
const FORBIDDEN_TRAVELTRUST_HREFS = [
  "/traveltrust#token-system",
  "/traveltrust#allocation",
  'href="#token-system"',
  'href="#allocation"',
] as const;

function listTsxTsFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "archive" || name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) listTsxTsFiles(path, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(path);
  }
  return acc;
}

describe("traveltrust v6 cross-links (contract)", () => {
  it("active app/components have no legacy dead /traveltrust anchors", () => {
    const files = [
      ...listTsxTsFiles(join(frontendRoot, "app")),
      ...listTsxTsFiles(join(frontendRoot, "components")),
    ];
    const hits: string[] = [];
    const selfPath = fileURLToPath(import.meta.url);
    for (const file of files) {
      if (file === selfPath) continue;
      const text = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN_TRAVELTRUST_HREFS) {
        if (text.includes(forbidden)) hits.push(`${file}: ${forbidden}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
