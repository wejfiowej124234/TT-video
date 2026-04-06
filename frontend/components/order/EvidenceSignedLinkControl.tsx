"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getIdempotencyKey, postMediaSignedUrls } from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { evidenceSignedUrlObjectId } from "@/lib/evidenceMediaObjectId";

export type EvidenceSignedLinkVariant = "did" | "light";

export type EvidenceSignedLinkControlProps = {
  orderId: string;
  contentHash: string;
  variant?: EvidenceSignedLinkVariant;
};

function mapSignedLinkError(e: unknown, t: (key: string) => string): string {
  const code = e instanceof Error ? e.message : "";
  if (code === "object_not_found") return t("evidence_signedLinkErr_noReceipt");
  if (code === "database_required") return t("evidence_signedLinkErr_db");
  if (code === "login_required" || code === "unauthorized") return t("evidence_signedLinkErr_login");
  return mapApiReadError(e, t, "evidence_signedLinkErr_generic");
}

export default function EvidenceSignedLinkControl({
  orderId,
  contentHash,
  variant = "light",
}: EvidenceSignedLinkControlProps) {
  const { t } = useTranslation();
  const objectId = useMemo(() => evidenceSignedUrlObjectId(orderId, contentHash), [orderId, contentHash]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const btnClass =
    variant === "did"
      ? "shrink-0 rounded-[var(--radius-sm)] border border-cyan-500/40 px-2 py-0.5 text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/10 disabled:opacity-50"
      : "shrink-0 rounded-[var(--radius-sm)] border border-ink-200 px-2 py-0.5 text-meta text-trust-600 hover:bg-ink-50 disabled:opacity-50";

  const onCopy = useCallback(async () => {
    if (!objectId || busy) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await postMediaSignedUrls({ object_id: objectId, scope: "read" }, getIdempotencyKey());
      const url = typeof res.url === "string" ? res.url.trim() : "";
      if (!url) {
        setErr(t("evidence_signedLinkErr_generic"));
        return;
      }
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        setErr(t("evidence_signedLinkErr_generic"));
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if (typeof window !== "undefined") {
        console.error("EvidenceSignedLinkControl:", e);
      }
      setErr(mapSignedLinkError(e, t));
    } finally {
      setBusy(false);
    }
  }, [objectId, busy, t]);

  if (!objectId) return null;

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <form
        className="inline"
        onSubmit={(e) => {
          e.preventDefault();
          void onCopy();
        }}
      >
        <button type="submit" className={btnClass} disabled={busy} aria-busy={busy ? true : undefined}>
          {busy ? t("evidence_signedLinkBusy") : copied ? t("evidence_signedLinkCopied") : t("evidence_signedLinkCopy")}
        </button>
      </form>
      {err ? (
        <span className="text-meta text-danger max-w-[14rem]" role="alert">
          {err}
        </span>
      ) : null}
    </span>
  );
}
