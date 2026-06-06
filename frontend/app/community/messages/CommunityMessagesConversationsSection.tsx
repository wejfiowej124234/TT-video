"use client";

import type { FormEvent } from "react";
import type { Locale } from "@/lib/i18n";
import { CommunityMessagesListSkeleton } from "@/components/community/CommunityMessagesListSkeleton";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { MessagesDmEmptyPanel } from "./MessagesDmEmptyPanel";
import { CommunityMessagesConversationRow } from "./CommunityMessagesConversationRow";
import type { CommunityMessagesDisplayConversation } from "./communityMessagesPageTypes";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type Props = {
  t: (k: string) => string;
  locale: Locale;
  dash: string;
  loading: boolean;
  listLoadError: string | null;
  isEmpty: boolean;
  displayList: CommunityMessagesDisplayConversation[];
  retryList: () => void;
  sharePostId: string | null;
  orderId: string | null;
};

export function CommunityMessagesConversationsSection({
  t,
  locale,
  dash,
  loading,
  listLoadError,
  isEmpty,
  displayList,
  retryList,
  sharePostId,
  orderId,
}: Props) {
  return (
    <section
      className={TT_COMMUNITY_PAGE_L5.panel}
      aria-label={t("community_conversations")}
    >
      {loading ? (
        <div role="status" aria-label={t("common_loading")}>
          <CommunityMessagesListSkeleton />
        </div>
      ) : listLoadError != null ? (
        <div className="px-6 py-10 text-center space-y-3" role="alert">
          <ApiErrorAlert message={listLoadError} tone="dark" />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              retryList();
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
      ) : isEmpty ? (
        <MessagesDmEmptyPanel t={t} />
      ) : (
        <ul className="divide-y divide-slate-600/50">
          {displayList.map((conv) => (
            <CommunityMessagesConversationRow
              key={conv.id}
              conv={conv}
              t={t}
              locale={locale}
              dash={dash}
              sharePostId={sharePostId}
              orderId={orderId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
