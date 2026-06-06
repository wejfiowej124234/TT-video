"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_MARKETING_HOME_FOOTER_TECH_CHIP } from "@/lib/marketingUi";

export type TrustInfraWallProps = {
  tone?: "light" | "dark";
  /** 首页页脚左对齐；默认居中 */
  align?: "center" | "start";
};

/** 页面底部可信基建墙（28：极简 3～4 个；随 app locale 切换） */
export default function TrustInfraWall({ tone = "light", align = "center" }: TrustInfraWallProps) {
  const { t } = useTranslation();
  const mutedCls = tone === "dark" ? "text-meta text-slate-400 whitespace-nowrap" : "text-ink-400";
  const strongCls = tone === "dark" ? "font-medium text-slate-200" : "font-medium text-ink-600";
  const chipCls = tone === "dark" ? TT_MARKETING_HOME_FOOTER_TECH_CHIP : "";
  const items = [
    { labelKey: "didRank_badge_polygon", titleKey: "trust_infra_polygon_title", muted: false },
    { labelKey: "order_defaultSettlementToken", titleKey: "trust_infra_usdc_title", muted: false },
    { labelKey: "trust_infra_wc_title", titleKey: "trust_infra_wc_title", muted: false },
    { labelKey: "trust_infra_wall_audited", titleKey: "trust_infra_audited_title", muted: true },
  ];
  const justify = align === "start" ? "justify-start" : "justify-center";
  return (
    <div
      className={`flex flex-wrap items-center ${justify} gap-2 sm:gap-2.5 text-meta ${tone === "dark" ? "text-slate-300/90" : "text-ink-500"}`}
      aria-label={t("trust_infra_aria")}
    >
      {items.map(({ labelKey, titleKey, muted }) => (
        <span
          key={labelKey}
          title={t(titleKey)}
          className={
            tone === "dark" && !muted
              ? chipCls
              : muted
                ? mutedCls
                : strongCls
          }
        >
          {t(labelKey)}
        </span>
      ))}
    </div>
  );
}
