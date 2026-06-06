"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_AUTH_L5_CROSS_NAV_LABEL, TT_AUTH_L5_CROSS_NAV_SHELL } from "@/lib/auth/authL5Shell";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";

/** Auth L5 底栏：全站快捷入口 + 暖金链（登录 / 注册共用） */
export default function AuthL5CrossNavFooter({
  hideFeeRouterLinks = false,
  className = "",
}: {
  /** 申请/入驻页隐藏费路由运维链，保留主链 + 信任中心 */
  hideFeeRouterLinks?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`${TT_AUTH_L5_CROSS_NAV_SHELL} ${className}`.trim()}
      data-tt-auth-surface="login_site_cross_nav"
      data-tt-cross-nav-hide-fee-router={hideFeeRouterLinks ? "1" : "0"}
    >
      <p className={TT_AUTH_L5_CROSS_NAV_LABEL}>{t("auth_login_siteNav_label")}</p>
      <AuthShellCrossNav variant="darkL5" hideFeeRouterLinks={hideFeeRouterLinks} />
    </div>
  );
}
