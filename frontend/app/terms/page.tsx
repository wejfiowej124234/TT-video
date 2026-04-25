"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * 服务条款页：核心表述与《对外口径包》08-4 第 1～2 章一致；
 * 完整条款以法务定稿为准。文档版本与定稿日期见 08-4 文末。
 */
export default function TermsPage() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-bg-console py-12 px-4" aria-label={t("terms_title")}>
      <div className="max-w-2xl mx-auto prose prose-ink">
        <h1 className="text-h3 font-semibold text-ink-900">{t("terms_title")}</h1>

        <p className="text-meta text-ink-600 mt-2">
          {t("terms_intro")}
        </p>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("terms_section1Title")}</h2>
        <ul className="list-disc pl-5 space-y-1 text-small text-ink-700">
          <li>{t("terms_section1Bullet1")}</li>
          <li>{t("terms_section1Bullet2")}</li>
          <li>{t("terms_section1Bullet3")}</li>
        </ul>

        <h2 className="text-h4 font-medium text-ink-800 mt-6">{t("terms_section2Title")}</h2>
        <ul className="list-disc pl-5 space-y-1 text-small text-ink-700">
          <li>{t("terms_section2Bullet1")}</li>
          <li>{t("terms_section2Bullet2")}</li>
        </ul>

        <p className="text-meta text-ink-600 mt-8">
          {t("terms_footerNote")}
        </p>

        <p className="mt-4">
          <Link
            href="/"
            className={`${touchTargetLink44Classes} text-travel-500 underline-offset-2 transition-colors hover:underline motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("terms_backHome")}
          </Link>
          {" · "}
          <Link
            href="/privacy"
            className={`${touchTargetLink44Classes} text-travel-500 underline-offset-2 transition-colors hover:underline motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("help_privacy")}
          </Link>
        </p>
      </div>
    </main>
  );
}
