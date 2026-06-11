import {
  ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF,
  type AdminPhase2RemainingBacklogId,
} from "@/lib/admin/adminPhase2RemainingBacklogPrepHref";

export type { AdminPhase2RemainingBacklogId } from "@/lib/admin/adminPhase2RemainingBacklogPrepHref";

/** 六项 Phase ②/③ 剩余 backlog · ① 机读 SSOT（非 staging GO）。 */
export const ADMIN_PHASE2_REMAINING_BACKLOG_ITEMS = [
  {
    id: "ADM-UX-IA-06",
    titleKey: "admin_phase2_backlog_ia06_title",
    prepKey: "admin_phase2_backlog_ia06_prep",
    phaseKey: "admin_phase2_backlog_phase_02",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-IA-06"],
    localPrepKey: "admin_phase2_backlog_cmd_ia06",
  },
  {
    id: "ADM-UX-ONB-04",
    titleKey: "admin_phase2_backlog_onb04_title",
    prepKey: "admin_phase2_backlog_onb04_prep",
    phaseKey: "admin_phase2_backlog_phase_02",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-ONB-04"],
    localPrepKey: "admin_phase2_backlog_cmd_onb04",
  },
  {
    id: "ADM-UX-RBAC-05",
    titleKey: "admin_phase2_backlog_rbac05_title",
    prepKey: "admin_phase2_backlog_rbac05_prep",
    phaseKey: "admin_phase2_backlog_phase_02",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-RBAC-05"],
    localPrepKey: "admin_phase2_backlog_cmd_rbac05",
  },
  {
    id: "ADM-UX-RBAC-06",
    titleKey: "admin_phase2_backlog_rbac06_title",
    prepKey: "admin_phase2_backlog_rbac06_prep",
    phaseKey: "admin_phase2_backlog_phase_03",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-RBAC-06"],
    localPrepKey: "admin_phase2_backlog_cmd_rbac06",
  },
  {
    id: "ADM-UX-FIN-02",
    titleKey: "admin_phase2_backlog_fin02_title",
    prepKey: "admin_phase2_backlog_fin02_prep",
    phaseKey: "admin_phase2_backlog_phase_02_03",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-FIN-02"],
    localPrepKey: "admin_phase2_backlog_cmd_fin02",
  },
  {
    id: "ADM-UX-CI-02",
    titleKey: "admin_phase2_backlog_ci02_title",
    prepKey: "admin_phase2_backlog_ci02_prep",
    phaseKey: "admin_phase2_backlog_phase_02",
    prepHref: ADMIN_PHASE2_REMAINING_BACKLOG_PREP_HREF["ADM-UX-CI-02"],
    localPrepKey: "admin_phase2_backlog_cmd_ci02",
  },
] as const;

