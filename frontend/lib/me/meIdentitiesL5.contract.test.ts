import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ME_IDENTITIES_L5_VISUAL_DATA_ATTR, TT_ME_IDENTITIES_L5 } from "./meIdentitiesL5";

describe("meIdentitiesL5 tokens", () => {
  it("uses auth L5 glass surfaces and warm title gradient", () => {
    expect(TT_ME_IDENTITIES_L5.identityCard).toContain("auth-l5-glass-surface");
    expect(TT_ME_IDENTITIES_L5.identityCard).toContain("auth-l5-glass-vignette");
    expect(TT_ME_IDENTITIES_L5.title).toContain("text-h1");
    expect(TT_ME_IDENTITIES_L5.title).toContain("bg-clip-text");
  });

  it("page wires backdrop + visual attr (contract via page.tsx source)", () => {
    const src = readFileSync(join(process.cwd(), "app/me/identities/page.tsx"), "utf8");
    expect(src).toContain("AuthL5PageBackdrop");
    expect(src).toContain("meIdentitiesL5MainDataAttrs");
    expect(src).toContain("TT_ME_IDENTITIES_L5");
    expect(src).toContain("MeIdentitiesRouteLoading");
  });
});
