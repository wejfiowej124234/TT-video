"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  clearGetMeCache,
  getApiRetryAfterSeconds,
  getMeFull,
  getMeStewardApplication,
  getOnboardingEntitlementsMe,
  getOnboardingQuote,
  isMeFullRequestError,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import {
  deriveOnboardingFlowPhase,
  onboardingEntitlementPaidForRole,
  onboardingRoleConfirmedForQuote,
  parseOnboardingEntitlementsView,
  parseOnboardingQuoteView,
  parseOnboardingRoleConfirmView,
  type OnboardingEntitlementsView,
  type OnboardingFlowPhase,
} from "@/lib/me/meOnboardingViewModel";
import { parseStewardApplicationStakeView } from "@/lib/steward/parseStewardApplicationView";
import {
  apiThrownCode,
  jurisdictionsCsvFromQuoteJson,
  newOnboardingIdempotencyKey,
  onboardingReturnUrlForCheckout,
} from "@/app/me/onboarding/meOnboardingPageHelpers";
import { isStewardBTrackComplete, isStewardBTrackPaid } from "@/lib/steward/stewardBTrackModel";

/**
 * Steward workbench **B-track admission fee** hook (USDC · role confirm).
 *
 * **Naming note (①):** code uses `bTrack` / `BTrack` = **USDC platform admission** (customer UI **Track A**).
 * TTG Seat stake is **A-track** in customer UI — see `stewardBTrackModel.ts` and
 * `docs/spec/artifacts/onboarding-fee-schedule.v1.md` «客户可见 UI 命名».
 */
export function useStewardOnboardingBTrack(enabled: boolean) {
  const { t } = useTranslation();
  const [quoteJson, setQuoteJson] = useState<unknown | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [quoteErrCode, setQuoteErrCode] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
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
  const [payRetryUntilMs, setPayRetryUntilMs] = useState<number | null>(null);
  const [roleRetryUntilMs, setRoleRetryUntilMs] = useState<number | null>(null);
  const [rateLimitTick, setRateLimitTick] = useState(0);
  const [mePayload, setMePayload] = useState<unknown | null>(null);

  const entitlements = useMemo(() => parseOnboardingEntitlementsView(entJson), [entJson]);
  const quote = useMemo(
    () => parseOnboardingQuoteView(quoteJson, "region_steward"),
    [quoteJson],
  );
  const roleConfirm =
    parseOnboardingRoleConfirmView(roleJson) ??
    (onboardingRoleConfirmedForQuote(mePayload, "region_steward")
      ? { role: "region_steward", userRole: "region_steward", implementationStatus: null }
      : null);
  const hasActivePaid = onboardingEntitlementPaidForRole(entitlements, "region_steward");
  const roleConfirmed = roleConfirm?.userRole != null;
  const bTrackComplete = isStewardBTrackComplete({ entitlements, mePayload });
  const bTrackPaid = isStewardBTrackPaid(entitlements);

  const flowPhase: OnboardingFlowPhase = deriveOnboardingFlowPhase({
    loggedIn: enabled,
    quoteReady: quote != null && !quoteErr,
    hasActivePaid,
    hasPaymentDraft: payJson != null,
    roleConfirmed,
  });

  useEffect(() => {
    const anyActive = [payRetryUntilMs, roleRetryUntilMs].some(
      (u) => u != null && u > Date.now(),
    );
    if (!anyActive) return;
    const id = window.setInterval(() => setRateLimitTick((x) => x + 1), 500);
    return () => window.clearInterval(id);
  }, [payRetryUntilMs, roleRetryUntilMs]);

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
    if (!enabled) return;
    setQuoteLoading(true);
    setQuoteErr(null);
    setQuoteErrCode(null);
    void (async () => {
      try {
        let quoteQuery: { jurisdictions?: string } | undefined;
        try {
          const raw = await getMeStewardApplication();
          const app = parseStewardApplicationStakeView(raw);
          if (app?.jurisdictions.length) {
            quoteQuery = { jurisdictions: app.jurisdictions.join(",") };
          }
        } catch {
          /* until application exists */
        }
        const d = await getOnboardingQuote("region_steward", quoteQuery);
        setQuoteJson(d);
        setQuoteErrCode(null);
      } catch (e) {
        setQuoteErrCode(apiThrownCode(e));
        setQuoteErr(mapApiReadError(e, t, "me_onboarding_quoteFailed"));
        setQuoteJson(null);
      } finally {
        setQuoteLoading(false);
      }
    })();
  }, [enabled, t]);

  const loadEntitlements = useCallback(async () => {
    if (!enabled) return;
    setEntLoading(true);
    setEntErr(null);
    try {
      const d = await getOnboardingEntitlementsMe();
      setEntJson(d);
    } catch (e) {
      setEntErr(mapApiReadError(e, t, "me_onboarding_entitlementsFailed"));
      setEntJson(null);
    } finally {
      setEntLoading(false);
    }
  }, [enabled, t]);

  const loadMe = useCallback(async () => {
    if (!enabled) return;
    try {
      const me = await getMeFull({ force: false });
      setMePayload(me);
    } catch (e) {
      if (!isMeFullRequestError(e)) setMePayload(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setQuoteJson(null);
      setEntJson(null);
      setMePayload(null);
      setPayJson(null);
      setRoleJson(null);
      return;
    }
    void loadQuote();
    void loadEntitlements();
    void loadMe();
  }, [enabled, loadQuote, loadEntitlements, loadMe]);

  useEffect(() => {
    if (!enabled || payJson == null) return;
    void loadEntitlements();
  }, [enabled, payJson, loadEntitlements]);

  const onCreatePaymentIntent = useCallback(async () => {
    if (!enabled) return;
    setPayLoading(true);
    setPayErr(null);
    setPayErrCode(null);
    setPayJson(null);
    try {
      const body: {
        role: "region_steward";
        return_url?: string;
        jurisdictions?: string;
      } = {
        role: "region_steward",
        return_url: onboardingReturnUrlForCheckout("region_steward"),
      };
      const fromQuote = jurisdictionsCsvFromQuoteJson(quoteJson);
      if (fromQuote) body.jurisdictions = fromQuote;
      else {
        try {
          const raw = await getMeStewardApplication();
          const app = parseStewardApplicationStakeView(raw);
          if (app?.jurisdictions.length) {
            body.jurisdictions = app.jurisdictions.join(",");
          }
        } catch {
          /* API may 400 */
        }
      }
      const d = await postOnboardingPaymentIntent(body, newOnboardingIdempotencyKey());
      setPayJson(d);
      setPayErrCode(null);
      setPayRetryUntilMs(null);
      await loadEntitlements();
    } catch (e) {
      setPayErrCode(apiThrownCode(e));
      setPayErr(mapApiReadError(e, t, "me_onboarding_paymentIntentFailed"));
      const ra = getApiRetryAfterSeconds(e);
      setPayRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
    } finally {
      setPayLoading(false);
    }
  }, [enabled, quoteJson, t, loadEntitlements]);

  const onRequestRoleConfirm = useCallback(async () => {
    if (!enabled) return;
    setRoleLoading(true);
    setRoleErr(null);
    setRoleErrCode(null);
    setRoleJson(null);
    try {
      const d = await postOnboardingRoleConfirm("region_steward", newOnboardingIdempotencyKey());
      setRoleJson(d);
      setRoleErrCode(null);
      setRoleRetryUntilMs(null);
      clearGetMeCache();
      const me = await getMeFull({ force: true });
      setMePayload(me);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("traveltrust:profile-updated"));
      }
      await loadEntitlements();
    } catch (e) {
      setRoleErrCode(apiThrownCode(e));
      setRoleErr(mapApiReadError(e, t, "me_onboarding_roleConfirmFailed"));
      const ra = getApiRetryAfterSeconds(e);
      setRoleRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
    } finally {
      setRoleLoading(false);
    }
  }, [enabled, t, loadEntitlements]);

  const loading = quoteLoading || entLoading;

  return {
    t,
    loading,
    quote,
    quoteErr,
    quoteLoading,
    loadQuote,
    entitlements: entitlements as OnboardingEntitlementsView | null,
    entErr,
    entLoading,
    loadEntitlements,
    bTrackPaid,
    bTrackComplete,
    flowPhase,
    hasActivePaid,
    roleConfirmed,
    payLoading,
    payErr,
    payErrCode,
    payJson,
    onCreatePaymentIntent,
    roleLoading,
    roleErr,
    roleErrCode,
    roleJson,
    onRequestRoleConfirm,
    payRetrySecsLeft,
    roleRetrySecsLeft,
  };
}
