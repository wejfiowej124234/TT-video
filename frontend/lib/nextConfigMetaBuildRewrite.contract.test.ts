import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("next.config meta/build rewrites (PP-D-001)", () => {
  it("proxies /api/meta/build to API /meta/build", () => {
    const cfg = readFileSync(join(process.cwd(), "next.config.js"), "utf8");
    expect(cfg).toContain('source: "/meta/build"');
    expect(cfg).toContain('source: "/api/meta/build"');
    expect(cfg).toMatch(/source:\s*"\/api\/meta\/build"[\s\S]*destination:\s*`\$\{dest\}\/meta\/build`/);
  });

  it("MED-01 allows Tigris + cdn.traveltrust.app remotePatterns", () => {
    const cfg = readFileSync(join(process.cwd(), "next.config.js"), "utf8");
    expect(cfg).toContain("traveltrust-community-media.fly.storage.tigris.dev");
    expect(cfg).toContain("cdn.traveltrust.app");
  });
});
