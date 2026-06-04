import { describe, expect, it } from "vitest";

import { CONSOLE_ROLES_70 } from "./adminRole70Matrix";

describe("adminRole70Matrix", () => {
  it("lists six 70 console roles", () => {
    expect(CONSOLE_ROLES_70).toHaveLength(6);
    expect(CONSOLE_ROLES_70).toContain("SuperAdmin");
    expect(CONSOLE_ROLES_70).toContain("Auditor");
  });
});
