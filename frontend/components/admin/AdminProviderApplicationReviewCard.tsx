"use client";

import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  getAdminUserProviderApplication,
  patchAdminProviderApplicationReview,
  type ProviderApplicationReviewStatus,
} from "@/lib/apiClient/adminProviderApplication";
import { providerRejectionCodeLabel } from "@/lib/provider/providerRejectionCodes";
import { mapApiReadError } from "@/lib/mapApiReadError";

import { AdminAuthDocPreviewLink } from "@/components/admin/AdminAuthDocPreviewLink";
import { AdminDetailContentPanel } from "@/components/admin/AdminDetailContentPanel";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_SEMANTIC_APPROVE_BTN_CLASS,
  ADMIN_SEMANTIC_REJECT_BTN_CLASS,
} from "@/lib/adminUi";

type ProviderApplicationPayload = {
  id?: string;
  status?: string;
  payload?: Record<string, unknown>;
  submitted_at?: string;
  rejection_codes?: string[];
  rejection_message?: string;
};

function applicationFromResponse(body: unknown): ProviderApplicationPayload | null {
  if (!body || typeof body !== "object") return null;
  const app = (body as Record<string, unknown>).application;
  if (!app || typeof app !== "object") return null;
  return app as ProviderApplicationPayload;
}

function payloadField(payload: Record<string, unknown> | undefined, key: string): string {
  const v = payload?.[key];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

function formatAddress(addr: unknown): string {
  if (!addr || typeof addr !== "object") return "";
  const o = addr as Record<string, unknown>;
  const parts = [o.line1, o.line2, o.city, o.postal_code, o.country_code]
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => String(x).trim());
  return parts.join(", ");
}

function docLinks(payload: Record<string, unknown> | undefined): { labelKey: string; url: string }[] {
  if (!payload) return [];
  const pairs: { labelKey: string; key: string }[] = [
    { labelKey: "admin_provider_app_docBusinessLicense", key: "business_license_url" },
    { labelKey: "admin_provider_app_docTravelPermit", key: "travel_agency_permit_url" },
    { labelKey: "admin_provider_app_docInsurance", key: "insurance_url" },
    { labelKey: "admin_provider_app_docLegalRepId", key: "legal_representative_id_url" },
  ];
  const out: { labelKey: string; url: string }[] = [];
  for (const { labelKey, key } of pairs) {
    const url = payloadField(payload, key);
    if (url) out.push({ labelKey, url });
  }
  const owners = payload.beneficial_owners;
  if (Array.isArray(owners)) {
    owners.forEach((row, i) => {
      if (!row || typeof row !== "object") return;
      const url = payloadField(row as Record<string, unknown>, "id_doc_url");
      const name = payloadField(row as Record<string, unknown>, "full_name");
      if (url) {
        out.push({
          labelKey: "admin_provider_app_docBeneficialOwner",
          url: `${url}#${name || i + 1}`,
        });
      }
    });
  }
  return out;
}

export function AdminProviderApplicationReviewCard({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<ProviderApplicationPayload | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);
  const [rejectionCodes, setRejectionCodes] = useState("DOC_BLUR");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const requestConfirm = useAdminL5ConfirmRequest();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const body = await getAdminUserProviderApplication(userId);
      setApp(applicationFromResponse(body));
    } catch (e) {
      setApp(null);
      setError(mapApiReadError(e, t, "admin_provider_app_loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async (status: ProviderApplicationReviewStatus) => {
    setReviewLoading(true);
    setReviewErr(null);
    try {
      const codes =
        status === "rejected" || status === "needs_more_info"
          ? rejectionCodes
              .split(/[,;\s]+/)
              .map((c) => c.trim())
              .filter(Boolean)
          : undefined;
      await patchAdminProviderApplicationReview(userId, {
        status,
        rejection_codes: codes,
        rejection_message:
          (status === "rejected" || status === "needs_more_info") && rejectionMessage.trim()
            ? rejectionMessage.trim()
            : undefined,
      });
      await load();
    } catch (e) {
      setReviewErr(mapApiReadError(e, t, "admin_provider_app_reviewFailed"));
    } finally {
      setReviewLoading(false);
    }
  };

  if (!userId) return null;

  // HU-364 · 无申请时不占用户详情三卡堆叠
  if (!loading && !error && !app?.status) return null;

  const payload = app?.payload;
  const registeredAddr = formatAddress(payload?.registered_address);
  const operatingAddr =
    payload?.operating_same_as_registered === true
      ? registeredAddr
      : formatAddress(payload?.operating_address);
  const documents = docLinks(payload);
  const actionable =
    app?.status !== "approved" && app?.status !== "rejected" && Boolean(app?.status);

  return (
    <AdminDetailContentPanel
      as="section"
      aria-label={t("admin_provider_app_sectionAria")}
      data-testid="admin-provider-application-review"
      data-tt-admin-onboarding-review-card="provider"
    >
      <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_provider_app_title")}
      </h2>
      {loading ? (
        <p className="mt-3 text-body text-ink-600" role="status">
          {t("admin_users_loading")}
        </p>
      ) : error ? (
        <p className="mt-3 text-small text-danger" role="alert">
          {error}
        </p>
      ) : (
        <div className="mt-3 space-y-3 text-body">
          <p>
            <span className="text-meta text-ink-500">{t("admin_provider_app_status")}: </span>
            <span className="font-mono text-meta">
              {app?.status === "needs_more_info"
                ? t("admin_provider_app_status_needs_more_info")
                : app?.status}
            </span>
          </p>
          {app.submitted_at ? (
            <p>
              <span className="text-meta text-ink-500">{t("admin_provider_app_submitted")}: </span>
              <span className="font-mono text-meta">{app.submitted_at}</span>
            </p>
          ) : null}
          {payload ? (
            <dl className="grid gap-2 sm:grid-cols-2 text-meta">
              {(
                [
                  ["legal_name", "admin_provider_app_legalName"],
                  ["entity_type", "admin_provider_app_entityType"],
                  ["shop_name", "admin_provider_app_shopName"],
                  ["country_code", "admin_provider_app_country"],
                  ["city", "admin_provider_app_city"],
                  ["registration_number", "admin_provider_app_registrationNumber"],
                  ["tax_id", "admin_provider_app_taxId"],
                  ["contact_name", "admin_provider_app_contactName"],
                  ["contact_phone", "admin_provider_app_contactPhone"],
                  ["contact_email", "admin_provider_app_contactEmail"],
                  ["wallet_address", "admin_provider_app_wallet"],
                ] as const
              ).map(([field, labelKey]) => {
                const val = payloadField(payload, field);
                if (!val) return null;
                return (
                  <div key={field} data-tt-admin-provider-field={field}>
                    <dt className="text-ink-500">{t(labelKey)}</dt>
                    <dd className="mt-0.5 break-all font-mono text-ink-800">{val}</dd>
                  </div>
                );
              })}
              {Array.isArray(payload.categories) && payload.categories.length > 0 ? (
                <div className="sm:col-span-2" data-tt-admin-provider-categories="1">
                  <dt className="text-ink-500">{t("admin_provider_app_categories")}</dt>
                  <dd className="mt-0.5 text-ink-800">
                    {(payload.categories as unknown[])
                      .map((c) => (typeof c === "string" ? c.trim() : ""))
                      .filter(Boolean)
                      .join(" · ")}
                  </dd>
                </div>
              ) : null}
              {payloadField(payload, "bio") ? (
                <div className="sm:col-span-2" data-tt-admin-provider-bio="1">
                  <dt className="text-ink-500">{t("admin_provider_app_bio")}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-ink-800">{payloadField(payload, "bio")}</dd>
                </div>
              ) : null}
              {registeredAddr ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-500">{t("admin_provider_app_registeredAddress")}</dt>
                  <dd className="mt-0.5 break-all font-mono text-ink-800">{registeredAddr}</dd>
                </div>
              ) : null}
              {operatingAddr ? (
                <div className="sm:col-span-2">
                  <dt className="text-ink-500">{t("admin_provider_app_operatingAddress")}</dt>
                  <dd className="mt-0.5 break-all font-mono text-ink-800">{operatingAddr}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
          {Array.isArray(payload?.beneficial_owners) && payload.beneficial_owners.length > 0 ? (
            <div>
              <p className="text-meta font-medium text-ink-600">{t("admin_provider_app_beneficialOwners")}</p>
              <ul className="mt-1 list-disc pl-5 text-meta text-ink-800">
                {(payload.beneficial_owners as Record<string, unknown>[]).map((o, idx) => (
                  <li key={idx}>
                    {payloadField(o, "full_name")} · {payloadField(o, "id_type")} ·{" "}
                    {payloadField(o, "id_number")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <p className="text-meta font-medium text-ink-600">{t("admin_provider_app_documents")}</p>
            {documents.length > 0 ? (
              <ul className="mt-1 space-y-1 text-meta" data-tt-admin-provider-docs="1">
                {documents.map(({ labelKey, url }) => {
                  const href = url.split("#")[0] ?? url;
                  const hashLabel = url.includes("#") ? url.split("#")[1] : "";
                  const label = hashLabel ? `${t(labelKey)} · ${hashLabel}` : t(labelKey);
                  return (
                    <li key={`${labelKey}-${href}`}>
                      <AdminAuthDocPreviewLink href={href} label={label} data-testid={`admin-provider-doc-${labelKey}`} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p
                className="mt-1 text-small text-ink-600"
                data-tt-admin-provider-docs="empty"
                role="status"
              >
                {t("admin_provider_app_docsEmptyHonest")}
              </p>
            )}
          </div>
          {app?.rejection_codes && app.rejection_codes.length > 0 ? (
            <ul
              className="list-disc pl-5 text-small text-ink-700"
              data-tt-admin-provider-needs-more-info={app.status === "needs_more_info" ? "1" : undefined}
            >
              {app.rejection_codes.map((code) => (
                <li key={code}>
                  {providerRejectionCodeLabel(t, code)}
                  <span className="ml-1 font-mono text-meta text-ink-500">({code})</span>
                </li>
              ))}
            </ul>
          ) : null}
          {app?.rejection_message ? (
            <p className="text-small text-ink-700 whitespace-pre-wrap">{app.rejection_message}</p>
          ) : null}

          {actionable ? (
            <div className={`mt-4 space-y-3 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() => void submitReview("reviewing")}
                >
                  {t("admin_provider_app_actionReviewing")}
                </button>
                <button
                  type="button"
                  className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
                  disabled={reviewLoading}
                  data-tt-admin-action-needs-more-info="1"
                  onClick={() =>
                    requestConfirm({
                      titleKey: "admin_l5_confirm_title_reject",
                      descKey: "admin_provider_app_confirm_needs_more_info",
                      danger: false,
                      confirmLabelKey: "admin_provider_app_actionNeedsMoreInfo",
                      onConfirm: () => submitReview("needs_more_info"),
                    })
                  }
                >
                  {t("admin_provider_app_actionNeedsMoreInfo")}
                </button>
                <button
                  type="button"
                  className={ADMIN_SEMANTIC_APPROVE_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() =>
                    requestConfirm({
                      titleKey: "admin_l5_confirm_title_approve",
                      descKey: "admin_provider_app_confirm_approve",
                      danger: true,
                      confirmLabelKey: "admin_provider_app_actionApprove",
                      onConfirm: () => submitReview("approved"),
                    })
                  }
                >
                  {t("admin_provider_app_actionApprove")}
                </button>
                <button
                  type="button"
                  className={ADMIN_SEMANTIC_REJECT_BTN_CLASS}
                  disabled={reviewLoading}
                  onClick={() =>
                    requestConfirm({
                      titleKey: "admin_l5_confirm_title_reject",
                      descKey: "admin_provider_app_confirm_reject",
                      danger: true,
                      confirmLabelKey: "admin_provider_app_actionReject",
                      onConfirm: () => submitReview("rejected"),
                    })
                  }
                >
                  {t("admin_provider_app_actionReject")}
                </button>
              </div>
              <label className="block text-small text-ink-700">
                {t("admin_provider_app_rejectionCodes")}
                <input
                  type="text"
                  className={`mt-1 w-full ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 font-mono text-meta`}
                  value={rejectionCodes}
                  onChange={(e) => setRejectionCodes(e.target.value)}
                  placeholder="DOC_BLUR, INCOMPLETE"
                />
              </label>
              <label className="block text-small text-ink-700">
                {t("admin_provider_app_rejectionMessage")}
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
