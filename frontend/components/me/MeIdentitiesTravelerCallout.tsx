"use client";

import Link from "next/link";
import { useHeaderSession } from "@/components/header/headerSession";
import { useTranslation } from "@/components/LocaleProvider";
import { meTrustStateLabelKey } from "@/components/me/meTrustSectionLabels";
import { TT_ME_IDENTITIES_L5 } from "@/lib/me/meIdentitiesL5";
import type { MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const travelerLinkClass = `${touchTargetLink44Classes} ${TT_ME_IDENTITIES_L5.travelerCalloutLink}`;

function travelerStatusPillClass(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return TT_ME_IDENTITIES_L5.cardStatusPillActive;
    case "pending":
      return TT_ME_IDENTITIES_L5.cardStatusPillPending;
    case "restricted":
      return TT_ME_IDENTITIES_L5.cardStatusPillRestricted;
    default:
      return TT_ME_IDENTITIES_L5.cardStatusPillPending;
  }
}

/** 旅行者默认身份：未登录引导注册；已登录说明已开通并链社区资料。 */
export function MeIdentitiesTravelerCallout({
  registerHref,
  loginHref,
  statusLabel = null,
  statusState = null,
}: {
  registerHref: string;
  loginHref: string;
  statusLabel?: string | null;
  statusState?: MeIdentitySlotState | null;
}) {
  const { t } = useTranslation();
  const { sessionUser, mounted, checking } = useHeaderSession();
  const signedIn = mounted && !checking && !!sessionUser;
  const showStatus = signedIn && statusLabel && statusState;

  return (
    <aside className={TT_ME_IDENTITIES_L5.travelerCallout} data-tt-me-identities-traveler-callout="1">
      {showStatus ? (
        <span className={TT_ME_IDENTITIES_L5.cardStatusRow}>
          <span className={travelerStatusPillClass(statusState)}>{statusLabel}</span>
        </span>
      ) : null}
      <span className={TT_ME_IDENTITIES_L5.travelerCalloutTitle}>
        {t(signedIn ? "me_identities_traveler_callout_title_active" : "me_identities_traveler_callout_title")}
      </span>
      <span className={TT_ME_IDENTITIES_L5.travelerCalloutBody}>
        {t(signedIn ? "me_identities_traveler_callout_body_active" : "me_identities_traveler_callout_body")}
      </span>
      <div className={TT_ME_IDENTITIES_L5.travelerCalloutActions}>
        {signedIn ? (
          <>
            <Link href="/me/settings/profile" className={travelerLinkClass}>
              {t("me_identities_traveler_callout_profile")}
            </Link>
            <Link href="/orders" className={travelerLinkClass}>
              {t("me_identities_traveler_callout_orders")}
            </Link>
          </>
        ) : (
          <>
            <Link href={registerHref} className={travelerLinkClass}>
              {t("me_identities_traveler_callout_register")}
            </Link>
            <Link href={loginHref} className={travelerLinkClass}>
              {t("auth_login_title")}
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
