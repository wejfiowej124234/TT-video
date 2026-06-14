/**
 * Phase A 验收矩阵 · 机读（SSOT：`PUBLISH-HUB-L5-DESIGN.md` §6.1 · §7）
 */
import { PUBLISH_HUB_DESIGN_SSOT_PATH, PUBLISH_HUB_PATH } from "@/lib/me/publishHubL5";

export const PUBLISH_HUB_PHASE_A_SPRINT_MARKER = "publish-hub-phase-a-20260612" as const;

export type PublishHubPhaseAItem = {
  id: string;
  title: string;
  status: "active" | "backlog";
  verify: readonly string[];
};

export const PUBLISH_HUB_PHASE_A_ITEMS: readonly PublishHubPhaseAItem[] = [
  {
    id: "PH-A-1",
    title: "路由 /me/publish + L5 壳 + 五轨功能筛选",
    status: "active",
    verify: ["publishHubPage.contract", "publishHubUiFreeze"],
  },
  {
    id: "PH-A-2",
    title: "顶栏发布中心 + 我的帖子改名 + 商家轨 MVP",
    status: "active",
    verify: ["headerUserMenuNavModel.test", "accountNavNamingP3"],
  },
  {
    id: "PH-A-3",
    title: "收购轨 + GET /me/acquisition-listings + archive/delete API",
    status: "active",
    verify: ["publishHubPage.contract", "smoke-acquisition-pd009-local.sh"],
  },
  {
    id: "PH-A-4",
    title: "行程轨 + GET /orders trip/traveler + 汇总条 + 全部视图隐藏空占位",
    status: "active",
    verify: ["publishHubPage.contract", "publishHubUiFreeze"],
  },
  {
    id: "PH-A-5",
    title: "治理提案轨 + GET /governance/proposals?mine=1 + Hub/设置互指",
    status: "active",
    verify: ["publishHubPage.contract", "publishHubUiFreeze", "meSettingsL5"],
  },
  {
    id: "PH-A-6",
    title: "向导轨 GET /me/guide-profile",
    status: "active",
    verify: ["publishHubPage.contract", "publishHubUiFreeze", "publishHubGuideModel"],
  },
  {
    id: "PH-A-7",
    title: "smoke-publish-hub-local.sh",
    status: "active",
    verify: ["smoke-publish-hub-local.sh"],
  },
  {
    id: "PH-A-8",
    title: "统一 PublishHubItem 横向卡片（cover + status badge）",
    status: "active",
    verify: ["publishHubItemModel", "publishHubUiFreeze"],
  },
  {
    id: "PH-A-15",
    title: "GET /api/v1/me/publish-summary BFF 聚合 + 前端 summary SSOT",
    status: "active",
    verify: ["publishHubServerSummaryModel", "mePublishSummary"],
  },
  {
    id: "PH-A-16",
    title: "订单↔发布中心 IA 边界 copy + ?identity= 默认筛选",
    status: "active",
    verify: ["ordersListL5", "publishHubIdentityDefaultFilter"],
  },
];

export const PUBLISH_HUB_HEADER_NAV = {
  publishHubHref: PUBLISH_HUB_PATH,
  publishHubLabelKey: "header_userMenu_publish_hub",
  postsLabelKey: "header_userMenu_my_posts",
  postsHref: "/community/me/posts",
} as const;

export const PUBLISH_HUB_DESIGN_DOC_REL = PUBLISH_HUB_DESIGN_SSOT_PATH;
