"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  resolveGuidesTriangle,
  type GuidesTriangleVertexId,
} from "@/lib/admin/guidesTriangleL5";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
  ADMIN_TEXT_META_CLASS,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
} from "@/lib/adminUi";

type Props = {
  current: GuidesTriangleVertexId;
};

/** Batch-11 HU-367 / HU-416 · 向导三角 IA（目录 / 入驻队列 / 官方攻略） */
export function AdminGuidesTriangleStrip({ current }: Props) {
  const { t } = useTranslation();
  const pack = resolveGuidesTriangle(current);

  return (
    <aside
      className={`mb-4 rounded-[var(--radius-md)] border border-ref-sun/40 bg-bg-console/50 px-4 py-3 ${ADMIN_FILTER_CARD_CLASS}`}
      role="navigation"
      aria-label={t("admin_guides_triangle_aria")}
      data-tt-admin-guides-triangle="1"
      data-tt-admin-guides-triangle-current={current}
      data-tt-admin-guides-triangle-policy={pack.policy}
    >
      <p className="text-body font-medium text-ink-800">{t("admin_guides_triangle_title")}</p>
      <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t("admin_guides_triangle_lead")}</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3" data-tt-admin-guides-triangle-lanes="1">
        {pack.vertices.map((v) => {
          const active = v.id === current;
          return (
            <li
              key={v.id}
              className={`rounded-[var(--radius-md)] border px-3 py-2 ${
                active ? "border-ref-sun/60 bg-bg-elevated/40" : "border-ink-200"
              }`}
              data-tt-admin-guides-triangle-lane={v.id}
              data-tt-admin-guides-triangle-lane-active={active ? "1" : "0"}
            >
              <p className="text-small font-medium text-ink-900">{t(v.titleKey)}</p>
              <p className={`mt-1 ${ADMIN_TEXT_META_CLASS}`}>{t(v.roleKey)}</p>
              <p className={`mt-1 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}>{t(v.notKey)}</p>
              {active ? (
                <p
                  className={`mt-2 text-meta font-medium text-ink-700`}
                  data-tt-admin-guides-triangle-you-are-here="1"
                >
                  {t("admin_guides_triangle_here")}
                </p>
              ) : (
                <Link
                  href={v.href}
                  className={`mt-2 inline-flex ${
                    v.id === "directory"
                      ? adminTableRowPrimaryActionClass()
                      : adminTableRowSecondaryActionClass()
                  }`}
                  data-tt-admin-guides-triangle-cta={v.id}
                >
                  {t("admin_guides_triangle_open")}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
