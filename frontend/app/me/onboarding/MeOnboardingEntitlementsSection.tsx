import type { OnboardingQuoteRole } from "@/lib/apiClient";

import {
  MeOnboardingStatusPill,
  MeOnboardingSummaryGrid,
  MeOnboardingSummaryItem,
  MeOnboardingTechnicalDetails,
} from "@/components/me/MeOnboardingSummaryPrimitives";
import {
  onboardingEntitlementStatusLabel,
  onboardingEntitlementStatusVariant,
  onboardingQuotePackageKey,
  onboardingRoleTargetLabel,
  parseOnboardingEntitlementsView,
} from "@/lib/me/meOnboardingViewModel";
import { meOnboardingDevUiEnabled } from "@/lib/me/meOnboardingDevGate";
import { MeOnboardingSectionLockedState } from "@/components/me/MeOnboardingSectionLockedState";
import { MeOnboardingSectionSkeleton } from "@/components/me/MeOnboardingSectionSkeleton";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

import { ME_ONBOARDING_BTN_SECONDARY_CLASS, ME_ONBOARDING_SECTION_CARD_CLASS } from "./meOnboardingPageChrome";
import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export type MeOnboardingEntitlementsSectionProps = {
  t: T;
  entSectionId: string;
  footerLinkClass: string;
  quoteRole: OnboardingQuoteRole;
  writesSectionId?: string;
  /** 下一步区已展示支付锚点时，隐藏空态重复 CTA */
  hideEmptyPaymentCta?: boolean;
  /** 支付单已创建或 Stripe 回跳后自动同步资格 */
  entitlementsSyncing?: boolean;
  /** 已登录且处于支付阶段、尚未出现「已支付」资格 */
  entitlementsAwaitingPayment?: boolean;
  sessionChecking?: boolean;
} & Pick<
  UseMeOnboardingPageResult,
  "sessionChecked" | "loggedIn" | "entJson" | "entErr" | "entLoading" | "loadEntitlements" | "entAutoSyncing"
>;

export function MeOnboardingEntitlementsSection({
  t,
  entSectionId,
  footerLinkClass,
  quoteRole,
  writesSectionId,
  hideEmptyPaymentCta = false,
  entitlementsSyncing = false,
  entitlementsAwaitingPayment = false,
  sessionChecking = false,
  sessionChecked,
  loggedIn,
  entJson,
  entErr,
  entLoading,
  loadEntitlements,
  entAutoSyncing,
}: MeOnboardingEntitlementsSectionProps) {
  const entitlements = parseOnboardingEntitlementsView(entJson);

  return (
    <section className={`${ME_ONBOARDING_SECTION_CARD_CLASS} ${TT_ME_ONBOARDING_L5.twoColSection}`} aria-labelledby={entSectionId}>
      <h2 id={entSectionId} className="text-h4 font-semibold text-ink-900">
        {t("me_onboarding_entitlementsSection")}
      </h2>
      {loggedIn ? (
        <p className="mt-2 text-meta leading-relaxed text-ink-600" data-tt-me-onboarding-entitlements-note="1">
          {t("me_onboarding_entitlementsMultiRoleNote")}
        </p>
      ) : null}
      {loggedIn && (entAutoSyncing || entitlementsSyncing) ? (
        <p className="mt-2 text-meta text-ink-600" aria-live="polite">
          {t("me_onboarding_entAutoSyncing")}
        </p>
      ) : null}
      {sessionChecking || !sessionChecked ? (
        <div className={TT_ME_ONBOARDING_L5.entitlementsSyncingShell} aria-busy="true" aria-live="polite">
          <MeOnboardingSectionSkeleton rows={2} />
          <p className="mt-3 text-small font-medium text-ink-800">{t("me_onboarding_sessionCheckingTitle")}</p>
          <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_sessionCheckingBody")}</p>
        </div>
      ) : !loggedIn ? (
        <MeOnboardingSectionLockedState
          t={t}
          titleKey="me_onboarding_entitlementsLoginDeferTitle"
          className="flex-1"
        />
      ) : entLoading || (entitlementsSyncing && (!entitlements || entitlements.items.length === 0)) ? (
        <div className={TT_ME_ONBOARDING_L5.entitlementsSyncingShell} aria-busy="true" aria-live="polite">
          <MeOnboardingSectionSkeleton rows={2} />
          <p className="mt-3 text-small font-medium text-ink-800">{t("me_onboarding_entitlementsSyncingTitle")}</p>
          <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_entitlementsSyncingHint")}</p>
        </div>
      ) : entErr ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {entErr}
        </p>
      ) : entitlements && entitlements.items.length > 0 ? (
        <>
          <ul className="mt-4 space-y-3" aria-label={t("me_onboarding_entitlementsListAria")}>
            {entitlements.items.map((item) => {
              const isCurrentFlow =
                (quoteRole === "provider" && item.roleTarget === "provider") ||
                (quoteRole === "region_steward" && item.roleTarget === "region_steward");
              return (
              <li
                key={item.id}
                className={`rounded-[var(--radius-sm)] border p-3 ${
                  isCurrentFlow
                    ? "border-ref-sun/35 bg-ref-sun/[0.06]"
                    : "border-ink-100 bg-ink-50/70"
                }`}
                data-tt-me-onboarding-entitlement-current={isCurrentFlow ? "1" : undefined}
              >
                <MeOnboardingSummaryGrid>
                  <MeOnboardingSummaryItem
                    label={t("me_onboarding_summaryRole")}
                    value={onboardingRoleTargetLabel(item.roleTarget, t)}
                  />
                  <MeOnboardingSummaryItem
                    label={t("me_onboarding_summaryEntitlementStatus")}
                    value={
                      <MeOnboardingStatusPill
                        status={onboardingEntitlementStatusLabel(item.status, t)}
                        variant={onboardingEntitlementStatusVariant(item.status)}
                      />
                    }
                  />
                  <MeOnboardingSummaryItem
                    label={t("me_onboarding_summaryPlan")}
                    value={t(onboardingQuotePackageKey(item.roleTarget === "region_steward" ? "region_steward" : "provider"))}
                  />
                </MeOnboardingSummaryGrid>
                {isCurrentFlow ? (
                  <p className="mt-2 text-meta font-medium text-travel-900">{t("me_onboarding_entitlementCurrentFlow")}</p>
                ) : null}
              </li>
            );
            })}
          </ul>
          {meOnboardingDevUiEnabled() ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={entJson} />
          ) : null}
        </>
      ) : entitlementsAwaitingPayment ? (
        <div
          className={`${TT_ME_ONBOARDING_L5.entitlementsSyncingShell} flex flex-1 flex-col justify-center`}
          data-tt-me-onboarding-entitlements-awaiting="1"
        >
          <MeOnboardingStatusPill
            status={t("me_onboarding_entitlementsAwaitingBadge")}
            variant="pending"
          />
          <p className="mt-3 text-small font-semibold text-ink-900">
            {t("me_onboarding_entitlementsAwaitingPaymentTitle")}
          </p>
          <p className="mt-1 text-meta leading-relaxed text-ink-600">
            {t("me_onboarding_entitlementsAwaitingPaymentHint")}
          </p>
          <button
            type="button"
            className={`${ME_ONBOARDING_BTN_SECONDARY_CLASS} mt-4`}
            aria-busy={entLoading || entitlementsSyncing}
            disabled={entitlementsSyncing}
            onClick={() => void loadEntitlements()}
            data-testid="me-onboarding-refresh-entitlements"
          >
            {t("me_onboarding_refreshEntitlements")}
          </button>
          {meOnboardingDevUiEnabled() ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={entJson} />
          ) : null}
        </div>
      ) : (
        <div className={TT_ME_ONBOARDING_L5.emptyState}>
          <p className="text-small font-medium text-ink-800">{t("me_onboarding_entitlementsEmptyTitle")}</p>
          <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_entitlementsEmptyHint")}</p>
          <div className={TT_ME_ONBOARDING_L5.emptyStateActions}>
            {writesSectionId && !hideEmptyPaymentCta ? (
              <a
                href={`#${writesSectionId}`}
                className={`${footerLinkClass} inline-flex min-h-[44px] items-center justify-center text-small font-semibold`}
              >
                {t("me_onboarding_entitlementsEmptyCta")}
              </a>
            ) : null}
            <button
              type="button"
              className={`${ME_ONBOARDING_BTN_SECONDARY_CLASS} w-full sm:w-auto`}
              aria-busy={entLoading || entitlementsSyncing}
              disabled={entitlementsSyncing}
              onClick={() => void loadEntitlements()}
              data-testid="me-onboarding-refresh-entitlements"
            >
              {t("me_onboarding_refreshEntitlements")}
            </button>
          </div>
          {meOnboardingDevUiEnabled() ? (
            <MeOnboardingTechnicalDetails label={t("me_onboarding_technicalDetails")} json={entJson} />
          ) : null}
        </div>
      )}
      {loggedIn && !entLoading && entitlements && entitlements.items.length > 0 ? (
        <button
          type="button"
          className={`${ME_ONBOARDING_BTN_SECONDARY_CLASS} mt-3`}
          aria-busy={entLoading}
          onClick={() => void loadEntitlements()}
          data-testid="me-onboarding-refresh-entitlements"
        >
          {t("me_onboarding_refreshEntitlements")}
        </button>
      ) : null}
    </section>
  );
}
