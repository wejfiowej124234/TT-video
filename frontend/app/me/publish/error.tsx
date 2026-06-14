"use client";

import Link from "next/link";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { useTranslation } from "@/components/LocaleProvider";
import { PUBLISH_HUB_PATH, TT_PUBLISH_HUB_L5 } from "@/lib/me/publishHubL5";
import { FOCUS_RING } from "@/components/me/constants";

export default function PublishHubError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <main
      className={TT_PUBLISH_HUB_L5.pageShell}
      aria-label={t("publish_hub_error_aria")}
      data-tt-publish-hub-error="1"
      data-tt-auth-visual="l5"
    >
      <AuthL5PageBackdrop />
      <div className={TT_PUBLISH_HUB_L5.pageColumn}>
        <h1 className={TT_PUBLISH_HUB_L5.title}>{t("publish_hub_error_title")}</h1>
        <p className={TT_PUBLISH_HUB_L5.subtitle}>{t("publish_hub_error_body")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`} onClick={() => reset()}>
            {t("common_retry")}
          </button>
          <Link href={PUBLISH_HUB_PATH} className={`${TT_PUBLISH_HUB_L5.crossNavLink} ${FOCUS_RING}`}>
            {t("publish_hub_title")}
          </Link>
        </div>
      </div>
    </main>
  );
}
