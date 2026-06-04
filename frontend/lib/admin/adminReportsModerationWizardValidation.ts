/** COM-02 · ① 举报处置向导逐步校验（与 PATCH body 同源规则）。 */

export type AdminReportsWizardFieldErrors = {
  expectedVer?: "invalid";
  notes?: "required";
  penaltySubject?: "required";
  penaltyReason?: "required";
};

export function validateAdminReportsWizardStep1(
  modExpectedVer: string,
): AdminReportsWizardFieldErrors {
  const ev = Number.parseInt(modExpectedVer.trim(), 10);
  if (!Number.isFinite(ev)) return { expectedVer: "invalid" };
  return {};
}

export function validateAdminReportsWizardStep2(modNotes: string): AdminReportsWizardFieldErrors {
  if (!modNotes.trim()) return { notes: "required" };
  return {};
}

export function validateAdminReportsWizardStep3(opts: {
  modRecordPenalty: boolean;
  modPenaltySubject: string;
  modPenaltyReason: string;
}): AdminReportsWizardFieldErrors {
  if (!opts.modRecordPenalty) return {};
  const errors: AdminReportsWizardFieldErrors = {};
  if (!opts.modPenaltySubject.trim()) errors.penaltySubject = "required";
  if (!opts.modPenaltyReason.trim()) errors.penaltyReason = "required";
  return errors;
}

export function adminReportsWizardFieldErrorKeys(
  errors: AdminReportsWizardFieldErrors,
): (keyof AdminReportsWizardFieldErrors)[] {
  return (Object.keys(errors) as (keyof AdminReportsWizardFieldErrors)[]).filter(
    (k) => errors[k] != null,
  );
}

export type AdminReportsModerationSubmitInput = {
  modExpectedVer: string;
  modNotes: string;
  modRecordPenalty: boolean;
  modPenaltySubject: string;
  modPenaltyReason: string;
};

/** PATCH 提交前全量校验（与向导逐步规则同源）。 */
export function validateAdminReportsModerationSubmit(
  input: AdminReportsModerationSubmitInput,
): AdminReportsWizardFieldErrors {
  return {
    ...validateAdminReportsWizardStep1(input.modExpectedVer),
    ...validateAdminReportsWizardStep2(input.modNotes),
    ...validateAdminReportsWizardStep3({
      modRecordPenalty: input.modRecordPenalty,
      modPenaltySubject: input.modPenaltySubject,
      modPenaltyReason: input.modPenaltyReason,
    }),
  };
}

export function adminReportsModerationSubmitBlocked(
  input: AdminReportsModerationSubmitInput,
): boolean {
  return adminReportsWizardFieldErrorKeys(validateAdminReportsModerationSubmit(input)).length > 0;
}
