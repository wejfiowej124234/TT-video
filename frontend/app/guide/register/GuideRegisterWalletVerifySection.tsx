"use client";

import GuideRegisterInlineFieldError from "./GuideRegisterInlineFieldError";
import { guideRegFocusRing, guideRegPrimaryCta, guideRegSecondaryBtn } from "./guideRegisterUiClasses";

export default function GuideRegisterWalletVerifySection({
  t,
  walletVerified,
  verifying,
  error,
  onVerify,
}: {
  t: (key: string) => string;
  walletVerified: boolean;
  verifying: boolean;
  error: string | null;
  onVerify: () => void;
}) {
  if (walletVerified) {
    return (
      <p className="text-meta text-ref-sun/90" role="status">
        {t("guideRegister_walletVerifiedOk")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-meta text-slate-400/95">{t("guideRegister_walletVerifyLead")}</p>
      <button
        type="button"
        disabled={verifying}
        onClick={onVerify}
        className={`${guideRegPrimaryCta} px-4 py-2 text-small ${guideRegFocusRing}`}
        aria-busy={verifying ? true : undefined}
      >
        {verifying ? t("guideRegister_walletVerifying") : t("guideRegister_walletVerifyCta")}
      </button>
      <GuideRegisterInlineFieldError message={error} />
    </div>
  );
}
