import { useCallback, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminMetaBuildFromPublicMeta } from "@/lib/useAdminMetaBuildFromPublicMeta";
import {
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
  type AdminFetchErrorKind,
  adminUserFacingErrorFromUnknown,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { writeRequestHeaders } from "@/lib/apiClient";

import {
  COMMENT_VIS_I18N,
  type AdminCommentVisibilityRes,
  type CommentVisibilityStatus,
  visErr,
} from "./adminCommunityCommentVisibilityPageModel";

export function useAdminCommunityCommentVisibilityPage() {
  const { t } = useTranslation();
  const { meta: buildMeta, loading: buildLoading, error: buildError } =
    useAdminMetaBuildFromPublicMeta("AdminCommentVisibilityMetaBuild");
  const [commentId, setCommentId] = useState("");
  const [visibility, setVisibility] = useState<CommentVisibilityStatus>("hidden");
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

  const submit = useCallback(() => {
    const id = commentId.trim();
    if (!id) {
      setFormError("invalid_request", t("admin_comment_vis_needId"));
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
    void adminFetchJson<AdminCommentVisibilityRes>(
      "AdminCommunityCommentVisibility",
      apiUrl(routes.admin.communityCommentVisibility(id)),
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ visibility_status: visibility }),
      },
    )
      .then(({ res, body: b }) => {
        const err = typeof b?.error === "string" ? b.error : undefined;
        if ((res.status === 400 || res.status === 404) && err) {
          const facing = adminUserFacingErrorFromUnknown(new Error(err), t);
          setFormError(facing.kind, visErr(err, t));
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminCommunityCommentVisibility", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        const visRaw = b.visibility_status ?? visibility;
        const visNorm =
          visRaw === "visible" || visRaw === "hidden" || visRaw === "removed" ? visRaw : null;
        const visLabel = visNorm ? t(COMMENT_VIS_I18N[visNorm]) : visRaw;
        setOk(t("admin_comment_vis_ok", { id: b.id ?? id, vis: visLabel }));
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityCommentVisibility", e);
        const facing = adminUserFacingErrorFromUnknown(e, t);
        setFormError(facing.kind, facing.message);
      })
      .finally(() => setSubmitting(false));
  }, [commentId, t, visibility]);

  return {
    buildMeta,
    buildLoading,
    buildError,
    commentId,
    setCommentId,
    visibility,
    setVisibility,
    submitting,
    error,
    errorKind,
    ok,
    submit,
  };
}
