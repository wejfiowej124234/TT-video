"use client";

import { useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { resendMeSettingsVerificationEmail } from "@/lib/me/meSettingsVerifyEmailApi";
import { TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { TT_ME_SETTINGS_L5 } from "@/lib/me/meSettingsL5";

/** 未验证邮箱 · 重发验证信（设置族 / 信任页 / verify-email 子页共用） */
export function MeSettingsResendVerifyEmailPanel({
  onDevToken,
}: {
  onDevToken?: (token: string) => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  async function handleResend() {
    setError(null);
    setDevToken(null);
    setBusy(true);
    try {
      const { devToken: dt, message } = await resendMeSettingsVerificationEmail();
      if (message === "email_already_verified") {
        setAlreadyVerified(true);
        return;
      }
      if (dt) {
        setDevToken(dt);
        onDevToken?.(dt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("me_settings_verify_resend_failed"));
    } finally {
      setBusy(false);
    }
  }

  if (alreadyVerified) {
    return (
      <p className={TT_ME_SETTINGS_L5.sectionCallout} role="status" data-tt-me-settings-verify-already="1">
        {t("me_settings_verify_already_verified")}
      </p>
    );
  }

  return (
    <div
      className="rounded-xl border border-ref-sun/28 bg-ref-sun/[0.06] px-4 py-3 space-y-3"
      data-tt-me-settings-resend-verify="1"
    >
      <p className="text-meta leading-relaxed text-slate-400/95">{t("me_settings_verify_resend_hint")}</p>
      <button
        type="button"
        className={TT_AUTH_L5_FORM.primaryCta}
        disabled={busy}
        aria-busy={busy ? true : undefined}
        data-tt-me-settings-resend-verify-btn="1"
        onClick={() => void handleResend()}
      >
        {busy ? t("me_settings_verify_resend_busy") : t("me_settings_verify_resend_action")}
      </button>
      {error ? (
        <p className={TT_ME_SETTINGS_L5.sectionCallout} role="alert">
          {error}
        </p>
      ) : null}
      {devToken ? (
        <p className="text-meta text-slate-400/95 break-all" data-tt-me-settings-verify-dev-token="1">
          {t("me_settings_verify_dev_token_label")}{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-ref-sun/90">{devToken}</code>
        </p>
      ) : null}
    </div>
  );
}
