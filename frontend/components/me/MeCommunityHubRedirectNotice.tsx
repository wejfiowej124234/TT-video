"use client";

import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  consumeMeCommunityHubRedirectNoticePending,
  dismissMeCommunityHubRedirectNotice,
} from "@/lib/me/meCommunityHubRedirectNotice";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses } from "@/lib/travelLinkFocus";

/** RP-015 · one-time copy after `/community/me` redirect → `/me/settings/profile`. */
export function MeCommunityHubRedirectNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(consumeMeCommunityHubRedirectNoticePending());
  }, []);

  if (!visible) return null;

  return (
    <div
      className={TT_ME_SETTINGS_L5.sectionCallout}
      role="status"
      aria-live="polite"
      data-tt-me-community-hub-redirect-notice="1"
    >
      <p className="text-small text-slate-200">{t("me_community_hub_redirect_notice")}</p>
      <p className="mt-1 text-meta text-slate-400/95">{t("me_community_hub_redirect_notice_hint")}</p>
      <button
        type="button"
        className={`mt-3 text-meta font-medium text-ref-sun underline underline-offset-2 ${authL5InlineLinkFocusClasses}`}
        onClick={() => {
          dismissMeCommunityHubRedirectNotice();
          setVisible(false);
        }}
      >
        {t("me_community_hub_redirect_notice_dismiss")}
      </button>
    </div>
  );
}
