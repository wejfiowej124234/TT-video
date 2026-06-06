import { type FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityFeedFilterBarFeedErrorProps = {
  t: LocaleTranslateFn;
  feedError: string;
  onRefresh: () => void;
};

export function CommunityFeedFilterBarFeedError({ t, feedError, onRefresh }: CommunityFeedFilterBarFeedErrorProps) {
  return (
    <div className="mb-4 space-y-2" role="alert" aria-live="polite">
      <ApiErrorAlert message={feedError} tone="dark" />
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onRefresh();
        }}
      >
        <button
          type="submit"
          aria-label={t("common_retry")}
          className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCardLinkFocus}`}
        >
          {t("common_retry")}
        </button>
      </form>
    </div>
  );
}
