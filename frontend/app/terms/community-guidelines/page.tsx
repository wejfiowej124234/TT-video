"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/**
 * 社区规范占位页：正式内容待法务/运营提供后替换（51-H2/51-31-24）。
 * 31 §3.3：社区规范链接从「我的」页链入此处。
 * 页身与 `/terms`、`/privacy`、`/help` 同档（**22** · **`bg-bg-console`**），与 **88 §3.5** 静态信息行一致。
 */
export default function CommunityGuidelinesPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" aria-label={t("community_guidelines")}>
      <div className="mx-auto max-w-2xl prose prose-ink">
        <h1 className="text-h3 font-semibold text-ink-900">{t("community_guidelines")}</h1>
        <p className="mt-2 text-meta text-ink-600">{t("community_guidelines_draft_note")}</p>
        <p className="mt-4 text-small text-ink-700">{t("community_guidelines_content")}</p>

        <div className="not-prose mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/community/me"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-meta font-medium text-white hover:bg-travel-400 motion-sub focus-visible:ring-offset-bg-console ${travelFocusRingCoreOffset2Classes}`}
          >
            {t("me_title")}
          </Link>
          <Link
            href="/community"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 py-2 text-meta font-medium text-ink-800 hover:bg-ink-50 motion-sub focus-visible:ring-offset-bg-console ${travelFocusRingCoreOffset2Classes}`}
          >
            {t("community_tab_feed")}
          </Link>
        </div>

        <p className="not-prose mt-6">
          <Link href="/terms" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("common_terms")}
          </Link>
          {" · "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("terms_backHome")}
          </Link>
        </p>
      </div>
    </main>
  );
}
