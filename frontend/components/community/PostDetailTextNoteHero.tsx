"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CommunityPost } from "@/lib/communityMockData";
import { TT_COMMUNITY_DRAWER_L5 } from "@/lib/marketingUi";
import { communityPostTagDisplayLabel, communityPostTagsForDisplay } from "@/components/community/communityPostTagDisplay";
import { communityCardLinkFocus, communityShellTabFocus } from "@/lib/communityA11yFocus";
import { useCommunityTopicTagWarm } from "@/lib/useCommunityTopicTagWarm";
import { UgcTranslatedText } from "@/components/ugc/UgcTranslatedText";

/** 纯文笔记 L5 头图区（小红书式排版） */
export function PostDetailTextNoteHero({
  post,
  t,
  topicHref,
  onAfterTopicTagClick,
}: {
  post: CommunityPost;
  t: (key: string) => string;
  topicHref: (tag: string) => string;
  onAfterTopicTagClick?: () => void;
}) {
  const warmTopicTag = useCommunityTopicTagWarm();

  return (
    <section className={TT_COMMUNITY_DRAWER_L5.postDetailTextNoteHero} aria-label={t("community_type_text")}>
      <span className="inline-block rounded-full border border-ref-sun/35 bg-ref-sun/10 px-2.5 py-0.5 text-meta font-medium text-ref-sun">
        {t("community_type_text")}
      </span>
      {post.title ? (
        <h3 className="mt-4 text-h4 font-semibold text-ref-sun/95">{post.title}</h3>
      ) : null}
      <UgcTranslatedText
        as="p"
        className={`${post.title ? "mt-3" : "mt-4"} ${TT_COMMUNITY_DRAWER_L5.postDetailTextNoteBody}`}
        policy="on_demand"
        contentClass="community_post"
        contentId={post.id}
        field="body"
        originalText={post.content}
      />
      {communityPostTagsForDisplay(post.tags).length > 0 ? (
        <div className={TT_COMMUNITY_DRAWER_L5.postDetailTextNoteTags}>
          {communityPostTagsForDisplay(post.tags).map((tag) => {
            const label = communityPostTagDisplayLabel(tag);
            return (
            <Link
              key={tag}
              href={topicHref(tag)}
              prefetch={true}
              onPointerEnter={() => warmTopicTag(tag)}
              onClick={() => onAfterTopicTagClick?.()}
              className={`${TT_COMMUNITY_DRAWER_L5.tagChip} ${communityShellTabFocus}`}
            >
              #{label}
            </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/** 详情作者条 · 紧凑头像（修复 fallback 过大） */
export function PostDetailAuthorRow({
  author,
  authorProfileHref,
  roleKey,
  roleVariant = "tourist",
  t,
  dash,
  authorFollow,
  children,
}: {
  author: CommunityPost["author"];
  authorProfileHref: string;
  roleKey: string;
  roleVariant?: "guide" | "tourist";
  t: (key: string) => string;
  dash: string;
  authorFollow?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-2 flex-wrap">
      <Link
        href={authorProfileHref}
        className={`${TT_COMMUNITY_DRAWER_L5.postDetailAuthorCompact} ${communityCardLinkFocus}`}
      >
        <div className={TT_COMMUNITY_DRAWER_L5.postDetailAuthorAvatar}>
          {author?.avatar_url ? (
            <Image src={author.avatar_url} alt="" fill className="object-cover" sizes="36px" unoptimized />
          ) : (
            <span aria-hidden>{(author?.nickname ?? "?").slice(0, 1)}</span>
          )}
        </div>
        <span className="min-w-0 flex flex-col gap-0.5">
          <span className="text-small font-medium text-slate-200 truncate">{author?.nickname ?? dash}</span>
        </span>
      </Link>
      <span
        className={`shrink-0 px-2 py-0.5 text-meta ${
          roleVariant === "guide" ? TT_COMMUNITY_DRAWER_L5.roleGuide : TT_COMMUNITY_DRAWER_L5.roleTourist
        }`}
      >
        {t(roleKey)}
      </span>
      {authorFollow}
      {children}
    </div>
  );
}
