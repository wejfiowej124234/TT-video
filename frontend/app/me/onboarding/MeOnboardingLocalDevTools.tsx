"use client";

import { useCallback, useState } from "react";

import { postOnboardingLocalDevMarkPaid } from "@/lib/apiClient/onboarding";
import { mapApiReadError } from "@/lib/mapApiReadError";

import { ME_ONBOARDING_BTN_SECONDARY_CLASS } from "./meOnboardingPageChrome";
import { MeOnboardingTechnicalDetails } from "@/components/me/MeOnboardingSummaryPrimitives";
import { onboardingIdempotencyKeyFromResponse, onboardingLocalDevToolsEnabled } from "./meOnboardingPageHelpers";
import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export type MeOnboardingLocalDevToolsProps = {
  t: T;
  payJson: unknown | null;
  loadEntitlements: () => Promise<void>;
};

export function MeOnboardingLocalDevTools({ t, payJson, loadEntitlements }: MeOnboardingLocalDevToolsProps) {
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [markPaidErr, setMarkPaidErr] = useState<string | null>(null);
  const [markPaidJson, setMarkPaidJson] = useState<unknown | null>(null);

  const idem = onboardingIdempotencyKeyFromResponse(payJson);

  const onMarkPaid = useCallback(async () => {
    if (!idem) return;
    setMarkPaidLoading(true);
    setMarkPaidErr(null);
    setMarkPaidJson(null);
    try {
      const d = await postOnboardingLocalDevMarkPaid(idem);
      setMarkPaidJson(d);
      await loadEntitlements();
    } catch (e) {
      if (typeof window !== "undefined") console.error("MeOnboarding local mark-paid:", e);
      setMarkPaidErr(mapApiReadError(e, t, "me_onboarding_localDevMarkPaidFailed"));
    } finally {
      setMarkPaidLoading(false);
    }
  }, [idem, loadEntitlements, t]);

  if (!onboardingLocalDevToolsEnabled()) return null;

  return (
    <div
      className="mt-4 rounded-[var(--radius-sm)] border border-dashed border-warning/40 bg-warning/5 p-3"
      data-testid="me-onboarding-local-dev-tools"
    >
      <h3 className="text-small font-semibold text-ink-900">{t("me_onboarding_localDevTitle")}</h3>
      <p className="mt-1 text-meta leading-relaxed text-ink-700">{t("me_onboarding_localDevHint")}</p>
      <p className="mt-2 font-mono text-meta text-ink-600 break-all">
        {t("me_onboarding_localDevIdempotencyLabel")}: {idem ?? t("me_onboarding_localDevIdempotencyMissing")}
      </p>
      <button
        type="button"
        className={`${ME_ONBOARDING_BTN_SECONDARY_CLASS} mt-3`}
        disabled={!idem || markPaidLoading}
        aria-busy={markPaidLoading}
        onClick={() => void onMarkPaid()}
        data-testid="me-onboarding-local-dev-mark-paid"
      >
        {markPaidLoading ? t("me_onboarding_loading") : t("me_onboarding_localDevMarkPaid")}
      </button>
      {markPaidErr ? (
        <p className="mt-2 text-small text-danger" role="alert">
          {markPaidErr}
        </p>
      ) : null}
      {markPaidJson ? (
        <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={markPaidJson} />
      ) : null}
    </div>
  );
}
