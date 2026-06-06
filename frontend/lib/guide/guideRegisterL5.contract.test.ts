import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE = readFileSync(join(process.cwd(), "app/guide/register/GuideRegisterPageMain.tsx"), "utf8");
const TOKENS = readFileSync(join(process.cwd(), "lib/guide/guideRegisterL5.ts"), "utf8");

describe("guideRegister L5 shell (①)", () => {
  it("uses Auth L5 backdrop and glass card", () => {
    expect(PAGE).toContain("AuthL5PageBackdrop");
    expect(PAGE).toContain("AuthL5Card");
    expect(PAGE).toContain("AuthL5CrossNavFooter");
    expect(PAGE).toContain("guideRegisterL5MainDataAttrs");
    expect(TOKENS).toContain('data-tt-auth-visual');
    expect(TOKENS).toContain("data-tt-guide-register-ui-frozen");
  });

  it("forbids console product shell regressions", () => {
    expect(PAGE).not.toContain("ProductCrossNav");
    expect(PAGE).not.toContain("TT_MARKETING_PRODUCT_PAGE_SHELL");
    expect(PAGE).not.toContain("TrustInfraWall");
  });
});
