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
};

export default function OrderEvidenceSection({ orderId, panelClassName, variantDid }: OrderEvidenceSectionProps) {
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

  const titleClass = variantDid ? "text-small font-semibold text-cyan-200 mb-2" : "text-small font-semibold text-ink-800 mb-2";
  const metaClass = variantDid ? "text-meta text-slate-300" : "text-meta text-ink-500";
  const hashClass = variantDid ? "text-small font-mono text-slate-300 break-all" : "text-small font-mono text-ink-600 break-all";

  return (
    <section className={`${panelClassName} p-4 md:p-5 space-y-3`} aria-label={t("escrow_evidenceSectionTitle")}>
      <h3 className={titleClass}>{t("escrow_evidenceSectionTitle")}</h3>
      {!loaded ? (
        <p className={metaClass}>{t("common_loading")}</p>
      ) : rows.length === 0 ? (
        <p className={metaClass}>{t("escrow_evidenceEmpty")}</p>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {rows.map((r, i) => (
            <li key={`${r.content_hash}-${i}`} className="flex flex-wrap items-start gap-2 gap-y-1">
              <div className="min-w-0 flex-1">
                <span className={hashClass}>{r.content_hash}</span>
                {r.created_at ? <span className={`${metaClass} ml-2`}>{r.created_at}</span> : null}
              </div>
              <EvidenceSignedLinkControl orderId={orderId} contentHash={r.content_hash} variant={variantDid ? "did" : "light"} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
