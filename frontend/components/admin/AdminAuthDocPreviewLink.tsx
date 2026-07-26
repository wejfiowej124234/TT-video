"use client";

import { useCallback, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { apiUrl } from "@/lib/api";
import { writeRequestHeaders, requestId } from "@/lib/apiClient/core";
import { ADMIN_INLINE_LINK_CLASS, ADMIN_TEXT_FOOTNOTE_CLASS } from "@/lib/adminUi";

/**
 * Batch-11 HU-358 · 证件鉴权预览：带 Admin Bearer 拉取后开 blob，避免裸 target=_blank 401。
 * HU-368 · 服务端 ACL 须覆盖 guide ∪ provider KYB uploads（serve_guide_upload）。
 */
export const TT_ADMIN_UPLOAD_ACL_PROVIDER_DOCS = "tt-admin-upload-acl-provider-docs-v1";

export function AdminAuthDocPreviewLink(props: {
  href: string;
  label: string;
  "data-testid"?: string;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const openPreview = useCallback(async () => {
    const raw = props.href.split("#")[0]?.trim();
    if (!raw) return;
    setBusy(true);
    setErr(null);
    let objectUrl: string | null = null;
    try {
      const url = raw.startsWith("http") ? raw : apiUrl(raw.startsWith("/") ? raw : `/${raw}`);
      const res = await fetch(url, {
        headers: {
          ...writeRequestHeaders(),
          "x-request-id": requestId(),
        },
        credentials: "include",
      });
      if (!res.ok) {
        setErr(t("admin_doc_preview_auth_failed"));
        return;
      }
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }, 60_000);
    } catch {
      setErr(t("admin_doc_preview_auth_failed"));
    } finally {
      setBusy(false);
    }
  }, [props.href, t]);

  return (
    <span
      className="inline-flex flex-col gap-0.5"
      data-tt-admin-auth-doc-preview="1"
      data-tt-admin-upload-acl-provider={TT_ADMIN_UPLOAD_ACL_PROVIDER_DOCS}
    >      <button
        type="button"
        className={`${ADMIN_INLINE_LINK_CLASS} text-left break-all`}
        disabled={busy}
        onClick={() => void openPreview()}
        data-testid={props["data-testid"]}
      >
        {busy ? t("admin_doc_preview_opening") : props.label}
      </button>
      {err ? (
        <span className={`text-meta text-danger ${ADMIN_TEXT_FOOTNOTE_CLASS}`} role="alert">
          {err}
        </span>
      ) : null}
    </span>
  );
}
