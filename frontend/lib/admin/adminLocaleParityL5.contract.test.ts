import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

function extractAdminLocaleKeys(src: string): string[] {
  const keys: string[] = [];
  const re = /^\s*(admin_[a-z0-9_]+):/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) keys.push(m[1]!);
  return keys;
}

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkTs(p));
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/** ① · ADM-P1-08：全局 admin_* zh/en parity + 禁中文 ?? fallback。 */
describe("admin locale parity L5 (①)", () => {
  const zh = readFileSync(join(fe, "locales", "zh.ts"), "utf8");
  const en = readFileSync(join(fe, "locales", "en.ts"), "utf8");
  const zhKeys = new Set(extractAdminLocaleKeys(zh));
  const enKeys = new Set(extractAdminLocaleKeys(en));

  it("every admin_* key in zh exists in en", () => {
    const missing = [...zhKeys].filter((k) => !enKeys.has(k));
    expect(missing, `missing en: ${missing.slice(0, 20).join(", ")}`).toEqual([]);
  });

  it("every admin_* key in en exists in zh", () => {
    const missing = [...enKeys].filter((k) => !zhKeys.has(k));
    expect(missing, `missing zh: ${missing.slice(0, 20).join(", ")}`).toEqual([]);
  });

  it("app/admin + components/admin avoid Chinese ?? string fallbacks", () => {
    const offenders: string[] = [];
    for (const file of [...walkTs(join(fe, "app", "admin")), ...walkTs(join(fe, "components", "admin"))]) {
      const src = readFileSync(file, "utf8");
      if (/\?\?\s*["'`][\u4e00-\u9fff]/.test(src)) offenders.push(file.replace(/\\/g, "/").split("frontend/").pop() ?? file);
    }
    expect(offenders).toEqual([]);
  });
});
