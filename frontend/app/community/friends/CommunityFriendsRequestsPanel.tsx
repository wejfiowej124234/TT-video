"use client";

import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import { FriendsRequestsEmptyPanel } from "./FriendsRequestsEmptyPanel";
import { FriendsSentRequestRow } from "./FriendsSentRequestRow";
import { RequestReceivedApiRow } from "./RequestReceivedApiRow";
import type {
  CommunityFriendsRequestReceived,
  CommunityFriendsRequestSent,
} from "./communityFriendsPageTypes";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityFriendsRequestsPanel({
  loading,
  requestSubTab,
  setRequestSubTab,
  apiRequestsSent,
  apiRequestsReceived,
  t,
  setApiRequestsReceived,
  showFriendsActionError,
  showFriendsToast,
}: {
  loading: boolean;
  requestSubTab: "sent" | "received";
  setRequestSubTab: (v: "sent" | "received") => void;
  apiRequestsSent: CommunityFriendsRequestSent[];
  apiRequestsReceived: CommunityFriendsRequestReceived[];
  t: (k: string) => string;
  setApiRequestsReceived: Dispatch<SetStateAction<CommunityFriendsRequestReceived[]>>;
  showFriendsActionError: (res: unknown, fallbackKey: string) => void;
  showFriendsToast: (text: string) => void;
}) {
  return (
    <section className={`${TT_COMMUNITY_PAGE_L5.panel} mb-4`}>
      <div className="flex gap-2 p-2 border-b border-slate-600/50">
        <form
          className="contents"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setRequestSubTab("sent");
          }}
        >
          <button
            type="submit"
            className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-meta font-medium min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
              requestSubTab === "sent" ? "bg-ref-sun/22 text-ref-sun/90" : "text-slate-300"
            }`}
          >
            {t("community_requests_sent")}
          </button>
        </form>
        <form
          className="contents"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setRequestSubTab("received");
          }}
        >
          <button
            type="submit"
            className={`flex-1 rounded-[var(--radius-md)] px-3 py-2 text-meta font-medium min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
              requestSubTab === "received" ? "bg-ref-sun/22 text-ref-sun/90" : "text-slate-300"
            }`}
          >
            {t("community_requests_received")}
          </button>
        </form>
      </div>
      <div className="p-4">
        {requestSubTab === "sent" ? (
          loading ? (
            <p className="text-slate-300 text-center py-6" role="status" aria-label={t("common_loading")}>
              {t("common_loading")}
            </p>
          ) : apiRequestsSent.length > 0 ? (
            <ul className="space-y-3">
              {apiRequestsSent.map((req) => (
                <FriendsSentRequestRow key={req.id} req={req} t={t} />
              ))}
            </ul>
          ) : (
            <FriendsRequestsEmptyPanel variant="sent" t={t} />
          )
        ) : loading ? (
          <p className="text-slate-300 text-center py-6" role="status" aria-label={t("common_loading")}>
            {t("common_loading")}
          </p>
        ) : apiRequestsReceived.length > 0 ? (
          <ul className="space-y-3">
            {apiRequestsReceived.map((req) => (
              <RequestReceivedApiRow
                key={req.id}
                req={req}
                t={t}
                onResolved={(id) => setApiRequestsReceived((prev) => prev.filter((r) => r.id !== id))}
                onActionFailed={(res) => showFriendsActionError(res, "community_friends_resolveRequestFailed")}
                onThrown={(e) => showFriendsToast(mapApiReadError(e, t, "community_friends_resolveRequestFailed"))}
                onOfflineHint={() => showFriendsToast(t("community_interaction_offline"))}
              />
            ))}
          </ul>
        ) : (
          <FriendsRequestsEmptyPanel variant="received" t={t} />
        )}
      </div>
    </section>
  );
}
