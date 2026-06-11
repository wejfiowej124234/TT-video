"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const PRODUCT_CROSS_NAV_DEFAULT_LINK = `inline-flex min-h-[44px] items-center justify-center text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`;

export type ProductCrossNavCoreProps = {
  /** 已翻译的 `<nav aria-label>`（用于 global-error 等无 LocaleProvider 场景） */
  navAriaLabel: string;
  t: (key: string) => string;
  className?: string;
  linkClassName?: string;
  separatorClassName?: string;
  showGuides?: boolean;
  /** 首页页脚已在「技术」栏展示费路由时设为 true，避免底栏重复 */
  hideFeeRouterLinks?: boolean;
  /** segment error 边界壳挂载 ProductCrossNav（机读锚点） */
  errorBoundaryCrossNavMarker?: boolean;
};

export type ProductCrossNavProps = Omit<ProductCrossNavCoreProps, "navAriaLabel" | "t"> & {
  /** i18n key for `<nav>` landmark（07 §5.2 / §5.2A） */
  ariaLabelKey: string;
};

function Sep({ className }: { className: string }) {
  return (
    <span className={`select-none ${className}`} aria-hidden>
      ·
    </span>
  );
}

/** 全站主链交叉入口：供 global-error、error 回退路径等注入字典 */
export function ProductCrossNavCore({
  navAriaLabel,
  t,
  className = "mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500",
  linkClassName = PRODUCT_CROSS_NAV_DEFAULT_LINK,
  separatorClassName = "text-ink-300",
  showGuides = false,
  hideFeeRouterLinks = false,
  errorBoundaryCrossNavMarker = false,
}: ProductCrossNavCoreProps) {
  return (
    <nav
      className={className}
      aria-label={navAriaLabel}
      {...(errorBoundaryCrossNavMarker ? { "data-tt-error-boundary-cross-nav": "1" } : {})}
    >
      <Link href="/" className={linkClassName}>
        {t("itin_nav_home")}
      </Link>
      <Sep className={separatorClassName} />
      <Link href="/market" className={linkClassName}>
        {t("header_market")}
      </Link>
      <Sep className={separatorClassName} />
      <Link href="/orders" className={linkClassName}>
        {t("itin_nav_orders")}
      </Link>
      <Sep className={separatorClassName} />
      <Link href="/pay" className={linkClassName}>
        {t("header_payHub")}
      </Link>
      {showGuides ? (
        <>
          <Sep className={separatorClassName} />
          <Link href="/guides" className={linkClassName}>
            {t("nav_guides")}
          </Link>
        </>
      ) : null}
      <Sep className={separatorClassName} />
      <Link href="/help" className={linkClassName}>
        {t("help_title")}
      </Link>
      <Sep className={separatorClassName} />
      <Link href="/trust" className={linkClassName}>
        {t("trust_nav_short")}
      </Link>
      {!hideFeeRouterLinks ? (
        <>
          <Sep className={separatorClassName} />
          <Link href="/governance/fee-routes" className={linkClassName}>
            {t("footer_link_governance_fee_routes")}
          </Link>
          <Sep className={separatorClassName} />
          <Link href="/traveltrust#fee-router" className={linkClassName}>
            {t("traveltrust_link_feeRouter")}
          </Link>
        </>
      ) : null}
    </nav>
  );
}

/** 全站主链交叉入口：市场 / 订单 / 支付 / 帮助 / 治理费路由 / TravelTrust FeeRouter（Target 叙事） */
export function ProductCrossNav({ ariaLabelKey, ...rest }: ProductCrossNavProps) {
  const { t } = useTranslation();
  return <ProductCrossNavCore navAriaLabel={t(ariaLabelKey)} t={t} {...rest} />;
}
