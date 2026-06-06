import { describe, expect, it, vi } from "vitest";
import { headerUserMenuButtonA11yLabel } from "./headerUserMenuButtonA11y";

describe("headerUserMenuButtonA11yLabel", () => {
  it("falls back when mePayload is null", () => {
    const t = vi.fn((k: string) => (k === "header_userMenu" ? "Menu" : k));
    expect(headerUserMenuButtonA11yLabel(null, "en", t)).toBe("Menu");
  });

  it("uses spine template when payload has active spine slots", () => {
    const t = vi.fn((key: string, vars?: Record<string, string>) => {
      if (key === "header_userMenu") return "Menu";
      if (key === "header_userMenu_spine" && vars) return `${vars.menu} (${vars.slots})`;
      if (key.startsWith("header_identitySpine_")) return key;
      return key;
    });
    const payload = {
      user: { id: "u1", role: "tourist" },
      identity_slots: [
        { id: "traveler", state: "active", stake_display: null },
        { id: "guide", state: "inactive", stake_display: null },
        { id: "merchant", state: "inactive", stake_display: null },
        { id: "acquisition", state: "inactive", stake_display: null },
      ],
    };
    const out = headerUserMenuButtonA11yLabel(payload, "en", t);
    expect(out).toMatch(/^Menu \(header_identitySpine_traveler\)/);
  });
});
