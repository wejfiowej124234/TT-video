"use client";

import type { CommunityMeNotesPanel } from "@/components/me/CommunityMeAccountPanel";
import { CommunityMeNotesGlassDrawer } from "@/components/me/communityMeNotes/CommunityMeNotesGlassDrawer";
import { CommunityMeLikesExperience } from "@/components/me/communityMeNotes/CommunityMeLikesExperience";
import { CommunityMeCollectsExperience } from "@/components/me/communityMeNotes/CommunityMeCollectsExperience";
import { CommunityMePostsExperience } from "@/components/me/communityMeNotes/CommunityMePostsExperience";
import { CommunityMeOrdersDrawerPreview } from "@/components/me/communityMeNotes/CommunityMeOrdersDrawerPreview";

type TFunc = (k: string) => string;

/** Hub 访客 `?tab=` 弹层栈（已登录用户由 Hub 重定向至独立页 / `/orders`）。 */
export function CommunityMeNotesDrawerStack({
  notesPanel,
  closeNotes,
  t,
}: {
  notesPanel: CommunityMeNotesPanel | null;
  closeNotes: () => void;
  t: TFunc;
}) {
  return (
    <>
      {notesPanel === "likes" ? (
        <CommunityMeNotesGlassDrawer
          open
          onClose={closeNotes}
          fullPageHref="/community/me/likes"
          dialogTitle={t("community_me_likes_title")}
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
          dialogDescription={t("community_me_orders_drawer_intro")}
          t={t}
        >
          <CommunityMeOrdersDrawerPreview t={t} onNavigate={closeNotes} />
        </CommunityMeNotesGlassDrawer>
      ) : null}
    </>
  );
}
