"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useMemo } from "react";
import type { CommunityPost } from "@/lib/communityPostTypes";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";
import LoadingText from "@/components/LoadingText";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

/** 首屏默认展示缩略图数；发现页可通过 `maxThumbs` 随分页增大（上限见 explore 页） */
export const COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX = 36;

function thumbSrc(p: CommunityPost): string | null {
  const c = p.cover_url?.trim();
  if (c) return c;
  if (p.media_urls?.length) return p.media_urls[0] ?? null;
  if (p.media_url?.trim()) return p.media_url.trim();
  return null;
}

/** 31 §2.1：发现页图片瀑布流（CSS columns）；点击进入 Feed 并打开 `?post=` 详情 */
export function CommunityExplorePhotoMasonry({
  posts,
  t,
  loading,
  maxThumbs = COMMUNITY_EXPLORE_MASONRY_DEFAULT_MAX,
  emptyActions,
}: {
  posts: CommunityPost[];
  t: (key: string, vars?: LocaleInterpolationVars) => string;
  loading: boolean;
  /** 最多展示多少条带缩略图的帖子（其余仍参与推荐作者等聚合） */
  maxThumbs?: number;
  /** 无带图帖时展示的引导操作（88 §3.2 · 13-1 空态） */
  emptyActions?: ReactNode;
}) {
  const cap = Math.max(1, maxThumbs);
  const items = useMemo(() => {
    const out: CommunityPost[] = [];
    for (const p of posts) {
      if (out.length >= cap) break;
      if (!thumbSrc(p)) continue;
      out.push(p);
    }
    return out;
  }, [posts, cap]);

  if (loading) {
    return (
      <div className="py-8 flex justify-center" aria-busy="true" aria-label={t("common_loading")}>
        <LoadingText className="text-slate-300" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-center space-y-4" role="status" aria-live="polite">
        <p className="text-body text-slate-400 max-w-md mx-auto">{t("community_explore_masonry_empty")}</p>
        {emptyActions ? <div className="flex flex-wrap justify-center gap-2">{emptyActions}</div> : null}
      </div>
    );
  }

  return (
    <div
      className="columns-2 sm:columns-3 lg:columns-4 gap-2 space-y-2 [content-visibility:auto]"
      role="list"
      aria-label={t("community_explore_section_masonry")}
    >
      {items.map((post, thumbIdx) => {
        const srcRaw = thumbSrc(post);
        const src = srcRaw ? communityMediaAbsoluteUrlForRender(srcRaw) : null;
        if (!src) return null;
        const href = `/community?post=${encodeURIComponent(post.id)}`;
        const titleTrim = post.title?.trim();
        const alt = titleTrim
          ? t("community_explore_masonry_thumb_alt", { title: titleTrim })
          : t("community_explore_masonry_thumb_alt_fallback");
        return (
          <Link
            key={post.id}
            href={href}
            role="listitem"
            className={`group block break-inside-avoid mb-2 rounded-[var(--radius-md)] overflow-hidden border border-ref-sun/22 bg-ink-800/60 motion-sub motion-reduce:transition-none hover:border-ref-sun/40 hover:shadow-scifi-masonry-hover ${communityCardLinkFocus}`}
          >
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                unoptimized
                priority={thumbIdx === 0}
                fetchPriority={thumbIdx === 0 ? "high" : "low"}
              />
              {post.type === "video" ? (
                <span className="pointer-events-none absolute right-1.5 bottom-1.5 rounded-[var(--radius-sm)] bg-black/65 px-1.5 py-0.5 text-[0.65rem] text-white" aria-hidden>
                  ▶
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
