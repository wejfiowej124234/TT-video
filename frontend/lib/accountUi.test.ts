import { describe, expect, it } from "vitest";

import { ACCOUNT_HUB_PATH } from "@/lib/accountUi";
import { resolveUiZone } from "@/lib/uiSystem";

describe("accountUi", () => {
  it("ACCOUNT_HUB_PATH points at TT community me hub", () => {
    expect(ACCOUNT_HUB_PATH).toBe("/community/me");
  });

  it("resolveUiZone: hub is marketDark, /me/* settings are console", () => {
    expect(resolveUiZone(ACCOUNT_HUB_PATH)).toBe("marketDark");
    expect(resolveUiZone("/me/security")).toBe("console");
    expect(resolveUiZone("/me/password")).toBe("console");
  });
});
