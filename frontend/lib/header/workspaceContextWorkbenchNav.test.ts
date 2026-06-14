import { describe, expect, it } from "vitest";
import {
  resolveOperatorWorkbenchRedirect,
  workbenchHrefForWorkspaceContext,
  workbenchLocationMatchesTarget,
  reorderNavItemsForWorkspaceContext,
} from "@/lib/header/workspaceContextWorkbenchNav";

describe("workspaceContextWorkbenchNav", () => {
  it("maps workspace context to workbench href", () => {
    expect(workbenchHrefForWorkspaceContext("account")).toBeNull();
    expect(workbenchHrefForWorkspaceContext("merchant")).toBe("/provider");
    expect(workbenchHrefForWorkspaceContext("guide")).toBe("/guide");
    expect(workbenchHrefForWorkspaceContext("region_steward")).toBe("/governance?view=region");
  });

  it("matches steward workbench query", () => {
    expect(
      workbenchLocationMatchesTarget("/governance", "?view=region", "/governance?view=region"),
    ).toBe(true);
    expect(
      workbenchLocationMatchesTarget("/governance", "", "/governance?view=region"),
    ).toBe(false);
  });

  it("redirects mismatched operator workbench to context target", () => {
    expect(
      resolveOperatorWorkbenchRedirect("/guide", "", "merchant"),
    ).toBe("/provider");
    expect(
      resolveOperatorWorkbenchRedirect("/provider", "", "merchant"),
    ).toBeNull();
    expect(
      resolveOperatorWorkbenchRedirect("/guide", "", "account"),
    ).toBeNull();
  });

  it("reorders settings nav items to prioritize context workbench", () => {
    const items = [
      { id: "publish_hub" },
      { id: "guide_hub" },
      { id: "merchant_hub" },
    ];
    expect(reorderNavItemsForWorkspaceContext(items, "merchant").map((i) => i.id)).toEqual([
      "merchant_hub",
      "publish_hub",
      "guide_hub",
    ]);
  });
});
