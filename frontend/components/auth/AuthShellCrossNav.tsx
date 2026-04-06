"use client";

import { ProductCrossNav } from "@/components/nav/ProductCrossNav";

/** 07 §5.0 / §5.2A：登录注册壳层底部全站交叉入口（市场、订单、支付、费路由、TravelTrust） */
export default function AuthShellCrossNav() {
  return (
    <ProductCrossNav
      ariaLabelKey="auth_shell_relatedNav_aria"
      showGuides
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-500 px-2 w-full max-w-lg"
    />
  );
}
