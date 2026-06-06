"use client";

import Link from "next/link";
import { useId } from "react";
import type { MeTrustSummary } from "@/lib/meTrust";
import { formatGuideRegistrationStatus } from "@/lib/meTrust";
import type { MeIdentitySlot, MeIdentitySlotState } from "@/lib/meIdentitySlots";
import { meIdentityActiveCount } from "@/lib/meIdentitySlots";
import { FOCUS_RING } from "./constants";
import MeAcquisitionPublishBondAction from "./MeAcquisitionPublishBondAction";
import MeAcquisitionFulfillmentBondAction from "./MeAcquisitionFulfillmentBondAction";

function slotLabelKey(id: MeIdentitySlot["id"]): string {
  switch (id) {
    case "traveler":
      return "me_identity_slot_traveler";
    case "guide":
      return "me_identity_slot_guide";
    case "acquisition":
      return "me_identity_slot_acquisition";
    case "merchant":
      return "me_identity_slot_merchant";
    case "region_steward":
      return "me_identity_slot_region_steward";
    default:
      return "me_identity_slot_traveler";
  }
}

function stateLabelKey(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return "me_identity_state_active";
    case "pending":
      return "me_identity_state_pending";
    case "restricted":
      return "me_identity_state_restricted";
    default:
      return "me_identity_state_inactive";
  }
}

function statePillClass(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return "bg-success/20 text-success border border-success/45";
    case "pending":
      return "bg-warning/15 text-warning/95 border border-warning/40";
    case "restricted":
      return "bg-danger/15 text-danger/90 border border-danger/40";
    default:
      return "bg-slate-700/70 text-slate-300 border border-slate-600/60";
  }
}

export interface MeTrustSectionProps {
  t: (k: string) => string;
  trust: MeTrustSummary;
  /** 已是向导账号时不展示「去注册」链，避免重复引导 */
  showGuideRegisterLink?: boolean;
  /** `/guide` 顶区横幅已展示向导资质时，隐藏本区「向导注册」格，避免重复 */
  hideGuideRegistrationRow?: boolean;
  /** 为 false 时隐藏顶区「信任中心」外链段落（与同页快捷 pill 去重） */
  showTrustHubPromo?: boolean;
  /** 五类身份与质押矩阵（`GET /me.identity_slots`） */
  identitySlots?: MeIdentitySlot[];
  /** 社区「我的」等页：收紧间距，次要说明与扩展块收入折叠 */
  compact?: boolean;
  /** 锁定收购发布保证金成功后刷新 `GET /me` */
  onTrustRefresh?: () => void;
}

export default function MeTrustSection({
  t,
  trust,
  showGuideRegisterLink = true,
  hideGuideRegistrationRow = false,
  showTrustHubPromo = true,
  identitySlots,
  compact = false,
  onTrustRefresh,
}: MeTrustSectionProps) {
  const titleId = useId();
  const matrixId = useId();
  const guideLabel = formatGuideRegistrationStatus(trust.guide_registration_status, t);
  const slots = identitySlots ?? [];
  const activeIdentities = meIdentityActiveCount(slots);
  const summaryKey =
    activeIdentities === 0
      ? "me_identity_summary_none"
      : activeIdentities === 1
        ? "me_identity_summary_one"
        : activeIdentities === 2
          ? "me_identity_summary_two"
          : "me_identity_summary_many";
  const summaryText =
    summaryKey === "me_identity_summary_many"
      ? t(summaryKey).replace(/\{\{count\}\}/g, String(activeIdentities))
      : t(summaryKey);
  const travelerSlot = slots.find((s) => s.id === "traveler");
  const stakeSlots = slots.filter((s) => s.id !== "traveler");
  const hasTrustExtras =
    trust.identity_status != null ||
    trust.risk_level != null ||
    (trust.recommended_actions != null && trust.recommended_actions.length > 0) ||
    (trust.risk_reason_codes != null && trust.risk_reason_codes.length > 0) ||
    trust.reputation?.as_guide != null ||
    trust.reputation?.as_reviewer != null;
  const trustExtrasNeedProminence =
    trust.risk_level === "high" ||
    trust.risk_level === "medium" ||
    (trust.recommended_actions != null && trust.recommended_actions.length > 0);

  const matrixBlock = slots.length === 5 ? (
    <div
      className={`rounded-[var(--radius-md)] border border-emerald-500/25 bg-slate-800/45 ${compact ? "mb-2 px-2.5 py-2 sm:px-3" : "mb-4 px-3 py-3 sm:px-4"}`}
      aria-labelledby={matrixId}
    >
      <h3 id={matrixId} className={`font-semibold text-emerald-200/95 ${compact ? "text-small mb-0.5" : "text-meta mb-1"}`}>
        {t("me_identity_matrix_title")}
      </h3>
      <p className={`text-slate-400/95 leading-snug ${compact ? "text-[0.65rem] mb-1" : "text-[0.7rem] mb-2 leading-relaxed"}`}>
        {t("me_identity_matrix_subtitle")}
      </p>
      <p className={`text-slate-300/95 leading-snug ${compact ? "text-[0.7rem] mb-2" : "text-meta mb-3 leading-relaxed"}`}>{summaryText}</p>
      <ul className={`grid grid-cols-2 lg:grid-cols-4 list-none p-0 m-0 ${compact ? "gap-2" : "gap-2.5"}`}>
        {travelerSlot ? (
          <li
            className={`col-span-2 lg:col-span-4 rounded-[var(--radius-md)] border border-slate-600/55 bg-slate-900/55 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
              compact ? "px-2.5 py-2" : "px-3 py-3"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-small font-semibold text-slate-100">{t(slotLabelKey("traveler"))}</span>
              <span
                className={`inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${statePillClass(travelerSlot.state)}`}
              >
                {t(stateLabelKey(travelerSlot.state))}
              </span>
            </div>
            <p className="text-[0.7rem] text-slate-400/95 leading-snug sm:text-right sm:max-w-[14rem]">
              {t("me_identity_traveler_no_stake_caption")}
            </p>
          </li>
        ) : null}
        {stakeSlots.map((slot) => (
          <li
            key={slot.id}
            className={`rounded-[var(--radius-md)] border border-slate-600/55 bg-slate-900/55 px-2.5 flex flex-col ${
              compact ? "py-2 min-h-[92px]" : "py-2.5 min-h-[104px]"
            }`}
          >
            <span className="text-small font-semibold text-slate-100 leading-tight">{t(slotLabelKey(slot.id))}</span>
            <span
              className={`mt-1.5 inline-flex w-fit max-w-full rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide ${statePillClass(slot.state)}`}
            >
              {t(stateLabelKey(slot.state))}
            </span>
            <div className="mt-auto pt-2 border-t border-slate-600/40">
              <span className="text-[0.65rem] text-slate-400 block">{t("me_identity_stake_label")}</span>
              <span className="text-meta font-mono text-slate-200/95 break-all">
                {slot.stake_display ?? t("me_identity_stake_empty")}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {!compact ? <p className="text-[0.7rem] text-slate-400/95 mt-2.5 leading-relaxed">{t("me_identity_stake_chain_hint")}</p> : null}
    </div>
  ) : null;

  const trustExtrasBlock = (
    <>
      {trust.identity_status != null || trust.risk_level != null ? (
        <dl className={`grid sm:grid-cols-2 ${compact ? "gap-2 mt-2" : "gap-3 mt-3"}`}>
          {trust.identity_status != null ? (
            <div className={`rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
              <dt className="text-meta text-slate-300">{t("me_trust_identity_label")}</dt>
              <dd className="text-body font-mono text-success mt-1">{trust.identity_status}</dd>
            </div>
          ) : null}
          {trust.risk_level != null ? (
            <div className={`rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
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
        <div className={`rounded-[var(--radius-md)] border border-warning/25 bg-slate-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
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
        <div className={`rounded-[var(--radius-md)] border border-cyan-500/25 bg-slate-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
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
        <div className={`rounded-[var(--radius-md)] border border-violet-500/25 bg-slate-800/50 px-3 ${compact ? "py-2 mt-2" : "py-3 mt-4"}`}>
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

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-cyan-400/35 bg-slate-900/60 backdrop-blur-md shadow-scifi-banner ring-1 ring-white/5 ${
        compact ? "px-3 py-3 sm:px-4 sm:py-4 mb-0" : "px-4 py-4 sm:px-6 sm:py-5 mb-4 sm:mb-6"
      }`}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className={`font-semibold text-success ${compact ? "text-meta mb-1.5" : "text-body mb-3"}`}>
        {t("me_trust_title")}
      </h2>
      {matrixBlock}
      <MeAcquisitionPublishBondAction
        t={t}
        trust={trust}
        compact={compact}
        onBondLocked={onTrustRefresh}
      />
      <MeAcquisitionFulfillmentBondAction
        t={t}
        trust={trust}
        compact={compact}
        onBondLocked={onTrustRefresh}
      />
      {!compact ? <p className="text-meta text-slate-300 mb-3">{t("me_trust_intro")}</p> : null}
      {showTrustHubPromo ? (
        <p className="text-meta text-slate-300 mb-3">
          <Link
            href="/trust"
            className={`font-medium text-emerald-300 hover:text-emerald-100 underline motion-sub ${FOCUS_RING}`}
          >
            {t("trust_hub_link")}
          </Link>
          <span className="text-slate-300/95"> — {t("trust_hub_hint")}</span>
        </p>
      ) : null}
      <dl
        className={`grid ${hideGuideRegistrationRow ? "sm:grid-cols-2" : "sm:grid-cols-3"} ${compact ? "gap-2" : "gap-3 sm:gap-4"}`}
      >
        <div className={`rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
          <dt className="text-meta text-slate-300">{t("me_kycStatus")}</dt>
          <dd className="text-body font-mono text-success mt-1">{trust.kyc_status}</dd>
        </div>
        <div className={`rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 ${compact ? "py-2" : "py-3"}`}>
          <dt className="text-meta text-slate-300">{t("me_trust_wallet_label")}</dt>
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
          <div className={`rounded-[var(--radius-md)] border border-success/20 bg-slate-800/60 px-3 sm:col-span-1 ${compact ? "py-2" : "py-3"}`}>
            <dt className="text-meta text-slate-300">{t("me_trust_guide_label")}</dt>
            <dd className="text-body text-slate-200 mt-1">{guideLabel}</dd>
          </div>
        )}
      </dl>
      {hasTrustExtras ? (
        compact && !trustExtrasNeedProminence ? (
          <details className="mt-2 rounded-[var(--radius-md)] border border-slate-600/45 bg-slate-800/30 open:border-slate-500/50">
            <summary className="cursor-pointer select-none list-none px-2.5 py-2 text-meta text-slate-400 hover:text-slate-200 [&::-webkit-details-marker]:hidden">
              {t("me_trust_compact_extras_summary")}
            </summary>
            <div className="border-t border-slate-600/40 px-2.5 pb-2.5 pt-2 space-y-1">{trustExtrasBlock}</div>
          </details>
        ) : compact ? (
          <div className="mt-2 space-y-1">{trustExtrasBlock}</div>
        ) : (
          trustExtrasBlock
        )
      ) : null}
      {compact ? (
        <details className="mt-2 rounded-[var(--radius-md)] border border-slate-600/45 bg-slate-800/30 open:border-slate-500/50">
          <summary className="cursor-pointer select-none list-none px-2.5 py-2 text-meta text-slate-400 hover:text-slate-200 [&::-webkit-details-marker]:hidden">
            {t("me_trust_compact_ancillary_summary")}
          </summary>
          <div className="border-t border-slate-600/40 px-2.5 pb-2.5 pt-2 space-y-2 text-[0.7rem] text-slate-400/95 leading-relaxed">
            {slots.length === 5 ? <p>{t("me_identity_stake_chain_hint")}</p> : null}
            <p>{t("me_kycReservedNote")}</p>
          </div>
        </details>
      ) : (
        <p className="text-meta text-slate-300 mt-3">{t("me_kycReservedNote")}</p>
      )}
      {showGuideRegisterLink ? (
        <div className={compact ? "mt-2" : "mt-3"}>
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
