"use client";

import Link from "next/link";
import { useId } from "react";
import { passwordStrength } from "./utils";
import AuthShellCrossNav from "@/components/auth/AuthShellCrossNav";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";
import RegisterPageBackdrop from "./RegisterPageBackdrop";
import { registerPageShellClass, type RegisterVisualKind } from "./registerBackgrounds";
import TrustGrowthMomentBanner from "@/components/trust/TrustGrowthMomentBanner";

export type RegisterTouristFormProps = {
  /** 主容器布局类（须含 `relative isolate`，与 `registerPageShellClass` 一致） */
  mainClassName?: string;
  /** 全屏摄影底图（与入口角色一致） */
  backdropKind?: Exclude<RegisterVisualKind, "default">;
  /** 主标题文案键（旅行者 / 商家 / 区域主理人共用表单时区分） */
  headingKey?: string;
  /** 可选说明条（商家、区域主理人等） */
  bannerKey?: string;
  /** 「已有账号」登录链：与注册页 `returnUrl` 对齐 */
  loginHref: string;
  /** 进入本步时是否聚焦邮箱（键盘/读屏友好） */
  autoFocusEmail?: boolean;
  email: string;
  setEmail: (v: string) => void;
  nickname: string;
  setNickname: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  defaultWallet: string;
  setDefaultWallet: (v: string) => void;
  error: string | null;
  loading: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  getErrorDisplay: (err: string | null) => string | null;
  t: (key: string) => string;
  inputClass: string;
  labelClass: string;
};

/** 旅行者（及商家/管家暂用）注册表单区块（从 register/page 拆出） */
export default function RegisterTouristForm({
  mainClassName = registerPageShellClass(),
  backdropKind = "traveler",
  headingKey = "auth_register_traveler",
  bannerKey,
  loginHref,
  autoFocusEmail = true,
  email,
  setEmail,
  nickname,
  setNickname,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  defaultWallet,
  setDefaultWallet,
  error,
  loading,
  onBack,
  onSubmit,
  getErrorDisplay,
  t,
  inputClass,
  labelClass,
}: RegisterTouristFormProps) {
  const formErrorId = useId();
  const fid = useId();
  const emailInputId = `${fid}-email`;
  const nicknameInputId = `${fid}-nickname`;
  const passwordInputId = `${fid}-password`;
  const passwordConfirmInputId = `${fid}-password-confirm`;
  const defaultWalletInputId = `${fid}-default-wallet`;
  const footerLinkClass = `${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`;
  const fieldWrapClass = "flex min-w-0 flex-col gap-1.5";
  return (
    <main
      className={mainClassName}
      aria-label={t(headingKey)}
      data-tt-auth-root="1"
      data-tt-auth-route="register"
      data-tt-auth-surface="register_form_shell"
      data-tt-auth-register-role={backdropKind}
    >
      <RegisterPageBackdrop kind={backdropKind} />
      <div className="relative z-10 flex w-full min-w-0 flex-col items-center gap-4">
      <div className="flex w-full min-w-0 max-w-sm flex-col gap-4 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console p-6 shadow-soft">
        <div className="flex items-center gap-2">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            <button
              type="submit"
              data-tt-auth-register-back="1"
              className={`inline-flex min-h-[44px] items-center px-1 text-meta text-ink-500 transition-colors hover:text-travel-500 motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
            >
              {t("auth_register_back")}
            </button>
          </form>
        </div>
        {bannerKey ? (
          <p className="text-meta text-ink-600 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft px-3 py-2">{t(bannerKey)}</p>
        ) : null}
        <h1 className="shrink-0 text-h4 font-semibold leading-snug text-ink-900">{t(headingKey)}</h1>
        <TrustGrowthMomentBanner moment="register" surface="auth" />
        <form noValidate onSubmit={onSubmit} className="flex min-w-0 flex-col gap-3" data-tt-auth-surface="register_form_fields">
          <div className={fieldWrapClass}>
            <label htmlFor={emailInputId} className={labelClass}>
              {t("auth_register_email")}
            </label>
            <input
              id={emailInputId}
              type="email"
              autoFocus={autoFocusEmail}
              placeholder={t("auth_register_email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              autoComplete="email"
              aria-invalid={!!error}
              aria-describedby={error ? formErrorId : undefined}
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor={nicknameInputId} className={labelClass}>
              {t("auth_register_nickname")}
            </label>
            <input
              id={nicknameInputId}
              type="text"
              placeholder={t("auth_register_nickname")}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={inputClass}
              autoComplete="nickname"
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor={passwordInputId} className={labelClass}>
              {t("auth_register_password")}
            </label>
            <input
              id={passwordInputId}
              type="password"
              placeholder={t("auth_register_passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              autoComplete="new-password"
            />
            {password && (() => { const s = passwordStrength(password); return s.labelKey ? <p className={`text-meta mt-0.5 ${s.ok ? "text-ink-500" : "text-warning"}`}>{t(s.labelKey)}</p> : null; })()}
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor={passwordConfirmInputId} className={labelClass}>
              {t("auth_register_confirmPassword")}
            </label>
            <input
              id={passwordConfirmInputId}
              type="password"
              placeholder={t("auth_register_confirmPlaceholder")}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor={defaultWalletInputId} className={labelClass}>
              {t("auth_register_defaultWallet")}
            </label>
            <input
              id={defaultWalletInputId}
              type="text"
              placeholder={t("auth_register_walletPlaceholder")}
              value={defaultWallet}
              onChange={(e) => setDefaultWallet(e.target.value)}
              className={inputClass}
            />
            <p className="text-meta text-ink-500">{t("auth_register_walletHint")}</p>
          </div>
          {error && (
            <p id={formErrorId} className="text-danger text-small whitespace-pre-line" role="alert" data-tt-auth-surface="register_form_error">
              {getErrorDisplay(error)}
            </p>
          )}
          <button
            type="submit"
            data-tt-auth-register-submit="1"
            disabled={loading}
            aria-busy={loading ? true : undefined}
            className={`btn-console inline-flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-travel-500 px-3 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
          >
            {loading ? t("auth_register_submitting") : t("auth_register_submit")}
          </button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href={loginHref} className={footerLinkClass}>{t("auth_register_loginLink")}</Link> ·{" "}
          <Link href="/" className={footerLinkClass}>{t("auth_register_web3Travel")}</Link>
        </p>
      </div>
      <AuthShellCrossNav />
      </div>
    </main>
  );
}
