import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { TT_MARKETING_AUTH_PAGE_SHELL } from "@/lib/marketingUi";

const AUTH_DIR = join(process.cwd(), "app", "auth");
const HELP_PAGE = join(process.cwd(), "app", "help", "page.tsx");
const LOGIN_PAGE = join(process.cwd(), "app", "auth", "login", "page.tsx");

function readAuthSources(): string {
  const parts: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".tsx") || name.endsWith(".ts")) parts.push(readFileSync(p, "utf8"));
    }
  };
  walk(AUTH_DIR);
  return parts.join("\n");
}

describe("auth/help console bridge theme (TT-PH1-217 · ①)", () => {
  it("auth routes avoid marketDark cyan chrome (88 console stack)", () => {
    const src = readAuthSources();
    expect(src).not.toMatch(/ref-cyan|border-cyan-|bg-cyan-|from-ref-teal|via-ref-cyan/);
    expect(src).toMatch(/text-travel-500|bg-travel-500|TT_AUTH_LOGIN_L5|ref-sun/);
  });

  it("help page uses console surface + travel links", () => {
    const src = readFileSync(HELP_PAGE, "utf8");
    expect(src).toContain("bg-bg-console");
    expect(src).toMatch(/text-travel-500/);
    expect(src).not.toMatch(/ref-cyan|border-cyan-/);
  });

  it("login uses L5 warm primary CTA (not legacy travel-500 flat pill)", () => {
    const src = readFileSync(LOGIN_PAGE, "utf8");
    expect(src).toContain("TT_AUTH_LOGIN_L5");
    expect(src).toContain("primaryCta");
    expect(src).not.toContain("bg-travel-500");
  });

  it("marketingUi exports auth page shell token", () => {
    expect(TT_MARKETING_AUTH_PAGE_SHELL).toContain("bg-bg-main");
  });
});
