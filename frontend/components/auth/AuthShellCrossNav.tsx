"use client";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

const AUTH_CROSS_NAV_CONSOLE =
  "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500 px-2 w-full max-w-lg";

const AUTH_CROSS_NAV_DARK_L5_LINK = `${touchTargetLink44Classes} inline-flex items-center justify-center text-small font-semibold !text-ref-sun underline underline-offset-4 decoration-ref-sun/45 hover:!text-[#fde9a8] hover:decoration-ref-sun/75 transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]`;

/** 07 §5.0 / §5.2A：登录注册壳层底部全站交叉入口（市场、订单、支付、费路由、TravelTrust） */
export default function AuthShellCrossNav({
  variant = "console",
  hideFeeRouterLinks = false,
}: {
  /** `darkL5`：登录 L5 暗底上暖金链（勿用 `text-travel-600` 蓝链） */
  variant?: "console" | "darkL5";
  hideFeeRouterLinks?: boolean;
}) {
  if (variant === "darkL5") {
    return (
      <ProductCrossNav
        ariaLabelKey="auth_shell_relatedNav_aria"
        showGuides
        hideFeeRouterLinks={hideFeeRouterLinks}
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 leading-relaxed px-1 w-full max-w-3xl mx-auto"
        linkClassName={AUTH_CROSS_NAV_DARK_L5_LINK}
        separatorClassName="text-ref-sun/25 select-none"
      />
    );
  }
  return (
    <ProductCrossNav
      ariaLabelKey="auth_shell_relatedNav_aria"
      showGuides
      hideFeeRouterLinks={hideFeeRouterLinks}
      className={AUTH_CROSS_NAV_CONSOLE}
    />
  );
}
