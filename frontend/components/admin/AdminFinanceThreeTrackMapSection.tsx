"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { FINANCE_THREE_TRACK_LANES } from "@/lib/admin/financeOpsL5";
import { ADMIN_CONSOLE_CALLOUT_LINK_CLASS, ADMIN_FILTER_CARD_CLASS, ADMIN_TEXT_META_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** Batch-11 HU-396 · 财务中心三轨地图（USDC / Stripe / 增长积分） */
export function AdminFinanceThreeTrackMapSection() {
  const { t } = useTranslation();

  return (
    <section
      className={`mb-4 ${ADMIN_FILTER_CARD_CLASS}`}
      data-tt-admin-fin-three-track-map="1"
      aria-label={t("admin_fin_three_track_title")}
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_fin_three_track_title")}</h2>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_fin_three_track_lead")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {FINANCE_THREE_TRACK_LANES.map((lane) => (
          <AdminWarmL5Surface
            as="li"
            key={lane.id}
            className="flex flex-col"
            data-tt-admin-fin-three-track-lane={lane.id}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-body font-medium text-ink-900">{t(lane.titleKey)}</h3>
              {lane.badgeKey ? (
                <span className="rounded border border-ink-300 px-1.5 py-0.5 text-meta text-ink-700">
                  {t(lane.badgeKey)}
                </span>
              ) : null}
            </div>
            <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t(lane.hintKey)}</p>
            <Link
              href={lane.primaryHref}
              className={`mt-2 inline-block text-small font-medium ${ADMIN_CONSOLE_CALLOUT_LINK_CLASS} ${touchTargetLink44Classes}`}
              data-tt-admin-fin-three-track-primary={lane.id}
            >
              {t("admin_fin_three_track_open_primary")}
            </Link>
            {lane.secondaryHref && lane.secondaryLabelKey ? (
              <Link
                href={lane.secondaryHref}
                className={`mt-1 inline-block text-meta underline text-ref-sun ${touchTargetLink44Classes}`}
                data-tt-admin-fin-three-track-secondary={lane.id}
              >
                {t(lane.secondaryLabelKey)}
              </Link>
            ) : null}
          </AdminWarmL5Surface>
        ))}
      </ul>
    </section>
  );
}
