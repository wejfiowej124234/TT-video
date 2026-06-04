"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import {
  clearAdmin2faSession,
  setAdmin2faSessionToken,
} from "@/lib/admin/admin2faSession";
import { adminFetchJson, adminErrorUserText, adminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import { ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_STEP_MARKER_CLASS } from "@/lib/adminUi";

type TotpStatus = {
  enrolled?: boolean;
  verified?: boolean;
  session_valid?: boolean;
  totp_wired?: boolean;
};

type TotpEnrollBody = {
  secret_base32?: string;
  otpauth_uri?: string;
  error?: string;
};

type TotpVerifyBody = {
  session_token?: string;
  error?: string;
};

export function AdminPermissionsTotpPanel() {
  const { t } = useTranslation();
  const sectionId = useId();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<TotpStatus | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [enrollUri, setEnrollUri] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    try {
      return {
        "x-request-id": `admin-totp-${Date.now()}`,
        ...getAuthHeaders(),
      };
    } catch {
      return { "x-request-id": `admin-totp-${Date.now()}` };
    }
  }, []);

  const reloadStatus = useCallback(() => {
    setLoading(true);
    setMsg(null);
    void adminFetchJson<TotpStatus & { status?: string }>(
      "AdminTotpStatus",
      apiUrl(routes.admin.totpStatus),
      { headers: authHeaders() },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          setStatus(null);
          setMsg(t("admin_permissions_totp_load_error"));
          return;
        }
        setStatus({
          enrolled: body.enrolled === true,
          verified: body.verified === true,
          session_valid: body.session_valid === true,
          totp_wired: body.totp_wired === true,
        });
      })
      .catch((e) => {
        setStatus(null);
        setMsg(adminErrorUserText(adminFetchErrorKind(e), t));
      })
      .finally(() => setLoading(false));
  }, [authHeaders, t]);

  useEffect(() => {
    reloadStatus();
    const on2fa = () => reloadStatus();
    window.addEventListener("traveltrust:admin-2fa-change", on2fa);
    return () => window.removeEventListener("traveltrust:admin-2fa-change", on2fa);
  }, [reloadStatus]);

  async function onEnroll() {
    setBusy(true);
    setMsg(null);
    setEnrollSecret(null);
    setEnrollUri(null);
    try {
      const { res, body } = await adminFetchJson<TotpEnrollBody>(
        "AdminTotpEnroll",
        apiUrl(routes.admin.totpEnroll),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...writeRequestHeaders(),
          },
          body: JSON.stringify({}),
        },
      );
      if (!res.ok) {
        setMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error(body.error ?? "enroll_failed")),
            t,
          ),
        );
        return;
      }
      setEnrollSecret(body.secret_base32 ?? null);
      setEnrollUri(body.otpauth_uri ?? null);
      setMsg(t("admin_permissions_totp_enroll_ok"));
      reloadStatus();
    } catch (e) {
      setMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    const trimmed = code.trim();
    if (trimmed.length !== 6) return;
    setBusy(true);
    setMsg(null);
    try {
      const { res, body } = await adminFetchJson<TotpVerifyBody>(
        "AdminTotpVerify",
        apiUrl(routes.admin.totpVerify),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...writeRequestHeaders(),
          },
          body: JSON.stringify({ code: trimmed }),
        },
      );
      if (!res.ok) {
        setMsg(
          adminErrorUserText(
            adminFetchErrorKind(new Error(body.error ?? "verify_failed")),
            t,
          ),
        );
        return;
      }
      if (typeof body.session_token === "string") {
        setAdmin2faSessionToken(body.session_token);
      }
      setCode("");
      setEnrollSecret(null);
      setEnrollUri(null);
      setMsg(t("admin_permissions_totp_verify_ok"));
      reloadStatus();
    } catch (e) {
      setMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  }

  function onClearSession() {
    clearAdmin2faSession();
    setMsg(t("admin_permissions_totp_session_cleared"));
    reloadStatus();
  }

  return (
    <section
      id="admin-permissions-totp"
      className="mt-6 scroll-mt-24 rounded-[var(--radius-lg)] border border-ink-200 bg-white p-4"
      aria-labelledby={sectionId}
      data-tt-admin-totp-panel="1"
    >
      <h2 id={sectionId} className="text-body font-semibold text-ink-900">
        {t("admin_permissions_totp_title")}
      </h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_permissions_totp_hint")}</p>
      <ol
        className="mt-4 space-y-2 border-t border-ink-100 pt-4"
        aria-label={t("admin_permissions_totp_steps_aria")}
        data-tt-admin-totp-steps="1"
      >
        {(
          [
            "admin_permissions_totp_step1",
            "admin_permissions_totp_step2",
            "admin_permissions_totp_step3",
          ] as const
        ).map((key, i) => (
          <li key={key} className="flex gap-3 text-small text-ink-700">
            <span className={ADMIN_STEP_MARKER_CLASS} aria-hidden>
              {i + 1}
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>

      {loading ? (
        <AdminListLoadingStatus message={t("admin_permissions_totp_loading")} className="mt-3 text-small text-ink-600" />
      ) : status ? (
        <ul className="mt-3 list-inside list-disc text-small text-ink-700">
          <li>
            {t("admin_permissions_totp_enrolled")}:{" "}
            {status.enrolled ? t("admin_permissions_yes") : t("admin_permissions_no")}
          </li>
          <li>
            {t("admin_permissions_totp_verified")}:{" "}
            {status.verified ? t("admin_permissions_yes") : t("admin_permissions_no")}
          </li>
          <li>
            {t("admin_permissions_totp_session")}:{" "}
            {status.session_valid ? t("admin_permissions_yes") : t("admin_permissions_no")}
          </li>
        </ul>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <button
          type="button"
          disabled={busy}
          className="rounded border border-ink-300 bg-ink-50 px-4 py-2 text-small font-medium text-ink-900 disabled:opacity-50"
          onClick={() => void onEnroll()}
        >
          {busy ? t("admin_permissions_totp_busy") : t("admin_permissions_totp_enroll_btn")}
        </button>
        <label className="block text-small">
          <span className="font-medium text-ink-800">{t("admin_permissions_totp_code_label")}</span>
          <input
            className="mt-1 block w-32 rounded border border-ink-200 px-2 py-1.5 font-mono text-meta tracking-widest"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </label>
        <button
          type="button"
          disabled={busy || code.trim().length !== 6}
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50`}
          onClick={() => void onVerify()}
        >
          {t("admin_permissions_totp_verify_btn")}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded border border-ink-200 px-4 py-2 text-small text-ink-700 disabled:opacity-50"
          onClick={onClearSession}
        >
          {t("admin_permissions_totp_clear_session")}
        </button>
      </div>

      {enrollSecret ? (
        <AdminNoticeBanner
          tone="readonly"
          size="lg"
          className="mt-4"
          message={
            <>
              <p className="font-medium">{t("admin_permissions_totp_secret_label")}</p>
              <p className="mt-1 break-all font-mono text-meta">{enrollSecret}</p>
              {enrollUri ? (
                <p className="mt-2 break-all font-mono text-meta text-ink-600">{enrollUri}</p>
              ) : null}
            </>
          }
        />
      ) : null}

      {msg ? <p className="mt-3 text-small text-ink-700">{msg}</p> : null}
    </section>
  );
}
