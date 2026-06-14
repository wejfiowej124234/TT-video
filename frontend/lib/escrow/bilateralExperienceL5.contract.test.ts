/**
 * ① Escrow 双边确认体验 L5 · 机读契约（冻结探针 + 聚合状态）
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ESCROW_BILATERAL_EXPERIENCE_L5_FROZEN,
  bilateralExperienceStatusI18nKey,
  resolveBilateralExperienceStatus,
} from "./bilateralExperienceL5Model";

const root = resolve(__dirname, "../..");

describe("bilateralExperienceL5 contract (① frozen)", () => {
  it("freeze marker is true", () => {
    expect(ESCROW_BILATERAL_EXPERIENCE_L5_FROZEN).toBe(true);
  });

  it("resolveBilateralExperienceStatus covers waiting-other and both-confirmed", () => {
    expect(
      resolveBilateralExperienceStatus({
        isGuide: false,
        touristConfirmed: true,
        guideConfirmed: false,
      }),
    ).toBe("waiting_other");
    expect(
      resolveBilateralExperienceStatus({
        isGuide: true,
        touristConfirmed: true,
        guideConfirmed: true,
      }),
    ).toBe("both_confirmed");
    expect(bilateralExperienceStatusI18nKey("waiting_other")).toBe(
      "order_bilateralStatusWaitingOther",
    );
    expect(bilateralExperienceStatusI18nKey("both_confirmed")).toBe(
      "order_bilateralStatusBothConfirmed",
    );
  });

  it("BilateralConfirmBlock exposes L5 probes", () => {
    const src = readFileSync(
      resolve(root, "components/escrow/EscrowDetail/BilateralConfirmBlock.tsx"),
      "utf8",
    );
    expect(src).toContain('data-tt-bilateral-experience-l5="1"');
    expect(src).toContain("data-tt-bilateral-status={aggregateStatus}");
    expect(src).toContain("bilateralExperienceStatusI18nKey");
    expect(src).toContain("data-tt-bilateral-status-banner");
  });

  it("e2e spec and evidence script exist", () => {
    const spec = readFileSync(resolve(root, "e2e/escrow-bilateral-experience-l5.spec.ts"), "utf8");
    expect(spec).toContain("Escrow bilateral experience L5");
    expect(spec).toContain("expectBilateralAggregateStatus");
    expect(spec).toContain("expectConfirmFinalPlanGateOpen");
    const script = readFileSync(
      resolve(root, "../scripts/dev/record-escrow-bilateral-experience-l5-evidence.sh"),
      "utf8",
    );
    expect(script).toContain("TT_ESCROW_BILATERAL_EXPERIENCE_L5_EVIDENCE: OK");
  });
});
