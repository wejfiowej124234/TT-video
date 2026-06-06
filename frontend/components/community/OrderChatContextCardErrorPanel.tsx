"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";

type Props = {
  embedded: boolean;
  fetchError: string;
  orderChatBanner: string;
  retryLabel: string;
  onRetry: () => void;
};

export function OrderChatContextCardErrorPanel({
  embedded,
  fetchError,
  orderChatBanner,
  retryLabel,
  onRetry,
}: Props) {
  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {!embedded ? <p className="text-small text-slate-300">{orderChatBanner}</p> : null}
      <ApiErrorAlert message={fetchError} />
      <form
        className="inline"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          onRetry();
        }}
      >
        <button
          type="submit"
          aria-label={retryLabel}
          className={`${TT_COMMUNITY_FEED_ACTION.retryPill} ${communityCyanPillFocus}`}
        >
          {retryLabel}
        </button>
      </form>
    </div>
  );
}
