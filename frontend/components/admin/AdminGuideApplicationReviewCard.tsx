"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getAdminUserGuideApplication,
  patchAdminGuideApplicationReview,
  type GuideApplicationReviewStatus,
} from "@/lib/apiClient/adminGuideApplication";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import {
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_SEMANTIC_APPROVE_BTN_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,
} from "@/lib/adminUi";

type GuideApplicationPayload = {
  id?: string;
  status?: string;
  city?: string;
  country_code?: string;
  languages?: string[];
  service_types?: string[];
  bio?: string | null;
  wallet_address?: string | null;
  real_name?: string | null;
  id_photo_url?: string | null;
  language_cert_url?: string | null;
  guide_license_url?: string | null;
  hourly_rate?: string | null;
  avatar_url?: string | null;
  submitted_at?: string;
  rejection_codes?: string[];
  rejection_message?: string | null;
};

function applicationFromResponse(body: unknown): GuideApplicationPayload | null {
  if (!body || typeof body !== "object") return null;
  const app = (body as Record<string, unknown>).application;
  if (!app || typeof app !== "object") return null;
  return app as GuideApplicationPayload;
}

export function AdminGuideApplicationReviewCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<GuideApplicationPayload | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);
  const [rejectionCodes, setRejectionCodes] = useState("DOC_BLUR");
  const [rejectionMessage, setRejectionMessage] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const body = await getAdminUserGuideApplication(userId);
      setApp(applicationFromResponse(body));
    } catch (e) {
      setApp(null);
      setError(mapApiReadError(e, t, "admin_guide_app_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async (status: GuideApplicationReviewStatus) => {
    setReviewLoading(true);
    setReviewErr(null);
    try {
      const codes =
        status === "rejected"
          ? rejectionCodes
              .split(/[,;\s]+/)
              .map((c) => c.trim())
              .filter(Boolean)
          : undefined;
      await patchAdminGuideApplicationReview(userId, {
        status,
        rejection_codes: codes,
        rejection_message:
          status === "rejected" && rejectionMessage.trim() ? rejectionMessage.trim() : undefined,
      });
      await load();
    } catch (e) {
      setReviewErr(mapApiReadError(e, t, "admin_guide_app_reviewFailed"));
    } finally {
      setReviewLoading(false);
    }
  };

  if (!userId) return null;

  const docLinks = [
    ["admin_guide_app_docIdPhoto", app?.id_photo_url],
    ["admin_guide_app_docLanguageCert", app?.language_cert_url],
    ["admin_guide_app_docGuideLicense", app?.guide_license_url],
  ].filter((pair): pair is [string, string] => typeof pair[1] === "string" && pair[1].trim().length > 0);

  const pendingLike =
    app?.status === "pending" || app?.status === "pending_review" || app?.status === "reviewing";

  return (
    <AdminDetailContentPanel
      as="section"
      aria-label={t("admin_guide_app_sectionAria")}
      data-testid="admin-guide-application-review"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">{t("admin_guide_app_title")}</h2>
      {loading ? (
        <p className="mt-3 text-body text-ink-600" role="status">
          {t("admin_users_loading")}
        </p>
      ) : error ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {error}
        </p>
      ) : !app?.status ? (
        <p className="mt-3 text-body text-ink-600">{t("admin_guide_app_none")}</p>
      ) : (
        <div className="mt-3 space-y-3 text-body">
          <p>
            <span className="text-meta text-ink-500">{t("admin_guide_app_status")}: </span>
            <span className="font-mono text-meta">{app.status}</span>
          </p>
          {app.submitted_at ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_guide_app_submitted")}: </span>
              <span className="font-mono text-meta">{app.submitted_at}</span>
            </p>
          ) : null}
          <dl className="grid gap-2 sm:grid-cols-2 text-meta">
            {app.city ? (
              <div>
                <dt className="text-ink-500">{t("admin_guide_app_city")}</dt>
                <dd className="mt-0.5 font-mono text-ink-800">{app.city}</dd>
              </div>
            ) : null}
            {app.country_code ? (
              <div>
                <dt className="text-ink-500">{t("admin_guide_app_country")}</dt>
                <dd className="mt-0.5 font-mono text-ink-800">{app.country_code}</dd>
              </div>
            ) : null}
            {app.real_name ? (
              <div>
                <dt className="text-ink-500">{t("admin_guide_app_realName")}</dt>
                <dd className="mt-0.5 font-mono text-ink-800">{app.real_name}</dd>
              </div>
            ) : null}
            {app.wallet_address ? (
              <div className="sm:col-span-2">
                <dt className="text-ink-500">{t("admin_guide_app_wallet")}</dt>
                <dd className="mt-0.5 break-all font-mono text-ink-800">{app.wallet_address}</dd>
              </div>
            ) : null}
            {app.hourly_rate ? (
              <div>
                <dt className="text-ink-500">{t("admin_guide_app_hourlyRate")}</dt>
                <dd className="mt-0.5 font-mono text-ink-800">{app.hourly_rate}</dd>
              </div>
            ) : null}
          </dl>
          {Array.isArray(app.languages) && app.languages.length > 0 ? (
            <p className="text-meta text-ink-700">{app.languages.join(" · ")}</p>
          ) : null}
          {Array.isArray(app.service_types) && app.service_types.length > 0 ? (
            <p className="text-meta text-ink-700">{app.service_types.join(" · ")}</p>
          ) : null}
          {app.bio ? <p className="text-small text-ink-700 whitespace-pre-wrap">{app.bio}</p> : null}
          {docLinks.length > 0 ? (
            <ul className="space-y-1 text-meta">
              {docLinks.map(([labelKey, url]) => (
                <li key={labelKey}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={`${ADMIN_INLINE_LINK_CLASS} break-all`}>
                    {t(labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {pendingLike ? (
            <div className={`mt-4 space-y-3 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() => void submitReview("reviewing")}
                >
                  {t("admin_guide_app_actionReviewing")}
                </button>
                <button
                  type="button"
                  className={ADMIN_SEMANTIC_APPROVE_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() => void submitReview("approved")}
                >
                  {t("admin_guide_app_actionApprove")}
                </button>
                <button
                  type="button"
                  className={ADMIN_SEMANTIC_REJECT_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() => void submitReview("rejected")}
                >
                  {t("admin_guide_app_actionReject")}
                </button>
              </div>
              <label className="block text-small text-ink-700">
                {t("admin_guide_app_rejectionCodes")}
                <input
                  type="text"
                  className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 font-mono text-meta`}
                  value={rejectionCodes}
                  onChange={(e) => setRejectionCodes(e.target.value)}
                />
              </label>
              <label className="block text-small text-ink-700">
                {t("admin_guide_app_rejectionMessage")}
                <textarea
                  className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 text-meta`}
                  rows={2}
                  value={rejectionMessage}
                  onChange={(e) => setRejectionMessage(e.target.value)}
                />
              </label>
              {reviewErr ? (
                <p className="text-small text-danger" role="alert">
                  {reviewErr}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </AdminDetailContentPanel>
  );
}
