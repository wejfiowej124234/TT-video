"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { MeSettingsHubBackLink } from "@/components/me/MeSettingsHubBackLink";
import { MeSettingsSubpageHeader } from "@/components/me/MeSettingsSubpageHeader";
import { putMePassword } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useTranslation } from "@/components/LocaleProvider";
import AuthL5Card from "@/components/auth/AuthL5Card";
import MeSettingsL5FlowPage from "@/components/me/MeSettingsL5FlowPage";
import LoginPasswordVisibilityToggle from "@/app/auth/login/LoginPasswordVisibilityToggle";
import { PASSWORD_MIN_LEN } from "@/app/auth/register/constants";
import { authL5FieldClass, TT_AUTH_L5_FORM } from "@/lib/auth/authL5Form";
import { ME_SETTINGS_HUB_PATH } from "@/lib/me/meSettingsL5";
import { authL5InlineLinkFocusClasses, touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** 修改密码（`PUT /api/v1/me/password`）· L5 子页；Hub → `/me/settings` */
export default function MePasswordPage() {
  const { t } = useTranslation();
  const formErrorId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const footerLinkClass = `${touchTargetLink44Classes} ${TT_AUTH_L5_FORM.footerLinks}`;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fieldInvalid = !!error;
  const inputClass = authL5FieldClass(fieldInvalid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("mePassword_mismatch"));
      return;
    }
    if (!newPassword.trim()) {
      setError(t("mePassword_required"));
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LEN) {
      setError(t("mePassword_tooShort", { n: PASSWORD_MIN_LEN }));
      return;
    }
    setSubmitting(true);
    putMePassword({ old_password: oldPassword || undefined, new_password: newPassword })
      .then(() => setSuccess(true))
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("MePassword:", err);
        }
        setError(mapApiReadError(err, t, "mePassword_failed"));
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <MeSettingsL5FlowPage
      ariaLabel={t("mePassword_title")}
      route="password"
      dataAttrs={{ "data-tt-me-settings-route": "password" }}
      showMinimalFooter={false}
    >
      <MeSettingsHubBackLink t={t} />

      <AuthL5Card maxWidth="wide" surface="me_password_form">
        {success ? (
          <div className="flex flex-col gap-4">
            <MeSettingsSubpageHeader t={t} eyebrowKey="me_settings_eyebrow" titleKey="mePassword_title" />
            <p className={TT_AUTH_L5_FORM.callout} role="status">
              {t("mePassword_successMessage")}
            </p>
            <Link href="/auth/login" className={TT_AUTH_L5_FORM.primaryCta}>
              {t("mePassword_goLogin")}
            </Link>
            <p className={TT_AUTH_L5_FORM.footerMetaCompact}>
              <Link href={ME_SETTINGS_HUB_PATH} className={footerLinkClass}>
                {t("mePassword_backSettings")}
              </Link>
            </p>
          </div>
        ) : (
          <>
            <MeSettingsSubpageHeader
              t={t}
              eyebrowKey="me_settings_eyebrow"
              titleKey="mePassword_title"
              subtitleKey="mePassword_subtitle"
            />
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className={TT_AUTH_L5_FORM.fieldGroup}>
                <label htmlFor={currentPasswordId} className={TT_AUTH_L5_FORM.label}>
                  {t("mePassword_currentPassword")}
                </label>
                <input
                  id={currentPasswordId}
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t("mePassword_currentPlaceholder")}
                  autoComplete="current-password"
                  aria-invalid={fieldInvalid}
                  aria-errormessage={error ? formErrorId : undefined}
                  className={inputClass}
                />
                <p className={TT_AUTH_L5_FORM.passwordHintOk}>
                  <Link href="/auth/forgot-password" className={authL5InlineLinkFocusClasses}>
                    {t("mePassword_forgotLink")}
                  </Link>
                </p>
              </div>
              <div className={TT_AUTH_L5_FORM.fieldGroup}>
                <label htmlFor={newPasswordId} className={TT_AUTH_L5_FORM.label}>
                  {t("mePassword_newPassword")}
                </label>
                <div className="relative">
                  <input
                    id={newPasswordId}
                    type={newVisible ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("mePassword_newPlaceholder", { n: String(PASSWORD_MIN_LEN) })}
                    autoComplete="new-password"
                    aria-invalid={fieldInvalid}
                    aria-errormessage={error ? formErrorId : undefined}
                    className={`${inputClass} pr-12`}
                  />
                  <LoginPasswordVisibilityToggle
                    visible={newVisible}
                    onToggle={() => setNewVisible((v) => !v)}
                    showLabel={t("auth_login_passwordShow")}
                    hideLabel={t("auth_login_passwordHide")}
                  />
                </div>
                <p className={TT_AUTH_L5_FORM.passwordHintOk}>{t("mePassword_hintMin", { n: PASSWORD_MIN_LEN })}</p>
              </div>
              <div className={TT_AUTH_L5_FORM.fieldGroup}>
                <label htmlFor={confirmPasswordId} className={TT_AUTH_L5_FORM.label}>
                  {t("mePassword_confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    id={confirmPasswordId}
                    type={confirmVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("mePassword_confirmPlaceholder")}
                    autoComplete="new-password"
                    aria-invalid={fieldInvalid}
                    aria-errormessage={error ? formErrorId : undefined}
                    className={`${inputClass} pr-12`}
                  />
                  <LoginPasswordVisibilityToggle
                    visible={confirmVisible}
                    onToggle={() => setConfirmVisible((v) => !v)}
                    showLabel={t("auth_login_passwordShow")}
                    hideLabel={t("auth_login_passwordHide")}
                  />
                </div>
              </div>
              {error ? (
                <p id={formErrorId} className={TT_AUTH_L5_FORM.error} role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting ? true : undefined}
                className={TT_AUTH_L5_FORM.primaryCta}
              >
                {submitting ? t("common_submitting") : t("mePassword_submit")}
              </button>
              <Link href={ME_SETTINGS_HUB_PATH} className={`${TT_AUTH_L5_FORM.secondaryButton} text-center`}>
                {t("mePassword_cancel")}
              </Link>
            </form>
          </>
        )}
      </AuthL5Card>
    </MeSettingsL5FlowPage>
  );
}
