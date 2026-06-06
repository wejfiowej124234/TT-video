import { describe, expect, it } from "vitest";

import {
  ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
} from "@/lib/adminUi";
import { resolveUiZone } from "@/lib/uiSystem";

describe("adminUi", () => {
  it("admin zone resolves for /admin paths", () => {
    expect(resolveUiZone("/admin")).toBe("admin");
    expect(resolveUiZone("/admin/observability")).toBe("admin");
  });

  it("focus helpers re-export marketing console tokens", () => {
    expect(ADMIN_FORM_FIELD_FOCUS_CLASS).toContain("focus-visible:ring-ref-sun");
    expect(ADMIN_FOCUS_RING_CORE_CLASS).toContain("focus-visible:ring-2");
    expect(ADMIN_LINK_FOCUS_CLASS).toContain("rounded-[var(--radius-sm)]");
  });
});
