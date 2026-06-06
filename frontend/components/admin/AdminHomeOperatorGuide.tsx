"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_STEP_MARKER_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** ① L5：首页操作指引（业务语言，非 Phase/API 术语）。 */
export function AdminHomeOperatorGuide() {
  const { t } = useTranslation();

  const steps = [
    "admin_home_guide_step1",
    "admin_home_guide_step2",
    "admin_home_guide_step3",
  ] as const;

  return (
    <AdminWarmL5Surface
      as="section"
      innerClassName="sm:p-6"
      aria-label={t("admin_home_guide_aria")}
      data-tt-admin-home-guide="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-body-l font-semibold text-ink-900">{t("admin_home_guide_title")}</h2>
        <Link
          href="/admin/operator-guide"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_home_guide_full_link")}
        </Link>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((key, i) => (
          <li key={key} className="flex gap-3 text-small text-ink-700">
            <span className={`${ADMIN_STEP_MARKER_CLASS} h-6 w-6 text-meta`} aria-hidden>
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{t(key)}</span>
          </li>
        ))}
      </ol>
    </AdminWarmL5Surface>
  );
}
