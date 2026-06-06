export function jurisdictionsCsvFromQuoteJson(quote: unknown): string | undefined {
  if (!quote || typeof quote !== "object") return undefined;
  const bd = (quote as Record<string, unknown>).jurisdiction_breakdown;
  if (!Array.isArray(bd)) return undefined;
  const ids = bd
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const j = (row as Record<string, unknown>).jurisdiction;
      return typeof j === "string" && j.trim().length > 0 ? j.trim().toUpperCase() : null;
    })
    .filter((j): j is string => j != null);
  return ids.length > 0 ? ids.join(",") : undefined;
}

export function onboardingClientSecretFromResponse(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const psp = o.psp;
  if (!psp || typeof psp !== "object") return null;
  const cs = (psp as Record<string, unknown>).client_secret;
  return typeof cs === "string" && cs.length > 0 ? cs : null;
}

export function onboardingCheckoutUrlFromResponse(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const psp = o.psp;
  if (!psp || typeof psp !== "object") return null;
  const u = (psp as Record<string, unknown>).checkout_url;
  return typeof u === "string" && u.startsWith("http") ? u : null;
}

import type { OnboardingQuoteRole } from "@/lib/apiClient";

export function parseOnboardingQuoteRoleParam(raw: string | null): OnboardingQuoteRole {
  return raw === "region_steward" ? "region_steward" : "provider";
}

/** SSR/CSR 同源：固定 UTC 展示，避免 `toLocaleString()` hydration 分叉 */
export function formatOnboardingQuoteExpiresAtUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

export function onboardingReturnUrlForCheckout(role: OnboardingQuoteRole = "provider"): string | undefined {
  if (typeof window === "undefined") return undefined;
  const base = `${window.location.origin}/me/onboarding`;
  return role === "region_steward" ? `${base}?role=region_steward` : base;
}

export function apiThrownCode(e: unknown): string | null {
  return e instanceof Error && e.message.length > 0 ? e.message : null;
}

export function onboardingQuoteRetryable(code: string | null): boolean {
  return code === "onboarding_quote_rate_limited";
}

export function onboardingWriteRetryable(code: string | null): boolean {
  return code === "onboarding_idempotency_conflict" || code === "onboarding_user_write_rate_limited";
}

export function onboardingWriteRateLimited(code: string | null): boolean {
  return code === "onboarding_user_write_rate_limited";
}

export function newOnboardingIdempotencyKey(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `idem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function onboardingIdempotencyKeyFromResponse(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const k = (p as Record<string, unknown>).idempotency_key;
  return typeof k === "string" && k.trim().length > 0 ? k.trim() : null;
}

/** ① 本地开发工具区（须 `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1` 且 API `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`）。 */
export function onboardingLocalDevToolsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS === "1";
}

const STRIPE_RETURN_QUERY_KEYS = [
  "session_id",
  "payment_intent",
  "payment_intent_client_secret",
  "redirect_status",
] as const;

/** Stripe Checkout / Elements 回跳常见 query；用于触发资格自动同步。 */
export function isOnboardingStripeReturnQuery(
  params: Pick<URLSearchParams, "has"> | { get: (key: string) => string | null },
): boolean {
  return STRIPE_RETURN_QUERY_KEYS.some((k) => params.has(k));
}

export function stripOnboardingStripeReturnQueryFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  let changed = false;
  for (const k of STRIPE_RETURN_QUERY_KEYS) {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
  return changed;
}
