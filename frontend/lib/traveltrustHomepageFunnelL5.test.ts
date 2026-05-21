import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_ROLES } from "@/app/traveltrust/traveltrustIdentityModel";
import {
  HOMEPAGE_FUNNEL_LANDINGS,
  TRAVELTRUST_FOOTER_PRODUCT_ROUTES,
  TRAVELTRUST_FOOTER_TRUST_ROUTES,
  TRAVELTRUST_HOMEPAGE_FUNNEL_L5_ID,
  TRAVELTRUST_PAGE_BRIEF_CTA_DEFAULTS,
  TRAVELTRUST_PLAN_TRIP_HREF_V6,
  TRAVELTRUST_ROLE_ENTER_ROUTES,
  TRAVELTRUST_TRUST_FUNNEL_ROUTES,
  TRAVELTRUST_WAVE1_PLAN_TRIP_TARGET,
} from "@/lib/traveltrustHomepageFunnelL5";

const APP_ROOT = join(process.cwd(), "app");

function appPageExists(routePath: string): boolean {
  const segments = routePath.split("/").filter(Boolean);
  const pageFile = join(APP_ROOT, ...segments, "page.tsx");
  if (existsSync(pageFile)) return true;
  const pageTsx = join(APP_ROOT, ...segments, "page.ts");
  return existsSync(pageTsx);
}

describe("traveltrustHomepageFunnelL5 · wave 0", () => {
  it("registers funnel L5 id and ① plan href", () => {
    expect(TRAVELTRUST_HOMEPAGE_FUNNEL_L5_ID).toBe("TT-HOMEPAGE-FUNNEL-L5-WAVE0-2026-05");
    expect(TRAVELTRUST_PLAN_TRIP_HREF_V6).toBe("#start");
    expect(TRAVELTRUST_WAVE1_PLAN_TRIP_TARGET).toBe("/guides");
  });

  it("page-brief defaults align with TT-PH1-170", () => {
    expect(TRAVELTRUST_PAGE_BRIEF_CTA_DEFAULTS.primary).toBe("#start");
    expect(TRAVELTRUST_PAGE_BRIEF_CTA_DEFAULTS.secondary).toBe("/governance");
  });

  it("role enter routes match traveltrustIdentityModel", () => {
    for (const role of TRAVELTRUST_ROLES) {
      expect(TRAVELTRUST_ROLE_ENTER_ROUTES[role.id]).toBe(role.href);
    }
    expect(TRAVELTRUST_ROLE_ENTER_ROUTES.traveler).toBe("#start");
    expect(TRAVELTRUST_ROLE_ENTER_ROUTES.guide).toBe("/guide");
  });

  it("trust funnel routes resolve to app pages", () => {
    const check = [
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.help,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.trust,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.governance,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.governanceParams,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.pay,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.feeRoutes,
      TRAVELTRUST_TRUST_FUNNEL_ROUTES.disputes,
    ];
    for (const path of check) {
      expect(appPageExists(path), `missing page for ${path}`).toBe(true);
    }
  });

  it("footer routes resolve to app pages", () => {
    for (const path of [...TRAVELTRUST_FOOTER_PRODUCT_ROUTES, ...TRAVELTRUST_FOOTER_TRUST_ROUTES]) {
      if (path === "/" || path.startsWith("/#")) continue;
      expect(appPageExists(path), `missing page for ${path}`).toBe(true);
    }
  });

  it("homepage funnel landings include wave1 guides target", () => {
    const paths = HOMEPAGE_FUNNEL_LANDINGS.map((l) => l.path);
    expect(paths).toContain("/guides");
    expect(paths).toContain("/guide");
    expect(paths).toContain("/market/provider");
  });
});
