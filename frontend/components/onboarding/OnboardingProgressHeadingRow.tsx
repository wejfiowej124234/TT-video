"use client";

import { TT_AUTH_ONBOARDING_PROGRESS } from "@/lib/onboarding/onboardingProgressChrome";
import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";
import { TT_MARKETING_CONSOLE_LINK_FOCUS } from "@/lib/marketingUi";

export function OnboardingProgressHeadingRow({
  title,
  variant,
  expanded,
  onToggle,
  expandLabel,
  collapseLabel,
  showToggle,
  controlsId,
}: {
  title: string;
  variant: "auth" | "console";
  expanded: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
  showToggle: boolean;
  controlsId: string;
}) {
  const titleClass =
    variant === "console" ? TT_ME_ONBOARDING_L5.progressHeading : TT_AUTH_ONBOARDING_PROGRESS.headingTitle;
  const rowClass =
    variant === "console"
      ? "flex min-h-[44px] items-center justify-between gap-3"
      : TT_AUTH_ONBOARDING_PROGRESS.headingRow;
  const toggleClass =
    variant === "console"
      ? `${TT_ME_ONBOARDING_L5.progressToggle} ${TT_MARKETING_CONSOLE_LINK_FOCUS} inline-flex min-h-[44px] shrink-0 items-center px-1`
      : TT_AUTH_ONBOARDING_PROGRESS.toggleBtn;

  return (
    <div className={rowClass}>
      <p className={titleClass}>{title}</p>
      {showToggle ? (
        <button
          type="button"
          className={toggleClass}
          aria-expanded={expanded}
          aria-controls={controlsId}
          onClick={onToggle}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </div>
  );
}
