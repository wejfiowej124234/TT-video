import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { stewardRegisterL5MainDataAttrs, TT_STEWARD_REGISTER_L5 } from "./stewardRegisterL5";
import {
  validateStewardRegisterForm,
  validateStewardRegisterStep1,
  validateStewardRegisterStep2,
  parseStewardRegisterStepParam,
  clampStewardRegisterStep,
  stewardRegisterMaxReachableStep,
  stewardRegisterValidationFailureFromCode,
} from "./stewardRegisterValidation";

describe("stewardRegisterL5.contract", () => {
  it("exposes stable L5 data attrs and UI freeze anchor", () => {
    expect(stewardRegisterL5MainDataAttrs()["data-tt-steward-register-page"]).toBe("1");
    expect(stewardRegisterL5MainDataAttrs()["data-tt-auth-visual"]).toBe("l5");
    expect(stewardRegisterL5MainDataAttrs()["data-tt-steward-register-ui-frozen"]).toBe("1");
    expect(TT_STEWARD_REGISTER_L5.stakeCallout).toContain("auth-l5-callout");
    expect(TT_STEWARD_REGISTER_L5.jurisdictionChipSelected).toContain("text-ref-sun");
    expect(TT_STEWARD_REGISTER_L5.jurisdictionChipUnselected).toContain("text-slate-400");
  });

  it("validates CN jurisdiction form", () => {
    const r = validateStewardRegisterForm(
      {
        jurisdictions: ["CN"],
        legal_name: "Test Steward",
        contact_email: "steward@test.com",
        wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
        motivation: "local smoke",
      },
      { wallet_verified: true },
    );
    expect(r.ok).toBe(true);
  });

  it("blocks submit when wallet is not verified", () => {
    const r = validateStewardRegisterForm(
      {
        jurisdictions: ["CN"],
        legal_name: "Test Steward",
        contact_email: "steward@test.com",
        wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
        motivation: "",
      },
      { wallet_verified: false },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("wallet_verify_required");
  });

  it("wizard step validators and URL step param", () => {
    expect(parseStewardRegisterStepParam("2")).toBe(2);
    expect(parseStewardRegisterStepParam(null)).toBe(1);
    expect(validateStewardRegisterStep1([])).not.toBeNull();
    expect(
      validateStewardRegisterStep2({
        legal_name: "Co",
        contact_email: "a@b.c",
        wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
        wallet_verified: true,
      }),
    ).toBeNull();
    expect(
      validateStewardRegisterStep2({
        legal_name: "Co",
        contact_email: "a@b.c",
        wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
        wallet_verified: false,
      })?.field,
    ).toBe("wallet");
  });

  it("clamps deep-link step to max reachable wizard step", () => {
    const empty = {
      jurisdictions: [] as string[],
      legal_name: "",
      contact_email: "",
      wallet_address: "",
    };
    expect(stewardRegisterMaxReachableStep(empty)).toBe(1);
    expect(clampStewardRegisterStep(3, empty)).toBe(1);
    const step1Only = { ...empty, jurisdictions: ["CN"] };
    expect(stewardRegisterMaxReachableStep(step1Only)).toBe(2);
    expect(clampStewardRegisterStep(3, step1Only)).toBe(2);
    const ready = {
      jurisdictions: ["CN"],
      legal_name: "Co",
      contact_email: "a@b.c",
      wallet_address: "0x4a62316623ad457F02cDC5D997deD67a383EC569",
      wallet_verified: true,
    };
    expect(stewardRegisterMaxReachableStep(ready)).toBe(3);
    expect(clampStewardRegisterStep(3, ready)).toBe(3);
    expect(stewardRegisterValidationFailureFromCode("wallet_invalid")?.field).toBe("wallet");
  });

  it("main form wires dual progress and wagmi wallet step flow", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "app/steward/register/StewardRegisterMainForm.tsx"),
      "utf8",
    );
    expect(src).toContain("StewardRegisterWizardProgress");
    expect(src).toContain("GuideRegisterWalletStepFlow");
    expect(src).toContain("stewardRegister_jurisdictionEmptyHint");
    expect(src).toContain("step1Blocked");
    expect(src).toContain("step2Blocked");
    expect(src).toContain("walletVerify.walletVerified");
    expect(src).toContain("stewardRegister_ctaBlockedStep2WalletVerify");
    expect(src).toContain("chainStakeChecking");
    expect(src).toContain("chainStakeByJurisdiction");
    expect(src).toContain("data-tt-steward-wallet-verified-summary");
    expect(src).toContain("data-tt-steward-stake-by-jurisdiction");
  });
});
