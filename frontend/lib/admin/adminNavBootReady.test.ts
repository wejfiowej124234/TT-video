import { describe, expect, it } from "vitest";

import { adminNavBootReady } from "./adminNavBootReady";

describe("adminNavBootReady", () => {
  it("is false while capabilities boot blocked", () => {
    expect(
      adminNavBootReady({
        loading: true,
        permissionsLoaded: false,
        capabilitiesUnavailable: false,
      }),
    ).toBe(false);
  });

  it("is true after session boot ready", () => {
    expect(
      adminNavBootReady({
        loading: false,
        permissionsLoaded: true,
        capabilitiesUnavailable: false,
      }),
    ).toBe(true);
  });

  it("is false when capabilities unavailable (disable frozen nav + show error)", () => {
    expect(
      adminNavBootReady({
        loading: false,
        permissionsLoaded: false,
        capabilitiesUnavailable: true,
      }),
    ).toBe(false);
  });
});
