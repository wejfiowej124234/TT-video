import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("community drawer/modal SSOT (site theme V1 §1.7 · TT-PH1-219d/e)", () => {
  it("PublishDrawer shell uses TT_COMMUNITY_DRAWER_L5", () => {
    const shell = read("PublishDrawer/index.tsx");
    const photo = read("PublishDrawer/PublishDrawerPhotoSection.tsx");
    const video = read("PublishDrawer/PublishDrawerVideoSection.tsx");
    const publishDrawerSrc = `${shell}\n${photo}\n${video}`;
    expect(shell).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(shell).toContain("text-slate-100");
    expect(shell).toContain("publishScrim");
    expect(publishDrawerSrc).toContain("publishDashedTile");
    expect(publishDrawerSrc).not.toMatch(/border-cyan-500\/4/);
    expect(publishDrawerSrc).not.toContain("border-fuchsia-500/25");
    expect(publishDrawerSrc).not.toMatch(/border-slate-[456]00/);
    expect(publishDrawerSrc).not.toMatch(/bg-slate-/);
    expect(video).toContain("community_publish_video_cover_pick");
    expect(video).toContain("text-ref-sun");
  });

  it("PublishDrawerAlerts imports drawer L5 ghost btn", () => {
    const src = read("PublishDrawer/PublishDrawerAlerts.tsx");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("publishGhostBtn");
    expect(src).toContain("community_clear_publish_error");
    expect(src).toContain("showPublishErrorBanner");
  });

  it("PublishDrawerFooter uses ready/error footer hints (not required_hint when form complete)", () => {
    const footer = read("PublishDrawer/PublishDrawerFooter.tsx");
    const index = read("PublishDrawer/index.tsx");
    expect(footer).toContain("community_publish_ready_hint");
    expect(footer).toContain("community_publish_error_footer_hint");
    expect(index).toContain("showPublishErrorBanner");
    expect(read("PublishDrawer/usePublishForm.ts")).toContain("isCommunityPublishParentOwnedError");
    expect(read("useCommunityFeedPublishSubmit.ts")).toContain("CommunityPublishSubmitRejectedError");
  });

  it("PostDetailDrawer uses warm drawer tokens", () => {
    const src = read("PostDetailDrawer.tsx");
    const meta = read("PostDetailDrawerMetaSection.tsx");
    expect(src).toContain('data-tt-community-post-detail-drawer="1"');
    expect(src).toContain("data-tt-community-post-detail-showcase");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("PostDetailDrawerActionBar");
    expect(meta).toContain("postDetailCloseFab");
    expect(meta).toContain("postDetailTagChipCompact");
    expect(meta).toContain("postDetailBookGuideChip");
    expect(src).toContain("postDetailMediaCloseFab");
    expect(src).toContain("postDetailSideColumn");
    expect(src).toContain("postDetailSideMetaBlock");
    expect(src).toContain("PostDetailDrawerCommentsSection");
    expect(src).toContain("usePostDetailDrawerModel");
    expect(src).toContain("PostDetailDrawerFooterComposer");
    expect(read("PostDetailDrawerFooterComposer.tsx")).toContain("ActionGateChecklist");
    expect(read("PostDetailDrawerFooterComposer.tsx")).toContain("ActionGateChecklist");
    expect(read("PostDetailDrawerFooterComposer.tsx")).toContain("community_showcase_comment_placeholder");
    expect(read("PostDetailDrawerFooterComposer.tsx")).toContain('variant="communityInline"');
    expect(read("CommentDrawer.tsx")).toContain("CommentDrawerComposer");
    expect(read("CommentDrawerComposer.tsx")).toContain("community_showcase_comment_placeholder");
    expect(read("CommentDrawerComposer.tsx")).toContain('variant="communityInline"');
    expect(read("CommentDrawerComposer.tsx")).toContain("ActionGateChecklist");
    expect(read("CommentDrawer.tsx")).toContain("community_showcase_content_hint");
    expect(read("PostDetailDrawerMetaSection.tsx")).toContain("community_showcase_content_hint");
    expect(read("PostDetailDrawerActionBar.tsx")).not.toContain("community_showcase_action_bar_hint");
    expect(read("PostDetailDrawerCommentsSection.tsx")).toContain("CommunityCommentAuthorAvatar");
    expect(read("CommentDrawer.tsx")).toContain("CommunityCommentAuthorAvatar");
    expect(read("CommentDrawerCommentThreads.tsx")).toContain("CommunityCommentAuthorAvatar");
    expect(read("CommunityVideoOverlayCommentSheet.tsx")).toContain("CommunityCommentAuthorAvatar");
    expect(read("CommunityVideoOverlayCommentSheet.tsx")).toContain("composerInputDisabled");
    expect(read("CommunityVideoOverlayCommentSheet.tsx")).toContain("community_showcase_content_hint");
    expect(read("PostDetailDrawerCommentsSection.tsx")).toContain("postDetailCommentRow");
    expect(read("PostDetailDrawerCommentsSection.tsx")).toContain("CommunityCommentGuideIdentityBadge");
    expect(read("PostDetailDrawerCommentsSection.tsx")).toContain("COMMUNITY_COMMENT_ACTION_REPLY_CLASS");
    expect(read("PostDetailDrawerCommentsSection.tsx")).not.toContain("CommunityCommentSortTabs");
    expect(read("PostDetailDrawerCommentsSection.tsx")).not.toContain("community_badge_escrow_guide");
    expect(read("PostDetailDrawerMetaSection.tsx")).not.toContain("community_badge_escrow_guide");
    expect(read("CommunityFeedCardContent.tsx")).not.toContain("community_badge_escrow_guide");
    expect(read("PostDetailDrawerMediaZone.tsx")).toContain("community_post_image_counter");
    expect(read("PostDetailDrawerMediaZone.tsx")).toContain("feedNavHintKey");
    expect(read("CommunityCommentSortTabs.tsx")).toContain("communityCommentSortTabHintKey");
    expect(src).not.toMatch(/border-cyan-500\/3/);
    expect(src).not.toMatch(/border-slate-[456]00/);
    expect(src).not.toMatch(/bg-slate-/);
    expect(src).not.toMatch(/border-ref-sun\/45 bg-ref-sun\/12 text-ref-sun\/90/);
  });

  it("PostDetailImageLightbox uses drawer lightbox tokens", () => {
    const src = read("PostDetailImageLightbox.tsx");
    expect(src).toContain("postDetailLightboxOverlay");
    expect(src).toContain("usePostDetailMediaWheel");
  });

  it("PostDetailDrawerMediaZone separates feed counter vs image counters", () => {
    const src = read("PostDetailDrawerMediaZone.tsx");
    expect(src).toContain("postDetailVideoFeedCounter");
    expect(src).toContain("postDetailFeedNavHint");
    expect(src).toContain("community_feed_post_counter");
    expect(src).toContain("usePostDetailMediaWheel");
  });

  it("PostDetailDrawerFooterComposer keeps composer input enabled while body empty", () => {
    const src = read("PostDetailDrawerFooterComposer.tsx");
    expect(src).toContain("composerInputDisabled");
    expect(src).toMatch(/disabled=\{composerInputDisabled\}/);
    expect(src).toMatch(/disabled=\{sendDisabled\}/);
    expect(src).not.toMatch(/disabled=\{sendDisabled\}[\s\S]{0,80}type="text"/);
  });

  it("usePostDetailDrawerModel splits composer input vs send disabled gates", () => {
    const src = read("usePostDetailDrawerModel.ts");
    expect(src).toContain("composerInputDisabled");
    expect(src).toContain("sendDisabled = composerInputDisabled");
  });

  it("CommentDrawer uses warm drawer tokens (align PostDetailDrawer)", () => {
    const src = read("CommentDrawer.tsx");
    const composer = read("CommentDrawerComposer.tsx");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("postDetailOverlay");
    expect(src).toContain("CommentDrawerComposer");
    expect(composer).toContain("postDetailComposerBar");
    expect(src).toContain("postDetailCommentRow");
    expect(src).not.toMatch(/border-slate-[456]00/);
    expect(src).not.toMatch(/bg-slate-/);
  });

  it("R-COMM-COMMENT-IDENTITY-SORT-CONTRAST-1: comment UIs omit sort tabs (default hot)", () => {
    expect(read("PostDetailDrawerCommentsSection.tsx")).not.toContain("CommunityCommentSortTabs");
    expect(read("CommentDrawerScrollBody.tsx")).not.toContain("CommentDrawerSortTabs");
    expect(read("CommunityVideoOverlayCommentSheet.tsx")).not.toContain("CommunityCommentSortTabs");
    expect(read("CommentDrawer.tsx")).not.toContain("CommunityCommentSortTabs");
    const tabs = read("CommunityCommentSortTabs.tsx");
    expect(tabs).toContain("TT_COMMUNITY_DRAWER_L5.sortTabActive");
  });

  it("PostDetailDrawer portals via PostDetailDrawerPortal", () => {
    const portal = read("PostDetailDrawerPortal.tsx");
    expect(portal).toContain("CommunityDrawerPortal");
    expect(portal).toContain("PostDetailDrawer");
  });

  it("CommunityReportDrawer portals via CommunityReportDrawerPortal", () => {
    const portal = read("CommunityReportDrawerPortal.tsx");
    expect(portal).toContain("CommunityDrawerPortal");
  });

  it("CommunityReportDrawer uses warm drawer tokens", () => {
    const src = read("CommunityReportDrawer.tsx");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("reportOverlay");
    expect(src).not.toMatch(/border-slate-[456]00/);
    expect(src).not.toMatch(/bg-slate-/);
  });

  it("CommunityFeedCardContent role/destination use warm badges", () => {
    const src = read("CommunityFeedCardContent.tsx");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("communityFollowPillClassName");
    expect(src).toContain("postDetailShowcaseBadge");
    expect(src).toContain("isShowcasePostId");
    expect(src).not.toContain("border-fuchsia-400/40");
    expect(src).not.toContain("border-cyan-400/50");
    expect(src).not.toContain("border-slate-500");
  });

  it("CommunityFeedMasonryCard wires showcase engagement a11y", () => {
    const src = read("CommunityFeedMasonryCard.tsx");
    expect(src).toContain("communityShowcaseEngagementButtonAria");
    expect(src).toContain("masonryShowcaseBadge");
  });

  it("CommunityFeedCardCompact wires showcase badge + engagement a11y", () => {
    const src = read("CommunityFeedCardCompact.tsx");
    expect(src).toContain("masonryShowcaseBadge");
    expect(src).toContain("communityShowcaseEngagementButtonAria");
  });

  it("CommunityFeedCardCompact grid uses masonry L5 like/footer SSOT", () => {
    const src = read("CommunityFeedCardCompact.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_L5.masonryLikeBtn");
    expect(src).toContain("CommunityFeedMasonryLocationPill");
    expect(src).not.toContain("TT_COMMUNITY_DRAWER_L5.followPillIdle");
  });

  it("CommunityFeedCardActions uses warm feed card action row", () => {
    const src = read("CommunityFeedCardActions.tsx");
    expect(src).toContain("feedCardActionsRow");
    expect(src).toContain("communityShowcaseEngagementButtonAria");
    expect(src).toContain("communityShowcaseEngagementCountClassName");
    expect(src).not.toMatch(/border-slate-600\/50/);
  });

  it("PostDetailDrawerActionBar surfaces showcase engagement hints and a11y", () => {
    const src = read("PostDetailDrawerActionBar.tsx");
    expect(src).toContain("communityShowcaseEngagementButtonAria");
    expect(src).toContain("communityShowcaseEngagementCountClassName");
    expect(src).not.toContain("community_showcase_action_bar_hint");
  });

  it("CommunityVideoOverlayActionRail mutes showcase engagement counts", () => {
    const src = read("CommunityVideoOverlayActionRail.tsx");
    expect(src).toContain("communityShowcaseEngagementButtonAria");
    expect(src).toContain("communityShowcaseEngagementCountClassName");
  });

  it("CommunityFeedCardMedia uses warm feed card media tokens (no cyan type badge)", () => {
    const src = read("CommunityFeedCardMedia.tsx");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5");
    expect(src).toContain("feedCardTypeBadge");
    expect(src).toContain("feedCardMediaFocus");
    expect(src).not.toContain("border-cyan-400");
    expect(src).not.toContain("text-cyan-300");
    expect(src).not.toContain("border-fuchsia-400");
    expect(src).not.toMatch(/bg-slate-800/);
  });

  it("CommunityFeedFilterBarChipFilters uses TT_COMMUNITY_FEED_ACTION filter chips (V2)", () => {
    const src = read("CommunityFeedFilterBarChipFilters.tsx");
    expect(src).toContain("filterChipActive");
    expect(src).not.toContain("bg-ref-sun/12 text-ref-sun/90");
    expect(src).toContain("communityCyanPillFocus");
    expect(src).not.toContain("communityFuchsiaPillFocus");
    expect(src).not.toContain("fuchsia");
  });

  it("PublishDrawerFooter submit uses publishSubmit warm token (225-G)", () => {
    const src = read("PublishDrawer/PublishDrawerFooter.tsx");
    expect(src).toContain("publishSubmit");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("drawer retry/send actions use Feed/Drawer SSOT tokens", () => {
    for (const rel of [
      "CommentDrawer.tsx",
      "CommentDrawerComposer.tsx",
      "PostDetailDrawerFooterComposer.tsx",
      "PostDetailDrawerCommentsSection.tsx",
    ]) {
      const src = read(rel);
      expect(src).toMatch(/TT_COMMUNITY_FEED_ACTION\.retryPill|TT_COMMUNITY_DRAWER_L5\.sendBtn/);
      expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta font-medium text-ref-sun\/90/);
    }
  });
});
