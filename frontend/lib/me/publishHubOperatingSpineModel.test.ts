import { describe, expect, it } from "vitest";
import {
  publishHubOperatingContextFromPageState,
  publishHubOperatingSpineLine,
} from "@/lib/me/publishHubOperatingSpineModel";

describe("publishHubOperatingSpineModel (W1-B4)", () => {
  const selectable = ["account", "guide", "merchant"] as const;

  it("filter merchant wins over stored account", () => {
    expect(
      publishHubOperatingContextFromPageState({
        filter: "merchant",
        urlIdentity: null,
        stored: "account",
        selectableIds: selectable,
      }),
    ).toBe("merchant");
  });

  it("URL identity wins when filter is all", () => {
    expect(
      publishHubOperatingContextFromPageState({
        filter: "all",
        urlIdentity: "guide",
        stored: "merchant",
        selectableIds: selectable,
      }),
    ).toBe("guide");
  });

  it("falls back to stored when filter all and no URL", () => {
    expect(
      publishHubOperatingContextFromPageState({
        filter: "all",
        urlIdentity: null,
        stored: "guide",
        selectableIds: selectable,
      }),
    ).toBe("guide");
  });

  it("spine line uses contextLabel interpolation", () => {
    const line = publishHubOperatingSpineLine("merchant", (key, vars) => {
      if (key === "publish_hub_operating_spine" && vars) {
        return `${vars.contextLabel} · 产出总览`;
      }
      if (key === "me_identity_slot_merchant") return "商家";
      return key;
    });
    expect(line).toBe("商家 · 产出总览");
  });
});
