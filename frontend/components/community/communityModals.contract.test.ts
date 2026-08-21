/**
 * G-03 · 社区弹窗/抽屉专测 contract（Phase ①）
 * ReportDrawer · QuickLinksDrawer · LoginModal — 与 `dataTtSelectors` · `pageShells` 同源。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { dataTt } from "@/test-utils/dataTtSelectors";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("community modals & drawers contract (G-03 · ①)", () => {
  it("CommunityLoginModal exposes login-for-publish marker and warm sheet", () => {
    const src = read("CommunityLoginModal.tsx");
    expect(src).toContain('data-tt-community-login-for-publish="1"');
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.loginModalScrim");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.loginModalSheet");
    expect(src).toContain("useFocusTrap");
    expect(src).toContain("/auth/login?returnUrl=/community");
    expect(src).not.toMatch(/type="url"/);
    expect(src).not.toMatch(/bg-slate-900\/95/);
  });

  it("CommunityReportDrawer exposes report drawer marker and POST flow hook", () => {
    const drawer = read("CommunityReportDrawer.tsx");
    const hook = read("useCommunityPostReport.ts");
    expect(drawer).toContain('data-tt-community-report-drawer="1"');
    expect(drawer).toContain("TT_COMMUNITY_DRAWER_L5.reportOverlay");
    expect(drawer).toContain("TT_COMMUNITY_DRAWER_L5.reportReasonRow");
    expect(drawer).toContain("useFocusTrap");
    expect(drawer).toContain('type="radio"');
    expect(drawer).not.toContain('type="url"');
    expect(hook).toContain("postCommunityReport");
    expect(hook).toContain("CommunityReportFlowContext");
  });

  it("CommunityMeQuickLinksDrawer exposes quick-links marker and aside L5 tokens", () => {
    const src = read("CommunityMeQuickLinksDrawer.tsx");
    expect(src).toContain('data-tt-community-me-quick-links-drawer="1"');
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5.meQuickFab");
    expect(src).toContain("TT_COMMUNITY_DRAWER_L5.meQuickPanel");
    expect(src).toContain("MeQuickLinksSection");
    expect(src).toContain('e.key === "Escape"');
    expect(src).not.toContain('type="url"');
  });

  it("dataTtSelectors includes G-03 community modal keys", () => {
    expect(dataTt.communityLoginForPublish).toBe('[data-tt-community-login-for-publish="1"]');
    expect(dataTt.communityReportDrawer).toBe('[data-tt-community-report-drawer="1"]');
    expect(dataTt.communityMeQuickLinksDrawer).toBe('[data-tt-community-me-quick-links-drawer="1"]');
    expect(dataTt.communityDeletePostConfirm).toBe('[data-tt-community-delete-post-confirm="1"]');
    expect(dataTt.communityDeleteCommentConfirm).toBe('[data-tt-community-delete-comment-confirm="1"]');
    expect(dataTt.communityUncollectConfirm).toBe('[data-tt-community-uncollect-confirm="1"]');
    expect(dataTt.communityUnlikeConfirm).toBe('[data-tt-community-unlike-confirm="1"]');
    expect(dataTt.communityOrderCancelConfirm).toBe('[data-tt-community-order-cancel-confirm="1"]');
  });

  it("L5 confirm dialogs expose data-tt markers and focus trap", () => {
    const deleteDlg = read("CommunityDeletePostConfirmDialog.tsx");
    const uncollectDlg = read("CommunityMeUncollectConfirmDialog.tsx");
    const unlikeDlg = read("CommunityMeUnlikeConfirmDialog.tsx");
    const cancelDlg = read("CommunityMeOrderCancelConfirmDialog.tsx");
    expect(deleteDlg).toContain("data-tt-community-delete-post-confirm");
    expect(deleteDlg).toContain("data-tt-community-delete-comment-confirm");
    expect(deleteDlg).toContain('variant === "comment"');
    expect(deleteDlg).toContain("community_delete_comment_confirm");
    expect(uncollectDlg).toContain('data-tt-community-uncollect-confirm="1"');
    expect(unlikeDlg).toContain('data-tt-community-unlike-confirm="1"');
    expect(cancelDlg).toContain('data-tt-community-order-cancel-confirm="1"');
    for (const src of [deleteDlg, uncollectDlg, unlikeDlg, cancelDlg]) {
      expect(src).toContain("useFocusTrap");
    }
  });

  it("Feed portals wire ReportDrawer without internal API paths", () => {
    const portal = read("CommunityFeedMainReportDrawerPortal.tsx");
    expect(portal).toContain("CommunityReportDrawer");
    expect(portal).not.toMatch(/\/api\/v1\/internal\//);
  });
});
