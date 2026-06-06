"use client";

import type { OrderReviewListItem, OrderReviewsListMeta } from "@/lib/apiClient";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  reviewBlockEmptyLiClass,
  reviewBlockErrClass,
  reviewBlockListMetaSummaryClass,
  reviewBlockLoadingClass,
  reviewBlockMetaDetailsClass,
  reviewBlockRetryClass,
  reviewBlockUlClass,
} from "./reviewBlockChrome";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function ReviewBlockListPanel({
  loading,
  listLoadError,
  reviews,
  load,
  listMeta,
  showListMeta,
  isDid,
  headingId,
  hClass,
  t,
}: {
  loading: boolean;
  listLoadError: string | null;
  reviews: OrderReviewListItem[];
  load: () => Promise<void>;
  listMeta: OrderReviewsListMeta | undefined;
  showListMeta: boolean;
  isDid: boolean;
  headingId: string;
  hClass: string;
  t: TFn;
}) {
  const loadingClass = reviewBlockLoadingClass(isDid);
  const errClass = reviewBlockErrClass(isDid);
  const retryClass = reviewBlockRetryClass(isDid);
  const ulClass = reviewBlockUlClass(isDid);
  const emptyLiClass = reviewBlockEmptyLiClass(isDid);
  const listMetaSummaryClass = reviewBlockListMetaSummaryClass(isDid);
  const metaDetailsClass = reviewBlockMetaDetailsClass(isDid);

  return (
    <>
      <h3 id={headingId} className={hClass}>
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
                r.weight != null && Number.isFinite(r.weight) ? ` · ${t("escrow_reviewWeightLabel")} ${r.weight.toFixed(4)}` : "";
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
          {showListMeta && listMeta ? (
            <details className={metaDetailsClass}>
              <summary className={listMetaSummaryClass}>{t("escrow_reviewListRuleSummary")}</summary>
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
    </>
  );
}
