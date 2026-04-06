import { describe, expect, it } from "vitest";

import { releasesListHrefFromRelistParam, safeReleasesListSearchFromRelistParam } from "./adminConfigReleasesNav";

describe("adminConfigReleasesNav", () => {
  it("returns empty search for null/empty relist", () => {
    expect(safeReleasesListSearchFromRelistParam(null)).toBe("");
    expect(safeReleasesListSearchFromRelistParam("")).toBe("");
  });

  it("normalizes limit and drops unknown keys", () => {
    const q = safeReleasesListSearchFromRelistParam(encodeURIComponent("limit=10&foo=bar&release_key=ssot"));
    expect(q).toBe("limit=10&release_key=ssot");
  });

  it("drops invalid status", () => {
    const q = safeReleasesListSearchFromRelistParam(encodeURIComponent("limit=50&status=nope"));
    expect(q).toBe("limit=50");
  });

  it("keeps valid status", () => {
    const q = safeReleasesListSearchFromRelistParam(
      encodeURIComponent("limit=20&release_key=k&status=published"),
    );
    expect(q).toBe("limit=20&release_key=k&status=published");
  });

  it("releasesListHrefFromRelistParam builds path", () => {
    expect(releasesListHrefFromRelistParam(null)).toBe("/admin/config/releases");
    expect(
      releasesListHrefFromRelistParam(encodeURIComponent("limit=30&status=draft")),
    ).toBe("/admin/config/releases?limit=30&status=draft");
  });
});
