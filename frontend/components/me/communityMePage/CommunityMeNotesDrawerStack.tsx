"use client";

import type { CommunityMeUrlTab } from "@/lib/communityMeContentNav";
import { CommunityMeNotesGlassDrawer } from "@/components/me/communityMeNotes/CommunityMeNotesGlassDrawer";
import { CommunityMeLikesExperience } from "@/components/me/communityMeNotes/CommunityMeLikesExperience";
import { CommunityMeCollectsExperience } from "@/components/me/communityMeNotes/CommunityMeCollectsExperience";
import { CommunityMePostsExperience } from "@/components/me/communityMeNotes/CommunityMePostsExperience";
import { CommunityMeOrdersDrawerPreview } from "@/components/me/communityMeNotes/CommunityMeOrdersDrawerPreview";

export default function CommunityMeNotesDrawerStack({
  notesPanel,
  closeNotes,
  t,
  likesListEnabled,
}: {
  notesPanel: CommunityMeUrlTab | null;
  closeNotes: () => void;
  t: (key: string) => string;
  likesListEnabled: boolean;
}) {
  return (
    <>
      {notesPanel === "likes" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          fullPageHref={likesListEnabled ? "/community/me/likes" : undefined}
          dialogTitle={t("community_me_likes_title")}
          dialogTitleBadge={t("community_me_posts_scope_badge")}
          dialogDescription={t("community_me_likes_drawer_intro")}
          t={t}
        >
          <CommunityMeLikesExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "collects" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          fullPageHref="/community/me/collects"
          dialogTitle={t("community_me_my_collects")}
          dialogTitleBadge={t("community_me_posts_scope_badge")}
          dialogDescription={t("community_me_collects_drawer_intro")}
          t={t}
        >
          <CommunityMeCollectsExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "posts" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          fullPageHref="/community/me/posts"
          dialogTitle={t("community_me_tab_community_posts")}
          dialogTitleBadge={t("community_me_posts_scope_badge")}
          dialogDescription={t("community_me_posts_drawer_intro")}
          t={t}
        >
          <CommunityMePostsExperience onLeaveDrawer={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}

      {notesPanel === "orders" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          fullPageHref="/orders"
          dialogTitle={t("header_myOrders")}
          dialogTitleBadge={t("community_me_orders_scope_badge")}
          dialogDescription={t("community_me_orders_drawer_intro")}
          t={t}
        >
          <CommunityMeOrdersDrawerPreview t={t} onNavigate={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}
    </>
  );
}
