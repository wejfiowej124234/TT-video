import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

function walkTsFiles(dir: string, root: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "archive") continue;
    const abs = join(dir, name);
    const st = statSync(abs);
    if (st.isDirectory()) {
      walkTsFiles(abs, root, out);
    } else if (/\.(ts|tsx)$/.test(name)) {
      out.push(relative(root, abs).replace(/\\/g, "/"));
    }
  }
  return out;
}

describe("marketingUi import hygiene", () => {
  it("rejects corrupted marketingUi import blocks", () => {
    const root = join(import.meta.dirname, "..");
    const files = walkTsFiles(root, root);
    const violations: string[] = [];

    for (const rel of files) {
      const text = readFileSync(join(root, rel), "utf8");
      const blocks = text.matchAll(/import\s*\{[^}]*\}\s*from\s*["']@\/lib\/marketingUi["']/gs);
      for (const match of blocks) {
        const block = match[0];
        if (/,,\s*TT_MARKETING/.test(block)) {
          violations.push(`${rel}: double comma in marketingUi import`);
        }
        if (/\$\{TT_MARKETING/.test(block)) {
          violations.push(`${rel}: template literal in marketingUi import`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("product paths do not import travelFocusRing* (admin/archive exempt)", () => {
    const root = join(import.meta.dirname, "..");
    const allowTravelFocusRing = new Set([
      "components/market/MarketSubsiteFilterBar.tsx",
      "lib/travelLinkFocus.ts",
      "lib/marketingUi.ts",
    ]);
    const violations: string[] = [];

    for (const rel of walkTsFiles(root, root)) {
      const norm = rel.replace(/\\/g, "/");
      if (norm.includes("/admin/") || norm.startsWith("admin/") || norm.includes("/archive/")) continue;
      if (!/\.(tsx|ts)$/.test(norm) || norm.endsWith(".test.ts")) continue;
      const text = readFileSync(join(root, rel), "utf8");
      if (!/travelFocusRing/.test(text)) continue;
      if (allowTravelFocusRing.has(norm)) continue;
      violations.push(`${rel}: travelFocusRing* remains on product path`);
    }

    expect(violations).toEqual([]);
  });

  it("warm marketing buttons do not stack TT_MARKETING_FOCUS_RING_CONSOLE", () => {
    const root = join(import.meta.dirname, "..");
    const warmToken =
      /TT_MARKETING_(?:ERROR_RETRY_BTN|BTN_SECONDARY_CONSOLE|BTN_PRIMARY_WARM(?:_SUBMIT(?:_BLOCK)?|_PROTOCOL(?:_COMPACT)?|_MARKET_BLOCK)?|BTN_WARM_OUTLINE(?:_COMPACT)?)/;
    const stackPattern = new RegExp(
      String.raw`\$\{(?:${warmToken.source})\}[\s\S]{0,240}?\$\{TT_MARKETING_FOCUS_RING_CONSOLE\}|\$\{TT_MARKETING_FOCUS_RING_CONSOLE\}[\s\S]{0,240}?\$\{(?:${warmToken.source})\}`,
    );
    const violations: string[] = [];

    for (const rel of walkTsFiles(root, root)) {
      const norm = rel.replace(/\\/g, "/");
      if (norm.includes("/admin/") || norm.includes("/archive/") || norm === "lib/marketingUi.ts") continue;
      const text = readFileSync(join(root, rel), "utf8");
      if (stackPattern.test(text)) {
        violations.push(`${rel}: warm button token stacked with TT_MARKETING_FOCUS_RING_CONSOLE`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("product paths do not use legacy travel-* Tailwind color utilities", () => {
    const root = join(import.meta.dirname, "..");
    const allow = new Set([
      "components/Header.tsx",
      "lib/marketingUi.ts",
      "lib/travelLinkFocus.ts",
    ]);
    const pattern = /\b(?:text|bg|border|ring|from|to|via)-travel-\d+/;
    const violations: string[] = [];

    for (const rel of walkTsFiles(root, root)) {
      const norm = rel.replace(/\\/g, "/");
      if (norm.includes("/admin/") || norm.includes("/archive/")) continue;
      if (allow.has(norm)) continue;
      const text = readFileSync(join(root, rel), "utf8");
      if (pattern.test(text)) {
        violations.push(`${rel}: legacy travel-* color utility`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("product paths do not add new btn-console usages (shrink allowlist when migrating)", () => {
    const root = join(import.meta.dirname, "..");
    /** 仅保留 CSS 遗留与注释；产品 TS/TSX 不得再引用 `btn-console` */
    const allowBtnConsole = new Set(["app/globals.css", "lib/marketingUi.ts", "lib/travelLinkFocus.ts"]);
    const violations: string[] = [];

    for (const rel of walkTsFiles(root, root)) {
      const norm = rel.replace(/\\/g, "/");
      if (norm.includes("/archive/") || norm.endsWith(".test.ts")) continue;
      const text = readFileSync(join(root, rel), "utf8");
      if (!/\bbtn-console\b/.test(text)) continue;
      if (allowBtnConsole.has(norm)) continue;
      violations.push(`${rel}: btn-console — use @/lib/uiSystem tokens instead`);
    }

    expect(violations).toEqual([]);
  });
});
