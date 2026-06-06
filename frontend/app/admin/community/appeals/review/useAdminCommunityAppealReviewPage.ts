// search-params gate: parent route provides Suspense boundary.
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
  type AdminFetchErrorKind,
  adminUserFacingErrorFromUnknown,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";

import {
  APPEAL_DECISION_I18N,
  APPEAL_REVIEW_DECISIONS,
  type CommunityAppealReviewRes,
  appealReviewErr,
} from "./adminCommunityAppealReviewPageModel";

export function useAdminCommunityAppealReviewPage() {
  const { t } = useTranslation();
  const requestConfirm = useAdminL5ConfirmRequest();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminAppealReviewMetaBuild");
  const searchParams = useSearchParams();
  const [appealId, setAppealId] = useState("");
  const [expectedVersion, setExpectedVersion] = useState("");
  const [decision, setDecision] = useState<(typeof APPEAL_REVIEW_DECISIONS)[number]>("rejected");
  const [reviewerNote, setReviewerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<AdminFetchErrorKind | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const setFormError = (kind: AdminFetchErrorKind, message: string) => {
    setErrorKind(kind);
    setError(message);
  };

  const clearFormError = () => {
    setErrorKind(null);
    setError(null);
  };

  useEffect(() => {
    const qId = searchParams.get("appeal_id")?.trim();
    const qVer = searchParams.get("expected_version")?.trim();
    if (qId) setAppealId(qId);
    if (qVer) setExpectedVersion(qVer);
  }, [searchParams]);

  const submitImpl = useCallback(() => {
    const aid = appealId.trim();
    if (!aid) {
      setFormError("invalid_request", t("admin_appeal_review_needId"));
      return;
    }
    const ev = Number.parseInt(expectedVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setFormError("invalid_request", t("admin_appeal_review_needVer"));
      return;
    }
    setSubmitting(true);
    clearFormError();
    setOk(null);
    let headers: Record<string, string>;
    try {
      headers = { ...writeRequestHeaders(), "Content-Type": "application/json" };
    } catch {
      setFormError("login_required", t("admin_policies_publishAuth"));
      setSubmitting(false);
      return;
    }
    const payload: Record<string, unknown> = {
      expected_version: ev,
      decision: decision.trim(),
    };
    if (reviewerNote.trim()) payload.reviewer_note = reviewerNote.trim();

    void adminFetchJson<CommunityAppealReviewRes>(
      "AdminCommunityAppealReview",
      apiUrl(routes.admin.communityAppealReview(aid)),
      { method: "POST", headers, body: JSON.stringify(payload) },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if (res.status === 400 && err) {
          setFormError("invalid_request", appealReviewErr(err, b, t));
          return;
        }
        if (res.status === 404 && err) {
          setFormError("not_found", appealReviewErr(err, b, t));
          return;
        }
        if (res.status === 409 && err) {
          setFormError("conflict", appealReviewErr(err, b, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityAppealReview", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const st = b.item?.status ?? decision;
        const idOut = b.item?.id ?? aid;
        const stNorm = st === "accepted" || st === "rejected" ? st : null;
        const stLabel = stNorm ? t(APPEAL_DECISION_I18N[stNorm]) : st;
        setOk(t("admin_appeal_review_ok", { id: idOut, status: stLabel }));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityAppealReview", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        setFormError(facing.kind, facing.message);
      })
      .finally(() => setSubmitting(false));
  }, [appealId, decision, expectedVersion, reviewerNote, t]);

  const submit = useCallback(() => {
    const aid = appealId.trim();
    if (!aid) {
      setFormError("invalid_request", t("admin_appeal_review_needId"));
      return;
    }
    const ev = Number.parseInt(expectedVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setFormError("invalid_request", t("admin_appeal_review_needVer"));
      return;
    }
    const stNorm = decision === "accepted" || decision === "rejected" ? decision : decision;
    const stLabel = stNorm === "accepted" || stNorm === "rejected" ? t(APPEAL_DECISION_I18N[stNorm]) : stNorm;
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_l5_confirm_desc_appeal_review",
      descVars: { decision: stLabel },
      danger: decision === "rejected",
      onConfirm: () => submitImpl(),
    });
  }, [appealId, decision, expectedVersion, requestConfirm, submitImpl, t]);

  return {
    buildMeta,
    buildLoading,
    buildError,
    appealId,
    setAppealId,
    expectedVersion,
    setExpectedVersion,
    decision,
    setDecision,
    reviewerNote,
    setReviewerNote,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  };
}
