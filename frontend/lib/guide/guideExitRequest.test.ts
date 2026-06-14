import { describe, expect, it } from "vitest";

import {
  canSubmitGuideExitRequest,
  isGuideExitingStatus,
  shouldShowGuideWorkbenchExitRequestCard,
} from "./guideExitRequest";

describe("guideExitRequest", () => {
  it("canSubmitGuideExitRequest allows active/approved only", () => {
    expect(canSubmitGuideExitRequest("active")).toBe(true);
    expect(canSubmitGuideExitRequest("approved")).toBe(true);
    expect(canSubmitGuideExitRequest("exiting")).toBe(false);
    expect(canSubmitGuideExitRequest("pending")).toBe(false);
  });

  it("isGuideExitingStatus detects exiting", () => {
    expect(isGuideExitingStatus("exiting")).toBe(true);
    expect(isGuideExitingStatus("active")).toBe(false);
  });

  it("shouldShowGuideWorkbenchExitRequestCard when staking or exiting", () => {
    expect(
      shouldShowGuideWorkbenchExitRequestCard({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        hasStakingActivity: true,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchExitRequestCard({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "exiting",
        hasStakingActivity: false,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchExitRequestCard({
        guideWorkspaceUnlocked: false,
        guideRegistrationStatus: "active",
        hasStakingActivity: true,
      }),
    ).toBe(false);
  });
});
