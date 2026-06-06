"use client";

import { Suspense, type ReactNode } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import AuthRouteLoading, { type AuthRouteLoadingVariant } from "@/components/auth/AuthRouteLoading";
import LoginRouteLoading from "@/app/auth/login/LoginRouteLoading";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";

/** `/auth/login`：外层已有 `main` + `AuthShellCrossNav`，内层 `useSearchParams` 须 Suspense（Next 15 · 07 §5.3） */
export function AuthLoginSearchParamsSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoginRouteLoading embedded mainAriaLabelKey="auth_login_title" />}>
      {children}
    </Suspense>
  );
}

const fullBleedMainClass =
  "min-h-screen bg-bg-main flex flex-col items-center justify-center gap-4 p-6 py-10";

/** 注册 / 重置 / 验证等：整页 `main` + 骨架 + 底栏与内层布局一致 */
export function AuthFullBleedSearchParamsSuspense({
  children,
  mainAriaLabelKey,
  variant = "narrow",
}: {
  children: ReactNode;
  mainAriaLabelKey: string;
  variant?: AuthRouteLoadingVariant;
}) {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <main
          className={fullBleedMainClass}
          aria-label={t(mainAriaLabelKey)}
          aria-busy="true"
          role="status"
        >
          <AuthRouteLoading embedded variant={variant} mainAriaLabelKey={mainAriaLabelKey} />
          <AuthShellCrossNav />
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
