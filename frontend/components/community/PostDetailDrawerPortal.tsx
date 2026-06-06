"use client";

import type { ComponentProps } from "react";
import { CommunityDrawerPortal } from "@/components/community/communityDrawerPortal";
import { PostDetailDrawer } from "@/components/community/PostDetailDrawer";

export function PostDetailDrawerPortal(props: ComponentProps<typeof PostDetailDrawer>) {
  return (
    <CommunityDrawerPortal>
      <PostDetailDrawer {...props} />
    </CommunityDrawerPortal>
  );
}
