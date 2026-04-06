"use client";

import type { ReactNode } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { CommunityPost } from "@/lib/communityMockData";

const GAP_PX = 16;

/** 桌面端 Feed 单列：随窗口滚动虚拟化，减轻长列表 DOM（31 清单 · 长列表虚拟滚动） */
export function CommunityFeedDesktopWindowVirtual({
  posts,
  renderItem,
}: {
  posts: CommunityPost[];
  renderItem: (post: CommunityPost) => ReactNode;
}) {
  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => 520,
    overscan: 6,
    gap: GAP_PX,
    getItemKey: (index) => posts[index]?.id ?? index,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
      {items.map((vi) => {
        const post = posts[vi.index];
        if (!post) return null;
        return (
          <div
            key={post.id}
            data-index={vi.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${vi.start}px)` }}
          >
            {renderItem(post)}
          </div>
        );
      })}
    </div>
  );
}
