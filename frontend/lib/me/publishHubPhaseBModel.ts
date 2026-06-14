/**
 * Phase B 验收矩阵 · 机读（SSOT：`PUBLISH-HUB-PHASE-TASK-LIST.md` §②）
 */
import { PUBLISH_HUB_DESIGN_SSOT_PATH } from "@/lib/me/publishHubL5";

export const PUBLISH_HUB_PHASE_B_SPRINT_MARKER = "publish-hub-phase-b-backlog" as const;

export type PublishHubPhaseBItem = {
  id: string;
  title: string;
  status: "backlog" | "active" | "closed";
  verify: readonly string[];
};

/** ② 测试网 · Not Started（须 G-1/G-2 后 Owner scope） */
export const PUBLISH_HUB_PHASE_B_ITEMS: readonly PublishHubPhaseBItem[] = [
  {
    id: "PH-B-1",
    title: "traveltrust-api GET /me/publish-summary 与 BFF 同形 staging 对拍",
    status: "backlog",
    verify: ["smoke-publish-hub-staging.sh", "publish-summary API contract"],
  },
  {
    id: "PH-B-2",
    title: "顶栏身份 switcher 全量 ↔ 发布中心默认筛选轨",
    status: "backlog",
    verify: ["headerUserMenuNavModel", "e2e publish-hub staging"],
  },
  {
    id: "PH-B-3",
    title: "staging 五轨功能 CRUD 回归",
    status: "backlog",
    verify: ["smoke-publish-hub-staging.sh"],
  },
  {
    id: "PH-B-4",
    title: "governance ?mine=1 与 Governor 投影 staging 对拍",
    status: "backlog",
    verify: ["smoke-governance-uat-p0-local.sh", "staging governor index"],
  },
  {
    id: "PH-B-5",
    title: "merchant/acquisition 下架与 market discover 一致性",
    status: "backlog",
    verify: ["smoke-acquisition-pd009-local.sh", "staging market"],
  },
  {
    id: "PH-B-6",
    title: "社区帖 /community/me/posts 跨设备与 API 一致（F-020 SLA）",
    status: "backlog",
    verify: ["communityMe staging gate"],
  },
  {
    id: "PH-B-7",
    title: "Playwright /me/publish staging（非 localhost mock）",
    status: "backlog",
    verify: ["e2e publish-hub staging"],
  },
  {
    id: "PH-B-8",
    title: "ISS-007 / 93 矩阵 staging release_gate=GO",
    status: "backlog",
    verify: ["evidence/GO_local_r002_verify"],
  },
  {
    id: "PH-B-9",
    title: "Phase ② 总闸边界复核（Stripe/webhook · 无写链冒充）",
    status: "backlog",
    verify: ["PHASE2-START-CHECKLIST"],
  },
  {
    id: "PH-B-10",
    title: "② 证据末行 TT_PUBLISH_HUB_STAGING: OK + 文档 ACTIVE",
    status: "backlog",
    verify: ["smoke-publish-hub-staging.sh", "PUBLISH-HUB-PHASE-TASK-LIST.md"],
  },
];

export const PUBLISH_HUB_PHASE_B_TASK_LIST_REL =
  "evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE-TASK-LIST.md" as const;

export const PUBLISH_HUB_PHASE_B_DESIGN_DOC_REL = PUBLISH_HUB_DESIGN_SSOT_PATH;
