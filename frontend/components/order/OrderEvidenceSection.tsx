"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { getOrderEvidence } from "@/lib/apiClient";
import EvidenceSignedLinkControl from "./EvidenceSignedLinkControl";

type EvidenceRow = { content_hash: string; created_at?: string; uploader_id?: string };

export type OrderEvidenceSectionProps = {
  orderId: string;
  /** 与 Escrow 协议区 `panelClass` 一致 */
  panelClassName: string;
  variantDid?: boolean;
  variantExperience?: boolean;
};

export default function OrderEvidenceSection({
  orderId,
  panelClassName,
  variantDid,
  variantExperience,
}: OrderEvidenceSectionProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getOrderEvidence(orderId)
      .then((items) => {
        if (cancelled) return;
        setRows((Array.isArray(items) ? items : []) as EvidenceRow[]);
      })
      .catch((err) => {
        if (typeof window !== "undefined") {
          console.error("OrderEvidenceSection getOrderEvidence:", err);
        }
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const isExperience = !!variantExperience;
  const isDid = !!variantDid && !isExperience;
  const titleClass = isExperience
    ? "text-small font-semibold text-ref-sun/95 mb-2"
    : isDid
      ? "text-small font-semibold text-cyan-200 mb-2"
      : "text-small font-semibold text-ink-800 mb-2";
  const metaClass = isExperience
    ? "text-meta text-slate-200"
    : isDid
      ? "text-meta text-slate-300"
      : "text-meta text-ink-600";
  const hashClass = isExperience
    ? "text-small font-mono text-slate-200 break-all"
    : isDid
      ? "text-small font-mono text-slate-300 break-all"
      : "text-small font-mono text-ink-600 break-all";

  const evidenceTitleKey = isExperience
    ? "escrow_evidenceSectionTitle_experience"
    : "escrow_evidenceSectionTitle";
  const evidenceEmptyKey = isExperience
    ? "escrow_evidenceEmpty_experience"
    : "escrow_evidenceEmpty";

  const sectionShellClass = isExperience
    ? "rounded-[var(--radius-sm)] border border-ref-sun/18 bg-[#0f0c0a] p-4 md:p-5 space-y-3"
    : `${panelClassName} p-4 md:p-5 space-y-3`;

  return (
    <section className={sectionShellClass} aria-label={t(evidenceTitleKey)}>
      <h3 className={titleClass}>{t(evidenceTitleKey)}</h3>
      {!loaded ? (
        <p className={metaClass}>{t("common_loading")}</p>
      ) : rows.length === 0 ? (
        <p className={metaClass}>{t(evidenceEmptyKey)}</p>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {rows.map((r, i) => (
            <li key={`${r.content_hash}-${i}`} className="flex flex-wrap items-start gap-2 gap-y-1">
              <div className="min-w-0 flex-1">
                <span className={hashClass}>{r.content_hash}</span>
                {r.created_at ? <span className={`${metaClass} ml-2`}>{r.created_at}</span> : null}
              </div>
              <EvidenceSignedLinkControl
                orderId={orderId}
                contentHash={r.content_hash}
                variant={isExperience || isDid ? "did" : "light"}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
