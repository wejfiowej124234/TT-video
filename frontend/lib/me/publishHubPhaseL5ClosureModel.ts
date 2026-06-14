/**

 * ① L5 收口 · 机读（SSOT：`PUBLISH-HUB-PHASE-TASK-LIST.md` §1.3）

 */

export const PUBLISH_HUB_PHASE_L5_CLOSURE_MARKER = "publish-hub-phase1-l5-closure" as const;



export type PublishHubPhaseL5ClosureItem = {

  id: string;

  title: string;

  status: "backlog" | "active" | "closed";

  verify: readonly string[];

};



/** ① L5 级 ACTIVE 收口 · PH-A-9～A-13 CLOSED（2026-06-12） */

export const PUBLISH_HUB_PHASE_L5_CLOSURE_ITEMS: readonly PublishHubPhaseL5ClosureItem[] = [

  {

    id: "PH-A-9",

    title: "L5 十维企业审计 + publishHubL5FullClosure.contract",

    status: "closed",

    verify: ["publishHubL5FullClosure", "PUBLISH-HUB-L5-AUDIT.md"],

  },

  {

    id: "PH-A-10",

    title: "Playwright e2e/publish-hub-l5.spec.ts",

    status: "closed",

    verify: ["PLAYWRIGHT_PUBLISH_HUB=1 smoke-publish-hub-local.sh"],

  },

  {

    id: "PH-A-11",

    title: "a11y + loading/error 段级态复审",

    status: "closed",

    verify: ["publishHubUiFreeze", "publishHubFilterA11y"],

  },

  {

    id: "PH-A-12",

    title: "卡片抛光：listing cover · 社区 post 深链",

    status: "closed",

    verify: ["publishHubCommunityLinks", "publishHubItemModel"],

  },

  {

    id: "PH-A-13",

    title: "① ACTIVE 声明 + publish-hub-l5-local-gate.v1.json",

    status: "closed",

    verify: ["PUBLISH-HUB-PHASE1-CLOSURE.md", "publishHubPhaseTaskList.contract"],

  },

  {

    id: "PH-A-14",

    title: "record-go-local-phase1-acceptance 旁证（可选）",

    status: "backlog",

    verify: ["record-go-local-phase1-acceptance-log.sh"],

  },

  {

    id: "PH-A-16",

    title: "订单↔发布中心 IA 边界 copy + ?identity= 默认筛选",

    status: "closed",

    verify: ["ordersListL5", "publishHubIdentityDefaultFilter"],

  },

  {

    id: "PH-IA-FREEZE",

    title: "IA 边界 ACTIVE 100 · 冻结 publish/orders/header/provider · ① 功能冻结",

    status: "closed",

    verify: ["publishHubIaBoundaryFreeze", "PUBLISH-HUB-IA-BOUNDARY-SCORE.md"],

  },

];



export const PUBLISH_HUB_PHASE_TASK_LIST_REL =

  "evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE-TASK-LIST.md" as const;


