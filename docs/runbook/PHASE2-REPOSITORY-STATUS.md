# 仓库阶段状态 · Phase ① Freeze + Phase ② Prepared / Not Started

**生效：** 2026-06-06（Closing Gap 宽轨复跑 · **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`**）

**一句话：** **① 已闭环并 Freeze**；**② Closing Gap 宽轨 GO Ready** — G1–G6 + G7 PREP_PASS 证据已复跑；**Phase ③ Production Preparation 未启动**。

**阶段治理跃迁（2026-05-28）：** 仓库主轨已从 **「功能开发」** 转为 **「阶段治理」**。**① 封版机读留痕已齐**（见下）；系统长期停留在 **Freeze 维护期**，直至真实 staging 与基础设施成熟（**G-1/G-2**）。

| 态 | 含义 |
|----|------|
| **Freeze** | Phase ① onboarding / Hub / `fee_schedule_v1` — **仅** bugfix · 证据 · 注释 |
| **Prepared** | Phase ② 文档 / smoke / G 闸 / 证据目录 — **可引用 · 非 GO** |
| **Not Started** | ② **实施**（Stripe 出网 · staging 真收单 · 测试网部署 · 链上 stake）— **G-1/G-2 未清** |

**G-0 机读留痕（全量 · ① · 已落盘）：**

| 日志 | 末行 | 复跑 |
|------|------|------|
| [`acceptance.latest.log`](../frontend/evidence/GO_local_phase1/acceptance.latest.log) | **`TT_GO_LOCAL_PHASE1: OK`**（2026-05-31 复跑） | `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` |
| [`site10.acceptance.latest.log`](../frontend/evidence/GO_local_phase1/site10.acceptance.latest.log) | `TT_ENTERPRISE_SITE_10_LOCAL: OK` | `bash scripts/dev/record-enterprise-site-10-acceptance-log.sh` |

**前置：** API `:8080` + `DATABASE_URL`；全站 10 另须 **`P3_CHAIN_OFF=1`**（根 `.env` 为 `0` 时启动 API 前显式 `export P3_CHAIN_OFF=1`）。SSOT：[ENTERPRISE-SITE-10-L5-MATRIX](./ENTERPRISE-SITE-10-L5-MATRIX.md)。

日常 **Freeze 维护** + **② 条件成熟前不开工**。详见 [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md)。

**② 运维 · API 长跑稳定性（非 ① 阻塞）：** [PHASE2-API-PROCESS-STABILITY](./PHASE2-API-PROCESS-STABILITY.md) — `traveltrust-api.exe` 长跑 **exit 1** 单独跟踪。

**Freeze 维护 · 治理技术债（① · 不阻塞 G-0）：**

| 项 | 态 | 说明 |
|----|-----|------|
| `docs/AI任务卡索引.from-stash.md` 机读 | **OPEN** | 主索引 `docs/AI任务卡索引.md` **可通过** `check-ai-task-card-index-overview`；**stash 镜像** 含历史 **A-SEQ / B-STATUS / C-BODY** 债务 — `maybe-run-ai-task-card-index-overview-on-diff.sh` **默认跳过** stash，设 **`AI_TASK_CARD_INDEX_VALIDATE_FROM_STASH=1`** 强制校验 |
| `docs/AI任务卡索引.md` 工作区漂移 | **维护** | 未改索引时 **`CI_LOCAL_SKIP_AI_TASK_CARD_INDEX=1`** 可跳过 ci-local 索引步（见 [CONTRIBUTING](../../CONTRIBUTING.md#pre-push-local)） |
| PHASE1_5 §6 | **部分 OPEN** | 资料/质押签字 · S1–S4 专用 cargo IT · 96-17 §0.3 — 见 [PHASE1_5](./PHASE1_5-DATA-LINK-MODEL-GATE.md#6-出口判据满足后才开-②) |

### 合法宣称闸（强制 · 防假完成）

| 宣称类型 | **合法**条件 |
|----------|----------------|
| ① onboarding 垂直已闭环 / Freeze | 契约 [§8.1](../spec/artifacts/onboarding-fee-schedule.v1.md#81-第一阶段--①-本地--全链路2026-05-28) + `acceptance.latest.log` 含 `TT_GO_LOCAL_PHASE1: OK` |
| ① 全站企业 L5（可选 · 高于 onboarding 切片） | `site10.acceptance.latest.log` 含 `TT_ENTERPRISE_SITE_10_LOCAL: OK` — **① 本地** · **非** ②③ GO |
| ② **Prepared** | 本文「已就绪」表 + runbook/smoke 入库 — **≠** 已开工 |
| ② **实施**（staging · Stripe · 测试网 · 链上 stake · smoke 跑绿 · `release_gate=GO`） | **仅当** [G-1/G-2](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前) **已清闸** + Owner 书面 scope = ② · **禁止**在 **Prepared / Not Started** 态下成立 |

> **Phase ② 严格处于 Prepared / Not Started。** 任何 staging、Stripe、测试网部署或链上实施之**进度/已闭/GO**表述，在 **G-1/G-2 未清** 前**均不合法**（含 PR 描述、汇报、矩阵勾选）。

---

## 状态矩阵（SSOT）

| 维度 | 状态 | 说明 |
|------|------|------|
| **Phase ①** | **Freeze · ACTIVE** | onboarding / Hub 准入轨 / `fee_schedule_v1` — 仅维护型工作 |
| **Phase ②** | **Closing Gap GO Ready** | 社区槽 **12/12 PASS** · [TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION](./TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) · 宽轨 **[PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md)** · **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`**（2026-06-06T10:14Z） |
| **①→② Transition Audit** | **OK · C1–C12 ALL PASS · Closing Gap GO Ready** | … — **Closing Review** [`CLOSING-REVIEW.md`](../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **`TT_PHASE2_GO_VERDICT: PHASE2_GO_READY`** · **≠ Phase ③ Production GO** |
| **G-0** | **① 已闭** | **2026-05-31** `record-go-local-phase1-acceptance-log.sh` → **`TT_GO_LOCAL_PHASE1: OK`** · `recorded=20260531T074458Z`（API **8080** + **`P3_CHAIN_OFF=1`**） |
| **社区 ① 切片** | **100% 已闭** | `run-community-phase1-local-evidence.sh` **OK** · G-08 **`20260531T074458Z`** · narrow **13** · l5-all **42** · PI-1 **8** · vitest **82** · MinIO **3** — [`GO_local_community_phase1_narrow/README.md`](../../frontend/evidence/GO_local_community_phase1_narrow/README.md) |
| **社区 ② C1** | **PASS（② 槽）** | `record-community-c1-seed-evidence.sh` · [`community/C1/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C1/STATUS.txt) · feed **22** · automation_leak **0** · **≠** C4～C12 GO |
| **社区 ② C2** | **PASS（② 槽）** | `record-community-c2-evidence.sh` · [`community/C2/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C2/STATUS.txt) · **≠** C4～C12 GO |
| **社区 ② C3** | **PASS（② 槽）** | `record-community-c3-evidence.sh` · [`community/C3/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C3/STATUS.txt) · moderation IT **2** · staging E2E exit 0 · **≠** C5～C12 GO · **≠** Phase ② GO |
| **社区 ② C4** | **PASS（② 槽 · staging MP4）** | `record-community-c4-evidence.sh` · [`community/C4/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C4/STATUS.txt) · video IT **`matrix_93_d_com_c4_*` 3** · staging playback E2E + Feed **canplay** · **HLS-CDN pending** · **≠** 生产 CDN/HLS GO · **≠** C5～C12 GO |
| **社区 ② C5** | **PASS（② 槽 · staging image delivery）** | `record-community-c5-evidence.sh` · [`community/C5/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C5/STATUS.txt) · image IT **`matrix_93_d_com_c5_*` 3** · staging image E2E + browser load · **production CDN pending** · **≠** Production CDN GO · **≠** C6～C12 GO |
| **社区 ② C6** | **PASS（② 槽 · staging social graph）** | `record-community-c6-evidence.sh` · [`community/C6/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C6/STATUS.txt) · social IT **`matrix_93_d_com_c6_*` 3** · staging social API + browser revisit · **≠** C7～C12 GO · **≠** Phase ② GO |
| **社区 ② C7** | **PASS（② 槽 · 93 matrix staging）** | `record-community-c7-evidence.sh` · [`community/C7/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C7/STATUS.txt) · [`report.json`](../../evidence/GO_phase2_testnet_20260526/community/C7/report.json) **`release_gate=GO`** · C1–C6 mapped · **≠** full-site 93 GO · **≠** C9～C12 GO |
| **社区 ② C8** | **PASS（② 槽 · staging ops runbook）** | `record-community-c8-evidence.sh` · [`community/C8/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C8/STATUS.txt) · [COMMUNITY-STAGING-OPS-RUNBOOK](./COMMUNITY-STAGING-OPS-RUNBOOK.md) · monitoring smoke exit 0 · **≠** C10～C12 GO · **≠** Phase ② GO |
| **社区 ② C9** | **PASS（② 槽 · shell visual sign-off）** | `record-community-c9-evidence.sh` · [`community/C9/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C9/STATUS.txt) · [`visual-review.md`](../../evidence/GO_phase2_testnet_20260526/community/C9/visual-review.md) · 9 screenshots · **≠** C11～C12 GO · **≠** Phase ② GO |
| **社区 ② C10** | **PASS（② 槽 · critical user journey）** | `20260605T235244Z` · `record-community-c10-evidence.sh` · [`TT-PHASE2-C10-STAGING-EVIDENCE`](./TT-PHASE2-C10-STAGING-EVIDENCE.md) · [`community/C10/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C10/STATUS.txt) · [`journey-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C10/journey-summary.md) · 11 screenshots · API + browser E2E exit 0 · **≠** C12 GO · **≠** Phase ② GO |
| **社区 ② C11** | **PASS（② 槽 · 04 route gate staging）** | `20260606T001039Z` · `record-community-c11-evidence.sh` · [`TT-PHASE2-C11-STAGING-EVIDENCE`](./TT-PHASE2-C11-STAGING-EVIDENCE.md) · [`community/C11/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C11/STATUS.txt) · [`route-gate-report.json`](../../evidence/GO_phase2_testnet_20260526/community/C11/route-gate-report.json) · 24 API + 18 browser routes · **≠** Phase ② GO |
| **社区 ② C12** | **PASS（② 槽 · DID/Trust interlink）** | `20260606T001931Z` · `record-community-c12-evidence.sh` · [`TT-PHASE2-C12-STAGING-EVIDENCE`](./TT-PHASE2-C12-STAGING-EVIDENCE.md) · [`community/C12/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/community/C12/STATUS.txt) · [`did-interlink-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C12/did-interlink-summary.md) · 8 screenshots · API/IT + browser E2E exit 0 · **≠** Phase ② GO |
| **G-1** | **机读绿** | [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) **2026-05-31** · `check-phase2-onboarding-staging-ready.sh` **exit 0** |
| **G-2** | **机读绿 · Fly HTTPS** | `tt-api-staging.fly.dev` · `tt-web-staging.fly.dev` · 六大域 UAT **25/0/0**（20260606T082857Z） |
| **G-3** | 文档满足 | ② ≠ ③，见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) |
| **G-4** | **② PASS** | staging 非零 `amount_minor` + Stripe test PI + webhook（20260606T095305Z · [`closing-gap/G4-stripe-g4/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/G4-stripe-g4/)） |
| **Closing Gap G1–G6** | **PASS** | R-003 `release_gate=GO` · onboarding smoke · C-GOV · Sepolia stake · PD-009 staging — [`closing-gap/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt) |

---

## 已就绪（Prepared · 可引用 · 非 GO）

| 类 | 路径 |
|----|------|
| ① 收口审计 | [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) |
| ② 缺口审计 | [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) |
| ② 启动清单 | [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) |
| 宽 ② 验收 | [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) |
| G-1 模板 | [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) |
| ① Freeze | [PHASE1-FREEZE-ONBOARDING-HUB](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) |
| ① 证据 | [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) |
| ② 证据根 | [GO_phase2_testnet_20260526](../../evidence/GO_phase2_testnet_20260526/README.md) |
| 社区 ① 证据 | [GO_local_community_phase1_narrow](../../frontend/evidence/GO_local_community_phase1_narrow/README.md) |
| 社区 ② backlog | [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md)（**COM-②-4～8 OPEN** · 2026-06 ① 审计增量） |
| ①→② 过渡审计 | [PHASE1-TO-PHASE2-TRANSITION-AUDIT](./PHASE1-TO-PHASE2-TRANSITION-AUDIT.md) · [PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md) · [`transition-audit/latest/`](../../evidence/GO_phase2_testnet_20260526/transition-audit/latest/) |
| 社区 ② 证据槽 C1～C12 | [GO_phase2_testnet_20260526/community](../../evidence/GO_phase2_testnet_20260526/community/README.md)（**ALL PASS** · **封版**） |
| **Closing Gap 宽轨** | [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md) · [closing-gap/STATUS.txt](../../evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt) |
| 社区 ③ 证据槽 P3-COM | [GO_production/community](../../evidence/GO_production/community/README.md)（**NOT STARTED** · Production GO 另闸） |
| Sepolia 证据槽 | [GO_phase2_steward_stake_sepolia](../../evidence/GO_phase2_steward_stake_sepolia/README.md) |
| G 闸预检 | `scripts/dev/check-phase2-onboarding-staging-ready.sh` |
| 窄 ② smoke | `scripts/dev/smoke-onboarding-testnet.sh` |
| 四方对拍 | `scripts/dev/assert-onboarding-fee-schedule-quad-party.mjs` |
| staging env 模板 | `scripts/dev/staging-onboarding.env.example` |

**诚实边界：** 上表 **Prepared** **≠** 已在 staging **跑绿** **≠** `release_gate=GO`。

---

## 仍 OPEN（Phase ③ · 非 ② 回退）

| 项 | 解锁条件 |
|----|----------|
| 生产域名 + HTTPS + CDN | Phase ③ · Matrix P1 |
| Stripe live + PSP 生产实例 | Phase ③ · G-1 生产签字 |
| Admin RBAC / SSO / 审计 | Phase ③ · Matrix P8 |
| Production GO 十二项 | [go-live-checklist](../go-live-checklist.md) |
| Mainnet G0–G6+SL | Phase ③ · Checklist §9 |

**② 宽轨已闭：** staging Fly · G4/G5 · R-003 GO · C-GOV · Sepolia stake · PD-009 — 见 [`closing-gap/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt)。

---

## 维护纪律（至 G-1/G-2 清零前）

### 允许

- **Bugfix**（onboarding / Hub / `fee_schedule_v1` 回归；须 ① 绿集 / 烟测）
- **证据 / runbook / 互指 / 模板** 维护（**不** 改产品行为）
- **注释 / i18n 同语义**
- **② Prepared 资产** 修错（脚本、FAILURES.md、env example）— **不** 扩 onboarding 产品面

### 禁止

- **新** onboarding / Hub / `fee_schedule_v1` **功能**（API 字段 · Hub 阶段 · 价目 SKU/规则）
- **Stripe 出网**、**staging 真收单**、**合约 broadcast**、**链上 stake 实施**（无 G-1/G-2）
- 用 ① 合成 webhook / 零金额 / 窄切片 smoke **冒充** ② staging GO
- 在 PR/文档中宣称 **「Phase ② 已启动 / 已 GO」**（除非本轮明确验收 **②** 且附 staging 证据）

**收购 PD-009：** 仍按各自 UI freeze + §8.1；**不** 因本状态自动放开 acquisition **新功能**。

---

## 开 Phase ② **实施** 的唯一定义

同时满足：

1. [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) **签字**
2. **G-2** staging 可达（`check-phase2-onboarding-staging-ready.sh` **exit 0** 或宽 ② `check_r003_staging_env_ready.py` **exit 0**）
3. Owner **书面**：本轮 scope = **② 测试网**（窄或宽），**不** 与 **③** 混句
4. **Freeze 解除** onboarding/Hub/fee_schedule **新功能** 禁令 — **仅** 对书面 scope 内 backlog（如 ONB-P2-*）

在此之前，仓库官方口径保持：**Phase ① Freeze + Phase ② Prepared / Not Started**。

---

## 互指

| 读者 | 入口 |
|------|------|
| 维护者 | 本文 + [PHASE1-FREEZE](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) |
| ① 是否可称已闭 | [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) |
| ② 规划 | [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) |
| ② 缺口全景 | [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) |

---

## 变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：① Freeze + ② Prepared/Not Started 仓库 SSOT |
| 2026-05-28 | 互指 [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) |
| 2026-05-28 | **阶段治理稳定态**：功能开发 → 治理；G-0 封版动作登记 |
| 2026-05-29 | **G-0 双日志已落盘**（`acceptance.latest.log` + `site10.acceptance.latest.log`）· Freeze 维护收敛 |
| 2026-05-29 | **治理技术债表**：AI 索引 stash 镜像机读债务 · PHASE1_5 §6 剩余项 |
| 2026-05-28 | **合法宣称闸**：② 实施类表述须 G-1/G-2 清闸后方成立 |

---

**End of PHASE2-REPOSITORY-STATUS**
