import type { AdminPhase2RemainingBacklogId } from "@/lib/admin/adminPhase2RemainingBacklog";

/** 六项 backlog · ① 预备深链 SSOT（②/③ GO 另闸）。 */
export const ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF: Record<
  AdminPhase2RemainingBacklogId,
  string
> = {
  "ADM-UX-IA-06": "/admin/permissions#admin-adm-u01-local-prep",
  "ADM-UX-ONB-04": "/admin/onboarding#admin-onboarding-hub-ledger",
  "ADM-UX-RBAC-05": "/admin/permissions#admin-adm-u01-local-prep",
  "ADM-UX-RBAC-06": "/admin/permissions#admin-permissions-totp",
  "ADM-UX-FIN-02": "/admin/finance-suite",
  "ADM-UX-CI-02": "/admin/permissions#admin-phase2-staging-record",
};

export function adminPhase2RemainingBacklogPrepHref(
  id: AdminPhase2RemainingBacklogId,
): string {
  return ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF[id];
}
