"use client";

import AuthL5CrossNavFooter from "@/components/auth/AuthL5CrossNavFooter";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL } from "@/lib/auth/authL5Shell";

/** Auth 流程页 L5 壳：暗底 + 单列 + 底栏快捷入口 */
export default function AuthL5FlowPage({
  route,
  ariaLabel,
  children,
}: {
  route: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={TT_AUTH_L5_PAGE_SHELL}
      aria-label={ariaLabel}
      data-tt-auth-root="1"
      data-tt-auth-route={route}
      data-tt-auth-visual="l5"
    >
      <AuthL5PageBackdrop />
      <div className={TT_AUTH_L5_PAGE_COLUMN}>
        {children}
        <AuthL5CrossNavFooter />
      </div>
    </main>
  );
}
