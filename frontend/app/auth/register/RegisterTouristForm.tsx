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

export type RegisterTouristFormProps = {
  /** 主容器布局类（须含 `relative isolate`，与 `registerPageShellClass` 一致） */
  mainClassName?: string;
  /** 全屏摄影底图（与入口角色一致） */
  backdropKind?: Exclude<RegisterVisualKind, "default">;
  /** 主标题文案键（旅行者 / 商家 / 区域主理人共用表单时区分） */
  headingKey?: string;
  /** 可选说明条（商家、区域主理人等） */
  bannerKey?: string;
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
  return (
    <main className={mainClassName} aria-label={t(headingKey)}>
      <RegisterPageBackdrop kind={backdropKind} />
      <div className="relative z-10 flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-sm rounded-[var(--radius-sm)] border border-ink-200 bg-bg-console shadow-soft p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              onBack();
            }}
          >
            <button type="submit" className="text-meta text-ink-500 hover:text-travel-500">{t("auth_register_back")}</button>
          </form>
        </div>
        {bannerKey ? (
          <p className="text-meta text-ink-600 rounded-[var(--radius-sm)] border border-ink-200 bg-bg-soft px-3 py-2">{t(bannerKey)}</p>
        ) : null}
        <h1 className="text-h4 font-semibold text-ink-900">{t(headingKey)}</h1>
        <form noValidate onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>{t("auth_register_email")}</label>
            <input type="email" autoFocus={autoFocusEmail} placeholder={t("auth_register_email")} value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} aria-label={t("auth_register_email")} aria-invalid={!!error} aria-describedby={error ? formErrorId : undefined} />
          </div>
          <div>
            <label className={labelClass}>{t("auth_register_nickname")}</label>
            <input type="text" placeholder={t("auth_register_nickname")} value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t("auth_register_password")}</label>
            <input type="password" placeholder={t("auth_register_passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} aria-label={t("auth_register_password")} />
            {password && (() => { const s = passwordStrength(password); return s.labelKey ? <p className={`text-meta mt-0.5 ${s.ok ? "text-ink-500" : "text-warning"}`}>{t(s.labelKey)}</p> : null; })()}
          </div>
          <div>
            <label className={labelClass}>{t("auth_register_confirmPassword")}</label>
            <input type="password" placeholder={t("auth_register_confirmPlaceholder")} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required className={inputClass} aria-label={t("auth_register_confirmPassword")} />
          </div>
          <div>
            <label className={labelClass}>{t("auth_register_defaultWallet")}</label>
            <input type="text" placeholder={t("auth_register_walletPlaceholder")} value={defaultWallet} onChange={(e) => setDefaultWallet(e.target.value)} className={inputClass} />
            <p className="text-meta text-ink-500 mt-0.5">{t("auth_register_walletHint")}</p>
          </div>
          {error && <p id={formErrorId} className="text-danger text-small" role="alert">{getErrorDisplay(error)}</p>}
          <button type="submit" disabled={loading} aria-busy={loading ? true : undefined} className={`btn-console w-full rounded-[var(--radius-sm)] bg-travel-500 text-white py-2 text-small font-medium disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}>{loading ? t("auth_register_submitting") : t("auth_register_submit")}</button>
        </form>
        <p className="text-meta text-ink-500">
          <Link href="/auth/login" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_register_loginLink")}</Link> ·{" "}
          <Link href="/" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>{t("auth_register_web3Travel")}</Link>
        </p>
      </div>
      <AuthShellCrossNav />
      </div>
    </main>
  );
}
