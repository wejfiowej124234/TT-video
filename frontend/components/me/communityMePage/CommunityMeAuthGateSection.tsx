"use client";

import Link from "next/link";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_ME_PANEL_L5, TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export default function CommunityMeAuthGateSection({
  t,
  communityMeGuestLoginReturnUrl,
}: {
  t: (key: string) => string;
  communityMeGuestLoginReturnUrl: string;
}) {
  return (
    <section
      data-tt-community-me-surface="community_me_auth_gate"
      data-tt-data-state="invalid"
      className={TT_COMMUNITY_ME_PANEL_L5.authGateShell}
    >
      <p className="text-meta sm:text-body text-slate-400 mb-3 leading-snug">{t("community_me_login_prompt")}</p>
      <Link
        href={`/auth/login?returnUrl=${encodeURIComponent(communityMeGuestLoginReturnUrl)}`}
        className={`${TT_COMMUNITY_PAGE_L5.pill} motion-reduce:transition-none ${communityCardLinkFocus}`}
      >
        {t("me_goLogin")}
      </Link>
    </section>
  );
}
