"use client";

import type { FormEvent } from "react";
import {
  communityAmberPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type PublishDrawerAlertsProps = {
  t: LocaleTranslateFn;
  /** 顶栏：API/策略拒绝（含字段级如 `post_duplicate_body`） */
  showPublishErrorBanner: boolean;
  publishFormErrorId: string;
  publishErrorMessage?: string | null;
  onRetryPublish?: () => void;
  publishError?: boolean;
  bodyFieldErr: boolean;
  mediaFieldErr: boolean;
  coverFieldErr: boolean;
  tagsFieldErr: boolean;
};

export function PublishDrawerAlerts({
  t,
  showPublishErrorBanner,
  publishFormErrorId,
  publishErrorMessage,
  onRetryPublish,
  publishError,
  bodyFieldErr,
  mediaFieldErr,
  coverFieldErr,
  tagsFieldErr,
}: PublishDrawerAlertsProps) {
  const hasInlineFieldErr = bodyFieldErr || mediaFieldErr || coverFieldErr || tagsFieldErr;

  return (
    <>
      {showPublishErrorBanner ? (
        <div
          id={publishFormErrorId}
          className="mx-4 mt-3 rounded-[var(--radius-md)] border border-warning/50 bg-warning/10 px-3 py-2 flex items-center justify-between gap-2"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-meta text-warning/95">{publishErrorMessage?.trim() || t("community_publish_failed")}</p>
          {onRetryPublish ? (
            <form
              className="inline shrink-0"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                onRetryPublish();
              }}
            >
              <button
                type="submit"
                aria-label={t("community_clear_publish_error")}
                className={`rounded px-2 py-1 text-meta font-medium text-warning/95 hover:bg-warning/20 motion-sub min-h-[44px] inline-flex items-center justify-center ${communityAmberPillFocus}`}
              >
                {t("community_clear_publish_error")}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {publishError && hasInlineFieldErr && !showPublishErrorBanner && onRetryPublish ? (
        <div className="mx-4 mt-2 flex justify-end">
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onRetryPublish();
            }}
          >
            <button
              type="submit"
              aria-label={t("community_clear_publish_error")}
              className={`${TT_COMMUNITY_DRAWER_L5.publishGhostBtn} ${communitySlatePillFocus}`}
            >
              {t("community_clear_publish_error")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
