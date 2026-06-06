"use client";

import type { LocaleInterpolationVars } from "@/lib/i18n";
import {
  reviewBlockGroupBorderClass,
  reviewBlockInputClass,
  reviewBlockLabelClass,
  reviewBlockLowHintClass,
  reviewBlockPillFocusClass,
  reviewBlockSelectClass,
} from "./reviewBlockChrome";
import { TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT } from "@/lib/marketingUi";

type TFn = (key: string, vars?: LocaleInterpolationVars) => string;

export function ReviewBlockSubmitReviewForm({
  isDid,
  scoreFieldId,
  commentFieldId,
  lowScoreHintId,
  score,
  setScore,
  comment,
  setComment,
  err,
  submitting,
  onSubmit,
  t,
}: {
  isDid: boolean;
  scoreFieldId: string;
  commentFieldId: string;
  lowScoreHintId: string;
  score: number;
  setScore: (n: number) => void;
  comment: string;
  setComment: (s: string) => void;
  err: string | null;
  submitting: boolean;
  onSubmit: () => void;
  t: TFn;
}) {
  const pillFocusClass = reviewBlockPillFocusClass(isDid);
  const groupBorder = reviewBlockGroupBorderClass(isDid);
  const labelClass = reviewBlockLabelClass(isDid);
  const selectClass = reviewBlockSelectClass(isDid);
  const inputClass = reviewBlockInputClass(isDid);
  const lowHintClass = reviewBlockLowHintClass(isDid);

  return (
    <form
      className={`pt-2 ${groupBorder} space-y-2`}
      aria-label={t("escrow_submitReview")}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
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
        className={`${TT_MARKETING_BTN_PRIMARY_WARM_PROTOCOL_COMPACT} disabled:opacity-50${isDid ? ` ${pillFocusClass}` : ""}`}
      >
        {submitting ? t("common_submitting") : t("escrow_submitReview")}
      </button>
    </form>
  );
}
