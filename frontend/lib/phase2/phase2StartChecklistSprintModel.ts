/**
 * ①→② PHASE2-START-CHECKLIST-SPRINT — 机读标记
 * SSOT: frontend/evidence/GO_phase2_start_checklist_sprint/PHASE2-START-CHECKLIST-SPRINT-FREEZE.md
 */
export const PHASE1_ALL_EVIDENCE_STATE_MACHINE_FROZEN = true;

export const PHASE2_START_CHECKLIST_SPRINT_FROZEN = true;

/** 权威 G-0～G-4 清点证据日志（勿换名；复跑产生新时间戳日志，冻结引用本文件） */
export const PHASE2_START_CHECKLIST_SPRINT_AUTHORITATIVE_LOG =
  "PHASE2-START-CHECKLIST-SPRINT-20260610T000230Z.log";

export const PHASE2_START_CHECKLIST_SPRINT_EVIDENCE_OK =
  "TT_PHASE2_START_CHECKLIST_SPRINT_EVIDENCE: OK 20260610T000230Z";

/** G-0～G-4 全部 PASS 后机读放行 ② 测试网实施（仍 ≠ ③ Production GO） */
export const PHASE2_G0_G4_ADMISSION_VERDICT = "CLEAR" as const;

export const PHASE2_START_CHECKLIST_GATE_IDS = [
  "G-0",
  "G-1",
  "G-2",
  "G-3",
  "G-4",
] as const;

export const PHASE2_START_CHECKLIST_DIMENSIONS = [
  "environment",
  "data",
  "deployment",
  "monitoring",
  "payment",
  "chain",
  "rollback",
] as const;

/** ① 权威证据锚（冻结引用 · 勿删步） */
export const PHASE1_AUTHORITATIVE_EVIDENCE_ANCHORS = [
  "frontend/evidence/GO_local_phase1/acceptance.latest.log",
  "frontend/evidence/GO_local_phase1/site10.acceptance.latest.log",
  "frontend/evidence/GO_local_real_user_acceptance/REAL-USER-ACCEPTANCE-SPRINT-20260609T161419Z.log",
  "frontend/evidence/GO_local_real_user_acceptance/REAL-USER-EXCEPTION-MATRIX-SPRINT-20260609T235032Z.log",
] as const;
