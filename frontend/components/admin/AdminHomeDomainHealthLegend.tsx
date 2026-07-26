"use client";

import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
  ADMIN_TEXT_FOOTNOTE_CLASS,
} from "@/lib/adminUi";

/** HU-435 · 首屏色点图例（绿=健康 · 黄=有待办 · 灰=暂无数据） */
const LEGEND_ITEMS = [
  {
    tone: "ok",
    labelKey: "admin_home_domain_health_legend_ok",
    dotClass: ADMIN_DOMAIN_HEALTH_OK_DOT_CLASS,
  },
  {
    tone: "attention",
    labelKey: "admin_home_domain_health_legend_attention",
    dotClass: ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  },
  {
    tone: "empty",
    labelKey: "admin_home_domain_health_legend_empty",
    dotClass: ADMIN_DOMAIN_HEALTH_UNKNOWN_DOT_CLASS,
  },
] as const;

export function AdminHomeDomainHealthLegend(props: {
  /** 速览旁注 · 更紧凑 */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { compact = false } = props;

  return (
    <ul
      className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 ${ADMIN_TEXT_FOOTNOTE_CLASS}`}
      aria-label={t("admin_home_domain_health_legend_aria")}
      data-tt-admin-domain-health-legend-visual="1"
      data-tt-admin-domain-health-legend-compact={compact ? "1" : undefined}
    >
      {LEGEND_ITEMS.map((item) => (
        <li
          key={item.tone}
          className="inline-flex items-center gap-1.5"
          data-tt-admin-domain-health-legend-tone={item.tone}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${item.dotClass}`} aria-hidden />
          <span className="text-meta">{t(item.labelKey)}</span>
        </li>
      ))}
    </ul>
  );
}
