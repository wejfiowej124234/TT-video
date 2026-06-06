"use client";

import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";

type RegisterVerificationCodeFieldProps = {
  t: (key: string, vars?: Record<string, string | number>) => string;
  labelClass: string;
  inputClass: string;
  codeInputId: string;
  verificationCode: string;
  setVerificationCode: (v: string) => void;
  sendCodeBusy: boolean;
  sendCodeCooldown: number;
  devCodeHint: string | null;
  onSendCode: () => void;
};

export default function RegisterVerificationCodeField({
  t,
  labelClass,
  inputClass,
  codeInputId,
  verificationCode,
  setVerificationCode,
  sendCodeBusy,
  sendCodeCooldown,
  devCodeHint,
  onSendCode,
}: RegisterVerificationCodeFieldProps) {
  const sendDisabled = sendCodeBusy || sendCodeCooldown > 0;

  return (
    <div className={TT_AUTH_L5_FORM.fieldGroup}>
      <label htmlFor={codeInputId} className={labelClass}>
        {t("auth_register_verificationCode")}
      </label>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
        <input
          id={codeInputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="[0-9]{6}"
          placeholder={t("auth_register_verificationCodePlaceholder")}
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          className={`${inputClass} sm:flex-1`}
          aria-describedby={devCodeHint ? `${codeInputId}-dev-hint` : undefined}
        />
        <button
          type="button"
          data-tt-auth-register-send-code="1"
          disabled={sendDisabled}
          aria-busy={sendCodeBusy ? true : undefined}
          onClick={onSendCode}
          className={`${TT_AUTH_L5_FORM.secondaryButton} shrink-0 sm:min-w-[8.5rem]`}
        >
          {sendCodeBusy
            ? t("auth_register_sendCodeSending")
            : sendCodeCooldown > 0
              ? t("auth_register_sendCodeCooldown", { seconds: sendCodeCooldown })
              : t("auth_register_sendCode")}
        </button>
      </div>
      <p className={TT_AUTH_L5_FORM.metaText}>{t("auth_register_verificationCodeHint")}</p>
      {devCodeHint ? (
        <p id={`${codeInputId}-dev-hint`} className={TT_AUTH_L5_FORM.callout} role="status">
          {t("auth_register_verificationDevCode", { code: devCodeHint })}
        </p>
      ) : null}
    </div>
  );
}
