"use client";

import Link from "next/link";
import { useId } from "react";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatGuideRegistrationStatus } from "@/lib/meTrust";
import { FOCUS_RING } from "./constants";

export interface MeTrustSectionProps {
  t: (k: string) => string;
  trust: MeTrustSummary;
  /** 已是向导账号时不展示「去注册」链，避免重复引导 */
  showGuideRegisterLink?: boolean;
  /** `/guide` 顶区横幅已展示向导资质时，隐藏本区「向导注册」格，避免重复 */
  hideGuideRegistrationRow?: boolean;
}

export default function MeTrustSection({
  t,
  trust,
  showGuideRegisterLink = true,
  hideGuideRegistrationRow = false,
}: MeTrustSectionProps) {
  const titleId = useId();
  const guideLabel = formatGuideRegistrationStatus(trust.guide_registration_status, t);
  return (
    <section
      className="rounded-[var(--radius-md)] border border-success/35 bg-slate-900/70 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6 shadow-scifi-success motion-sub hover:border-success/55"
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="text-body font-semibold text-success mb-3">
        {t("me_trust_title")}
      </h2>
      <p className="text-meta text-slate-400 mb-3">{t("me_trust_intro")}</p>
      <dl
        className={`grid gap-3 sm:gap-4 ${hideGuideRegistrationRow ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
      >
        <div className="rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 py-3">
          <dt className="text-meta text-slate-400">{t("me_kycStatus")}</dt>
          <dd className="text-body font-mono text-success mt-1">{trust.kyc_status}</dd>
        </div>
        <div className="rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 py-3">
          <dt className="text-meta text-slate-400">{t("me_trust_wallet_label")}</dt>
          <dd className="mt-1">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-meta font-medium ${
                trust.wallet_linked
                  ? "bg-success/20 text-success border border-success/40"
                  : "bg-slate-700/80 text-slate-300 border border-slate-600/60"
              }`}
            >
              {trust.wallet_linked ? t("me_trust_wallet_yes") : t("me_trust_wallet_no")}
            </span>
          </dd>
        </div>
        {hideGuideRegistrationRow ? null : (
          <div className="rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 py-3 sm:col-span-1">
            <dt className="text-meta text-slate-400">{t("me_trust_guide_label")}</dt>
            <dd className="text-body text-slate-200 mt-1">{guideLabel}</dd>
          </div>
        )}
      </dl>
      {trust.identity_status != null || trust.risk_level != null ? (
        <dl className="grid gap-3 sm:grid-cols-2 mt-3">
          {trust.identity_status != null ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 py-3">
              <dt className="text-meta text-slate-400">{t("me_trust_identity_label")}</dt>
              <dd className="text-body font-mono text-success mt-1">{trust.identity_status}</dd>
            </div>
          ) : null}
          {trust.risk_level != null ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 py-3">
              <dt className="text-meta text-slate-400">{t("me_trust_risk_label")}</dt>
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
                  <p className="text-meta text-slate-400 mt-2">
                    {t("me_trust_risk_basis_caption")}:{" "}
                    <span className="font-mono text-slate-300">{trust.risk_basis}</span>
                  </p>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {(trust.recommended_actions != null && trust.recommended_actions.length > 0) ||
      (trust.risk_reason_codes != null && trust.risk_reason_codes.length > 0) ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-warning/25 bg-slate-800/50 px-3 py-3">
          {trust.recommended_actions != null && trust.recommended_actions.length > 0 ? (
            <div className="mb-3 last:mb-0">
              <h3 className="text-meta font-semibold text-warning/95 mb-2">
                {t("me_trust_recommended_actions_title")}
              </h3>
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
              <h3 className="text-meta font-semibold text-slate-300 mb-2">
                {t("me_trust_reason_codes_title")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {trust.risk_reason_codes.map((code) => (
                  <li key={code}>
                    <span className="inline-block rounded-[var(--radius-sm)] border border-slate-600/80 bg-slate-900/60 px-2 py-0.5 text-meta font-mono text-slate-300">
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
        <div className="mt-4 rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-800/50 px-3 py-3">
          <h3 className="text-meta font-semibold text-cyan-200 mb-2">{t("me_trust_reputation_title")}</h3>
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <div>
              <dt className="text-meta text-slate-400">{t("me_trust_reputation_avg")}</dt>
              <dd className="text-body font-mono text-cyan-300 mt-0.5">
                {trust.reputation.as_guide.weighted_avg_score == null ||
                typeof trust.reputation.as_guide.weighted_avg_score !== "number" ||
                !Number.isFinite(trust.reputation.as_guide.weighted_avg_score)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.weighted_avg_score.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-400">{t("me_trust_reputation_received")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_guide.reviews_received_count === "number" &&
                !Number.isFinite(trust.reputation.as_guide.reviews_received_count)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.reviews_received_count}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-400">{t("me_trust_reputation_weight_sum")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_guide.sum_review_weights !== "number" ||
                !Number.isFinite(trust.reputation.as_guide.sum_review_weights)
                  ? t("ui_em_dash")
                  : trust.reputation.as_guide.sum_review_weights.toFixed(4)}
              </dd>
            </div>
          </dl>
          <p className="text-meta text-slate-400 mt-2">
            {t("me_trust_reputation_rule")}:{" "}
            <span className="font-mono text-slate-300">{trust.reputation.rule_version}</span>
          </p>
          {trust.reputation.formula != null && trust.reputation.formula !== "" ? (
            <p className="text-meta text-slate-400 mt-1">{trust.reputation.formula}</p>
          ) : null}
        </div>
      ) : null}
      {trust.reputation?.as_reviewer != null ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-violet-500/25 bg-slate-800/50 px-3 py-3">
          <h3 className="text-meta font-semibold text-violet-200 mb-2">{t("me_trust_reputation_reviewer_title")}</h3>
          <dl className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <div>
              <dt className="text-meta text-slate-400">{t("me_trust_reputation_reviewer_count")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_reviewer.reviews_written_count === "number" &&
                !Number.isFinite(trust.reputation.as_reviewer.reviews_written_count)
                  ? t("ui_em_dash")
                  : trust.reputation.as_reviewer.reviews_written_count}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-slate-400">{t("me_trust_reputation_reviewer_weight_sum")}</dt>
              <dd className="text-body font-mono text-slate-200 mt-0.5">
                {typeof trust.reputation.as_reviewer.sum_review_weights !== "number" ||
                !Number.isFinite(trust.reputation.as_reviewer.sum_review_weights)
                  ? t("ui_em_dash")
                  : trust.reputation.as_reviewer.sum_review_weights.toFixed(4)}
              </dd>
            </div>
          </dl>
          {trust.reputation.as_guide == null && trust.reputation.formula != null && trust.reputation.formula !== "" ? (
            <p className="text-meta text-slate-400 mt-2">{trust.reputation.formula}</p>
          ) : null}
          {trust.reputation.as_guide == null ? (
            <p className="text-meta text-slate-400 mt-2">
              {t("me_trust_reputation_rule")}:{" "}
              <span className="font-mono text-slate-300">{trust.reputation.rule_version}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="text-meta text-slate-400 mt-3">{t("me_kycReservedNote")}</p>
      {showGuideRegisterLink ? (
        <div className="mt-3">
          <Link
            href="/guide/register"
            className={`inline-flex text-meta text-success hover:text-success underline motion-sub ${FOCUS_RING}`}
          >
            {t("me_trust_guide_cta")}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
