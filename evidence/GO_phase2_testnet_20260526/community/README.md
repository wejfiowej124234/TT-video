# Phase ② · 社区 C1～C12 证据槽（Fly staging · Matrix Closure · 2026-06-06）

**阶段：② 测试网 / staging** — **Fly 持久 HTTPS 单槽复验**（`https://tt-api-staging.fly.dev`）。

**矩阵 Attestation：** [TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION](../../../docs/runbook/TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · **`TT_PHASE2_COMMUNITY_MATRIX_VERDICT: GO`** · **`TT_PHASE2_GO_VERDICT: NOT_MET`**

**闸门：** [PHASE2-START-CHECKLIST · G-T](../../../docs/runbook/PHASE2-START-CHECKLIST.md) **`READY_FOR_C1_C12`** — **禁止** 用本表矩阵 GO 冒充 **Phase ② 宽轨 GO** 或 **③ Production GO**。

**SSOT 表：** [COMMUNITY-PHASE-2-3-ROADMAP §C1～C12](../../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [`CLOSING-REVIEW.md`](./CLOSING-REVIEW.md)

**Runbooks：** [`TT-PHASE2-C1-STAGING-EVIDENCE`](../../../docs/runbook/TT-PHASE2-C1-STAGING-EVIDENCE.md) · [C2](../../../docs/runbook/TT-PHASE2-C2-STAGING-EVIDENCE.md) · [C3](../../../docs/runbook/TT-PHASE2-C3-STAGING-EVIDENCE.md) · [C4](../../../docs/runbook/TT-PHASE2-C4-STAGING-EVIDENCE.md) · [C5](../../../docs/runbook/TT-PHASE2-C5-STAGING-EVIDENCE.md) · [C6](../../../docs/runbook/TT-PHASE2-C6-STAGING-EVIDENCE.md) · [C7](../../../docs/runbook/TT-PHASE2-C7-STAGING-EVIDENCE.md) · [C8](../../../docs/runbook/TT-PHASE2-C8-STAGING-EVIDENCE.md) · [C9](../../../docs/runbook/TT-PHASE2-C9-STAGING-EVIDENCE.md) · [C10](../../../docs/runbook/TT-PHASE2-C10-STAGING-EVIDENCE.md) · [C11](../../../docs/runbook/TT-PHASE2-C11-STAGING-EVIDENCE.md) · [C12](../../../docs/runbook/TT-PHASE2-C12-STAGING-EVIDENCE.md)

## C1～C12 覆盖矩阵（Fly staging · SSOT · STATUS.txt）

| ID | 路径 | ② 验收命令 | Fly staging 态 | 最近证据（UTC） | 可宣称 |
|----|------|------------|----------------|-----------------|--------|
| **C1** | [C1/](./C1/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c1-seed-evidence.sh` | **PASS** | `20260605T123651Z` · feed **22** · automation_leak **0** | **② C1 only** |
| **C2** | [C2/](./C2/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c2-evidence.sh` | **PASS** | `20260605T125440Z` · IT **11** · upload E2E OK | **② C2 only** |
| **C3** | [C3/](./C3/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c3-evidence.sh` | **PASS** | `20260605T125712Z` · IT **2** · moderation E2E OK | **② C3 only** |
| **C4** | [C4/](./C4/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c4-evidence.sh` | **PASS** | `20260605T141755Z` · IT **5** · staging MP4 + Feed player E2E · **HLS-CDN pending** | **② C4 only** |
| **C5** | [C5/](./C5/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c5-evidence.sh` | **PASS** | `20260605T143234Z` · IT **3** · staging image delivery + browser E2E · **production CDN pending** | **② C5 only** |
| **C6** | [C6/](./C6/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c6-evidence.sh` | **PASS** | `20260605T144104Z` · IT **3** · social API + browser E2E | **② C6 only** |
| **C7** | [C7/](./C7/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c7-evidence.sh` | **PASS** | `20260605T144841Z` · `report.json` GO · 22/25 PASS · C1–C6 映射 | **② C7 only** |
| **C8** | [C8/](./C8/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c8-evidence.sh` | **PASS** | `20260605T145342Z` · monitoring smoke · runbook.md | **② C8 only** |
| **C9** | [C9/](./C9/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c9-evidence.sh` | **PASS** | `20260605T151358Z` · shell signoff · visual-review.md · 8 screenshots | **② C9 only** |
| **C10** | [C10/](./C10/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c10-evidence.sh` | **PASS** | `20260605T235244Z` · critical journey · journey-summary.md · 11 screenshots · **video slice skipped (Fly S3)** | **② C10 only** |
| **C11** | [C11/](./C11/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c11-evidence.sh` | **PASS** | `20260606T001039Z` · route-gate **24/24** API · **18/18** browser | **② C11 only** |
| **C12** | [C12/](./C12/) | `STAGING_API_BASE=https://tt-api-staging.fly.dev bash scripts/dev/record-community-c12-evidence.sh` | **PASS** | `20260606T001931Z` · did-interlink-summary · 8 screenshots | **② C12 only** |

**矩阵汇总（Fly staging 轨）：** **12 / 12** 槽 **PASS** · **0 OPEN** · **Community 矩阵 GO**（[Final Attestation](../../../docs/runbook/TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md)）· **≠** Phase ② 宽轨 **GO** · **≠** ③ Production GO

**纪律：** **停止新增 Community 单槽** — 仅 **bugfix** · **证据复跑** · **Closing Gap 宽轨依赖**

**历史说明：** 2026-05-31 证据（含 tunnel）仍存于各目录，**不** 自动等同 Fly 复验 PASS；以各槽 **`STATUS.txt` `last_run`** 为准。

**宽轨收口：** [PHASE2-CLOSING-GAP](../../../docs/runbook/PHASE2-CLOSING-GAP.md) · **`TT_PHASE2_GO_VERDICT: NOT_MET`** → 目标 **`PHASE2_GO_READY`**
