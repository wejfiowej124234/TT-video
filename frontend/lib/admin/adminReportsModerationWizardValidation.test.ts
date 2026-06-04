import { describe, expect, it } from "vitest";

import {
  adminReportsModerationSubmitBlocked,
  adminReportsWizardFieldErrorKeys,
  validateAdminReportsModerationSubmit,
  validateAdminReportsWizardStep1,
  validateAdminReportsWizardStep2,
  validateAdminReportsWizardStep3,
} from "@/lib/admin/adminReportsModerationWizardValidation";

describe("adminReportsModerationWizardValidation", () => {
  it("step1 rejects non-numeric expected version", () => {
    expect(validateAdminReportsWizardStep1("")).toEqual({ expectedVer: "invalid" });
    expect(validateAdminReportsWizardStep1("x")).toEqual({ expectedVer: "invalid" });
    expect(validateAdminReportsWizardStep1("3")).toEqual({});
  });

  it("step2 requires trimmed notes", () => {
    expect(validateAdminReportsWizardStep2("   ")).toEqual({ notes: "required" });
    expect(validateAdminReportsWizardStep2("ok")).toEqual({});
  });

  it("submit blocks when notes missing even if step1 ok", () => {
    expect(
      adminReportsModerationSubmitBlocked({
        modExpectedVer: "2",
        modNotes: "",
        modRecordPenalty: false,
        modPenaltySubject: "",
        modPenaltyReason: "",
      }),
    ).toBe(true);
    expect(
      validateAdminReportsModerationSubmit({
        modExpectedVer: "2",
        modNotes: "done",
        modRecordPenalty: false,
        modPenaltySubject: "",
        modPenaltyReason: "",
      }),
    ).toEqual({});
  });

  it("step3 requires penalty fields when recording penalty", () => {
    expect(
      validateAdminReportsWizardStep3({
        modRecordPenalty: false,
        modPenaltySubject: "",
        modPenaltyReason: "",
      }),
    ).toEqual({});
    expect(
      adminReportsWizardFieldErrorKeys(
        validateAdminReportsWizardStep3({
          modRecordPenalty: true,
          modPenaltySubject: "",
          modPenaltyReason: "spam",
        }),
      ),
    ).toEqual(["penaltySubject"]);
  });
});
