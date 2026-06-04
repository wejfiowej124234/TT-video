import {
  ADMIN_FINANCE_WORKFLOW_STEPS,
  type AdminFinanceWorkflowSnapshotKey,
} from "@/lib/admin/adminFinanceWorkflowModel";

/** FIN-02 · ① partial 深度页「下一步」导航 SSOT。 */
export function adminFinanceWorkflowStepIndex(stepId: string): number {
  return ADMIN_FINANCE_WORKFLOW_STEPS.findIndex((s) => s.id === stepId);
}

export function adminFinanceWorkflowNextStep(stepId: string | null) {
  if (!stepId) return null;
  const idx = adminFinanceWorkflowStepIndex(stepId);
  if (idx < 0 || idx >= ADMIN_FINANCE_WORKFLOW_STEPS.length - 1) return null;
  return ADMIN_FINANCE_WORKFLOW_STEPS[idx + 1] ?? null;
}

export type AdminFinanceWorkflowStepDef = (typeof ADMIN_FINANCE_WORKFLOW_STEPS)[number];

export function adminFinanceWorkflowStepSnapshotKey(
  step: AdminFinanceWorkflowStepDef,
): AdminFinanceWorkflowSnapshotKey | null {
  return step.snapshotKey ?? null;
}
