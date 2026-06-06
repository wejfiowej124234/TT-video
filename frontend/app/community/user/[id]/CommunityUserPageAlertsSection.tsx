"use client";

import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type TFn = (key: string) => string;

export function CommunityUserPageAlertsSection(props: {
  t: TFn;
  deleteError: string | null;
  visibilityError: string | null;
  isLoggedIn: boolean;
  isSelf: boolean;
  followingLoadError: string | null;
  onFollowingRetry: () => void;
  conversationsLoadError: string | null;
  onConversationsRetry: () => void;
  postsLoadError: string | null;
  onPostsRetry: () => void;
}) {
  const {
    t,
    deleteError,
    visibilityError,
    isLoggedIn,
    isSelf,
    followingLoadError,
    onFollowingRetry,
    conversationsLoadError,
    onConversationsRetry,
    postsLoadError,
    onPostsRetry,
  } = props;

  return (
    <>
      {deleteError && (
        <div className="mb-4">
          <ApiErrorAlert message={deleteError} tone="dark" />
        </div>
      )}
      {visibilityError && (
        <div className="mb-4">
          <ApiErrorAlert message={visibilityError} tone="dark" />
        </div>
      )}

      {isLoggedIn && !isSelf && followingLoadError ? (
        <div className="mb-4 space-y-2">
          <ApiErrorAlert message={followingLoadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onFollowingRetry();
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {isLoggedIn && conversationsLoadError ? (
        <div className="mb-4 space-y-2">
          <ApiErrorAlert message={conversationsLoadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onConversationsRetry();
            }}
          >
            <button
              type="submit"
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      ) : null}

      {postsLoadError && (
        <div className="mb-4 space-y-2">
          <ApiErrorAlert message={postsLoadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onPostsRetry();
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
