import { describe, expect, it, beforeEach } from "vitest";
import type { MeIdentitySlot } from "@/lib/meIdentitySlots";
import {
  ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY,
  DEFAULT_ACTIVE_WORKSPACE_CONTEXT,
  listSelectableWorkspaceContexts,
  normalizeStoredWorkspaceContext,
  parseActiveWorkspaceContext,
  publishHubHrefForWorkspaceContext,
  readActiveWorkspaceContext,
  resolveActiveWorkspaceContext,
  writeActiveWorkspaceContext,
  workspaceContextFromPublishHubIdentityParam,
  workspaceContextToPublishHubIdentityParam,
} from "@/lib/header/activeWorkspaceContext";

function slot(id: MeIdentitySlot["id"], state: MeIdentitySlot["state"]): MeIdentitySlot {
  return { id, state, stake_display: null };
}

describe("activeWorkspaceContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parses known context ids", () => {
    expect(parseActiveWorkspaceContext("account")).toBe("account");
    expect(parseActiveWorkspaceContext("guide")).toBe("guide");
    expect(parseActiveWorkspaceContext("invalid")).toBeNull();
  });

  it("reads and writes localStorage roundtrip", () => {
    expect(readActiveWorkspaceContext()).toBe(DEFAULT_ACTIVE_WORKSPACE_CONTEXT);
    writeActiveWorkspaceContext("merchant");
    expect(localStorage.getItem(ACTIVE_WORKSPACE_CONTEXT_STORAGE_KEY)).toBe("merchant");
    expect(readActiveWorkspaceContext()).toBe("merchant");
  });

  it("lists account plus active/pending operator slots only", () => {
    expect(
      listSelectableWorkspaceContexts([
        slot("traveler", "active"),
        slot("guide", "active"),
        slot("merchant", "pending"),
        slot("acquisition", "restricted"),
      ]),
    ).toEqual(["account", "guide", "merchant"]);
  });

  it("maps publish hub identity param both ways", () => {
    expect(workspaceContextToPublishHubIdentityParam("account")).toBeNull();
    expect(workspaceContextToPublishHubIdentityParam("guide")).toBe("guide");
    expect(workspaceContextFromPublishHubIdentityParam("merchant")).toBe("merchant");
    expect(workspaceContextFromPublishHubIdentityParam("traveler")).toBe("account");
  });

  it("builds publish hub href with identity query", () => {
    expect(publishHubHrefForWorkspaceContext("account")).toBe("/me/publish");
    expect(publishHubHrefForWorkspaceContext("acquisition")).toBe("/me/publish?identity=acquisition");
  });

  it("url identity overrides stored context when selectable", () => {
    expect(
      resolveActiveWorkspaceContext({
        stored: "account",
        urlIdentity: "guide",
        selectableIds: ["account", "guide"],
      }),
    ).toBe("guide");
  });

  it("falls back to account when stored context not selectable", () => {
    expect(
      normalizeStoredWorkspaceContext("merchant", ["account", "guide"]),
    ).toBe("account");
  });
});
