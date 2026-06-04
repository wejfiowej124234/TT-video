import { describe, expect, it } from "vitest";

import { ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS } from "@/lib/admin/adminPhase2RemainingBacklog";
import {
  ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF,
  adminPhase2RemainingBacklogPrepHref,
} from "@/lib/admin/adminPhase2RemainingBacklogPrepHref";

describe("adminPhase2RemainingBacklogPrepHref", () => {
  it("maps all six backlog ids to deep prep links", () => {
    for (const row of ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS) {
      expect(adminPhase2RemainingBacklogPrepHref(row.id)).toBe(row.prepHref);
      expect(ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF[row.id]).toBe(row.prepHref);
    }
  });

  it("IA-06 and RBAC-05 point to ADM-U01 local prep anchor", () => {
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-IA-06"]).toContain(
      "admin-adm-u01-local-prep",
    );
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-RBAC-05"]).toContain(
      "admin-adm-u01-local-prep",
    );
  });

  it("CI-02 points to staging record panel", () => {
    expect(ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-CI-02"]).toContain(
      "admin-phase2-staging-record",
    );
  });
});
