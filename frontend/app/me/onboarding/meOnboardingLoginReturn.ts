import type { OnboardingQuoteRole } from "@/lib/apiClient";

import type { MeOnboardingFromContext } from "./meOnboardingGuestAccess";
import { isMeOnboardingFromContext } from "./meOnboardingGuestAccess";

export type { MeOnboardingFromContext } from "./meOnboardingGuestAccess";

/** 登录 / 深链回到本页（含 role / from 查询） */
export function meOnboardingLoginReturnUrl(
  role: OnboardingQuoteRole,
  opts?: { from?: MeOnboardingFromContext },
): string {
  return meOnboardingHref(role, { from: opts?.from ?? "identities_hub" });
}

/** 准入页直链（须带 `from=` 才允许未登录只读；见 `meOnboardingGuestAccess`） */
export function meOnboardingHref(
  role: OnboardingQuoteRole,
  opts: { from: MeOnboardingFromContext },
): string {
  const q = new URLSearchParams();
  if (role === "region_steward") q.set("role", "region_steward");
  else q.set("role", "provider");
  q.set("from", opts.from);
  return `/me/onboarding?${q.toString()}`;
}

/** SSR/CSR 同源：从当前 URL 查询构造登录后回跳路径（禁止读 `window`） */
export function buildMeOnboardingAuthReturnPath(
  searchParams: { toString(): string },
  quoteRole: OnboardingQuoteRole,
): string {
  const q = new URLSearchParams(searchParams.toString());
  if (!q.has("role")) {
    q.set("role", quoteRole === "region_steward" ? "region_steward" : "provider");
  }
  const fromRaw = q.get("from");
  if (fromRaw !== "settings" && !isMeOnboardingFromContext(fromRaw)) {
    q.set("from", "identities_hub");
  }
  return `/me/onboarding?${q.toString()}`;
}

export function meOnboardingLoginHref(_role: OnboardingQuoteRole, returnPath: string): string {
  return `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`;
}

/** 注册后回到准入页（provider 保留 step-1 role 查询） */
export function meOnboardingRegisterHref(role: OnboardingQuoteRole, returnPath: string): string {
  const returnUrl = encodeURIComponent(returnPath);
  if (role === "provider") {
    return `/auth/register?role=provider&returnUrl=${returnUrl}`;
  }
  return `/auth/register?returnUrl=${returnUrl}`;
}
