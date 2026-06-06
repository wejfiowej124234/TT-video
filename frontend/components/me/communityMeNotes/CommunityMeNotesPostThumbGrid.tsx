"use client";

import type { FormEvent, ReactNode } from "react";
import type { CommunityPost } from "@/lib/communityPostTypes";
import { CommunityMePostGridThumb } from "@/components/community/CommunityMePostGridThumb";
import { CommunityMeNotesCardOverflowMenu } from "@/components/me/communityMeNotes/CommunityMeNotesCardOverflowMenu";

type TFunc = (k: string) => string;

export type CommunityMeNotesPostCardMenuProps = {
  onDelete: (postId: string) => void;
  onPinToTop: (postId: string) => void;
  deleteBusyId?: string | null;
  deleteDisabled?: boolean;
  deleteDisabledTitle?: string;
  deleteLabelKey?: string;
  deletePendingLabelKey?: string;
  showPinOption?: boolean;
};

/**
 * 个人中心笔记弹层：`grid-cols-3` 多行铺开展示；点主区域进帖；可选右上角 ⋮（删除 / 置顶）。
 */
export function CommunityMeNotesPostThumbGrid({
  posts,
  onOpenPost,
  t,
  overlay,
  cardMenu,
  listAriaLabel,
  /** 无帖子时补齐一行虚位方格（与「社区帖子」抽屉空态槽位视觉对齐） */
  minEmptySlots = 0,
}: {
  posts: readonly CommunityPost[];
  onOpenPost: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  t: TFunc;
  /** @deprecated 使用 `cardMenu`（⋮ 删除 / 置顶） */
  overlay?: (post: CommunityPost) => ReactNode;
  cardMenu?: CommunityMeNotesPostCardMenuProps;
  listAriaLabel: string;
  minEmptySlots?: number;
}) {
  const padEmpty =
    posts.length === 0 && minEmptySlots > 0 ? Math.max(0, Math.floor(minEmptySlots)) : 0;
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0" aria-label={listAriaLabel}>
      {posts.map((post) => {
        const isVideo = post.is_video === true || post.type === "video";
        return (
          <li key={post.id} className="min-w-0">
            <div className="group relative aspect-square overflow-hidden rounded-[var(--radius-md)] border border-cyan-500/30 bg-ink-800/50 shadow-scifi-panel ring-1 ring-white/5">
              <button
                type="button"
                className="absolute inset-0 z-[1] block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
                onClick={(e) => onOpenPost(post, e.currentTarget)}
                aria-label={t("community_view_full")}
              >
                <CommunityMePostGridThumb post={post} t={t} sizes="120px" />
              </button>
              {isVideo ? (
                <span
                  className="pointer-events-none absolute bottom-1 right-1 z-[2] rounded-[var(--radius-sm)] bg-black/60 p-0.5"
                  aria-hidden
                >
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              ) : null}
              {cardMenu ? (
                <CommunityMeNotesCardOverflowMenu
                  itemId={post.id}
                  t={t}
                  onDelete={cardMenu.onDelete}
                  onPinToTop={cardMenu.onPinToTop}
                  deleteBusyId={cardMenu.deleteBusyId}
                  deleteDisabled={cardMenu.deleteDisabled}
                  deleteDisabledTitle={cardMenu.deleteDisabledTitle}
                  deleteLabelKey={cardMenu.deleteLabelKey}
                  deletePendingLabelKey={cardMenu.deletePendingLabelKey}
                  showPinOption={cardMenu.showPinOption}
                />
              ) : overlay ? (
                <div className="pointer-events-none absolute inset-0 z-[2] flex items-start justify-end p-1">
                  <div className="pointer-events-auto">{overlay(post)}</div>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
      {Array.from({ length: padEmpty }, (_, i) => (
        <li key={`__me_notes_thumb_empty_${i}`} className="min-w-0" aria-hidden>
          <div className="aspect-square rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/40 ring-1 ring-white/[0.04]" />
        </li>
      ))}
    </ul>
  );
}
