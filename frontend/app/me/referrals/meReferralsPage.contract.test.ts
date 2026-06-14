import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { routes } from "@/lib/api/routes";

const feRoot = join(__dirname, "../../..");

function readFe(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

describe("G-S4 me referrals contract", () => {
  it("routes expose me referrals read API", () => {
    expect(routes.meReferrals).toBe("/api/v1/me/referrals");
  });

  it("unauthenticated login CTA shell (UX-P1-04)", () => {
    const main = readFe("app/me/referrals/MeReferralsPageMain.tsx");
    const hook = readFe("app/me/referrals/useMeReferralsPage.ts");
    expect(main).toContain("data-tt-me-referrals-auth-required");
    expect(main).toContain("data-tt-me-referrals-login-cta");
    expect(main).toContain("/auth/login?from=/me/referrals");
    expect(hook).toContain("needsLogin");
  });
});
