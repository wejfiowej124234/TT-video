"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { TT_AUTH_LOGIN_L5 } from "@/lib/auth/loginL5";
import AuthL5PageBackdrop from "@/components/auth/AuthL5PageBackdrop";

/** L5 登录骨架：与 `page.tsx` 同壳（暗径大气 CSS + 深色玻璃卡） */
export default function LoginRouteLoading({
  embedded = false,
  mainAriaLabelKey = "auth_login_title",
}: {
  embedded?: boolean;
  mainAriaLabelKey?: string;
}) {
  const { t } = useTranslation();
  const card = (
    <div className={TT_AUTH_LOGIN_L5.loadingSkeletonCard} aria-hidden>
      <div className={`h-8 w-32 ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
      <div className="mt-5 space-y-3">
        <div className={`h-3 w-16 ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
        <div className={`min-h-[44px] h-11 w-full ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
        <div className={`h-3 w-14 ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
        <div className={`min-h-[44px] h-11 w-full ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
        <div className={`min-h-[48px] h-12 w-full ${TT_AUTH_LOGIN_L5.loadingPulse}`} />
      </div>
    </div>
  );
  if (embedded) {
    return card;
  }
  return (
    <main
      className={TT_AUTH_LOGIN_L5.pageShell}
      role="status"
      aria-label={t(mainAriaLabelKey)}
      aria-busy="true"
    >
      <AuthL5PageBackdrop />
      <div className={TT_AUTH_LOGIN_L5.cardWrap}>{card}</div>
    </main>
  );
}
