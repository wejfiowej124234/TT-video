/**
 * Builds JSON body for **`PATCH …/admin/community/moderation/:id`**（与 **`useAdminCommunityReportsPage`** 弹层字段同源）。
 */
export function buildAdminCommunityReportsModerationPatchBody(opts: {
  expectedVersion: number;
  modStatus: string;
  modNotes: string;
  modDisposition: string;
  modRecordPenalty: boolean;
  modPenaltyAction: string;
  modPenaltySubject: string;
  modPenaltyReason: string;
  modPenaltyExpires: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    expected_version: opts.expectedVersion,
    status: opts.modStatus.trim(),
  };
  const notes = opts.modNotes.trim();
  if (notes) body.admin_notes = notes;
  const disp = opts.modDisposition.trim();
  if (disp) body.disposition = disp;
  if (opts.modRecordPenalty && opts.modStatus === "resolved") {
    const rp: Record<string, unknown> = { action: opts.modPenaltyAction.trim() };
    const sub = opts.modPenaltySubject.trim();
    if (sub) rp.subject_user_id = sub;
    const reason = opts.modPenaltyReason.trim();
    if (reason) rp.reason = reason;
    const exp = opts.modPenaltyExpires.trim();
    if (exp) rp.expires_at = exp;
    body.record_penalty = rp;
  }
  return body;
}
