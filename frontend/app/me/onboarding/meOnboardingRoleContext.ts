import type { OnboardingQuoteRole } from "@/lib/apiClient";

import { isMeOnboardingFromContext } from "./meOnboardingGuestAccess";

/** 入驻链来源锁定报价角色（商家/主理人分轨进入时不混切） */
export function resolveOnboardingRoleLock(from: string | null | undefined): OnboardingQuoteRole | null {
  if (!isMeOnboardingFromContext(from ?? null)) return null;
  if (from === "provider_pending" || from === "provider_register") return "provider";
  if (from === "steward_pending" || from === "steward_register") return "region_steward";
  return null;
}
