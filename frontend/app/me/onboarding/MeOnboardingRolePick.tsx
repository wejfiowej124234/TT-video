import type { OnboardingQuoteRole } from "@/lib/apiClient";
import { TT_MARKETING_FOCUS_RING_CONSOLE } from "@/lib/marketingUi";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

import type { UseMeOnboardingPageResult } from "./useMeOnboardingPage";

type T = UseMeOnboardingPageResult["t"];

export type MeOnboardingRolePickProps = {
  t: T;
  quoteRole: OnboardingQuoteRole;
  setQuoteRole: (r: OnboardingQuoteRole) => void;
  groupAriaLabel: string;
};

export function MeOnboardingRolePick({ t, quoteRole, setQuoteRole, groupAriaLabel }: MeOnboardingRolePickProps) {
  const roleBtn = (role: OnboardingQuoteRole, labelKey: "me_onboarding_roleProvider" | "me_onboarding_roleSteward") => {
    const active = quoteRole === role;
    return (
      <button
        type="button"
        aria-pressed={active}
        onClick={() => setQuoteRole(role)}
        className={`min-h-[44px] flex-1 rounded-[var(--radius-sm)] border px-4 text-small font-semibold transition-[border-color,background-color,box-shadow] sm:flex-none ${TT_MARKETING_FOCUS_RING_CONSOLE} ${
          active ? TT_ME_ONBOARDING_L5.rolePillSelected : TT_ME_ONBOARDING_L5.rolePillIdle
        }`}
      >
        {t(labelKey)}
      </button>
    );
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2 sm:flex-nowrap" role="group" aria-label={groupAriaLabel}>
      {roleBtn("provider", "me_onboarding_roleProvider")}
      {roleBtn("region_steward", "me_onboarding_roleSteward")}
    </div>
  );
}
