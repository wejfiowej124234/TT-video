import { describe, expect, it } from "vitest";

import { orderConsoleRoles70WithCurrentFirst } from "./adminConsoleRole70PickOrder";
import { CONSOLE_ROLES_70 } from "./adminRole70Matrix";

describe("orderConsoleRoles70WithCurrentFirst", () => {
  it("puts current role first and preserves remaining order", () => {
    expect(orderConsoleRoles70WithCurrentFirst("Finance")).toEqual([
      "Finance",
      "SuperAdmin",
      "Ops",
      "CS",
      "Risk",
      "Auditor",
    ]);
  });

  it("returns full matrix when current role missing", () => {
    expect(orderConsoleRoles70WithCurrentFirst(null)).toEqual([...CONSOLE_ROLES_70]);
  });
});
