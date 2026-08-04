import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "app/guide/register");
const LIB = join(process.cwd(), "lib/guide");

function readAbs(abs: string) {
  return readFileSync(abs, "utf8");
}

/** ① 本地 L5 100% 清单 — 不含 ② 测试网 / ③ 公网 */
describe("guideRegister L5 complete checklist (① local only)", () => {
  it("wires wallet verify, context banners (no KYC), server draft, rejection labels", () => {
    expect(readAbs(join(ROOT, "GuideRegisterPageMain.tsx"))).toContain("GuideRegisterContextBanners");
    expect(readAbs(join(ROOT, "GuideRegisterContextBanners.tsx"))).not.toContain("GuideRegisterKycBanner");
    expect(readAbs(join(ROOT, "GuideRegisterDidIdentityCard.tsx"))).toContain("GuideRegisterWalletStepFlow");
    expect(readAbs(join(ROOT, "GuideRegisterDidIdentityCard.tsx"))).toContain("GuideRegisterStep1ProgressBar");
    expect(readAbs(join(ROOT, "GuideRegisterRejectedGate.tsx"))).toContain("guideRejectionCodeLabel");
    expect(readAbs(join(ROOT, "useGuideRegisterPage.ts"))).toContain("getGuideRegistrationServerDraft");
    expect(readAbs(join(LIB, "guideRegisterServerDraft.ts"))).toContain("meGuideRegistrationDraft");
  });

  it("has file preview and inline field errors", () => {
    expect(readAbs(join(ROOT, "GuideRegisterFileField.tsx"))).toContain("createObjectURL");
    expect(readAbs(join(process.cwd(), "lib/guide/compressGuideRegisterImage.ts"))).toContain(
      "compressGuideRegisterImageFile",
    );
    expect(readAbs(join(ROOT, "GuideRegisterDidIdentityCard.tsx"))).toContain("GuideRegisterInlineFieldError");
    expect(readAbs(join(ROOT, "GuideRegisterServiceFields.tsx"))).toContain("GuideRegisterInlineFieldError");
  });

  it("register flow uploads docs to URLs not base64-only pending", () => {
    expect(readAbs(join(process.cwd(), "app/auth/register/useRegisterPage.ts"))).toContain("postGuideUploadDoc");
    expect(readAbs(join(ROOT, "guideRegisterSubmitFlow.ts"))).toContain("idPhotoUrl");
  });
});
