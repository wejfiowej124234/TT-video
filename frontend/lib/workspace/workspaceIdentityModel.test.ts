import { describe, expect, it } from "vitest";
import {
  ACQUISITION_WORKSPACE_HREF,
  MERCHANT_STUDIO_HREF,
  MERCHANT_WORKSPACE_HREF,
  STEWARD_WORKSPACE_HREF,
  workspaceActiveHref,
  WORKSPACE_SPRINT_MARKER,
} from "./workspaceIdentityModel";
import {
  filterOrdersForWorkspaceIdentity,
  workspaceOrdersInProgressHref,
} from "./workspaceOrderBus";
import type { OrderListItem } from "@/lib/apiClient";

describe("workspaceIdentityModel", () => {
  it("merchant and acquisition active hrefs are operator workbenches", () => {
    expect(workspaceActiveHref("merchant")).toBe(MERCHANT_WORKSPACE_HREF);
    expect(MERCHANT_STUDIO_HREF).toContain("studio=1");
    expect(workspaceActiveHref("acquisition")).toBe(ACQUISITION_WORKSPACE_HREF);
    expect(workspaceActiveHref("region_steward")).toBe(STEWARD_WORKSPACE_HREF);
    expect(WORKSPACE_SPRINT_MARKER).toBe("multi-identity-workspace-sprint-v1");
  });
});

describe("workspaceOrderBus", () => {
  it("filters merchant_service orders", () => {
    const items = [
      { id: "a", business_line: "merchant_service" },
      { id: "b", business_line: "trip" },
    ] as OrderListItem[];
    expect(filterOrdersForWorkspaceIdentity(items, "merchant")).toHaveLength(1);
    expect(filterOrdersForWorkspaceIdentity(items, "merchant")[0]?.id).toBe("a");
  });

  it("orders in progress href uses shared bus", () => {
    expect(workspaceOrdersInProgressHref()).toContain("/orders?state=");
  });
});
