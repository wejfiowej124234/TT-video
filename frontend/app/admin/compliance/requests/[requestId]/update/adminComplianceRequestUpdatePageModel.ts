export type ComplianceUpdatePostRes = {
  status?: string;
  error?: string;
  item?: { version?: number; status?: string; request_ref?: string };
  current_version?: number;
};

export const DSAR_STATUSES = ["", "open", "in_progress", "completed", "rejected", "cancelled"] as const;

export const DSAR_STATUS_I18N: Record<Exclude<(typeof DSAR_STATUSES)[number], "">, string> = {
  open: "admin_compliance_update_status_open",
  in_progress: "admin_compliance_update_status_in_progress",
  completed: "admin_compliance_update_status_completed",
  rejected: "admin_compliance_update_status_rejected",
  cancelled: "admin_compliance_update_status_cancelled",
};
