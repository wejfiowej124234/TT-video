import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  ADMIN_CONVERGENCE_FROZEN_HREF_PREFIXES,
  isAdminHrefVisibleInConvergence,
  isComplexityConvergenceFreezeActive,
  isExpansionIdentitySurfaceVisible,
  isGovernancePathVisibleInConvergence,
} from "./complexityConvergenceSurface";

describe("complexityConvergenceSurface", () => {
  const prev = process.env.NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE;
    else process.env.NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE = prev;
  });

  it("freeze off by default in vitest", () => {
    delete process.env.NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE;
    expect(isComplexityConvergenceFreezeActive()).toBe(false);
    expect(isExpansionIdentitySurfaceVisible("merchant")).toBe(true);
  });

  it("freeze on hides expansion surfaces and non-P0 admin paths", () => {
    process.env.NEXT_PUBLIC_COMPLEXITY_CONVERGENCE_FREEZE = "1";
    expect(isComplexityConvergenceFreezeActive()).toBe(true);
    expect(isExpansionIdentitySurfaceVisible("acquisition")).toBe(false);
    expect(isAdminHrefVisibleInConvergence("/admin/orders")).toBe(true);
    expect(isAdminHrefVisibleInConvergence("/admin/growth")).toBe(false);
    expect(isAdminHrefVisibleInConvergence("/admin/content/pois")).toBe(false);
    expect(isGovernancePathVisibleInConvergence("/governance/proposals")).toBe(true);
    expect(isGovernancePathVisibleInConvergence("/governance/delegate")).toBe(false);
  });

  it("frozen admin prefixes are stable", () => {
    expect(ADMIN_CONVERGENCE_FROZEN_HREF_PREFIXES.length).toBeGreaterThan(5);
  });
});
