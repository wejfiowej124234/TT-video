import { describe, expect, it } from "vitest";
import {
  headerWorkspaceContextNavOptions,
  headerWorkspaceContextSwitcherVisible,
} from "@/lib/header/headerWorkspaceContextNavModel";
import type { MeIdentitySlot } from "@/lib/meIdentitySlots";

function slot(id: MeIdentitySlot["id"], state: MeIdentitySlot["state"]): MeIdentitySlot {
  return { id, state, stake_display: null };
}

describe("headerWorkspaceContextNavModel", () => {
  it("returns account-only when no operator slots", () => {
    expect(headerWorkspaceContextNavOptions([slot("traveler", "active")])).toEqual([
      { id: "account", labelKey: "header_workspace_context_account" },
    ]);
    expect(headerWorkspaceContextSwitcherVisible([slot("traveler", "active")])).toBe(false);
  });

  it("includes operator options with me_identity_slot label keys", () => {
    const options = headerWorkspaceContextNavOptions([
      slot("traveler", "active"),
      slot("guide", "active"),
      slot("merchant", "pending"),
    ]);
    expect(options.map((o) => o.id)).toEqual(["account", "guide", "merchant"]);
    expect(options[1]?.labelKey).toBe("me_identity_slot_guide");
    expect(headerWorkspaceContextSwitcherVisible([
      slot("traveler", "active"),
      slot("guide", "active"),
    ])).toBe(true);
  });
});
