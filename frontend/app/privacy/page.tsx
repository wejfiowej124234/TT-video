"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 隐私政策页：核心表述与《对外口径包》08-4 第 3 章（证据、数据主权等）一致；
 * 完整隐私政策以法务定稿为准。文档版本与定稿日期见 08-4 文末。
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" aria-label={t("privacy_title")}>
      <div className="max-w-2xl mx-auto prose prose-ink">
        <h1 className="text-h3 font-semibold text-ink-900">{t("privacy_title")}</h1>

        <p className="text-meta text-ink-600 mt-2">
          {t("privacy_intro")}
        </p>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("privacy_section1Title")}</h2>
        <ul className="list-disc pl-5 space-y-1 text-small text-ink-700">
          <li>{t("privacy_section1Bullet1")}</li>
          <li>{t("privacy_section1Bullet2")}</li>
        </ul>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("privacy_section2Title")}</h2>
        <ul className="list-disc pl-5 space-y-1 text-small text-ink-700">
          <li>{t("privacy_section2Bullet1")}</li>
          <li>{t("privacy_section2Bullet2")}</li>
        </ul>

        <p className="text-meta text-ink-600 mt-8">
          {t("privacy_footerNote")}
        </p>

        <p className="mt-4">
          <Link
            href="/"
            className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("privacy_backHome")}
          </Link>
          {" · "}
          <Link
            href="/terms"
            className={`text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("help_terms")}
          </Link>
        </p>
      </div>
    </main>
  );
}
