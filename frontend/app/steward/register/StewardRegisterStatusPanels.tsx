"use client";

import Link from "next/link";
import { StewardOnboardingProgress } from "@/components/steward/StewardOnboardingProgress";
import { meOnboardingHref } from "@/app/me/onboarding/meOnboardingLoginReturn";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { guideRegFocusRing } from "@/app/guide/register/guideRegisterUiClasses";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export function StewardRegisterDonePanel({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-4 text-center" data-tt-steward-register-done="1">
      <StewardOnboardingProgress currentStep={3} variant="compact" defaultExpanded={false} className="text-left" />
      <h2 className="text-h4 font-semibold text-slate-100">{t("stewardRegister_doneTitle")}</h2>
      <p className="text-small text-slate-300">{t("steward_register_done")}</p>
      <ol
        className="mx-auto max-w-md list-decimal space-y-2 pl-5 text-left text-meta text-slate-400"
        data-tt-steward-done-checklist="1"
      >
        <li>{t("stewardRegister_doneStepOnboarding")}</li>
        <li>{t("stewardRegister_doneStepStake")}</li>
        <li>{t("stewardRegister_doneStepReview")}</li>
      </ol>
      <Link
        href={meOnboardingHref("region_steward", { from: "steward_register" })}
        className={`${touchTargetLink44Classes} inline-flex justify-center ${TT_AUTH_L5_FORM.primaryCta} ${guideRegFocusRing}`}
      >
        {t("steward_register_go_onboarding")}
      </Link>
    </div>
  );
}

export function StewardRegisterAlreadyPanel({ t }: { t: (key: string) => string }) {
  return (
    <div className="space-y-4 text-center" data-tt-steward-register-already="1">
      <p className="text-h4 font-semibold text-slate-100">{t("stewardRegister_alreadyTitle")}</p>
      <p className="text-small text-slate-300">{t("stewardRegister_alreadyDesc")}</p>
      <Link
        href="/me/settings/profile"
        className={`${touchTargetLink44Classes} inline-flex justify-center text-meta text-ref-sun/85 hover:text-ref-sun ${guideRegFocusRing}`}
      >
        {t("stewardRegister_goCommunity")}
      </Link>
    </div>
  );
}

export function StewardRegisterRejectedGate({
  t,
  rejectionMessage,
  onReapply,
}: {
  t: (key: string) => string;
  rejectionMessage: string | null;
  onReapply: () => void;
}) {
  return (
    <div className="space-y-4" data-tt-steward-register-rejected="1">
      <p className="text-h4 font-semibold text-slate-100">{t("stewardRegister_rejectedTitle")}</p>
      <p className="text-small text-slate-300">{t("stewardRegister_rejectedDesc")}</p>
      {rejectionMessage ? <p className={TT_AUTH_L5_FORM.error}>{rejectionMessage}</p> : null}
      <button type="button" className={`${TT_AUTH_L5_FORM.secondaryButton} ${guideRegFocusRing}`} onClick={onReapply}>
        {t("stewardRegister_reapply")}
      </button>
    </div>
  );
}
