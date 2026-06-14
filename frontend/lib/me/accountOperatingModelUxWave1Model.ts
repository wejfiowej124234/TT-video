/**
 * Account Operating Model · Wave 1 Sprint · 三阶机读 SSOT
 * 文档：`evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md`
 * ① 本地代码已闭 · ② 测试网 / ③ 公网须 G-1/G-2 / Production GO 另闸
 */
import { ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC } from "@/lib/me/accountOperatingModelUxWave0Model";

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_SPRINT_DOC =
  "evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SCORE_DOC =
  "evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_ADR =
  "../docs/adr/ADR-20260613-active-workspace-context-switcher.md" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SMOKE =
  "../scripts/dev/smoke-publish-hub-local.sh" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE =
  "../scripts/dev/smoke-publish-hub-staging.sh" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SUMMARY =
  "TT_PUBLISH_HUB_SMOKE: OK" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SUMMARY =
  "TT_PUBLISH_HUB_STAGING: OK" as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_PRODUCTION_SUMMARY =
  "TT_PUBLISH_HUB_PRODUCTION: OK" as const;

/** Sprint 卡主阶段（② 实施轨）；① 本地 closure 见 LOCAL_SCORE */
export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_PHASE = "testnet-2" as const;

export type AccountOperatingModelUxWave1DeploymentPhase = "①" | "②" | "③";

export type AccountOperatingModelUxWave1Item = {
  id: string;
  title: string;
  status: "backlog" | "active" | "closed";
  phase: AccountOperatingModelUxWave1DeploymentPhase;
  sprint: "1A" | "1B" | "1C" | "1D" | "1L" | "3P";
  phB?: string;
  phC?: string;
  verify: readonly string[];
  /** ① 代码已闭但本 ID 仍须 ② staging 复验 */
  stagingRecheck?: boolean;
};

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_MARKER =
  "account-operating-model-ux-wave1-local-20260612" as const;

/** 全量 Wave1 任务 · 按 phase 分组消费 */
export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS: readonly AccountOperatingModelUxWave1Item[] = [
  // —— ① 本地 · Sprint 1A/1B（代码 + vitest + local smoke）——
  {
    id: "W1-A1",
    title: "ADR Active Workspace Context accepted",
    status: "closed",
    phase: "①",
    sprint: "1A",
    phB: "PH-B-2",
    verify: [ACCOUNT_OPERATING_MODEL_UX_WAVE1_ADR, "HEADER-UTILITY freeze"],
  },
  {
    id: "W1-A2",
    title: "lib/header/activeWorkspaceContext.ts + localStorage",
    status: "closed",
    phase: "①",
    sprint: "1A",
    verify: ["activeWorkspaceContext.test"],
  },
  {
    id: "W1-A3",
    title: "traveltrust-api GET /me/publish-summary（Rust handler）",
    status: "closed",
    phase: "①",
    sprint: "1A",
    phB: "PH-B-1",
    verify: ["cargo test publish_summary", ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SMOKE],
    stagingRecheck: true,
  },
  {
    id: "W1-A4",
    title: "BFF upstream-first publish-summary（api 优先 · fallback 聚合）",
    status: "closed",
    phase: "①",
    sprint: "1A",
    phB: "PH-B-1",
    verify: ["publishHubPublishSummaryRoute", ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SMOKE],
    stagingRecheck: true,
  },
  {
    id: "W1-B1",
    title: "顶栏 Workspace Context 下拉",
    status: "closed",
    phase: "①",
    sprint: "1B",
    phB: "PH-B-2",
    verify: ["headerUserMenuNavModel", "headerUtilityMenuUiFreeze"],
    stagingRecheck: true,
  },
  {
    id: "W1-B2",
    title: "Context ↔ /me/publish?identity= 三向同步",
    status: "closed",
    phase: "①",
    sprint: "1B",
    phB: "PH-B-2",
    verify: ["publishHubWorkspaceContextSync", "publishHubIdentityDefaultFilter"],
    stagingRecheck: true,
  },
  {
    id: "W1-B3",
    title: "Context ↔ 工作台 deep link",
    status: "closed",
    phase: "①",
    sprint: "1B",
    phB: "PH-B-2",
    verify: ["workspaceContextWorkbenchNav", "e2e publish-hub-l5"],
    stagingRecheck: true,
  },
  {
    id: "W1-B4",
    title: "发布中心 spine 行 {contextLabel} · 产出总览",
    status: "closed",
    phase: "①",
    sprint: "1B",
    verify: ["publishHubOperatingSpineModel"],
    stagingRecheck: true,
  },
  {
    id: "W1-L1",
    title: "① 本地绿集 smoke-publish-hub-local.sh + Wave1 contract 并集",
    status: "closed",
    phase: "①",
    sprint: "1L",
    verify: [ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SMOKE, ACCOUNT_OPERATING_MODEL_UX_WAVE1_LOCAL_SUMMARY],
  },
  // —— ② 测试网 · Sprint 1C/1D（须 G-1/G-2）——
  {
    id: "W1-C1",
    title: "staging 五轨 CRUD smoke",
    status: "backlog",
    phase: "②",
    sprint: "1C",
    phB: "PH-B-3",
    verify: [ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE],
  },
  {
    id: "W1-C2",
    title: "merchant/acquisition 下架 ↔ /market discover staging",
    status: "backlog",
    phase: "②",
    sprint: "1C",
    phB: "PH-B-5",
    verify: [ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE, "smoke-acquisition-pd009-staging"],
  },
  {
    id: "W1-C3",
    title: "Playwright /me/publish staging（multi-demo E1–E6）",
    status: "backlog",
    phase: "②",
    sprint: "1C",
    phB: "PH-B-7",
    verify: ["e2e/publish-hub-l5.spec.ts", ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE],
  },
  {
    id: "W1-C4",
    title: "治理 ?mine=1 + Governor 投影 staging 对拍",
    status: "backlog",
    phase: "②",
    sprint: "1C",
    phB: "PH-B-4",
    verify: ["smoke-governance staging", ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SMOKE],
  },
  {
    id: "W1-D1",
    title: "PUBLISH-HUB-PHASE-TASK-LIST PH-B 行 staging closed",
    status: "backlog",
    phase: "②",
    sprint: "1D",
    verify: ["PUBLISH-HUB-PHASE-TASK-LIST.md", "publishHubPhaseBModel"],
  },
  {
    id: "W1-D2",
    title: "② 证据 TT_PUBLISH_HUB_STAGING + PH-B-10",
    status: "backlog",
    phase: "②",
    sprint: "1D",
    phB: "PH-B-10",
    verify: [ACCOUNT_OPERATING_MODEL_UX_WAVE1_STAGING_SUMMARY, "GO_phase2_*"],
  },
  // —— ③ 公网/生产 · 另闸 ——
  {
    id: "W1-P1",
    title: "主网 Governor / 链上提案 exec 与 governance 轨同步",
    status: "backlog",
    phase: "③",
    sprint: "3P",
    phC: "PH-C-1",
    verify: ["go-live-checklist", "governance mainnet"],
  },
  {
    id: "W1-P2",
    title: "Production PSP + 真 webhook · 发布中心无写链冒充",
    status: "backlog",
    phase: "③",
    sprint: "3P",
    phC: "PH-C-3",
    verify: ["go-live-checklist", "PHASE2-REPOSITORY-STATUS"],
  },
  {
    id: "W1-P3",
    title: "93 全矩阵 + ISS-007 Production GO（非窄切片 PARTIAL_GO）",
    status: "backlog",
    phase: "③",
    sprint: "3P",
    phC: "PH-C-4",
    verify: ["evidence/GO_local_r002_verify", "go-live-checklist"],
  },
];

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS_PHASE_1 =
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "①");

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS_PHASE_2 =
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "②");

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS_PHASE_3 =
  ACCOUNT_OPERATING_MODEL_UX_WAVE1_ITEMS.filter((i) => i.phase === "③");

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_PREREQS = [
  "G-0",
  "G-1",
  "G-2",
  "G-3",
  "G-4",
] as const;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE0_PREREQ_DOC = ACCOUNT_OPERATING_MODEL_UX_WAVE0_SCORE_DOC;

export const ACCOUNT_OPERATING_MODEL_UX_WAVE1_HONEST_BOUNDARY =
  "① Wave1 本地代码 closure ≠ ② staging GO ≠ ③ Production GO" as const;
