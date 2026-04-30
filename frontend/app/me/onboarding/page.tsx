"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import {
  getApiRetryAfterSeconds,
  getMeFull,
  getOnboardingEntitlementsMe,
  getOnboardingQuote,
  isMeFullRequestError,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
  type OnboardingQuoteRole,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import { StripeOnboardingPayment } from "./StripeOnboardingPayment";

function onboardingClientSecretFromResponse(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const psp = o.psp;
  if (!psp || typeof psp !== "object") return null;
  const cs = (psp as Record<string, unknown>).client_secret;
  return typeof cs === "string" && cs.length > 0 ? cs : null;
}

function onboardingCheckoutUrlFromResponse(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const psp = o.psp;
  if (!psp || typeof psp !== "object") return null;
  const u = (psp as Record<string, unknown>).checkout_url;
  return typeof u === "string" && u.startsWith("http") ? u : null;
}

function onboardingReturnUrlForCheckout(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/me/onboarding`;
}

function apiThrownCode(e: unknown): string | null {
  return e instanceof Error && e.message.length > 0 ? e.message : null;
}

function onboardingQuoteRetryable(code: string | null): boolean {
  return code === "onboarding_quote_rate_limited";
}

function onboardingWriteRetryable(code: string | null): boolean {
  return code === "onboarding_idempotency_conflict" || code === "onboarding_user_write_rate_limited";
}

function onboardingWriteRateLimited(code: string | null): boolean {
  return code === "onboarding_user_write_rate_limited";
}

/** 96-18 准入页：报价 / 资格只读；登录后真实调用写接口（与 04 §3.4、无 PSP 真收单一致）。 */
export default function MeOnboardingPage() {
  const { t } = useTranslation();
  const mainTitleId = useId();
  const quoteSectionId = useId();
  const entSectionId = useId();
  const writesSectionId = useId();
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const cardClass = "rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6";
  const btnPrimaryClass = `min-h-[44px] rounded-[var(--radius-sm)] border border-travel-500 bg-travel-500 px-4 text-small font-semibold text-white transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console enabled:hover:bg-travel-600 disabled:cursor-not-allowed disabled:opacity-50`;
  const btnSecondaryClass = `min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-4 text-small font-semibold text-ink-800 transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console enabled:hover:border-travel-400/50 disabled:cursor-not-allowed disabled:opacity-50`;

  const [quoteRole, setQuoteRole] = useState<OnboardingQuoteRole>("provider");
  const [quoteJson, setQuoteJson] = useState<unknown | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [quoteErrCode, setQuoteErrCode] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [entJson, setEntJson] = useState<unknown | null>(null);
  const [entErr, setEntErr] = useState<string | null>(null);
  const [entLoading, setEntLoading] = useState(false);

  const [payLoading, setPayLoading] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [payErrCode, setPayErrCode] = useState<string | null>(null);
  const [payJson, setPayJson] = useState<unknown | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleErr, setRoleErr] = useState<string | null>(null);
  const [roleErrCode, setRoleErrCode] = useState<string | null>(null);
  const [roleJson, setRoleJson] = useState<unknown | null>(null);

  const [quoteRetryUntilMs, setQuoteRetryUntilMs] = useState<number | null>(null);
  const [payRetryUntilMs, setPayRetryUntilMs] = useState<number | null>(null);
  const [roleRetryUntilMs, setRoleRetryUntilMs] = useState<number | null>(null);
  const [rateLimitTick, setRateLimitTick] = useState(0);

  useEffect(() => {
    const anyActive = [quoteRetryUntilMs, payRetryUntilMs, roleRetryUntilMs].some(
      (u) => u != null && u > Date.now()
    );
    if (!anyActive) return;
    const id = window.setInterval(() => setRateLimitTick((x) => x + 1), 500);
    return () => window.clearInterval(id);
  }, [quoteRetryUntilMs, payRetryUntilMs, roleRetryUntilMs]);

  const quoteRetrySecsLeft = useMemo(() => {
    void rateLimitTick;
    if (!quoteRetryUntilMs) return null;
    const s = Math.ceil((quoteRetryUntilMs - Date.now()) / 1000);
    return s > 0 ? s : null;
  }, [quoteRetryUntilMs, rateLimitTick]);

  const payRetrySecsLeft = useMemo(() => {
    void rateLimitTick;
    if (!payRetryUntilMs) return null;
    const s = Math.ceil((payRetryUntilMs - Date.now()) / 1000);
    return s > 0 ? s : null;
  }, [payRetryUntilMs, rateLimitTick]);

  const roleRetrySecsLeft = useMemo(() => {
    void rateLimitTick;
    if (!roleRetryUntilMs) return null;
    const s = Math.ceil((roleRetryUntilMs - Date.now()) / 1000);
    return s > 0 ? s : null;
  }, [roleRetryUntilMs, rateLimitTick]);

  const loadQuote = useCallback(() => {
    setQuoteLoading(true);
    setQuoteErr(null);
    setQuoteErrCode(null);
    getOnboardingQuote(quoteRole)
      .then((d) => {
        setQuoteJson(d);
        setQuoteErrCode(null);
        setQuoteRetryUntilMs(null);
      })
      .catch((e) => {
        if (typeof window !== "undefined") console.error("MeOnboarding quote:", e);
        setQuoteErrCode(apiThrownCode(e));
        setQuoteErr(mapApiReadError(e, t, "me_onboarding_quoteFailed"));
        setQuoteJson(null);
        const ra = getApiRetryAfterSeconds(e);
        setQuoteRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
      })
      .finally(() => setQuoteLoading(false));
  }, [quoteRole, t]);

  const loadEntitlements = useCallback(async () => {
    if (!loggedIn) return;
    setEntLoading(true);
    setEntErr(null);
    try {
      const d = await getOnboardingEntitlementsMe();
      setEntJson(d);
    } catch (e) {
      if (typeof window !== "undefined") console.error("MeOnboarding entitlements:", e);
      setEntErr(mapApiReadError(e, t, "me_onboarding_entitlementsFailed"));
      setEntJson(null);
    } finally {
      setEntLoading(false);
    }
  }, [loggedIn, t]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  useEffect(() => {
    let cancelled = false;
    getMeFull({ force: false })
      .then((me) => {
        if (!cancelled) {
          setLoggedIn(me != null);
          setSessionChecked(true);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (isMeFullRequestError(e)) {
          setLoggedIn(false);
          setSessionChecked(true);
          return;
        }
        if (typeof window !== "undefined") console.error("MeOnboarding session:", e);
        setLoggedIn(false);
        setSessionChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionChecked || !loggedIn) return;
    void loadEntitlements();
  }, [sessionChecked, loggedIn, loadEntitlements]);

  const newIdempotencyKey = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const onCreatePaymentIntent = async () => {
    setPayLoading(true);
    setPayErr(null);
    setPayErrCode(null);
    setPayJson(null);
    try {
      const d = await postOnboardingPaymentIntent(
        { role: quoteRole, return_url: onboardingReturnUrlForCheckout() },
        newIdempotencyKey()
      );
      setPayJson(d);
      setPayErrCode(null);
      setPayRetryUntilMs(null);
      await loadEntitlements();
    } catch (e) {
      if (typeof window !== "undefined") console.error("MeOnboarding payment intent:", e);
      setPayErrCode(apiThrownCode(e));
      setPayErr(mapApiReadError(e, t, "me_onboarding_paymentIntentFailed"));
      const ra = getApiRetryAfterSeconds(e);
      setPayRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
    } finally {
      setPayLoading(false);
    }
  };

  const onRequestRoleConfirm = async () => {
    setRoleLoading(true);
    setRoleErr(null);
    setRoleErrCode(null);
    setRoleJson(null);
    try {
      const d = await postOnboardingRoleConfirm(quoteRole, newIdempotencyKey());
      setRoleJson(d);
      setRoleErrCode(null);
      setRoleRetryUntilMs(null);
      await loadEntitlements();
    } catch (e) {
      if (typeof window !== "undefined") console.error("MeOnboarding role confirm:", e);
      setRoleErrCode(apiThrownCode(e));
      setRoleErr(mapApiReadError(e, t, "me_onboarding_roleConfirmFailed"));
      const ra = getApiRetryAfterSeconds(e);
      setRoleRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
    } finally {
      setRoleLoading(false);
    }
  };

  const roleBtn = (role: OnboardingQuoteRole, labelKey: "me_onboarding_roleProvider" | "me_onboarding_roleSteward") => {
    const active = quoteRole === role;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setQuoteRole(role)}
        className={`min-h-[44px] rounded-[var(--radius-sm)] border px-4 text-small font-semibold transition-colors ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console ${
          active
            ? "border-travel-500 bg-travel-500/10 text-travel-700"
            : "border-ink-200 bg-white text-ink-700 hover:border-travel-400/50"
        }`}
      >
        {t(labelKey)}
      </button>
    );
  };

  return (
    <main
      className="min-h-screen bg-bg-main px-4 py-8 sm:px-6"
      aria-labelledby={mainTitleId}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 id={mainTitleId} className="text-h3 font-semibold text-ink-900">
            {t("me_onboarding_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-kicker leading-relaxed text-ink-600">{t("me_onboarding_subtitle")}</p>
          <p
            className="mt-3 rounded-[var(--radius-sm)] border border-amber-200/80 bg-amber-50/90 p-3 text-small text-ink-800"
            role="note"
          >
            {t("me_onboarding_stubNotice")}
          </p>
        </div>

        <section className={cardClass} aria-labelledby={quoteSectionId}>
          <h2 id={quoteSectionId} className="text-h4 font-semibold text-ink-900">
            {t("me_onboarding_quoteSection")}
          </h2>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label={t("me_onboarding_quoteRoleGroup")}
          >
            {roleBtn("provider", "me_onboarding_roleProvider")}
            {roleBtn("region_steward", "me_onboarding_roleSteward")}
          </div>
          <p className="mt-3 text-meta text-ink-600">{t("me_onboarding_quoteHint")}</p>
          {quoteLoading ? (
            <p className="mt-4 text-meta text-ink-500">{t("me_onboarding_loading")}</p>
          ) : quoteErr ? (
            <div className="mt-4 space-y-2">
              <p className="text-small text-red-700" role="alert">
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
                    className={btnSecondaryClass}
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
          ) : (
            <pre
              className="mt-4 max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-ink-100 bg-ink-50/80 p-3 text-meta text-ink-800 whitespace-pre-wrap break-words"
              aria-label={t("me_onboarding_aria_quoteJson")}
            >
              {quoteJson != null ? JSON.stringify(quoteJson, null, 2) : "—"}
            </pre>
          )}
        </section>

        <section className={cardClass} aria-labelledby={entSectionId}>
          <h2 id={entSectionId} className="text-h4 font-semibold text-ink-900">
            {t("me_onboarding_entitlementsSection")}
          </h2>
          {!sessionChecked ? (
            <p className="mt-3 text-meta text-ink-500">{t("me_onboarding_loading")}</p>
          ) : !loggedIn ? (
            <p className="mt-3 text-small text-ink-700">
              {t("me_onboarding_loginHint")}{" "}
              <Link href="/auth/login" className={footerLinkClass}>
                {t("me_onboarding_goLogin")}
              </Link>
            </p>
          ) : entLoading ? (
            <p className="mt-3 text-meta text-ink-500">{t("me_onboarding_loading")}</p>
          ) : entErr ? (
            <p className="mt-3 text-small text-red-700" role="alert">
              {entErr}
            </p>
          ) : (
            <pre
              className="mt-4 max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-ink-100 bg-ink-50/80 p-3 text-meta text-ink-800 whitespace-pre-wrap break-words"
              aria-label={t("me_onboarding_aria_entitlementsJson")}
            >
              {entJson != null ? JSON.stringify(entJson, null, 2) : "—"}
            </pre>
          )}
          {loggedIn && !entLoading ? (
            <button
              type="button"
              className={`${btnSecondaryClass} mt-3`}
              aria-busy={entLoading}
              onClick={() => void loadEntitlements()}
              data-testid="me-onboarding-refresh-entitlements"
            >
              {t("me_onboarding_refreshEntitlements")}
            </button>
          ) : null}
        </section>

        {loggedIn ? (
          <section className={cardClass} aria-labelledby={writesSectionId}>
            <h2 id={writesSectionId} className="text-h4 font-semibold text-ink-900">
              {t("me_onboarding_writesSection")}
            </h2>
            <p className="mt-2 text-meta text-ink-600">{t("me_onboarding_writesHint")}</p>
            <details className="mt-4 rounded-[var(--radius-sm)] border border-ink-200 bg-ink-50/50 p-3">
              <summary
                className={`cursor-pointer text-small font-semibold text-ink-900 ${travelFocusRingOffset2Classes} focus-visible:ring-offset-bg-console rounded-[var(--radius-sm)] px-1 -mx-1 py-0.5`}
              >
                {t("me_onboarding_localLoopTitle")}
              </summary>
              <p className="mt-2 whitespace-pre-line text-meta leading-relaxed text-ink-700">
                {t("me_onboarding_localLoopIntro")}
              </p>
            </details>
            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={t("me_onboarding_writesActionsGroup")}
            >
              <button
                type="button"
                className={btnPrimaryClass}
                aria-busy={payLoading}
                disabled={payLoading}
                onClick={() => void onCreatePaymentIntent()}
                data-testid="me-onboarding-create-intent"
              >
                {payLoading ? t("me_onboarding_loading") : t("me_onboarding_createPaymentIntent")}
              </button>
              <button
                type="button"
                className={btnPrimaryClass}
                aria-busy={roleLoading}
                disabled={roleLoading}
                onClick={() => void onRequestRoleConfirm()}
                data-testid="me-onboarding-role-confirm"
              >
                {roleLoading ? t("me_onboarding_loading") : t("me_onboarding_requestRoleConfirm")}
              </button>
            </div>
            {payErr ? (
              <div className="mt-3 space-y-2">
                <p className="text-small text-red-700" role="alert">
                  {payErr}
                </p>
                {onboardingWriteRetryable(payErrCode) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {onboardingWriteRateLimited(payErrCode) && payRetrySecsLeft != null ? (
                      <p className="text-meta text-ink-600" aria-live="polite">
                        {t("me_onboarding_retryAfterCountdown", { n: payRetrySecsLeft })}
                      </p>
                    ) : null}
                    <p className="text-meta text-ink-600">{t("me_onboarding_retryHintWriteConflictOrRate")}</p>
                    <button
                      type="button"
                      className={btnSecondaryClass}
                      aria-busy={payLoading}
                      disabled={
                        payLoading ||
                        (onboardingWriteRateLimited(payErrCode) &&
                          payRetrySecsLeft != null &&
                          payRetrySecsLeft > 0)
                      }
                      onClick={() => void onCreatePaymentIntent()}
                      data-testid="me-onboarding-retry-payment-intent"
                    >
                      {t("me_onboarding_retryAction")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {payJson != null ? (
              <pre
                className="mt-3 max-h-48 overflow-auto rounded-[var(--radius-sm)] border border-ink-100 bg-ink-50/80 p-3 text-meta text-ink-800 whitespace-pre-wrap break-words"
                aria-label={t("me_onboarding_aria_paymentIntentJson")}
              >
                {JSON.stringify(payJson, null, 2)}
              </pre>
            ) : null}
            {(() => {
              const checkoutUrl = onboardingCheckoutUrlFromResponse(payJson);
              if (checkoutUrl) {
                return (
                  <div className="mt-4 rounded-[var(--radius-sm)] border border-ink-200 bg-white p-4">
                    <h3 className="text-small font-semibold text-ink-900">{t("me_onboarding_stripeCheckoutTitle")}</h3>
                    <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_stripeCheckoutHint")}</p>
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btnPrimaryClass} mt-3 inline-flex items-center justify-center no-underline`}
                    >
                      {t("me_onboarding_stripeCheckoutOpen")}
                      <span className="sr-only"> {t("me_onboarding_stripeCheckoutNewTabSrOnly")}</span>
                    </a>
                  </div>
                );
              }
              const cs = onboardingClientSecretFromResponse(payJson);
              if (!cs) return null;
              return (
                <div className="mt-4 rounded-[var(--radius-sm)] border border-ink-200 bg-white p-4">
                  <h3 className="text-small font-semibold text-ink-900">{t("me_onboarding_stripePayTitle")}</h3>
                  <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_stripePayHint")}</p>
                  <StripeOnboardingPayment
                    clientSecret={cs}
                    onComplete={() => void loadEntitlements()}
                    submitLabel={t("me_onboarding_stripeSubmit")}
                    submitBusyLabel={t("me_onboarding_loading")}
                    missingPkMessage={t("me_onboarding_stripeMissingPk")}
                  />
                </div>
              );
            })()}
            <h3 className="mt-6 text-small font-semibold text-ink-900">{t("me_onboarding_roleConfirmSection")}</h3>
            <p className="mt-1 text-meta text-ink-600">{t("me_onboarding_roleConfirmHint")}</p>
            {roleErr ? (
              <div className="mt-3 space-y-2">
                <p className="text-small text-red-700" role="alert">
                  {roleErr}
                </p>
                {onboardingWriteRetryable(roleErrCode) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {onboardingWriteRateLimited(roleErrCode) && roleRetrySecsLeft != null ? (
                      <p className="text-meta text-ink-600" aria-live="polite">
                        {t("me_onboarding_retryAfterCountdown", { n: roleRetrySecsLeft })}
                      </p>
                    ) : null}
                    <p className="text-meta text-ink-600">{t("me_onboarding_retryHintWriteConflictOrRate")}</p>
                    <button
                      type="button"
                      className={btnSecondaryClass}
                      aria-busy={roleLoading}
                      disabled={
                        roleLoading ||
                        (onboardingWriteRateLimited(roleErrCode) &&
                          roleRetrySecsLeft != null &&
                          roleRetrySecsLeft > 0)
                      }
                      onClick={() => void onRequestRoleConfirm()}
                      data-testid="me-onboarding-retry-role-confirm"
                    >
                      {t("me_onboarding_retryAction")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            {roleJson != null ? (
              <pre
                className="mt-3 max-h-48 overflow-auto rounded-[var(--radius-sm)] border border-ink-100 bg-ink-50/80 p-3 text-meta text-ink-800 whitespace-pre-wrap break-words"
                aria-label={t("me_onboarding_aria_roleConfirmJson")}
              >
                {JSON.stringify(roleJson, null, 2)}
              </pre>
            ) : null}
          </section>
        ) : null}

        <p className="text-meta text-ink-600">
          <Link href="/me/identities" className={footerLinkClass}>
            {t("me_onboarding_backIdentities")}
          </Link>
        </p>

        <div className="border-t border-ink-200 pt-6">
          <ProductCrossNav ariaLabelKey="me_onboarding_relatedNav_aria" showGuides />
        </div>
      </div>
    </main>
  );
}
