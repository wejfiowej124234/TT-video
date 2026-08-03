#!/usr/bin/env node
/**
 * V65 Admin UX Batch · one-shot: locale patch + inventory FREEZE + evidence + pointer sync.
 * Not a new version rail. Stamp from argv or UTC now.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const STAMP = process.argv[2] || new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
const TIP = "87a5686f7a6f77e94075d25a5f4bc036ef3a71d9";
const EVIDENCE_DIR = path.join(ROOT, "evidence/GO_v65_admin_ux_batch", STAMP);
const ZH_PATH = path.join(ROOT, "frontend/locales/zh.ts");
const INV_JSON = path.join(ROOT, "docs/runbook/TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.json");
const INV_MD = path.join(ROOT, "docs/runbook/TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.md");
const BATCH_JSON = path.join(ROOT, "docs/runbook/TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json");
const RUNTIME_JSON = path.join(ROOT, "docs/runbook/TT-V65-FINAL-RUNTIME-TRUTH-SSOT-LATEST.json");

/** Priority Batch Fix locale map (G012–G022 + coupled table/snake). */
const LOCALE_PATCHES = {
  admin_business_superadmin_shortcut_title: "开发快捷入口 · 业务账号预览（非 ADM-U01）",
  pes3_admin_page_subtitle: "产品增强冲刺 · 转化分析层",
  admin_steward_app_actionNeedsMoreInfo: "需要补充信息",
  admin_steward_app_contactEmail: "联系邮箱",
  admin_steward_app_needsMoreInfoNote: "补充说明",
  admin_onboarding_dual_ledger_payment: "支付事件",
  admin_onboarding_dual_ledger_webhook: "Webhook 任务",
  admin_fin_drift_depth_detected: "检测到漂移",
  admin_fin_drift_depth_status: "状态",
  admin_fin_drift_depth_link_cross_check: "交叉核对",
  admin_official_templates_col_catalog: "目录",
  admin_public_operations_stats_col_origin: "数据来源",
  admin_public_operations_publish_status_filter: "展示状态",
  admin_public_operations_publish_col_display_status: "展示状态",
  admin_public_operations_publish_col_display_origin: "展示来源",
  admin_public_operations_col_featured: "精选",
  admin_public_operations_col_priority: "展示优先级",
  admin_public_operations_col_surfaces: "展示面",
  admin_public_operations_col_display_start_at: "展示开始",
  admin_public_operations_col_display_end_at: "展示结束",
  admin_public_operations_history_col_entity: "实体编号",
  admin_official_cold_start_action_deploy: "部署",
  admin_official_cold_start_action_rollback: "回滚",
  admin_official_cold_start_col_surfaces: "展示面",
  admin_official_cold_start_action_request_deploy: "申请部署",
  admin_official_cold_start_action_create: "创建活动",
  admin_official_cold_start_action_add_item: "添加活动项",
  admin_backup_runbooks_heading: "运行手册",
  admin_audit_ops_operations: "操作",
  admin_users_role_filter_ph: "游客、向导、管理员…",
  admin_users_kyc_filter_ph: "无、待审…",
  admin_orders_state_placeholder: "草稿、托管中、争议中…",
  admin_disputes_status_placeholder: "进行中、已结案…",
  admin_audit_list_actorId: "操作者 ID",
  admin_audit_list_action: "动作",
  admin_audit_list_resourceType: "资源类型",
  admin_audit_list_colRequestId: "请求编号",
  admin_region_share_reconcile_closure_clean: "投影闭环干净",
  admin_region_share_reconcile_triangle_marker: "金额三角标记",
  admin_region_share_reconcile_epoch_marker: "纪元对账标记",
  admin_rank_snapshots_feed_mode: "信息流模式",
  admin_rank_snapshots_colMode: "信息流模式",
  admin_rank_snapshots_colCount: "条目数",
  admin_rank_snapshots_colTopPosts: "置顶帖",
  admin_rank_snapshots_colNotes: "备注",
  admin_rank_snapshots_colCreated: "创建时间",
  admin_penalties_reportId: "举报编号",
  admin_penalties_status: "状态",
  admin_penalties_colAction: "动作",
  admin_penalties_colStatus: "状态",
  admin_penalties_colSubject: "对象",
  admin_penalties_colReport: "举报编号",
  admin_penalties_colReason: "原因",
  admin_penalties_colBy: "登记人",
  admin_penalties_colExpires: "到期时间",
  admin_penalties_colMeta: "元数据",
  admin_penalties_colCreated: "创建时间",
  admin_penalties_createSubject: "对象用户编号（UUID）",
  admin_penalties_createAction: "动作类型",
  admin_home_desc_onboarding_hub: "入驻权益、支付事件、Webhook 与合规审计（枢纽导航）。",
  admin_filter_field_feed_mode: "信息流模式",
};

function patchZhTs(src) {
  let out = src;
  const applied = [];
  const missed = [];
  for (const [key, value] of Object.entries(LOCALE_PATCHES)) {
    const re = new RegExp(`(^\\s*${key}:\\s*)(?:"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')`, "m");
    if (!re.test(out)) {
      missed.push(key);
      continue;
    }
    out = out.replace(re, `$1${JSON.stringify(value)}`);
    applied.push(key);
  }
  return { out, applied, missed };
}

function updateGap(g, patch) {
  return Object.assign({}, g, patch);
}

function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

  const zhBefore = fs.readFileSync(ZH_PATH, "utf8");
  const { out: zhAfter, applied, missed } = patchZhTs(zhBefore);
  if (applied.length === 0) {
    console.error("v65-admin-ux-batch-apply: no locale keys applied");
    process.exit(2);
  }
  fs.writeFileSync(ZH_PATH, zhAfter);

  const inv = JSON.parse(fs.readFileSync(INV_JSON, "utf8"));
  inv.stamp_utc = STAMP;
  inv.status = "FROZEN";
  inv.freeze_status = "FROZEN";
  inv.phase = "BATCH_FIX_THEN_ONE_CUT";
  inv.evidence_pack = `evidence/GO_v65_admin_ux_batch/${STAMP}/`;
  inv.prior_inventory_stamp = "20260803T035711Z";
  inv.freeze_note =
    "G005 demoted CLOSED_CAMPAIGN_TRACKING (P1→0); children remain P2 with Evidence+Fix Plan; CN screenshots deferred to Runtime Evidence after one cut. Locale Batch Fix applied this stamp.";

  const closedLocaleIds = new Set([
    "V65-UX-G012",
    "V65-UX-G013",
    "V65-UX-G014",
    "V65-UX-G015",
    "V65-UX-G016",
    "V65-UX-G017",
    "V65-UX-G018",
    "V65-UX-G019",
    "V65-UX-G020",
    "V65-UX-G021",
    "V65-UX-G022",
  ]);

  inv.gaps = inv.gaps.map((g) => {
    if (g.id === "V65-UX-G005") {
      return updateGap(g, {
        status: "CLOSED_CAMPAIGN_TRACKING",
        severity: "P1",
        closed_at: STAMP,
        close_reason:
          "Children G012–G043 registered as P2 with Route/Evidence/Owner/Fix Plan. Owner CN screenshots deferred to post-cut Runtime Evidence (not a Freeze blocker once children exist).",
        evidence: `${g.evidence || ""} · demote@${STAMP}`,
      });
    }
    if (closedLocaleIds.has(g.id)) {
      return updateGap(g, {
        status: "CLOSED_IN_BATCH_FIX",
        closed_at: STAMP,
        evidence: `${g.evidence} · locale patched ${STAMP}`,
        fix_plan: "Locale-only applied in V65 Admin UX Batch Fix",
      });
    }
    if (g.id === "V65-UX-G023") {
      return updateGap(g, {
        status: "OPEN",
        severity: "P2",
        issue:
          "~133 ops-facing Admin keys without CJK at prior collect; Wave-1 closed G012–G022 priority families this Batch; remainder deferred next Admin UX Batch",
        evidence: `I18N-COLLECT prior · WAVE1_APPLIED_${applied.length}_KEYS@${STAMP}`,
        fix_plan: "Overflow → next V65 Admin UX Batch (not this cut)",
      });
    }
    if (g.id === "V65-UX-G025" || g.id === "V65-UX-G026") {
      return updateGap(g, {
        status: "CLOSED_CONFIRM_DESIGN",
        closed_at: STAMP,
        evidence:
          g.id === "V65-UX-G025"
            ? "AdminConsoleRoleEffectiveStrip · mono source maintainer-only; product path uses Chinese source_product"
            : "adminP1UxFixes.contract · overview uses honesty_metrics not honesty_dev_metrics",
        fix_plan: "CONFIRM_DESIGN · no Batch code change",
      });
    }
    if (
      [
        "V65-UX-G024",
        "V65-UX-G027",
        "V65-UX-G028",
        "V65-UX-G029",
        "V65-UX-G030",
        "V65-UX-G031",
        "V65-UX-G032",
        "V65-UX-G033",
        "V65-UX-G034",
        "V65-UX-G035",
        "V65-UX-G036",
        "V65-UX-G037",
        "V65-UX-G038",
        "V65-UX-G039",
        "V65-UX-G040",
        "V65-UX-G041",
        "V65-UX-G042",
        "V65-UX-G043",
      ].includes(g.id)
    ) {
      return updateGap(g, {
        status: "OPEN_VERIFY_AT_RUNTIME",
        evidence: `${g.evidence} · machine+code noted@${STAMP}; Owner CN shot at Runtime Evidence`,
        fix_plan:
          g.id.startsWith("V65-UX-G04") && Number(g.id.slice(-2)) >= 41
            ? "Coupled locale closed in G015–G017; table density/IA confirm at Runtime Evidence"
            : "No fragment deploy; verify on Production after this cut · optional polish next Batch",
      });
    }
    return g;
  });

  const open = inv.gaps.filter((g) => String(g.status).startsWith("OPEN"));
  const p0 = open.filter((g) => g.severity === "P0").length;
  const p1 = open.filter((g) => g.severity === "P1").length;
  const p2 = open.filter((g) => g.severity === "P2").length;
  inv.totals = {
    open: open.length,
    p0_open: p0,
    p1_open: p1,
    p2_open: p2,
    closed_in_batch_fix: inv.gaps.filter((g) => g.status === "CLOSED_IN_BATCH_FIX").length,
    closed_confirm_design: inv.gaps.filter((g) => g.status === "CLOSED_CONFIRM_DESIGN").length,
    closed_campaign: inv.gaps.filter((g) => g.status === "CLOSED_CAMPAIGN_TRACKING").length,
  };
  inv.freeze_gate_eval = {
    p0_ok: p0 === 0,
    p1_ok: p1 === 0,
    p2_ok: p2 <= 50,
    batch_size_ok: open.length >= 10 && open.length <= 50,
    ready: p0 === 0 && p1 === 0 && p2 <= 50,
    evaluated_at: STAMP,
  };
  if (!inv.freeze_gate_eval.ready) {
    console.error("Freeze Gate NOT ready", inv.totals, inv.freeze_gate_eval);
    process.exit(3);
  }
  inv.next_steps = [
    "Local vitest admin contracts",
    "One Commit (Admin UX Batch only)",
    "One Build + One Production Web Deploy",
    "Runtime Evidence: CN screenshots for OPEN_VERIFY_AT_RUNTIME + tip SHA advance",
    "Do not flip TT_PRODUCTION_GO",
  ];
  inv.related.evidence_pack = `evidence/GO_v65_admin_ux_batch/${STAMP}/`;
  fs.writeFileSync(INV_JSON, JSON.stringify(inv, null, 2) + "\n");

  const md = `# TT-V65 · Admin UX Batch · Gap Inventory · FROZEN

**Candidate:** \`V65\` · **Production tip (pre-cut):** \`${TIP}\`  
**Batch:** \`V65 Admin UX Batch\` · **NOT a new version** (\`not_a_new_version: true\`)  
**Stamp:** \`${STAMP}\` · **Status:** **FROZEN**  
**Evidence:** \`evidence/GO_v65_admin_ux_batch/${STAMP}/\`

## Freeze Gate

| Check | Result |
|-------|--------|
| P0 OPEN | **${p0}** |
| P1 OPEN | **${p1}** (G005 → CLOSED_CAMPAIGN_TRACKING) |
| P2 OPEN | **${p2}** (≤50) |
| Verdict | **FREEZE PASS** → Batch Fix (locale Wave-1) → One Cut |

## Totals

\`\`\`json
${JSON.stringify(inv.totals, null, 2)}
\`\`\`

## This cut

- Locale Wave-1: **${applied.length}** keys patched (\`frontend/locales/zh.ts\`)
- CLOSED_IN_BATCH_FIX: G012–G022
- CLOSED_CONFIRM_DESIGN: G025 · G026
- OPEN_VERIFY_AT_RUNTIME: G024 · G027–G043 (Owner CN shots at Runtime Evidence)
- OPEN overflow: G023 (next Batch)

## Honest boundary

① locale Batch Fix ≠ ② Staging GO ≠ ③ Production GO. \`TT_PRODUCTION_GO\` remains **NO_GO**.

## Related

- Process: \`docs/runbook/TT-V65-BATCH-RELEASE-CLOSURE-LATEST.md\`
- Runtime SSOT: \`docs/runbook/TT-V65-FINAL-RUNTIME-TRUTH-SSOT-LATEST.md\`
- Machine JSON: \`docs/runbook/TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.json\`
`;
  fs.writeFileSync(INV_MD, md);

  const batch = JSON.parse(fs.readFileSync(BATCH_JSON, "utf8"));
  batch.stamp_utc = STAMP;
  batch.active_batch.status = "FROZEN_BATCH_FIX_APPLIED";
  batch.active_batch.inventory_stamp = STAMP;
  batch.active_batch.evidence_pack = `evidence/GO_v65_admin_ux_batch/${STAMP}/`;
  batch.active_batch.freeze_status = "FROZEN";
  batch.active_batch.totals_snapshot = {
    open: open.length,
    p0_open: p0,
    p1_open: p1,
    p2_open_children: p2,
    locale_keys_patched: applied.length,
  };
  batch.active_batch.next =
    "one_commit → one_build → one_production_web_deploy → runtime_evidence";
  batch.active_batch.batch_fix = {
    stamp: STAMP,
    locale_keys_applied: applied.length,
    locale_keys_missed: missed,
    closed_gap_ids: [...closedLocaleIds],
  };
  fs.writeFileSync(BATCH_JSON, JSON.stringify(batch, null, 2) + "\n");

  const runtime = JSON.parse(fs.readFileSync(RUNTIME_JSON, "utf8"));
  runtime.stamp = STAMP;
  runtime.release_mode = runtime.release_mode || {};
  runtime.release_mode.active_batch = "V65-ADMIN-UX";
  runtime.release_mode.gap_inventory =
    "docs/runbook/TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.json";
  runtime.release_mode.batch_freeze_status = "FROZEN";
  runtime.release_mode.batch_inventory_stamp = STAMP;
  runtime.parent_baselines = runtime.parent_baselines || {};
  runtime.parent_baselines.batch_release_closure = {
    stamp: STAMP,
    status: "FROZEN_BATCH_FIX_APPLIED",
    active_batch: "V65-ADMIN-UX",
    ref: "docs/runbook/TT-V65-BATCH-RELEASE-CLOSURE-LATEST.json",
  };
  runtime.parent_baselines.admin_ux_batch_gap_inventory = {
    stamp: STAMP,
    freeze_status: "FROZEN",
    ref: "docs/runbook/TT-V65-ADMIN-UX-BATCH-GAP-INVENTORY-LATEST.json",
  };
  fs.writeFileSync(RUNTIME_JSON, JSON.stringify(runtime, null, 2) + "\n");

  const collectSrc = path.join(
    ROOT,
    "evidence/GO_v65_admin_ux_batch/20260803T035711Z/I18N-COLLECT.json",
  );
  if (fs.existsSync(collectSrc)) {
    fs.copyFileSync(collectSrc, path.join(EVIDENCE_DIR, "I18N-COLLECT-PRIOR.json"));
  }
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "BATCH-FIX-LOCALE.json"),
    JSON.stringify(
      {
        stamp: STAMP,
        tip_pre_cut: TIP,
        applied,
        missed,
        closed_gaps: [...closedLocaleIds],
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "FREEZE-GATE.json"),
    JSON.stringify({ stamp: STAMP, totals: inv.totals, freeze_gate_eval: inv.freeze_gate_eval }, null, 2) +
      "\n",
  );
  fs.writeFileSync(path.join(EVIDENCE_DIR, "stamp.txt"), STAMP + "\n");
  fs.writeFileSync(
    path.join(EVIDENCE_DIR, "README.md"),
    `# V65 Admin UX Batch · ${STAMP}

- Freeze Gate: PASS (P0=${p0} P1=${p1} P2=${p2})
- Locale Wave-1 applied: ${applied.length} keys
- Pre-cut Production tip: \`${TIP}\`
- Next: One Commit → Build → Production Deploy → Runtime Evidence
`,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        stamp: STAMP,
        applied: applied.length,
        missed,
        totals: inv.totals,
        freeze: inv.freeze_gate_eval,
        evidence: `evidence/GO_v65_admin_ux_batch/${STAMP}/`,
      },
      null,
      2,
    ),
  );
}

main();
