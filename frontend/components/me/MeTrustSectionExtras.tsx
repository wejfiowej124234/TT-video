import type { MeTrustSummary } from "@/lib/meTrust";

export default function MeTrustSectionExtras({
  trust,
  t,
  compact,
}: {
  trust: MeTrustSummary;
  t: (k: string) => string;
  compact: boolean;
}) {
  return (
    <>
      {trust.identity_status != null || trust.risk_level != null ? (
        <dl className={`grid sm:grid-cols-2 ${compact ? "gap-2 mt-2" : "gap-3 mt-3"}`}>
          {trust.identity_status != null ? (
            <div className={`rounded-[var(--radius-md)] border border-success/20 bg-ink-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
              <dt className="text-meta text-slate-300">{t("me_trust_identity_label")}</dt>
              <dd className="text-body font-mono text-success mt-1">{trust.identity_status}</dd>
            </div>
          ) : null}
          {trust.risk_level != null ? (
            <div className={`rounded-[var(--radius-md)] border border-success/20 bg-ink-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
              <dt className="text-meta text-slate-300">{t("me_trust_risk_label")}</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-meta font-mono font-medium border ${
                    trust.risk_level === "high"
                      ? "bg-danger/15 text-danger/95 border-danger/40"
                      : trust.risk_level === "medium"
                        ? "bg-warning/15 text-warning/95 border-warning/40"
                        : "bg-success/15 text-success border-success/35"
                  }`}
                >
                  {trust.risk_level}
                </span>
                {trust.risk_basis != null && trust.risk_basis !== "" ? (
                  <p className="text-meta text-slate-300/95 mt-2">
                    {t("me_trust_risk_basis_caption")}:{" "}
                    <span className="font-mono text-slate-200">{trust.risk_basis}</span>
                  </p>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {(trust.recommended_actions != null && trust.recommended_actions.length > 0) ||
      (trust.risk_reason_codes != null && trust.risk_reason_codes.length > 0) ? (
        <div className={`rounded-[var(--radius-md)] border border-warning/25 bg-ink-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
          {trust.recommended_actions != null && trust.recommended_actions.length > 0 ? (
            <div className="mb-3 last:mb-0">
              <h3 className="text-meta font-semibold text-warning/95 mb-2">{t("me_trust_recommended_actions_title")}</h3>
              <ul className="list-disc pl-5 space-y-1 text-body text-slate-200">
                {trust.recommended_actions.map((code) => {
                  const key = `me_trust_action_${code}`;
                  const label = t(key);
                  return (
                    <li key={code}>
                      {label === key ? <span className="font-mono text-slate-300">{code}</span> : label}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {trust.risk_reason_codes != null && trust.risk_reason_codes.length > 0 ? (
            <div>
              <h3 className="text-meta font-semibold text-slate-300 mb-2">{t("me_trust_reason_codes_title")}</h3>
              <ul className="flex flex-wrap gap-2">
                {trust.risk_reason_codes.map((code) => (
                  <li key={code}>
                    <span className="inline-block rounded-[var(--radius-sm)] border border-slate-600/80 bg-ink-900/60 px-2 py-0.5 text-meta font-mono text-slate-300">
                      {code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {trust.reputation?.as_guide != null ? (
        <div className={`rounded-[var(--radius-md)] border border-cyan-500/25 bg-ink-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
          <h3 className="text-meta font-semibold text-cyan-200 mb-2">{t("me_trust_reputation_title")}</h3>
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <div>
              <dt className="text-meta text-slate-300">{t("me_trust_reputation_avg")}</dt>
              <dd className="text-body font-mono text-cyan-300 mt-0.5">
                {trust.reputation.as_guide.weighted_avg_score == null ||
                typeof trust.reputation.as_guide.weighted_avg_score !== "number" ||
                !Number.isFinite(trust.reputation.as_guide.weighted_avg_score)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.weighted_avg_score.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-300">{t("me_trust_reputation_received")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_guide.reviews_received_count === "number" &&
                !Number.isFinite(trust.reputation.as_guide.reviews_received_count)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.reviews_received_count}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-300">{t("me_trust_reputation_weight_sum")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_guide.sum_review_weights !== "number" ||
                !Number.isFinite(trust.reputation.as_guide.sum_review_weights)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.sum_review_weights.toFixed(4)}
              </dd>
            </div>
          </dl>
          <p className="text-meta text-slate-300 mt-2">
            {t("me_trust_reputation_rule")}:{" "}
            <span className="font-mono text-slate-200">{trust.reputation.rule_version}</span>
          </p>
          {trust.reputation.formula != null && trust.reputation.formula !== "" ? (
            <p className="text-small text-slate-300/95 mt-1 leading-relaxed break-words">{trust.reputation.formula}</p>
          ) : null}
        </div>
      ) : null}
      {trust.reputation?.as_reviewer != null ? (
        <div className={`rounded-[var(--radius-md)] border border-violet-500/25 bg-ink-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
          <h3 className="text-meta font-semibold text-violet-200 mb-2">{t("me_trust_reputation_reviewer_title")}</h3>
          <dl className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div>
              <dt className="text-meta text-slate-300">{t("me_trust_reputation_reviewer_count")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_reviewer.reviews_written_count === "number" &&
                !Number.isFinite(trust.reputation.as_reviewer.reviews_written_count)
                  ? t("ui_em_dash")
                  : trust.reputation.as_reviewer.reviews_written_count}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-300">{t("me_trust_reputation_reviewer_weight_sum")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_reviewer.sum_review_weights !== "number" ||
                !Number.isFinite(trust.reputation.as_reviewer.sum_review_weights)
                  ? t("ui_em_dash")
                  : trust.reputation.as_reviewer.sum_review_weights.toFixed(4)}
              </dd>
            </div>
          </dl>
          {trust.reputation.as_guide == null && trust.reputation.formula != null && trust.reputation.formula !== "" ? (
            <p className="text-small text-slate-300/95 mt-2 leading-relaxed break-words">{trust.reputation.formula}</p>
          ) : null}
          {trust.reputation.as_guide == null ? (
            <p className="text-meta text-slate-300 mt-2">
              {t("me_trust_reputation_rule")}:{" "}
              <span className="font-mono text-slate-200">{trust.reputation.rule_version}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
