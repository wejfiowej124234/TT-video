"use client";

import Link from "next/link";

import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import type { MeOnboardingFromContext } from "./meOnboardingGuestAccess";

/** 主理人准入页：说明支付 / 链上质押 / 审核并行（Console L5 弱提示条） */
export function MeOnboardingStewardJourneyBridge({
  t,
  from,
  className = "",
}: {
  t: (key: string) => string;
  from: MeOnboardingFromContext;
  className?: string;
}) {
  const pending = from === "steward_pending";
  return (
    <div
      className={`${TT_ME_ONBOARDING_L5.journeyBridge} ${className}`.trim()}
      role="note"
      data-tt-me-onboarding-steward-journey-bridge="1"
      data-tt-me-onboarding-steward-journey-variant={pending ? "pending" : "register"}
    >
      <p className="font-semibold text-ink-900">
        {pending ? t("me_onboarding_pendingReviewBridgeTitle") : t("me_onboarding_stewardJourneyBridgeTitle")}
      </p>
      <p className="mt-1 text-meta leading-relaxed text-ink-700">
        {pending ? t("me_onboarding_pendingReviewBridgeBody") : t("me_onboarding_stewardJourneyBridgeBody")}
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-meta leading-relaxed text-ink-700">
        <li>{t("me_onboarding_stewardJourneyStepPay")}</li>
        <li>{t("me_onboarding_stewardJourneyStepStake")}</li>
        <li>{t("me_onboarding_stewardJourneyStepReview")}</li>
      </ol>
      <p className="mt-2 text-meta text-ink-600">
        <Link href="/steward/register" className="text-ref-sun underline-offset-2 hover:underline">
          {t("me_onboarding_stewardJourneyRegisterLink")}
        </Link>
      </p>
    </div>
  );
}
