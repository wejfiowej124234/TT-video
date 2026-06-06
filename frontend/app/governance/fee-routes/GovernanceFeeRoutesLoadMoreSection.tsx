"use client";

import { type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import {
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_BTN_WARM_OUTLINE_COMPACT,
} from "@/lib/marketingUi";

type GovernanceFeeRoutesLoadMoreSectionProps = {
  hasMore: boolean;
  nextCursor: string | null | undefined;
  loadMoreError: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  setLoadMoreError: (msg: string | null) => void;
  governanceFeeRoutesLoadMoreHintId: string;
  t: (key: string) => string;
};

export function GovernanceFeeRoutesLoadMoreSection({
  hasMore,
  nextCursor,
  loadMoreError,
  loadingMore,
  onLoadMore,
  setLoadMoreError,
  governanceFeeRoutesLoadMoreHintId,
  t,
}: GovernanceFeeRoutesLoadMoreSectionProps) {
  if (!hasMore || !nextCursor) return null;

  return (
    <div className="mt-6">
      {loadMoreError ? (
        <div className="mb-4 max-w-2xl space-y-2" role="alert" aria-live="polite">
          <ApiErrorAlert message={loadMoreError} />
          <div className="flex flex-wrap gap-2">
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (loadingMore) return;
                onLoadMore();
              }}
            >
              <button
                type="submit"
                disabled={loadingMore}
                aria-busy={loadingMore ? true : undefined}
                aria-label={t("common_retry")}
                className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-3 py-2 focus-visible:ring-offset-bg-main`}
              >
                {loadingMore ? t("common_retrying") : t("common_retry")}
              </button>
            </form>
            <form
              className="inline"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setLoadMoreError(null);
              }}
            >
              <button
                type="submit"
                className={`${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} text-meta focus-visible:ring-offset-bg-main`}
                aria-label={t("common_closeAlert")}
              >
                {t("common_closeAlert")}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <p id={governanceFeeRoutesLoadMoreHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
        {t("governance_public_load_more_hint")}
      </p>
      <form
        className="inline"
        aria-describedby={governanceFeeRoutesLoadMoreHintId}
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onLoadMore();
        }}
      >
        <button
          type="submit"
          className={`${TT_MARKETING_BTN_SECONDARY_CONSOLE} rounded-[var(--radius-sm)] px-4 py-2 focus-visible:ring-offset-bg-main`}
          disabled={loadingMore}
          aria-busy={loadingMore ? true : undefined}
        >
          {loadingMore ? t("common_loading") : t("governance_fee_routes_load_more")}
        </button>
      </form>
    </div>
  );
}
