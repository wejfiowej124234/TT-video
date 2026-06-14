import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { stewardAdmissionWorkbenchHref } from "@/lib/steward/stewardAdmissionNav";

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

/** 准入页直链（商家 Console）；主理人 USDC 统一进工作台 A 轨 */
export function meOnboardingHref(
  role: OnboardingQuoteRole,
  opts: { from: MeOnboardingFromContext },
): string {
  if (role === "region_steward") {
    return stewardAdmissionWorkbenchHref(opts.from);
  }
  const q = new URLSearchParams();
  q.set("role", "provider");
  q.set("from", opts.from);
  return `/me/onboarding?${q.toString()}`;
}

/** SSR/CSR 同源：从当前 URL 查询构造登录后回跳路径（禁止读 `window`） */
export function buildMeOnboardingAuthReturnPath(
  searchParams: { toString(): string },
  quoteRole: OnboardingQuoteRole,
): string {
  const q = new URLSearchParams(searchParams.toString());
  if (quoteRole === "region_steward") {
    const fromRaw = q.get("from");
    const from: MeOnboardingFromContext =
      fromRaw === "settings"
        ? "identities_hub"
        : isMeOnboardingFromContext(fromRaw)
          ? fromRaw
          : "identities_hub";
    return stewardAdmissionWorkbenchHref(from);
  }
  if (!q.has("role")) {
    q.set("role", "provider");
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
