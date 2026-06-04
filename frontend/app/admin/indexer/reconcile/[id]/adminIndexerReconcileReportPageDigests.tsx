import {
  formatDigestChainLine,
  formatDigestEconomicLine,
  formatDigestEventLogLine,
} from "./adminIndexerReconcileReportPageModel";

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-[min(28rem,70vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function StoredReportSummaryDigest({
  report,
  t,
}: {
  report: Record<string, unknown>;
  t: (key: string) => string;
}) {
  const summary = report.summary;
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  const stats = s.stats && typeof s.stats === "object" ? (s.stats as Record<string, unknown>) : null;
  const rawClean = stats?.projection_reconcile_clean;
  const issues = stats?.issues_total;
  const ecoLine = formatDigestEconomicLine(s.economic_projection_row_counts);
  const evLine = formatDigestEventLogLine(s.event_log_escrow_coverage);
  const chainLine = formatDigestChainLine(s.chain_observation);

  const issuesKnown =
    typeof issues === "number"
      ? Number.isFinite(issues)
      : typeof issues === "string" && issues.trim() !== "";

  const show =
    rawClean === true ||
    rawClean === false ||
    issuesKnown ||
    Boolean(ecoLine) ||
    Boolean(evLine) ||
    Boolean(chainLine);

  if (!show) return null;

  const cleanStr =
    rawClean === true
      ? t("admin_indexer_reconcile_reports_clean_yes")
      : rawClean === false
        ? t("admin_indexer_reconcile_reports_clean_no")
        : t("ui_em_dash");
  const issuesStr = issuesKnown ? String(issues) : t("ui_em_dash");

  const rows: { label: string; value: string }[] = [
    { label: t("admin_indexer_reconcile_digest_clean"), value: cleanStr },
    { label: t("admin_indexer_reconcile_digest_issues"), value: issuesStr },
  ];
  if (ecoLine) rows.push({ label: t("admin_indexer_reconcile_digest_econ"), value: ecoLine });
  if (evLine) rows.push({ label: t("admin_indexer_reconcile_digest_escrow_log"), value: evLine });
  if (chainLine) rows.push({ label: t("admin_indexer_reconcile_digest_chain"), value: chainLine });

  return (
    <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/80 p-3">
      <h3 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_indexer_reconcile_digest_title")}
      </h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-meta text-ink-500">{row.label}</dt>
            <dd className="font-mono text-small text-ink-900 break-all">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
