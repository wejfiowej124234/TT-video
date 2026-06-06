"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getOrderReviews,
  postReview,
  getIdempotencyKey,
  type OrderReviewListItem,
  type OrderReviewWeightBreakdown,
  type OrderReviewsListMeta,
} from "@/lib/apiClient";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { mapReviewSubmitError } from "@/lib/mapReviewSubmitError";
import {
  escrowProtocolCompactInputClass,
  escrowProtocolCompactSelectClass,
  escrowProtocolInlineLinkClass,
  escrowProtocolMetaClass,
  escrowProtocolPillFocusClass,
  escrowProtocolSubheadingClass,
  TT_ESCROW_PROTOCOL_SECTION,
} from "@/lib/escrowProtocolUi";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

/** 与后端默认 REVIEW_LOW_SCORE_COMMENT_MIN_CHARS 一致（未读 env 时） */
const LOW_SCORE_COMMENT_MIN = 20;

function parseWeightBreakdown(v: unknown): OrderReviewWeightBreakdown | null {
  if (v == null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const rule_version = typeof o.rule_version === "string" ? o.rule_version : "";
  if (!rule_version) return null;
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : NaN);
  const order_amount = num("order_amount");
  const account_age_days = num("account_age_days");
  const amount_factor = num("amount_factor");
  const age_factor = num("age_factor");
  const weight = num("weight");
  const guide_historical_score_reserved = num("guide_historical_score_reserved");
  if ([order_amount, account_age_days, amount_factor, age_factor, weight, guide_historical_score_reserved].some((x) => Number.isNaN(x))) {
    return null;
  }
  return {
    rule_version,
    order_amount,
    account_age_days: Math.round(account_age_days),
    amount_factor,
    age_factor,
    weight,
    guide_historical_score_reserved,
  };
}

export default function ReviewBlock({ orderId, variantDid }: { orderId: string; variantDid?: boolean }) {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<OrderReviewListItem[]>([]);
  const [listMeta, setListMeta] = useState<OrderReviewsListMeta | undefined>(undefined);
  const [lastBreakdown, setLastBreakdown] = useState<OrderReviewWeightBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [listLoadError, setListLoadError] = useState<string | null>(null);
  const reviewsSectionId = useId();
  const scoreFieldId = `${reviewsSectionId}-score`;
  const commentFieldId = `${reviewsSectionId}-comment`;
  const lowScoreHintId = `${reviewsSectionId}-low-score-hint`;

  useEffect(() => {
    setLastBreakdown(null);
  }, [orderId]);

  const load = useCallback((): Promise<void> => {
    setLoading(true);
    setListLoadError(null);
    return getOrderReviews(orderId)
      .then(({ items, meta }) => {
        setReviews(items);
        setListMeta(meta);
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("ReviewBlock getOrderReviews:", e);
        }
        setReviews([]);
        setListMeta(undefined);
        setListLoadError(mapApiReadError(e, t, "escrow_loadFailed"));
      })
      .finally(() => setLoading(false));
  }, [orderId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = () => {
    setErr(null);
    if (score <= 2 && comment.trim().length < LOW_SCORE_COMMENT_MIN) {
      setErr(t("escrow_reviewLowScoreCommentRequired"));
      return;
    }
    setSubmitting(true);
    postReview(orderId, { score, comment: comment || undefined }, getIdempotencyKey())
      .then((raw) => {
        const body = raw as { review?: { weight_breakdown?: unknown } };
        setLastBreakdown(parseWeightBreakdown(body.review?.weight_breakdown));
        return load();
      })
      .then(() => {
        setComment("");
        setScore(5);
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          console.error("ReviewBlock postReview:", e);
        }
        setErr(mapReviewSubmitError(e, t));
      })
      .finally(() => setSubmitting(false));
  };

  const isDid = !!variantDid;
  const pillFocusClass = isDid
    ? escrowProtocolPillFocusClass
    : `${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`;
  const shellClass = isDid
    ? TT_ESCROW_PROTOCOL_SECTION
    : "rounded-[var(--radius-sm)] bg-bg-console p-6 shadow-soft space-y-3";
  const hClass = isDid ? escrowProtocolSubheadingClass : "text-body font-semibold text-ink-800";
  const loadingClass = isDid ? `text-small ${escrowProtocolMetaClass}` : "text-small text-ink-500";
  const errClass = isDid ? "text-small text-warning/95" : "text-small text-warning dark:text-warning/90";
  const retryClass = isDid
    ? `${touchTargetLink44Classes} ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:text-travel-500 underline-offset-2 hover:underline ${travelFocusRingOffset2Classes}`;
  const listMetaSummaryClass = isDid
    ? `${touchTargetLink44Classes} cursor-pointer select-none ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} cursor-pointer select-none text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`;
  const breakdownSummaryClass = isDid
    ? `${touchTargetLink44Classes} cursor-pointer font-medium ${escrowProtocolInlineLinkClass}`
    : `${touchTargetLink44Classes} cursor-pointer font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`;
  const ulClass = isDid ? `space-y-1 text-small ${escrowProtocolMetaClass}` : "space-y-1 text-small text-ink-700";
  const emptyLiClass = isDid ? escrowProtocolMetaClass : "text-ink-500";
  const groupBorder = isDid ? "border-t border-ref-sun/14" : "border-t border-ink-200";
  const labelClass = isDid ? `block text-meta ${escrowProtocolMetaClass}` : "block text-meta text-ink-500";
  const selectClass = isDid ? escrowProtocolCompactSelectClass : "inline-flex min-h-[44px] items-center justify-start border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-bg-console text-ink-800";
  const inputClass = isDid
    ? escrowProtocolCompactInputClass
    : "block w-full border border-ink-200 rounded-[var(--radius-sm)] px-2 py-1 text-small bg-bg-console text-ink-800 placeholder:text-ink-500";
  const lowHintClass = isDid ? `text-meta ${escrowProtocolMetaClass}` : "text-meta text-ink-600";
  const metaDetailsClass = isDid ? "text-meta text-slate-300 mt-2" : "text-meta text-ink-600 mt-2";

  const showListMeta =
    listMeta &&
    (listMeta.review_weight_rule_version != null || (listMeta.review_weight_rule != null && listMeta.review_weight_rule !== ""));

  return (
    <section className={shellClass} aria-labelledby={reviewsSectionId}>
      <h3 id={reviewsSectionId} className={hClass}>
        {t("escrow_reviews")}
      </h3>
      {loading ? (
        <p className={loadingClass} role="status" aria-live="polite" aria-busy="true">
          {t("common_loading")}
        </p>
      ) : listLoadError ? (
        <div className="space-y-2">
          <p className={errClass} role="alert">
            {listLoadError}
          </p>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <button type="submit" className={retryClass}>
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : (
        <>
          <ul className={ulClass}>
            {reviews.length === 0 && <li className={emptyLiClass}>{t("escrow_noReviews")}</li>}
            {reviews.map((r, i) => {
              const key = r.id ?? `${r.reviewer_id}-${i}`;
              const wPart =
                r.weight != null && Number.isFinite(r.weight)
                  ? ` · ${t("escrow_reviewWeightLabel")} ${r.weight.toFixed(4)}`
                  : "";
              return (
                <li key={key}>
                  {t("escrow_scoreLabelShort")}
                  {r.score}
                  {wPart}
                  {r.comment ? ` · ${r.comment}` : ""}
                </li>
              );
            })}
          </ul>
          {showListMeta ? (
            <details className={metaDetailsClass}>
              <summary className={listMetaSummaryClass}>
                {t("escrow_reviewListRuleSummary")}
              </summary>
              <dl className="mt-2 space-y-1 font-mono text-meta">
                {listMeta.review_weight_rule_version != null ? (
                  <div>
                    <dt className="inline text-ink-500">{t("escrow_reviewBreakdownRuleVersion")}: </dt>
                    <dd className="inline">{listMeta.review_weight_rule_version}</dd>
                  </div>
                ) : null}
                {listMeta.review_weight_rule != null && listMeta.review_weight_rule !== "" ? (
                  <div className="whitespace-pre-wrap break-words">{listMeta.review_weight_rule}</div>
                ) : null}
              </dl>
            </details>
          ) : null}
        </>
      )}
      {lastBreakdown != null ? (
        <details
          className={isDid ? "rounded-[var(--radius-md)] border border-ref-sun/15 bg-black/20 px-3 py-2 text-small text-slate-300" : "rounded-[var(--radius-md)] border border-ink-200 bg-bg-soft px-3 py-2 text-small text-ink-700"}
          open
        >
          <summary className={breakdownSummaryClass}>{t("escrow_reviewSubmitBreakdownTitle")}</summary>
          <dl className="mt-2 grid gap-1 font-mono text-meta sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownRuleVersion")}</dt>
              <dd>{lastBreakdown.rule_version}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownWeight")}</dt>
              <dd>{lastBreakdown.weight.toFixed(4)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownAmount")}</dt>
              <dd>{lastBreakdown.order_amount}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownAge")}</dt>
              <dd>{lastBreakdown.account_age_days}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownAmountFactor")}</dt>
              <dd>{lastBreakdown.amount_factor.toFixed(4)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t("escrow_reviewBreakdownAgeFactor")}</dt>
              <dd>{lastBreakdown.age_factor.toFixed(4)}</dd>
            </div>
          </dl>
        </details>
      ) : null}
      <form
        className={`pt-2 ${groupBorder} space-y-2`}
        aria-label={t("escrow_submitReview")}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={scoreFieldId} className={labelClass}>
          {t("escrow_scoreLabel")}
        </label>
        <select
          id={scoreFieldId}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className={selectClass}
          aria-describedby={score <= 2 ? lowScoreHintId : undefined}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <label htmlFor={commentFieldId} className={`${labelClass} mt-2`}>
          {t("escrow_reviewCommentLabel")}
        </label>
        <input
          id={commentFieldId}
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("escrow_commentPlaceholder")}
          className={inputClass}
          aria-describedby={score <= 2 ? lowScoreHintId : undefined}
        />
        {score <= 2 && (
          <p id={lowScoreHintId} className={lowHintClass}>
            {t("escrow_reviewLowScoreHint")}
          </p>
        )}
        {err && (
          <p className="text-small text-danger" role="alert">
            {err}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting ? true : undefined}
          className={`btn-console rounded-[var(--radius-sm)] bg-travel-500 px-3 py-1.5 text-white text-small disabled:opacity-50 ${pillFocusClass}`}
        >
          {submitting ? t("common_submitting") : t("escrow_submitReview")}
        </button>
      </form>
    </section>
  );
}
