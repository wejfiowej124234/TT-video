import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useHeaderSession } from "@/components/header/headerSession";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getApiRetryAfterSeconds,
  clearGetMeCache,
  getMeFull,
  getMeStewardApplication,
  getOnboardingEntitlementsMe,
  getOnboardingQuote,
  isMeFullRequestError,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
  type OnboardingQuoteRole,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { parseStewardApplicationStakeView } from "@/lib/steward/parseStewardApplicationView";

import {
  apiThrownCode,
  isOnboardingStripeReturnQuery,
  newOnboardingIdempotencyKey,
  onboardingReturnUrlForCheckout,
  jurisdictionsCsvFromQuoteJson,
  parseOnboardingQuoteRoleParam,
  stripOnboardingStripeReturnQueryFromUrl,
} from "./meOnboardingPageHelpers";
import { parseOnboardingEntitlementsView, onboardingRoleConfirmedForQuote } from "@/lib/me/meOnboardingViewModel";

export type UseMeOnboardingPageResult = {
  t: ReturnType<typeof useTranslation>["t"];
  quoteRole: OnboardingQuoteRole;
  setQuoteRole: (r: OnboardingQuoteRole) => void;
  quoteJson: unknown | null;
  quoteErr: string | null;
  quoteErrCode: string | null;
  quoteLoading: boolean;
  loadQuote: () => void;
  quoteRetrySecsLeft: number | null;
  sessionChecked: boolean;
  sessionChecking: boolean;
  loggedIn: boolean;
  entJson: unknown | null;
  entErr: string | null;
  entLoading: boolean;
  loadEntitlements: () => Promise<void>;
  payLoading: boolean;
  payErr: string | null;
  payErrCode: string | null;
  payJson: unknown | null;
  onCreatePaymentIntent: () => Promise<void>;
  roleLoading: boolean;
  roleErr: string | null;
  roleErrCode: string | null;
  roleJson: unknown | null;
  onRequestRoleConfirm: () => Promise<void>;
  payRetrySecsLeft: number | null;
  roleRetrySecsLeft: number | null;
  entAutoSyncing: boolean;
  mePayload: unknown | null;
  roleConfirmedPersisted: boolean;
};

export function useMeOnboardingPage(): UseMeOnboardingPageResult {
  const { t } = useTranslation();
  const { sessionUser, checking, mounted } = useHeaderSession();
  const sessionChecked = mounted && !checking;
  const sessionChecking = mounted && checking;
  const loggedIn = sessionUser != null;

  const searchParams = useSearchParams();
  const roleFromUrl = parseOnboardingQuoteRoleParam(searchParams.get("role"));

  const [quoteRole, setQuoteRoleState] = useState<OnboardingQuoteRole>(roleFromUrl);

  const setQuoteRole = useCallback((role: OnboardingQuoteRole) => {
    setQuoteRoleState(role);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (role === "region_steward") {
      url.searchParams.set("role", "region_steward");
    } else {
      url.searchParams.delete("role");
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    setQuoteRoleState(roleFromUrl);
  }, [roleFromUrl]);
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

  const [quoteRetryUntilMs, setQuoteRetryUntilMs] = useState<number | null>(null);
  const [payRetryUntilMs, setPayRetryUntilMs] = useState<number | null>(null);
  const [roleRetryUntilMs, setRoleRetryUntilMs] = useState<number | null>(null);
  const [rateLimitTick, setRateLimitTick] = useState(0);
  const [entAutoSyncing, setEntAutoSyncing] = useState(false);
  const [mePayload, setMePayload] = useState<unknown | null>(null);

  const stripeCheckoutReturn = isOnboardingStripeReturnQuery(searchParams);
  const roleConfirmedPersisted = onboardingRoleConfirmedForQuote(mePayload, quoteRole);

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
    void (async () => {
      try {
        let quoteQuery: { jurisdictions?: string } | undefined;
        if (quoteRole === "region_steward") {
          try {
            const raw = await getMeStewardApplication();
            const app = parseStewardApplicationStakeView(raw);
            if (app?.jurisdictions.length) {
              quoteQuery = { jurisdictions: app.jurisdictions.join(",") };
            }
          } catch {
            /* quote may 400 onboarding_jurisdictions_required until application exists */
          }
        }
        const d = await getOnboardingQuote(quoteRole, quoteQuery);
        setQuoteJson(d);
        setQuoteErrCode(null);
        setQuoteRetryUntilMs(null);
      } catch (e) {
        if (typeof window !== "undefined") console.error("MeOnboarding quote:", e);
        setQuoteErrCode(apiThrownCode(e));
        setQuoteErr(mapApiReadError(e, t, "me_onboarding_quoteFailed"));
        setQuoteJson(null);
        const ra = getApiRetryAfterSeconds(e);
        setQuoteRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
      } finally {
        setQuoteLoading(false);
      }
    })();
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
    if (!loggedIn) {
      setMePayload(null);
      setEntJson(null);
      setEntErr(null);
      setPayJson(null);
      setRoleJson(null);
      setEntAutoSyncing(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await getMeFull({ force: false });
        if (!cancelled) setMePayload(me);
      } catch (e) {
        if (cancelled) return;
        if (!isMeFullRequestError(e) && typeof window !== "undefined") {
          console.error("MeOnboarding mePayload:", e);
        }
        setMePayload(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn, sessionUser?.id]);

  useEffect(() => {
    if (!sessionChecked || !loggedIn) return;
    void loadEntitlements();
  }, [sessionChecked, loggedIn, loadEntitlements]);

  useEffect(() => {
    if (!loggedIn) return;
    if (payJson == null) return;
    void loadEntitlements();
  }, [loggedIn, payJson, loadEntitlements]);

  useEffect(() => {
    if (!loggedIn || !stripeCheckoutReturn) return;
    stripOnboardingStripeReturnQueryFromUrl();
    setEntAutoSyncing(true);
    void loadEntitlements();
  }, [loggedIn, stripeCheckoutReturn, loadEntitlements]);

  useEffect(() => {
    if (!loggedIn) return;
    const refresh = () => void loadEntitlements();
    window.addEventListener("focus", refresh);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loggedIn, loadEntitlements]);

  useEffect(() => {
    if (!loggedIn) return;
    const hasPaid = parseOnboardingEntitlementsView(entJson)?.hasActivePaid ?? false;
    if (hasPaid) {
      setEntAutoSyncing(false);
      return;
    }
    if (payJson != null || stripeCheckoutReturn) {
      setEntAutoSyncing(true);
    }
  }, [loggedIn, entJson, payJson, stripeCheckoutReturn]);

  useEffect(() => {
    if (!loggedIn || !entAutoSyncing) return;
    const intervalId = window.setInterval(() => void loadEntitlements(), 4000);
    const stopId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setEntAutoSyncing(false);
    }, 90000);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(stopId);
    };
  }, [loggedIn, entAutoSyncing, loadEntitlements]);

  const onCreatePaymentIntent = useCallback(async () => {
    setPayLoading(true);
    setPayErr(null);
    setPayErrCode(null);
    setPayJson(null);
    try {
      const body: {
        role: OnboardingQuoteRole;
        return_url?: string;
        jurisdictions?: string;
      } = {
        role: quoteRole,
        return_url: onboardingReturnUrlForCheckout(quoteRole),
      };
      if (quoteRole === "region_steward") {
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
            /* API may 400 onboarding_jurisdictions_required */
          }
        }
      }
      const d = await postOnboardingPaymentIntent(body, newOnboardingIdempotencyKey());
      setPayJson(d);
      setPayErrCode(null);
      setPayRetryUntilMs(null);
      setEntAutoSyncing(true);
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
  }, [quoteRole, quoteJson, t, loadEntitlements]);

  const onRequestRoleConfirm = useCallback(async () => {
    setRoleLoading(true);
    setRoleErr(null);
    setRoleErrCode(null);
    setRoleJson(null);
    try {
      const d = await postOnboardingRoleConfirm(quoteRole, newOnboardingIdempotencyKey());
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
      if (typeof window !== "undefined") console.error("MeOnboarding role confirm:", e);
      setRoleErrCode(apiThrownCode(e));
      setRoleErr(mapApiReadError(e, t, "me_onboarding_roleConfirmFailed"));
      const ra = getApiRetryAfterSeconds(e);
      setRoleRetryUntilMs(ra != null ? Date.now() + ra * 1000 : null);
    } finally {
      setRoleLoading(false);
    }
  }, [quoteRole, t, loadEntitlements]);

  return {
    t,
    quoteRole,
    setQuoteRole,
    quoteJson,
    quoteErr,
    quoteErrCode,
    quoteLoading,
    loadQuote,
    quoteRetrySecsLeft,
    sessionChecked,
    sessionChecking,
    loggedIn,
    entJson,
    entErr,
    entLoading,
    loadEntitlements,
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
    entAutoSyncing,
    mePayload,
    roleConfirmedPersisted,
  };
}
