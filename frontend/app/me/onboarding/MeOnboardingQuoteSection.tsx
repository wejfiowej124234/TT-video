import type { OnboardingQuoteRole } from "@/lib/apiClient";
import {
  MeOnboardingStatusPill,
  MeOnboardingSummaryGrid,
  MeOnboardingSummaryItem,
  MeOnboardingTechnicalDetails,
} from "@/components/me/MeOnboardingSummaryPrimitives";
import { MeOnboardingSectionSkeleton } from "@/components/me/MeOnboardingSectionSkeleton";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import { meOnboardingDevUiEnabled } from "@/lib/me/meOnboardingDevGate";
import {
  onboardingQuotePackageKey,
  parseOnboardingQuoteView,
} from "@/lib/me/meOnboardingViewModel";
import {
  ME_ONBOARDING_BTN_SECONDARY_CLASS,
  ME_ONBOARDING_SECTION_CARD_CLASS,
} from "./meOnboardingPageChrome";
import { formatOnboardingQuoteExpiresAtUtc, onboardingQuoteRetryable } from "./meOnboardingPageHelpers";
import { MeOnboardingRolePick } from "./MeOnboardingRolePick";
import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export type MeOnboardingQuoteSectionProps = {
  t: T;
  quoteSectionId: string;
  roleLocked?: OnboardingQuoteRole | null;
} & Pick<
  UseMeOnboardingPageResult,
  | "quoteRole"
  | "setQuoteRole"
  | "quoteJson"
  | "quoteErr"
  | "quoteErrCode"
  | "quoteLoading"
  | "loadQuote"
  | "quoteRetrySecsLeft"
>;

function roleLabel(t: T, role: OnboardingQuoteRole): string {
  return role === "region_steward" ? t("me_onboarding_roleSteward") : t("me_onboarding_roleProvider");
}

export function MeOnboardingQuoteSection({
  t,
  quoteSectionId,
  quoteRole,
  setQuoteRole,
  roleLocked = null,
  quoteJson,
  quoteErr,
  quoteErrCode,
  quoteLoading,
  loadQuote,
  quoteRetrySecsLeft,
}: MeOnboardingQuoteSectionProps) {
  const quote = parseOnboardingQuoteView(quoteJson, quoteRole);

  return (
    <section className={`${ME_ONBOARDING_SECTION_CARD_CLASS} ${TT_ME_ONBOARDING_L5.twoColSection}`} aria-labelledby={quoteSectionId}>
      <h2 id={quoteSectionId} className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_quoteSection")}
      </h2>
      <div
        className="mt-3 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/80 p-3 text-meta leading-relaxed text-ink-700"
        role="note"
        data-tt-me-onboarding-b-track-disclosure="1"
      >
        <p className="font-semibold text-ink-900">{t("me_onboarding_bTrackDisclosureTitle")}</p>
        <p className="mt-1">{t("me_onboarding_bTrackDisclosureBody")}</p>
      </div>
      {roleLocked ? (
        <p
          className="mt-3 inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] border border-ref-sun/35 bg-ref-sun/[0.06] px-4 text-small font-semibold text-travel-900"
          data-tt-me-onboarding-role-locked="1"
        >
          {t(
            roleLocked === "region_steward"
              ? "me_onboarding_quoteRoleLockedSteward"
              : "me_onboarding_quoteRoleLockedProvider",
          )}
        </p>
      ) : (
        <MeOnboardingRolePick
          t={t}
          quoteRole={quoteRole}
          setQuoteRole={setQuoteRole}
          groupAriaLabel={t("me_onboarding_quoteRoleGroup")}
        />
      )}
      <p className="mt-3 text-meta text-ink-600">{t("me_onboarding_quoteHint")}</p>
      {quoteLoading ? (
        <MeOnboardingSectionSkeleton rows={3} />
      ) : quoteErr ? (
        <div className="mt-4 space-y-2">
          <p className="text-small text-danger" role="alert">
            {quoteErr}
          </p>
          {onboardingQuoteRetryable(quoteErrCode) ? (
            <div className="flex flex-wrap items-center gap-2">
              {quoteRetrySecsLeft != null ? (
                <p className="text-meta text-ink-600" aria-live="polite">
                  {t("me_onboarding_retryAfterCountdown", { n: quoteRetrySecsLeft })}
                </p>
              ) : null}
              <p className="text-meta text-ink-600">{t("me_onboarding_retryHintQuoteRateLimited")}</p>
              <button
                type="button"
                className={ME_ONBOARDING_BTN_SECONDARY_CLASS}
                aria-busy={quoteLoading}
                disabled={
                  quoteLoading ||
                  (onboardingQuoteRetryable(quoteErrCode) &&
                    quoteRetrySecsLeft != null &&
                    quoteRetrySecsLeft > 0)
                }
                onClick={() => void loadQuote()}
                data-testid="me-onboarding-retry-quote"
              >
                {t("me_onboarding_retryAction")}
              </button>
            </div>
          ) : null}
        </div>
      ) : quote ? (
        <>
          <div
            className={
              quote.isStub || quote.amountMinor === 0
                ? TT_ME_ONBOARDING_L5.amountHeroDemo
                : TT_ME_ONBOARDING_L5.amountHero
            }
          >
            <p className={TT_ME_ONBOARDING_L5.quotePackageEyebrow}>{t(onboardingQuotePackageKey(quote.role))}</p>
            <p
              className={
                quote.isStub || quote.amountMinor === 0
                  ? TT_ME_ONBOARDING_L5.amountHeroValueDemo
                  : TT_ME_ONBOARDING_L5.amountHeroValue
              }
            >
              {quote.amountLabel}
            </p>
            {quote.isStub || quote.amountMinor === 0 ? (
              <>
                <p className={TT_ME_ONBOARDING_L5.amountHeroBadge}>{t("me_onboarding_demoAmountBadge")}</p>
                <p className="mt-2 text-meta text-ink-500">{t("me_onboarding_demoAmountSubtitle")}</p>
              </>
            ) : null}
          </div>
          <MeOnboardingSummaryGrid>
            <MeOnboardingSummaryItem label={t("me_onboarding_summaryRole")} value={roleLabel(t, quote.role)} />
            <MeOnboardingSummaryItem
              label={t("me_onboarding_summaryPlan")}
              value={t(onboardingQuotePackageKey(quote.role))}
            />
            <MeOnboardingSummaryItem
              label={t("me_onboarding_summaryQuoteStatus")}
              value={
                quote.isStub ? (
                  <MeOnboardingStatusPill status={t("me_onboarding_statusDemo")} />
                ) : (
                  <MeOnboardingStatusPill status={t("me_onboarding_statusLive")} />
                )
              }
              meta={
                quote.expiresAt
                  ? `${t("me_onboarding_summaryValidUntil")}: ${formatOnboardingQuoteExpiresAtUtc(quote.expiresAt)}`
                  : undefined
              }
            />
          </MeOnboardingSummaryGrid>
          {meOnboardingDevUiEnabled() ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={quoteJson} />
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-meta text-ink-500">{t("me_onboarding_quoteEmpty")}</p>
      )}
    </section>
  );
}
