"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

/** Auth L5 深色玻璃卡（登录/注册/找回等共用） */
export default function AuthL5Card({
  children,
  className = "",
  bodyClassName = TT_AUTH_L5_FORM.cardBody,
  maxWidth = "narrow",
  surface,
}: {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  maxWidth?: "narrow" | "wide";
  surface?: string;
}) {
  const widthClass = maxWidth === "wide" ? TT_AUTH_L5_FORM.cardWide : TT_AUTH_L5_FORM.cardNarrow;
  return (
    <div className={TT_AUTH_L5_FORM.cardWrap}>
      <div className={TT_AUTH_L5_FORM.cardHalo} aria-hidden />
      <div className="auth-l5-card-ambient pointer-events-none absolute left-1/2 top-1/2 z-0 h-[88%] w-full max-w-full -translate-x-1/2 -translate-y-1/2 rounded-xl" aria-hidden />
      <div
        className={`${TT_AUTH_L5_FORM.card} auth-l5-glass-vignette ${widthClass} ${className}`.trim()}
        {...(surface ? { "data-tt-auth-surface": surface } : {})}
      >
        <div className={TT_AUTH_L5_FORM.cardSheen} aria-hidden />
        <div className={TT_AUTH_L5_FORM.cardInnerGlow} aria-hidden />
        <div className="auth-l5-glass-floor pointer-events-none absolute inset-x-0 bottom-0 h-24 rounded-b-xl bg-gradient-to-t from-ref-sun/[0.04] to-transparent" aria-hidden />
        <div className={`relative z-[1] ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
