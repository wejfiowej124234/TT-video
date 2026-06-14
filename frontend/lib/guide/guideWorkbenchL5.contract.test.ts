import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUIDE_WORKBENCH_INBOX_L5_FROZEN,
  GUIDE_WORKBENCH_L5_CLOSURE_PROBE,
  GUIDE_WORKBENCH_L5_FROZEN_MARKER,
  buildGuideWorkbenchInboxSnapshot,
} from "./guideWorkbenchInboxModel";
import type { OrderListItem } from "@/lib/apiClient";

const root = join(process.cwd());

function item(partial: Partial<OrderListItem> & { id: string }): OrderListItem {
  return { ...partial } as OrderListItem;
}

describe("Guide workbench L5 inbox (① local · frozen)", () => {
  it("freeze doc is ACTIVE", () => {
    const freeze = readFileSync(
      join(root, "evidence/GO_local_guide_workbench_l5/GUIDE-WORKBENCH-INBOX-L5-FREEZE.md"),
      "utf8",
    );
    expect(freeze).toContain("冻结结论（ACTIVE）");
    expect(GUIDE_WORKBENCH_INBOX_L5_FROZEN).toBe(true);
  });
  it("buildGuideWorkbenchInboxSnapshot prioritizes created then bilateral", () => {
    const guideRowId = "550e8400-e29b-41d4-a716-446655440099";
    const snap = buildGuideWorkbenchInboxSnapshot(
      [
        item({
          id: "b",
          state: "accepted",
          sub_status: "pending_bilateral",
          guide_id: guideRowId,
          created_at: "2026-06-09T08:00:00Z",
          traveler_nickname: "Alice",
          amount: "120",
          currency: "USDC",
        }),
        item({
          id: "a",
          state: "created",
          guide_id: guideRowId,
          created_at: "2026-06-09T07:00:00Z",
          traveler_nickname: "Bob",
          amount: "80",
          currency: "USDC",
        }),
      ],
      guideRowId,
      new Date("2026-06-09T12:00:00Z"),
    );
    expect(snap.pendingAcceptCount).toBe(1);
    expect(snap.todayPendingCount).toBe(2);
    expect(snap.nextOrder?.id).toBe("a");
    expect(snap.nextOrder?.primaryAction).toBe("accept");
    expect(snap.nextOrder?.travelerLabel).toBe("Bob");
    expect(snap.nextOrder?.amountLine).toBe("80 USDC");
    expect(snap.nextOrder?.statusLabelKey).toBe("guide_workbench_status_pending_accept");
  });

  it("inbox card exposes next-order summary probe", () => {
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchInboxCard.tsx"), "utf8");
    expect(card).toContain('data-tt-guide-workbench-next-order="1"');
    expect(card).toContain("guide_workbench_next_order_travel_date");
    expect(card).toContain("guide_workbench_status_pending_accept");
  });

  it("/guide page wires GuideWorkbenchInboxCard above stats", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchInboxCard.tsx"), "utf8");
    expect(page).toContain("GuideWorkbenchInboxCard");
    expect(page).toContain("useGuideWorkbenchInbox");
    expect(page).not.toContain("guide_dashboard_quick_links");
    expect(card).toContain("guide_workbench_inbox_title");
    const inboxIdx = page.indexOf("<GuideWorkbenchInboxCard");
    const statsIdx = page.indexOf("<GuideDashboardStats");
    expect(inboxIdx).toBeGreaterThan(0);
    expect(statsIdx).toBeGreaterThan(inboxIdx);
  });

  it("/guide page wires market exposure card and settings ingress", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    expect(page).toContain("GuideWorkbenchMarketExposureCard");
    expect(page).toContain("useGuideWorkbenchProfile");
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchMarketExposureCard.tsx"), "utf8");
    expect(card).toContain("guideProfileSettingsHrefFromWorkbench");
    expect(card).toContain('data-tt-guide-workbench-profile-summary="1"');
    expect(card).toContain('data-tt-guide-workbench-profile-preview="1"');
    expect(card).not.toContain("<dl");
  });

  it("profile summary model passes hourly_currency for GuideCard preview", () => {
    const settingsModel = readFileSync(join(root, "lib/guide/guideProfileSettingsModel.ts"), "utf8");
    const summaryModel = readFileSync(join(root, "lib/guide/guideWorkbenchProfileSummaryModel.ts"), "utf8");
    expect(settingsModel).toContain("hourly_currency");
    expect(settingsModel).toContain("DEFAULT_SETTLEMENT_CURRENCY_CODE");
    expect(summaryModel).toContain("buildGuideProfileMarketPreviewDraft");
  });

  it("/guide collapses empty stats sections for new guides (U4)", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    expect(page).toContain("shouldShowGuideWorkbenchStatsSections");
  });

  it("/guide is ops-only; admission on Trust not workbench", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    const inbox = readFileSync(join(root, "components/guide/GuideWorkbenchInboxCard.tsx"), "utf8");
    expect(page).not.toContain("GuideWorkbenchGateProgressCard");
    expect(page).not.toContain("MeTrustSection");
    expect(page).not.toContain("GuideWorkbenchTrustSummaryCard");
    expect(inbox).not.toContain("GuideWorkbenchTrustAdmissionLink");
    expect(readFileSync(join(root, "components/guide/GuideWorkbenchStakingGateCard.tsx"), "utf8")).toContain(
      "GuideWorkbenchTrustAdmissionLink",
    );
    expect(readFileSync(join(root, "lib/me/meSettingsTrustProgressModel.ts"), "utf8")).toContain(
      "guide_listing",
    );
  });

  it("profile preview uses GuideCard previewOnly (no fake onView)", () => {
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchMarketExposureCard.tsx"), "utf8");
    expect(card).toContain("previewOnly");
    expect(card).not.toContain("onView={() => {}}");
  });

  it("/guide is ops-only: no ProductCrossNav or quick links", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    expect(page).not.toContain("ProductCrossNav");
    expect(page).not.toContain("guide_dashboard_quick_links");
    expect(page).toContain("GUIDE_WORKSPACE_OPS_SCOPE_MARKER");
    expect(page).toContain("shouldShowGuideInboxEmptyState");
    expect(page).toContain("meGuideWorkspaceUnlocked");
    expect(page).toContain("WorkspaceOperatorLockedPanel");
    expect(page).not.toContain("/guide/register");
    expect(page).not.toContain("resolveGuideWorkbenchGateProgress");
  });

  it("Playwright dual-role spec exists", () => {
    const spec = readFileSync(join(root, "e2e/guide-workbench-inbox-l5.spec.ts"), "utf8");
    expect(spec).toContain("expectGuideWorkbenchPendingAcceptCount");
    expect(spec).toContain("clickGuideWorkbenchEnterOrderAccept");
    expect(spec).toContain("bilateralRe");
  });

  it("inbox links guide reception orders via hat=guide", () => {
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchInboxCard.tsx"), "utf8");
    expect(card).toContain("guideOrdersInProgressHref");
    expect(card).not.toContain("ORDERS_LIST_IN_PROGRESS_VALUE");
    expect(card).not.toContain('/orders?state=');
  });

  it("inbox card exposes L5 closure probe", () => {
    const card = readFileSync(join(root, "components/guide/GuideWorkbenchInboxCard.tsx"), "utf8");
    expect(card).toContain("GUIDE_WORKBENCH_L5_CLOSURE_PROBE");
    expect(card).toContain("GUIDE_WORKBENCH_L5_FROZEN_MARKER");
    expect(card).toContain("guide_workbench_enter_order");
    expect(GUIDE_WORKBENCH_L5_CLOSURE_PROBE).toBe("guide-workbench-full-v1");
    expect(GUIDE_WORKBENCH_L5_FROZEN_MARKER).toBe("guide-workbench-l5-20260612");
  });

  it("workbench wires single primary identity-staking CTA on live /guide page", () => {
    const page = readFileSync(join(root, "app/guide/page.tsx"), "utf8");
    const banner = readFileSync(join(root, "components/guide/GuideIdentityStakingBanner.tsx"), "utf8");
    expect(page).toContain("GuideIdentityStakingBanner");
    expect(page).toContain("shouldShowGuideIdentityStakingBanner");
    expect(page).not.toContain("GuideDashboardPageMain");
    expect(banner).toContain("GUIDE_IDENTITY_STAKING_HREF");
    expect(banner).toContain("data-tt-guide-go-identity-staking");
  });
});
