import { describe, expect, it } from "vitest";
import {
  detectWorkspaceContextUrlConflict,
  publishHubFilterFromWorkspaceContext,
  publishHubIdentityParamFromRailFilter,
  publishHubUrlAndContextForFilter,
  resolvePublishHubWorkspaceContextInit,
} from "@/lib/me/publishHubWorkspaceContextSync";

describe("publishHubWorkspaceContextSync", () => {
  it("maps workspace context to rail filter", () => {
    expect(publishHubFilterFromWorkspaceContext("account")).toBeNull();
    expect(publishHubFilterFromWorkspaceContext("merchant")).toBe("merchant");
    expect(publishHubFilterFromWorkspaceContext("region_steward")).toBe("governance");
  });

  it("maps rail filter back to identity param", () => {
    expect(publishHubIdentityParamFromRailFilter("all")).toBeNull();
    expect(publishHubIdentityParamFromRailFilter("guide")).toBe("guide");
    expect(publishHubIdentityParamFromRailFilter("governance")).toBe("region_steward");
  });

  it("detects stored/url context conflict (URL wins path)", () => {
    expect(
      detectWorkspaceContextUrlConflict({
        stored: "guide",
        urlIdentity: "merchant",
        selectableIds: ["account", "guide", "merchant"],
      }),
    ).toBe(true);
    expect(
      detectWorkspaceContextUrlConflict({
        stored: "account",
        urlIdentity: "merchant",
        selectableIds: ["account", "merchant"],
      }),
    ).toBe(false);
  });

  it("applies stored operator context when URL has no identity", () => {
    expect(
      resolvePublishHubWorkspaceContextInit({
        stored: "guide",
        urlIdentity: null,
        selectableIds: ["account", "guide", "merchant"],
      }),
    ).toEqual({
      filter: "guide",
      urlConflict: false,
      applyUrlIdentity: "guide",
    });
  });

  it("returns conflict flag when URL identity overrides stored", () => {
    expect(
      resolvePublishHubWorkspaceContextInit({
        stored: "guide",
        urlIdentity: "merchant",
        selectableIds: ["account", "guide", "merchant"],
      }),
    ).toEqual({
      filter: "merchant",
      urlConflict: true,
      applyUrlIdentity: null,
    });
  });

  it("builds href and context for filter chip sync", () => {
    expect(
      publishHubUrlAndContextForFilter("merchant", "/me/publish", new URLSearchParams()),
    ).toEqual({
      href: "/me/publish?identity=merchant",
      context: "merchant",
    });
    expect(
      publishHubUrlAndContextForFilter("all", "/me/publish", new URLSearchParams("identity=guide")),
    ).toEqual({
      href: "/me/publish",
      context: "account",
    });
  });
});
