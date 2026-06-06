"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { passwordStrength } from "./utils";

type RegisterGuideFormAccountSectionProps = {
  t: (key: string) => string;
  labelClass: string;
  inputClass: string;
  fieldWrapClass: string;
  formErrorId: string;
  emailInputId: string;
  nicknameInputId: string;
  passwordInputId: string;
  passwordConfirmInputId: string;
  autoFocusAccountEmail: boolean;
  email: string;
  setEmail: (v: string) => void;
  nickname: string;
  setNickname: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  passwordConfirm: string;
  setPasswordConfirm: (v: string) => void;
  error: string | null;
};

export default function RegisterGuideFormAccountSection({
  t,
  labelClass,
  inputClass,
  fieldWrapClass,
  formErrorId,
  emailInputId,
  nicknameInputId,
  passwordInputId,
  passwordConfirmInputId,
  autoFocusAccountEmail,
  email,
  setEmail,
  nickname,
  setNickname,
  password,
  setPassword,
  passwordConfirm,
  setPasswordConfirm,
  error,
}: RegisterGuideFormAccountSectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className={TT_AUTH_L5_FORM.sectionTitle}>{t("auth_register_accountSection")}</h2>
      <div className={fieldWrapClass}>
        <label htmlFor={emailInputId} className={labelClass}>
          {t("auth_register_email")} *
        </label>
        <input
          id={emailInputId}
          type="email"
          autoFocus={autoFocusAccountEmail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          placeholder={t("auth_register_email")}
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
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={inputClass}
          autoComplete="nickname"
        />
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={passwordInputId} className={labelClass}>
          {t("auth_register_password")} *
        </label>
        <input
          id={passwordInputId}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
          placeholder={t("auth_register_passwordPlaceholder")}
          autoComplete="new-password"
        />
        {(() => {
          if (!password) return null;
          const s = passwordStrength(password);
          if (!s.labelKey) return null;
          return <p className={`text-meta mt-0.5 ${s.ok ? "text-ink-500" : "text-warning"}`}>{t(s.labelKey)}</p>;
        })()}
      </div>
      <div className={fieldWrapClass}>
        <label htmlFor={passwordConfirmInputId} className={labelClass}>
          {t("auth_register_confirmPassword")} *
        </label>
        <input
          id={passwordConfirmInputId}
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          className={inputClass}
          placeholder={t("auth_register_confirmPlaceholder")}
          autoComplete="new-password"
        />
      </div>
    </section>
  );
}
