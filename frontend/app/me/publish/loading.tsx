"use client";

import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { useTranslation } from "@/components/LocaleProvider";
import { TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";

export default function PublishHubLoading() {
  const { t } = useTranslation();
  return (
    <main
      className={TT_PUBLISH_HUB_L5.pageShell}
      aria-busy="true"
      aria-label={t("publish_hub_loading_aria")}
      data-tt-publish-hub-loading="1"
      data-tt-auth-visual="l5"
    >
      <AuthL5PageBackdrop />
      <div className={TT_PUBLISH_HUB_L5.pageColumn}>
        <p className="text-meta text-slate-500" role="status">
          {t("common_loading")}
        </p>
      </div>
    </main>
  );
}
