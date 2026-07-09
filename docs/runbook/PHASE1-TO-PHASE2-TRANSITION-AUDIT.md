# Phase ① → Phase ② Transition Audit（SSOT）

**阶段：** 在 **C1～C12 测试网实施** 之前 **必须** 完成的本审计；**不** 替代 **②** 各槽验收，**不** 等于 **staging GO**。

**机读入口：** `bash scripts/dev/run-phase1-to-phase2-transition-audit.sh`  
**证据根：** [`evidence/GO_phase2_testnet_20260526/transition-audit/latest/`](../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/)  
**判定出口：** [PHASE2-READY-REPORT.md](./PHASE2-READY-REPORT.md)（`TT_PHASE2_READY_VERDICT`）

**互指：** [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · [PHASE1-FREEZE-ONBOARDING-HUB](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) · [COMMUNITY-L5-CLOSURE](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) · [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md)

**最近机读（2026-05-31 · `20260531T085525Z`）：** [`transition-audit/latest/run.log`](../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/run.log) — **`TT_PHASE2_TRANSITION_AUDIT: OK`** · **`TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12`**（**T9 PASS** · G-1/G-2 机读绿）。出口：[PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md)。

**复跑：**

```bash
bash scripts/run-check-04-routes.sh
bash scripts/dev/run-phase1-to-phase2-transition-audit.sh
```

---

## 审计纪律

| 规则 | 说明 |
|------|------|
| **不跳阶** | 本审计 **通过** **≠** C1～C12 **已实施**；**`READY_PENDING_STAGING`** **≠** **`READY_FOR_C1_C12`**；仍须 **G-1/G-2** + staging 主机 |
| **不删 ① 代码** | `chain_off` / `seed-test-accounts` / `local_dev` **登记禁配**，staging **关断**，而非从仓库删除 |
| **禁止假完成** | `TT_PHASE2_TRANSITION_AUDIT: OK` **不得** 写入 **② GO** 或 **③ Production GO** |

---

## 检查项矩阵（T1～T9）

| ID | 项 | 命令 / 动作 | 证据路径 | ① 可宣称 | ② 开工键 |
|----|-----|-------------|----------|----------|----------|
| **T1** | Phase ① 社区 + G-08 | `run-community-phase1-local-evidence.sh` + `record-go-local-phase1-acceptance-log.sh` | `GO_local_community_phase1_narrow/*.latest.log` · `acceptance.latest.log` | **① 100%** | **G-0** |
| **T2** | PHASE1-FREEZE 基线 | 文档存在性 | `PHASE1-FREEZE-ONBOARDING-HUB.md` · PHASE2 总态 | **Freeze ACTIVE** | — |
| **T3** | API Inventory / 04 对拍 | `bash scripts/run-check-04-routes.sh` | `transition-audit/latest/check-04-routes.log` | **①** 路由契约 | **C11** 前置 |
| **T4** | DB Migration | `sqlx migrate info` · **G-2 证据** `record-phase2-g2-staging-sqlx-migrate-evidence.sh`（① 基线克隆 `traveltrust_staging` + pending） | `sqlx-migrate-info.log` · [`g2-staging-migrate/latest/`](../../evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/) | **①** 文件齐全 | **G-2** |
| **T5** | 本地专用逻辑清单 | `local-only-anchors.txt` · `traveltrust-env-flags.txt` | 同目录 | **登记** | **G-1/G-4** |
| **T6** | 存储 / 环境隔离 | G-1 模板 · COMMUNITY-MEDIA runbook · staging env example | `PHASE2-G1-ENV-ISOLATION-DECISION.md` | **Prepared** | **G-1** |
| **T7** | Golden Paths | 见下表脚本 | `golden-paths.md`（本目录生成说明） | **① 烟测** | **②** 烟测替换 staging URL |
| **T8** | 社区 SSOT 对齐 | CLOSURE / AUDIT / ROADMAP / go-live | 各文档三阶表 | **①** | — |
| **T9** | Phase ② 开工闸 | `check-phase2-onboarding-staging-ready.sh` | `check-phase2-staging-ready.log` | — | **G-1～G-4** |

---

## T5 · 本地专用逻辑（staging **必须关闭或禁止**）

| 机制 | ① 典型 | staging ② 要求 | 风险若误开 |
|------|--------|------------------|------------|
| `SEED_TEST_ACCOUNTS=1` | 开发默认可开 | **必须 0 / unset** | 测试账号泄露 · 提权 |
| `POST /auth/seed-test-accounts` | ① 烟测 | **403** `seed_test_accounts_disabled` | 伪造用户 |
| `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | ① 零金额 | **禁止**（G-4） | 假收单 |
| `P3_CHAIN_OFF=1` | ① E2E 链下 | staging 按 runbook 显式配置 | 链行为不一致 |
| `TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1` | ① 落盘 | staging 用 S3/presign | 路径混用 |
| MinIO `:19000` / `127.0.0.1` | ① TD-3 证据 | **C4** 用 staging 桶 + CDN | 冒充 ② CDN |

**完整 env 符号表：** `transition-audit/latest/traveltrust-env-flags.txt`（机读 grep，**非** 人工穷举签字）。

---

## T7 · Golden Paths（① · 命令 SSOT）

### Community 全链（①）

| 步 | 命令 | 期望 |
|----|------|------|
| 1 | `bash scripts/evidence/run-community-phase1-local-evidence.sh` | `TT_COMMUNITY_PHASE1_LOCAL_EVIDENCE: OK` |
| 2 | （可选）`bash scripts/dev/smoke-acquisition-pd009-local.sh` | `TT_SMOKE_ACQUISITION_PD009: OK` |

### Provider 全链（①）

| 步 | 命令 | 期望 |
|----|------|------|
| 1 | API `:8080` + `DATABASE_URL` | `/health` 200 |
| 2 | `bash scripts/dev/smoke-provider-onboarding-local.sh` | `TT_SMOKE_PROVIDER_ONBOARDING: OK` |

### 全仓 G-08（①）

| 步 | 命令 | 期望 |
|----|------|------|
| 1 | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` | `TT_GO_LOCAL_PHASE1: OK` |

**② 替换规则：** 同上脚本族，**仅** 将 `API_BASE` / `PLAYWRIGHT_BASE_URL` 换为 **HTTPS staging**；**不得** 沿用 ① 日志宣称 **② GO**。

---

## T3 · API Inventory

**真源：** [04-后端与API.md](../spec/04-后端与API.md) · [14 附录 §2.3](../spec/14-附录-API与ABI对齐检查报告.md) · 机读闸 `scripts/run-check-04-routes.sh`（**T3** 产出 [`check-04-routes.log`](../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/check-04-routes.log)）。

**2026-05-31 解除阻塞：** 补入 12 条 `/api/v1` 社区与头像路由（`conversations/ensure` · `media/capabilities` · `posts/upload-media` · `uploads/community-posts` · media-assets sessions/parts/complete · `me/profile-avatar` presign/commit · `uploads/profile-avatars`）— 与 `community/router.rs` · `me_profile_avatar.rs` 挂载一致；**①** 过渡审计 **T3 PASS**。**C11** staging 对拍仍为 **②** 独立槽。

**错误码规范：** 04 正文 JSON 契约 + `error_code` 字段（示例 `conflict_order_state`）；**②** 不得引入与 04 表冲突的新 code 而不更 spec。

---

## C1～C12 开工条件（本审计之后）

| 末行判定 | 含义 | C1～C12 |
|----------|------|---------|
| `TT_PHASE2_TRANSITION_AUDIT: OK` + `READY_PENDING_STAGING` | 过渡机读通过 · **G-1/G-2** / `.env.staging-onboarding.local` **未齐** | **禁止** 实施/GO |
| `TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12` | **T9** staging 预检绿 + 上表全绿 | 可启动 **C1** |

仅当 [PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md) 末行为 **`READY_FOR_C1_C12`** 时，方可在 [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) 启动 **C1** 实施（逐槽 `run.log`）。当前（`20260531T085525Z`）：**`READY_FOR_C1_C12`**。
