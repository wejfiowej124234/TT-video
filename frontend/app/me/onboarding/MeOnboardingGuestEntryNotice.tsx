"use client";

import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

import type { MeOnboardingFromContext } from "./meOnboardingGuestAccess";

type T = (key: string) => string;

const FROM_HINT_KEYS: Record<MeOnboardingFromContext, string> = {
  steward_pending: "me_onboarding_guestEntry_stewardPending",
  steward_register: "me_onboarding_guestEntry_stewardRegister",
  provider_register: "me_onboarding_guestEntry_providerRegister",
  provider_pending: "me_onboarding_guestEntry_providerPending",
  identities_hub: "me_onboarding_guestEntry_identitiesHub",
};

export function MeOnboardingGuestEntryNotice({ t, from }: { t: T; from: MeOnboardingFromContext }) {
  return (
    <p
      className={`mt-4 ${TT_ME_ONBOARDING_L5.journeyBridge}`}
      role="note"
      data-tt-me-onboarding-guest-entry="1"
    >
      {t(FROM_HINT_KEYS[from])}
    </p>
  );
}
