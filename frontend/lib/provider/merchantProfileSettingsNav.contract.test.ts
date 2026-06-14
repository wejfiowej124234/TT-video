import { describe, expect, it } from "vitest";

import { ME_IDENTITIES_MERCHANT_SETTINGS_HREF } from "@/lib/me/meIdentitiesCoreCardModel";
import { merchantProfileSettingsHrefFromWorkbench } from "@/lib/provider/merchantProfileSettingsNav";

describe("merchantProfileSettingsNav", () => {
  it("workbench settings href is a real route (never undefined)", () => {
    const href = merchantProfileSettingsHrefFromWorkbench();
    expect(href).not.toContain("undefined");
    expect(href).toBe(`${ME_IDENTITIES_MERCHANT_SETTINGS_HREF}?from=provider`);
  });
});
