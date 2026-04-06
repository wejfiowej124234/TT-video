"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/apiClient/community";
import { getMe } from "@/lib/apiClient/me";

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

async function fetchShareDmPickerRows(): Promise<PickerRow[]> {
  const [convData, meData] = await Promise.all([getConversations(), getMe()]);
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
  const q = useQuery({
    queryKey: ["community", "share-dm-quick-pick"],
    queryFn: fetchShareDmPickerRows,
    enabled,
    staleTime: 15_000,
  });

  if (!enabled) return null;

  if (q.isLoading) {
    return (
      <div className="flex min-h-[44px] items-center justify-start px-4 py-2 text-meta text-slate-400" role="status">
        {t("common_loading")}
      </div>
    );
  }

  if (q.isError || !q.data?.length) return null;

  return (
    <ul className="max-h-44 overflow-y-auto py-1" role="list">
      <li className="flex min-h-[44px] items-center justify-start px-4 text-meta text-slate-400">{t("community_share_dm_recent")}</li>
      {q.data.map((row) => (
        <li key={row.conversationId}>
          <Link
            href={`/community/messages/${row.conversationId}?sharePostId=${encodeURIComponent(postId)}`}
            role="menuitem"
            onClick={() => onNavigate?.()}
            className="flex min-h-[44px] items-center justify-start gap-2 px-4 py-2 text-left text-small text-slate-200 hover:bg-fuchsia-500/15 motion-sub focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/55"
          >
            <div className="relative h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 overflow-hidden rounded-full bg-slate-700 ring-1 ring-cyan-400/25">
              {row.peerAvatarUrl ? (
                <Image src={row.peerAvatarUrl} alt="" fill className="object-cover" sizes="44px" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-meta font-medium text-cyan-300">
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
