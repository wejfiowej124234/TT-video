"use client";

import { useTranslation } from "@/components/LocaleProvider";

/** 页面底部可信基建墙（28：极简 3～4 个；随 app locale 切换） */
export default function TrustInfraWall() {
  const { t } = useTranslation();
  const items = [
    { labelKey: "didRank_badge_polygon", titleKey: "trust_infra_polygon_title", muted: false },
    { labelKey: "order_defaultSettlementToken", titleKey: "trust_infra_usdc_title", muted: false },
    { labelKey: "trust_infra_wc_title", titleKey: "trust_infra_wc_title", muted: false },
    { labelKey: "trust_infra_wall_audited", titleKey: "trust_infra_audited_title", muted: true },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-meta text-ink-500" aria-label={t("trust_infra_aria")}>
      {items.map(({ labelKey, titleKey, muted }) => (
        <span
          key={labelKey}
          title={t(titleKey)}
          className={muted ? "text-ink-400" : "font-medium text-ink-600"}
        >
          {t(labelKey)}
        </span>
      ))}
    </div>
  );
}
