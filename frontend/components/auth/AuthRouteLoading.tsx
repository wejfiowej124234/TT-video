"use client";

import { useTranslation } from "@/components/LocaleProvider";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_AUTH_L5_PAGE_COLUMN, TT_AUTH_L5_PAGE_SHELL } from "@/lib/auth/authL5Shell";

export type AuthRouteLoadingVariant = "narrow" | "register";

/**
 * 认证子路由 L5 骨架：暗底 + 暖金玻璃卡脉冲（与 login 同族，无 Console 浅灰闪屏）。
 */
export default function AuthRouteLoading({
  variant = "narrow",
  mainAriaLabelKey = "common_loading",
  embedded = false,
}: {
  variant?: AuthRouteLoadingVariant;
  mainAriaLabelKey?: string;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const fieldRows = variant === "register" ? 5 : 2;
  const maxWidthClass = variant === "register" ? "max-w-lg w-full" : "max-w-sm w-full";
  const card = (
    <div className={`${TT_AUTH_L5_FORM.cardWrap} ${maxWidthClass}`}>
      <div className={TT_AUTH_L5_FORM.cardHalo} aria-hidden />
      <div className={`${TT_AUTH_L5_FORM.loadingSkeletonCard} relative z-[1]`} aria-hidden>
        <div className={`h-8 w-32 ${TT_AUTH_L5_FORM.loadingPulse}`} />
        <div className="mt-5 space-y-3">
          {Array.from({ length: fieldRows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className={`h-3 w-16 ${TT_AUTH_L5_FORM.loadingPulse}`} />
              <div className={`min-h-[44px] h-11 w-full ${TT_AUTH_L5_FORM.loadingPulse}`} />
            </div>
          ))}
          <div className={`min-h-[48px] h-12 w-full ${TT_AUTH_L5_FORM.loadingPulse}`} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className={`h-4 w-24 ${TT_AUTH_L5_FORM.loadingPulse}`} />
          <div className={`h-4 w-28 ${TT_AUTH_L5_FORM.loadingPulse}`} />
        </div>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <main
      className={TT_AUTH_L5_PAGE_SHELL}
      role="status"
      aria-label={t(mainAriaLabelKey)}
      aria-busy="true"
      data-tt-auth-visual="l5"
      data-tt-auth-surface="auth_route_loading"
      {...(variant === "register"
        ? {
            "data-tt-auth-route": "register",
            "data-tt-auth-register-ui-frozen": "1",
          }
        : {})}
    >
      <AuthL5PageBackdrop />
      <div className={TT_AUTH_L5_PAGE_COLUMN}>{card}</div>
    </main>
  );
}
