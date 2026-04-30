"use client";

import Image from "next/image";
import type { CommunityPost } from "@/lib/communityPostTypes";
import type { FormEvent, ReactNode } from "react";
import { CommunityMeNotesCardOverflowMenu } from "@/components/me/communityMeNotes/CommunityMeNotesCardOverflowMenu";
import type { LocaleTranslateFn } from "@/lib/i18n";
import {
  communityMePostsShowcaseKindI18nKey,
  formatPostsShowcaseCardTitle,
  formatPostIdShort,
  inferCommunityMePostsShowcaseKind,
  isCommunityMePostsShowcaseKindFromApi,
  pickPostsShowcaseCoverUrl,
} from "@/lib/communityMePostsShowcaseModel";

/** 社区帖子橱窗（`/community/me?tab=posts`）：一行 3 卡多行滚动；右上角 ⋮（删除 / 本弹窗内置顶，不持久化） */
export function CommunityMePostsShowcaseThumbGrid({
  posts,
  t,
  onOpenPost,
  onRequestDelete,
  onPinToTop,
  deleteBusyId,
  listAriaLabel,
  footerSlot,
  /** 首行至少展示几个槽位（不足时用虚位卡补齐；弹层与完整页均默认 3，与「赞过」一行三格一致） */
  minSlots = 3,
  /** 为 false 时「删除」菜单项禁用（仅置顶可用） */
  allowDelete = true,
}: {
  posts: readonly CommunityPost[];
  t: LocaleTranslateFn;
  onOpenPost: (post: CommunityPost) => void;
  onRequestDelete: (postId: string) => void;
  onPinToTop: (postId: string) => void;
  deleteBusyId: string | null;
  listAriaLabel: string;
  /** 完整页置于列表下方：经营入口、说明等 */
  footerSlot?: ReactNode;
  minSlots?: number;
  allowDelete?: boolean;
}) {
  const padCount = minSlots > 0 ? Math.max(0, minSlots - posts.length) : 0;

  return (
    <div className="space-y-3">
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0" aria-label={listAriaLabel}>
        {posts.map((post) => {
          const kind = inferCommunityMePostsShowcaseKind(post);
          const kindFromApi = isCommunityMePostsShowcaseKindFromApi(post);
          const kindLabel = t(communityMePostsShowcaseKindI18nKey(kind));
          const title = formatPostsShowcaseCardTitle(post, t("community_me_posts_showcase_untitled"));
          const cover = pickPostsShowcaseCoverUrl(post);
          const idShort = formatPostIdShort(post.id);
          const vis = post.visibilityStatus ?? "public";
          const statsLine = t("community_me_posts_showcase_stats_line", {
            likes: post.likes ?? 0,
            comments: post.comments ?? 0,
            collects: post.collects ?? 0,
          });
          const aria = t("community_me_posts_showcase_card_aria", { id: idShort, title, kind: kindLabel });

          return (
            <li key={post.id} className="min-w-0">
              <div className="relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-[var(--radius-md)] border border-cyan-500/25 bg-ink-800/55 text-left shadow-scifi-panel ring-1 ring-white/5">
                <div className="relative h-[4.25rem] w-full shrink-0 bg-ink-700/80">
                  {cover ? (
                    <Image src={cover} alt="" fill className="object-cover" sizes="120px" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 px-2">
                      <p className="line-clamp-3 text-center text-[0.62rem] leading-snug text-slate-300">{title}</p>
                    </div>
                  )}
                  <span
                    className="absolute left-1 top-1 max-w-[calc(100%-2.75rem)] truncate rounded bg-black/55 px-1 py-0.5 text-[0.58rem] font-medium text-cyan-100 ring-1 ring-cyan-400/20"
                    title={kindFromApi ? undefined : t("community_me_posts_showcase_kind_inferred_hint")}
                  >
                    {kindFromApi ? kindLabel : `~${kindLabel}`}
                  </span>
                  {post.is_video && cover ? (
                    <span className="pointer-events-none absolute bottom-1 right-1 rounded-[var(--radius-sm)] bg-black/60 p-0.5" aria-hidden>
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1 p-1.5">
                  <p className="font-mono text-[0.58rem] leading-none text-slate-400">#{idShort}</p>
                  <p className="line-clamp-2 min-h-[2.25rem] text-[0.62rem] font-semibold leading-tight text-cyan-100">
                    {title}
                  </p>
                  <p className="text-[0.58rem] text-slate-400">{statsLine}</p>
                  {vis === "private" ? (
                    <span className="mt-auto inline-flex w-fit rounded-[var(--radius-sm)] bg-warning/15 px-1.5 py-0.5 text-[0.58rem] font-medium text-warning/95 ring-1 ring-warning/25">
                      {t("community_me_posts_badge_private")}
                    </span>
                  ) : vis === "archived" ? (
                    <span className="mt-auto inline-flex w-fit rounded-[var(--radius-sm)] bg-ink-600/80 px-1.5 py-0.5 text-[0.58rem] font-medium text-slate-300 ring-1 ring-slate-500/40">
                      {t("community_me_posts_badge_archived")}
                    </span>
                  ) : (
                    <span className="mt-auto inline-flex w-fit rounded-[var(--radius-sm)] bg-cyan-500/12 px-1.5 py-0.5 text-[0.58rem] font-medium text-cyan-200/95 ring-1 ring-cyan-400/25">
                      {t("community_post_visibility_public")}
                    </span>
                  )}
                </div>
                <form
                  className="absolute inset-0 z-[1]"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    onOpenPost(post);
                  }}
                >
                  <button
                    type="submit"
                    className="absolute inset-0 h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-inset"
                    aria-label={aria}
                  />
                </form>
                <CommunityMeNotesCardOverflowMenu
                  itemId={post.id}
                  t={t}
                  onDelete={() => onRequestDelete(post.id)}
                  onPinToTop={() => onPinToTop(post.id)}
                  deleteBusyId={deleteBusyId}
                  deleteDisabled={!allowDelete}
                  deleteDisabledTitle={!allowDelete ? t("community_me_posts_menu_delete_disabled_hint") : undefined}
                />
              </div>
            </li>
          );
        })}
        {Array.from({ length: padCount }, (_, i) => (
          <li key={`__post_showcase_slot_pad_${i}`} className="min-w-0">
            <div
              className="flex min-h-[168px] flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-cyan-500/30 bg-ink-800/35 px-2 text-center ring-1 ring-white/[0.04]"
              aria-label={t("community_me_posts_showcase_slot_placeholder_aria")}
            >
              <p className="text-[0.62rem] font-medium leading-snug text-slate-500">{t("community_me_posts_showcase_slot_placeholder")}</p>
            </div>
          </li>
        ))}
      </ul>
      {footerSlot}
    </div>
  );
}
