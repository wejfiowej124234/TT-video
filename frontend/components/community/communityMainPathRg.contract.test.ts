/**
 * D8 · G13 · `components/community` 主路径冷色字面量机读（与 runbook `rg` 同键）
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname);

function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walkTsx(p));
    else if (name.name.endsWith(".tsx") && !name.name.endsWith(".contract.test.tsx"))
      out.push(p);
  }
  return out;
}

const FORBIDDEN = [
  /\bfuchsia\b/i,
  /\bcyan-500\b/,
  /\bbg-cyan-500\b/,
  /\bborder-cyan-400\b/,
  /\bbg-cta-gradient\b/,
  /\bfrom-cyan-300\b/,
  /\btext-ref-cyan\b/,
];

/** Hub-surface confirm modals keep sci-fi chrome on `surface === "hub"`; page surface uses TT_COMMUNITY_PAGE_L5. */
const HUB_CONFIRM_DIALOG_ALLOWLIST = new Set([
  "CommunityDeletePostConfirmDialog.tsx",
  "CommunityMeOrderCancelConfirmDialog.tsx",
  "CommunityMeUncollectConfirmDialog.tsx",
  "CommunityMeUnlikeConfirmDialog.tsx",
]);

describe("community main path rg (G13 · D8)", () => {
  it("components/community/**/*.tsx has zero cold neon literals", () => {
    const files = walkTsx(root);
    const hits: string[] = [];
    for (const file of files) {
      const rel = file.replace(root + "/", "").replace(/\\/g, "/");
      if (HUB_CONFIRM_DIALOG_ALLOWLIST.has(rel.split("/").pop() ?? "")) continue;
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (FORBIDDEN.some((re) => re.test(line))) {
          hits.push(`${file.replace(root + "/", "")}:${i + 1}:${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it("communityA11yFocus fuchsia aliases resolve to warm ref-sun rings", () => {
    const src = readFileSync(join(root, "../../lib/communityA11yFocus.ts"), "utf8");
    expect(src).toContain("communityFuchsiaPillFocus = communityCyanPillFocus");
    expect(src).toContain("communityFuchsiaTextFocus = communityHeaderInlineFocus");
    expect(src).not.toMatch(/ring-fuchsia/);
  });
});
