"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getConversations } from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
} from "@/lib/communityConversationsQuery";

type PickerRow = { conversationId: string; peerNickname: string; peerAvatarUrl: string | null };

function resolveMeId(meData: unknown): string | undefined {
  const rawMe = meData as Record<string, unknown> | null;
  if (!rawMe) return undefined;
  const meInner =
    rawMe.user && typeof rawMe.user === "object" && rawMe.user !== null
      ? (rawMe.user as { id?: string })
      : (rawMe as { id?: string });
  const id = meInner?.id;
  return typeof id === "string" && id !== "anonymous" ? id : undefined;
}

const MAX_ROWS = 8;

function mapShareDmPickerRows(convData: Awaited<ReturnType<typeof getConversations>>, meData: unknown): PickerRow[] {
  const meId = resolveMeId(meData);
  const list = convData.conversations ?? [];
  if (list.length === 0) return [];
  const rows: PickerRow[] = list.map((c) => {
    const peerId = c.peer_id ?? (meId ? (c.user1_id === meId ? c.user2_id : c.user1_id) : c.user1_id);
    const nick = (c.peer_nickname && String(c.peer_nickname).trim()) || peerId.slice(0, 8);
    return {
      conversationId: c.id,
      peerNickname: nick,
      peerAvatarUrl: c.peer_avatar_url ?? null,
    };
  });
  return rows.slice(0, MAX_ROWS);
}

/** 分享菜单内：已登录时展示最近会话直达链（带 sharePostId） */
export function CommunityShareDmQuickPick({
  postId,
  t,
  enabled,
  onNavigate,
}: {
  postId: string;
  t: (key: string) => string;
  enabled: boolean;
  onNavigate?: () => void;
}) {
  const [convQ, meQ] = useQueries({
    queries: [
      {
        queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
        queryFn: getConversations,
        enabled,
        staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
      },
      {
        queryKey: ["community", "messages", "me"],
        queryFn: getMe,
        enabled,
        staleTime: 60_000,
      },
    ],
  });

  const rows = useMemo(
    () => (convQ.data != null ? mapShareDmPickerRows(convQ.data, meQ.data) : []),
    [convQ.data, meQ.data],
  );

  if (!enabled) return null;

  if (convQ.isLoading || meQ.isLoading) {
    return (
      <div className="flex min-h-[44px] items-center justify-start px-4 py-2 text-meta text-slate-400" role="status">
        {t("common_loading")}
      </div>
    );
  }

  if (convQ.isError || meQ.isError || rows.length === 0) return null;

  return (
    <ul className="max-h-44 overflow-y-auto py-1" role="list">
      <li className="flex min-h-[44px] items-center justify-start px-4 text-meta text-slate-400">{t("community_share_dm_recent")}</li>
      {rows.map((row) => (
        <li key={row.conversationId}>
          <Link
            href={`/community/messages/${row.conversationId}?sharePostId=${encodeURIComponent(postId)}`}
            role="menuitem"
            onClick={() => onNavigate?.()}
            className="flex min-h-[44px] items-center justify-start gap-2 px-4 py-2 text-left text-small text-slate-200 hover:bg-ref-sun/12 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/55"
          >
            <div className="relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 overflow-hidden rounded-full bg-slate-700 ring-1 ring-ref-sun/25">
              {row.peerAvatarUrl ? (
                <Image src={row.peerAvatarUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-meta font-medium text-ref-sun/90">
                  {row.peerNickname.slice(0, 1)}
                </span>
              )}
            </div>
            <span className="truncate">{row.peerNickname}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
