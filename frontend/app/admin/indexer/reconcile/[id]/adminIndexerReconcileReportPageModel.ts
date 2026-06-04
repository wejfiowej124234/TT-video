export type ReconcileReportRes = {
  status?: string;
  error?: string;
  report?: Record<string, unknown>;
  note?: string;
  meta?: unknown;
};

export function downloadJsonFile(fileBase: string, content: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const safe = fileBase.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "report";
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reconcile-report-${safe}.json`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatDigestEconomicLine(eco: unknown): string {
  if (!eco || typeof eco !== "object") return "";
  const o = eco as Record<string, unknown>;
  const frRaw = o.fee_router_routed_events;
  const rvRaw = o.region_vault_forwarded_events;
  const fr = frRaw && typeof frRaw === "object" ? (frRaw as Record<string, unknown>) : null;
  const rv = rvRaw && typeof rvRaw === "object" ? (rvRaw as Record<string, unknown>) : null;
  const frN = typeof fr?.rows_total === "number" && Number.isFinite(fr.rows_total) ? fr.rows_total : null;
  const frMx =
    typeof fr?.max_block_number === "number" && Number.isFinite(fr.max_block_number)
      ? fr.max_block_number
      : null;
  const rvN = typeof rv?.rows_total === "number" && Number.isFinite(rv.rows_total) ? rv.rows_total : null;
  const rvMx =
    typeof rv?.max_block_number === "number" && Number.isFinite(rv.max_block_number)
      ? rv.max_block_number
      : null;
  const parts: string[] = [];
  if (frN !== null) {
    parts.push(frMx !== null ? `FR:${frN}↑${frMx}` : `FR:${frN}`);
  } else if (frMx !== null) {
    parts.push(`FR:↑${frMx}`);
  }
  if (rvN !== null) {
    parts.push(rvMx !== null ? `RV:${rvN}↑${rvMx}` : `RV:${rvN}`);
  } else if (rvMx !== null) {
    parts.push(`RV:↑${rvMx}`);
  }
  return parts.join(" ");
}

export function formatDigestEventLogLine(ev: unknown): string {
  if (!ev || typeof ev !== "object") return "";
  const o = ev as Record<string, unknown>;
  const cls =
    typeof o.escrow_class_event_rows === "number" && Number.isFinite(o.escrow_class_event_rows)
      ? o.escrow_class_event_rows
      : null;
  const crt =
    typeof o.escrow_created_rows === "number" && Number.isFinite(o.escrow_created_rows)
      ? o.escrow_created_rows
      : null;
  const dst =
    typeof o.distinct_escrow_address_from_escrow_created === "number" &&
    Number.isFinite(o.distinct_escrow_address_from_escrow_created)
      ? o.distinct_escrow_address_from_escrow_created
      : null;
  const parts: string[] = [];
  if (cls !== null) parts.push(`cls:${cls}`);
  if (crt !== null) parts.push(`crt:${crt}`);
  if (dst !== null) parts.push(`dst:${dst}`);
  return parts.join(" ");
}

export function formatDigestChainLine(co: unknown): string {
  if (!co || typeof co !== "object") return "";
  const o = co as Record<string, unknown>;
  if (o.ok === false && typeof o.error === "string" && o.error.trim()) {
    const err = o.error.trim();
    return `ok:false ${err.length > 96 ? `${err.slice(0, 96)}…` : err}`;
  }
  const tip =
    typeof o.eth_chain_tip_block_number === "number" && Number.isFinite(o.eth_chain_tip_block_number)
      ? o.eth_chain_tip_block_number
      : null;
  const ub =
    typeof o.indexer_finalized_upper_bound === "number" && Number.isFinite(o.indexer_finalized_upper_bound)
      ? o.indexer_finalized_upper_bound
      : null;
  const parts: string[] = [];
  if (tip !== null) parts.push(`tip:${tip}`);
  if (ub !== null) parts.push(`final≤${ub}`);
  return parts.join(" ");
}
