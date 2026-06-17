# TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD

**Status:** **ACTIVE · SSOT**（Phase **② → ③** 唯一升级总标准）  
**Card:** `TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD`  
**阶段口径:** **① 本地 → ② 测试网 → ③ 公网/生产**（须顺序 · **禁止跳阶**）  
**生效:** 2026-06-14

**末行 grep（审计轨）:** `TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_AUDIT: PASS`  
**末行 grep（毕业签字）:** `TT_TESTNET_GRADUATION: CLOSED`

> **诚实边界：** 本标准 **仅** 约束 **② Testnet 毕业 → 申请 ③ 宽表评审**。**≠** `TT_TESTNET_PERFECT_VALIDATION_GO` 自动等价 **③ Production GO** · **≠** ISS-007 全站 93 矩阵 · **≠** 主网真链 / `sk_live` / `go-live`。

---

## 0 · 与既有 SSOT 关系（不替代 · 收敛上位）

| 文档 / 键 | 角色 |
|-----------|------|
| **[TESTNET-PERFECT-VALIDATION-REPORT](./TESTNET-PERFECT-VALIDATION-REPORT.md)** | Burn-down **P0/P1** 登记 · Readiness 计分 · `TT_TESTNET_PERFECT_VALIDATION_GO` |
| **[PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)** | 阶段治理 · G-0～G-4 · Closing Gap 宽轨 |
| **[PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md)** | ② 开工闸（G-1/G-2） |
| **本文** | **② 毕业多维矩阵 + 签字闸** → 方可宣称 `TT_TESTNET_GRADUATION: CLOSED` 并申请 **③** 入口评审 |

**禁止假完成：** 窄切片 `release_gate=GO` · ① 本地绿 · CI 顶栏 · mock-pay 走廊 **不得** 单独冒充本标准 **毕业签字**。

---

## 1 · 唯一毕业退出（写死）

### 1.1 必要条件（AND）

| # | 闸 | 目标 |
|---|-----|------|
| G-01 | Open Testnet **P0** | **0** |
| G-02 | Open Testnet **P1** | **0** |
| G-03 | **TT_PHASE2_READINESS** | **100 / 100** |
| G-04 | **TT_TESTNET_PERFECT_VALIDATION_GO** | **GO** |
| G-05 | **毕业矩阵** `blocking_open` | **0** |
| G-06 | **P2FC 72h soak** | `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json` 存在 |
| G-07 | **Indexer 深账** | `reconcile_compound_pass=true` · `missing_projection=0`（staging · TN-P1-010） |
| G-08 | **Deep · Enterprise · Operational · Governance · Full Surface** | **`missing_coverage=0`** · **`evidence_gap=0`** · **D1–D24 全 PASS** · **`surface_coverage_pct=100`** · **`untested_ui_element=0`** · **`untested_user_action=0`**（§9–§13） |
| G-09 | **Owner 签字** | `evidence/GO_phase2_testnet_graduation/<stamp>/OWNER-SIGNOFF.md` |

**单人维护者（Sebastian Ward）：** Product / Engineering / Compliance / Operations **四帽合一**自签 — 模板 [PHASE2-TESTNET-OWNER-SIGNOFF-SOLO](./evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md) · 索引 [SOLO-MAINTAINER-SIGNATURE-INDEX](../../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md)。**自签仅当 G-01～G-08 机读全 AND** — **不**因单人开发降低 D1–D24 / surface 100% 标准。

**未满足 G-01～G-09 前：** 仅可输出 `TT_TESTNET_GRADUATION: OPEN` 或 `PARTIAL` — **禁止** `CLOSED`。

**Owner Sign-off 顺序（写死）：** 先 **G-01～G-08** 全 AND（含 **§9–§13** 深度边角）→ 再 **G-09** 单人 Owner 自签 → 方可 `TT_TESTNET_GRADUATION: CLOSED`。

### 1.2 裁决键

| 键 | 含义 |
|----|------|
| `TT_TESTNET_PERFECT_VALIDATION_GO` | Burn-down 窄轨 **Perfect**（[§0.1](./TESTNET-PERFECT-VALIDATION-REPORT.md#01--phase-②-burn-down-纪律active--2026-06-14-起)） |
| **`TT_TESTNET_GRADUATION: CLOSED`** | **本标准** G×A 矩阵 + **§9 Deep Closure** + **G-09** 签字 **全部满足** → **② 正式毕业** |
| `TT_PHASE3_ENTRY_REVIEW: ELIGIBLE` | ② 毕业后 **方可** 启动 ③ 公网/生产宽表评审（**另闸** · 见根 README · `go-live-checklist`） |

---

## 2 · 审计维度（A1–A9 · 固定 · 禁止扩面）

| ID | 维度 | 验收要点 |
|----|------|----------|
| **A1** | Happy Path | 主链 smoke / `record-*-staging-evidence.sh` **exit 0** + 末行 PASS |
| **A2** | 异常 / 降级 | 4xx/5xx 边界 · reorg hint · RPC 降级 · 门闸拒绝（非 500 泄漏） |
| **A3** | 权限 / RBAC | 六角色 × hat · deny 探针 · Admin 垂直 ADM-U01/U02 |
| **A4** | 状态迁移 | 订单 / escrow / 收购 / stake 状态机与 DB/API 一致 |
| **A5** | 恢复链路 | indexer replay · reconcile · reorg recovery runbook 可执行 |
| **A6** | 长周期 Soak | P2FC **72h** wall-clock · `COMPLETED.json` |
| **A7** | Indexer / Reconcile | tick → replay → reconcile · `compound_pass` · FeeRouter 观测 |
| **A8** | 真人 / 浏览器 | Playwright staging UAT · 六域 UAT · 关键旅程截图 |
| **A9** | 证据链 | artifact 目录 · `report.json` · manifest · grep PASS 行 |

---

## 3 · 业务域矩阵（G01–G12 · 测试网期新增/验证面）

| ID | 域 | 主要证据 / 脚本 |
|----|-----|-----------------|
| **G01** | Admin · RBAC 六控制台 | `record-adm-u01-staging-evidence.sh` · ADM-U02 |
| **G02** | 六角色 HAT 矩阵 | `record-tn-p1-007-008-hat-staging-evidence.sh` |
| **G03** | 多身份 / 四槽 | TN-P1-007/008 · `/me/identities` |
| **G04** | 订单走廊 | `smoke-phase2-testnet-execution-sprint.sh` S01–S10 |
| **G05** | 商家入驻 | `record-tn-p1-002-provider-onboarding-staging-evidence.sh` |
| **G06** | Escrow · WEB3-P2-003 | `record-tn-p1-006-escrow-staging-evidence.sh` |
| **G07** | 收购 PD-009 | `record-tn-p1-003-acquisition-staging-evidence.sh` |
| **G08** | 主理人 Stake / Sepolia | `record-tn-p1-004-steward-stake-staging-evidence.sh` |
| **G09** | 治理 / 提案 / 参数 | Closing Gap C-GOV · B-417 轨（**live execute 另闸**） |
| **G10** | 社区 C1–C12 | `record-community-c*-evidence.sh` · [C1–C12 attestation](./TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) |
| **G11** | Stripe PSP · webhook | `smoke-onboarding-testnet.sh` · TN-P1-005 |
| **G12** | Indexer · Reconcile · FeeRouter | `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` |

矩阵机读真源：`evidence/GO_phase2_testnet_graduation/<stamp>/graduation-matrix.v1.json`

---

## 4 · 单元格裁决（KEEP 语义）

| 状态 | 含义 | 计入 `blocking_open` |
|------|------|----------------------|
| **PASS** | 当前 **②** 可验证目标已闭 · 证据在册 | 否 |
| **PARTIAL** | 主链 PASS · 诚实边界项留 **③** 或依赖项 OPEN | **是**（若 P1 级） |
| **OPEN** | 未跑 / 失败 / 证据缺失 | **是** |
| **DEFER_③** | 明确仅 **③** 验收（主网 USDC · sk_live · 生产 CDN） | 否（须矩阵注明） |

---

## 5 · 执行入口（唯一编排）

```bash
# 全量审计 + 毕业矩阵（诚实 NO-GO 安全）
bash scripts/dev/run-phase2-testnet-closure-governance-audit.sh

# 仅矩阵再生成（已有探针 JSON）
bash scripts/dev/run-phase2-testnet-closure-governance-audit.sh --matrix-only
```

**产出目录：** `evidence/GO_phase2_testnet_graduation/<UTC-stamp>/`

| 文件 | 内容 |
|------|------|
| `graduation-matrix.v1.json` | G×A 全矩阵 + gates + **deep_closure** + **surface-coverage-matrix** |
| `probe-deep-closure.json` | **§9** D1–D7 深度探针 · `missing_coverage` · `evidence_gap` |
| `GRADUATION-AUDIT-REPORT.md` | 人读摘要 |
| `probe-*.json` | staging live 探针 |
| `STATUS.txt` | PASS / PARTIAL / NO-GO |

**合并 / 汇报前：** 审计脚本 **exit 0** 且末行 `TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_AUDIT: PASS` **不**等价毕业 — 须 **§1.1 G-01～G-08** 全 AND + **G-09** Owner 签字。

**Deep Closure 探针（§9 顺序 · 禁止跳步）：**

```bash
node scripts/dev/probe-phase2-testnet-deep-closure.mjs --evid-dir evidence/GO_phase2_testnet_graduation/<stamp>/
```

---

## 6 · Burn-down 映射（TN-P1 → 矩阵）

| TN-P1 | 矩阵域 | 关闭后解锁 |
|-------|--------|------------|
| TN-P1-009 | G04/G06/G11 **A6** | P2FC soak COMPLETED |
| TN-P1-010 | **G12** **A5/A7** | Indexer compound clean |
| TN-P1-004 partial | **G08** **A1** | live Sepolia stake → **DEFER_③** 或 TTG 重播后 PASS |

当前 Open P1 **未清零前**：`TT_TESTNET_GRADUATION` **必须** 为 **OPEN**。

---

## 7 · ③ 宽表评审（毕业后再启）

| 项 | 说明 |
|----|------|
| 触发 | **仅当** `TT_TESTNET_GRADUATION: CLOSED` |
| 入口 | [go-live-checklist · GO Decision](../../go-live-checklist.md#go-decision-entry-point) · **G-1/G-2** ③ 增量 |
| 禁止 | 用 **②** 毕业矩阵 **直接** 宣称 Production GO |

---

## 8 · 一句话

**② 毕业 = G01–G12 × A1–A9 矩阵 `blocking_open=0` + **§9–§13** 全链路 `missing_coverage=0` · `evidence_gap=0` · **`surface_coverage_pct=100`** · **`untested_ui_element=0`** · **`untested_user_action=0`**（**D1–D24 全 PASS**）+ §1.1 **G-01～G-08** + **G-09** Owner 签字 → `TT_TESTNET_GRADUATION: CLOSED`；此前 Burn-down 以 [TESTNET-PERFECT-VALIDATION-REPORT](./TESTNET-PERFECT-VALIDATION-REPORT.md) 为执行轨，**不跳阶**。

---

## 9 · Deep Closure Addendum（深度边角 · 2026-06-14 追加）

**地位：** 本文 **§1** 上位标准的 **强制附录**；**不**替代 A1–A9 / G01–G12，**补齐** Happy Path 之外的边角深度验证。

**执行顺序（写死 · 禁止跳步）：**

| 序 | ID | 轨道 | 验收要点 | 主要证据 / 探针 |
|----|-----|------|----------|-----------------|
| 1 | **D1** | 新增功能反查 | 测试网期 **已宣称 CLOSED** 的 TN-P1 / ADM 项 **逐条** 反查 evidence + PASS 行 + `report.json`；Open P1 **不得**冒充 PASS | Burn-down §8 · `probe-deep-closure.json` **D1** |
| 2 | **D2** | 六角色负向矩阵 | SuperAdmin…Auditor **deny** 探针 · HAT cross-role **403/401** · 非仅 happy allow | ADM-U01 `matrix-api-results.json` · TN-P1-007/008 hat-matrix-probe |
| 3 | **D3** | 多身份污染测试 | 四槽 / hat 切换 **不** 交叉泄漏订单 · listing · trust · session | `multi-identity-smoke.log` · hat-matrix-probe |
| 4 | **D4** | 五方对账 | **DB**（projection）· **API**（/meta · orders）· **UI**（human sprint）· **链上**（Escrow tx）· **Indexer**（reconcile compound）一致 | live `probe-indexer-reconcile.json` · TN-P1-006 · human acceptance |
| 5 | **D5** | 恢复 / 重放 / 幂等 / 安全滥用 | `indexer-replay` 可执行 · internal **无 secret 拒绝** · tick 幂等（同窗不重复投影） | live replay POST · abuse probe |
| 6 | **D6** | 长尾页面真人抽检 | 非五主 / 非 burn-down 主链的 staging 页面 **抽样** 浏览器 PASS | `phase2-human-acceptance-staging-sprint` · `GO_phase2_staging_ui_real_user` · Playwright hat |
| 7 | **D7** | 证据完整性审计 | 各 CLOSED 项 **run log + report.json + manifest** 齐 · stamp 可追溯 | `testnet-perfect-validation-manifest.v1.json` |

### 9.1 深度毕业键（AND · 进入 G-09 前）

| 键 | 目标 |
|----|------|
| `blocking_open` | **0**（G×A 矩阵 · §4） |
| **`missing_coverage`** | **0**（**D1–D24** 每条 **PASS**） |
| **`evidence_gap`** | **0**（**D1–D24** 全部 `gaps[]` 合计 **0**） |
| **`surface_coverage_pct`** | **100**（`registry/phase2-testnet-surface-coverage-registry.v1.yaml` 逐项 PASS） |
| **`untested_ui_element`** | **0** |
| **`untested_user_action`** | **0** |

**仅当** `blocking_open=0` **且** `missing_coverage=0` **且** `evidence_gap=0` **且** G-01～G-07 满足 → **方可** 撰写 **G-09** `OWNER-SIGNOFF.md` → `TT_TESTNET_GRADUATION: CLOSED`。

**禁止：** 仅跑 G×A 矩阵、未跑 **§9–§11** 深度/企业/运营就绪轨 → **不得** Owner 签字。

### 9.2 机读产出

| 文件 | 末行 grep |
|------|-----------|
| `probe-deep-closure.json` | `missing_coverage` · `evidence_gap` · `execution_order: D1→D24` |
| `surface-coverage-matrix.v1.json` | `surface_coverage_pct` · `untested_ui_element` · `untested_user_action` |
| `graduation-matrix.v1.json` | `deep_closure.summary` · `enterprise_closure` · `operational_readiness` |
| `GRADUATION-AUDIT-REPORT.md` | Deep + Enterprise + Operational 摘要表 |

---

## 10 · Enterprise Closure Addendum（企业级深度 · 2026-06-14 追加）

**地位：** **§9** 的 **强制续篇**；在 D1–D7 边角验证之上，补齐 **多身份组合爆炸 · 全生命周期 · 运营后台 · 财务一致性 · 异常恢复 · i18n · 安全重放 · 运营日模拟** 等企业级覆盖。**须与 §11 合并** 方可达 **全链路企业级闭环**。

**执行顺序（写死 · 接 §9 · 禁止跳步）：**

| 序 | ID | 轨道 | 验收要点 | 主要证据 / 探针 |
|----|-----|------|----------|-----------------|
| 8 | **D8** | 多身份角色组合爆炸矩阵 | 六角色 × HAT × Admin 控制台 **组合 deny/allow** · 非单角色 happy path | TN-P1-007/008 **34+** API 探针 · ADM-U01 **102+** 矩阵 |
| 9 | **D9** | 全生命周期状态迁移 | 订单 / Escrow / 收购 / stake **状态机** 全链迁移与 DB/API/链上一致 | TN-P1-003 · TN-P1-006 · P2Exec S01–S10 |
| 10 | **D10** | CMS / Growth / Governance / Admin 运营后台 | 内容 / 增长 / 官方 / 国家市场 **Admin OPS** 读面 + 治理参数/提案壳 | `staging-api-parity-probe.py` · ADM-U01/U02 · `smoke-governance-*-l5` |
| 11 | **D11** | 订单 / Escrow / FeeRouter / PSP 财务一致性 | Stripe test PSP · Escrow fund/release · FeeRouter 观测 · projection 对账 | TN-P1-005 · TN-P1-006 · TN-P1-010 reconcile |
| 12 | **D12** | 异常运营恢复链路 | soak 中断恢复 · indexer replay/reconcile · reorg runbook 可执行 | TN-P1-009 · TN-P1-010 · D5 replay |
| 13 | **D13** | 国际化边界 | `Accept-Language` / locale 降级 · 关键 API 错误态 **非 500 泄漏** · i18n 烟测 | `test:i18n:ci` 证据 · staging FE locale 抽测 |
| 14 | **D14** | 安全攻击与重放防护 | internal 无凭据拒绝 · rate limit / idempotency 可观测 · 重放/双 POST 不重复写 | `/meta` rate_limits · idempotency_cache · abuse 探针 |
| 15 | **D15** | 真实运营日模拟 | **wall-clock** 多域串联：登录→交易→治理→Admin→对账 **单日剧本** | P2FC 72h · `smoke-phase2-testnet-execution-sprint` · human acceptance |

### 10.1 企业级毕业键（与 §9.1 合并 AND）

| 键 | 目标 |
|----|------|
| `enterprise_coverage_pct` | **100**（**D8–D15** 全 **PASS**；机读 = `8/8`） |
| `operational_readiness_pct` | **100**（**D16–D20** 全 **PASS**；机读 = `5/5`） |
| `missing_coverage` | **0**（**D1–D20** 合计） |
| `evidence_gap` | **0** |

**诚实边界：** ② staging **允许** mock-pay / MockERC20 / FeeRouter distribute 未跑 — 须在矩阵 **note** 标明 · **不得** 用 **DEFER_③** 冒充 D11 **PASS**（D11 ② 轨验 **test PSP + 链上 leg + reconcile 观测** 即可）。

### 10.2 执行入口（接 §5）

```bash
# 全量含 D1→D20（内嵌于 governance audit）
bash scripts/dev/run-phase2-testnet-closure-governance-audit.sh

# 仅深度/企业/运营探针
node scripts/dev/probe-phase2-testnet-deep-closure.mjs --evid-dir evidence/GO_phase2_testnet_graduation/<stamp>/
```

---

## 11 · Operational Readiness Addendum（运营就绪 · 2026-06-14 追加）

**地位：** **§10** 的 **强制续篇**；补齐 **Runbook · DR/故障演练 · 监控告警 · 发布/回滚/热修 · Production Readiness Review** 五维，使 **功能 · 权限 · 数据 · 财务 · 安全 · 运营 · 恢复 · 监控 · 发布** 全链路达到 **② 可毕业** 的企业级闭环。**D1–D20 全 PASS** + §1.1 全闸 → 方可 G-09 签字。

**执行顺序（写死 · 接 §10 · 禁止跳步）：**

| 序 | ID | 轨道 | 验收要点 | 主要证据 / 探针 |
|----|-----|------|----------|-----------------|
| 16 | **D16** | Runbook 完整性审计 | 毕业/开工/go-live/infra/testnet burn-down **SSOT 齐** · `docs/runbook` 索引可解析 · 关键脚本可执行 | `docs/runbook/README.md` · `go-live-checklist` · `PHASE2-START-CHECKLIST` · `TT-9618` |
| 17 | **D17** | 灾难恢复与故障演练 | staging **rollback + db-restore** drill 证据 · `disaster_recovery_matrix.json` · reorg/indexer 恢复 runbook | `run-phase3-fly-release-rollback-drill.sh` · `PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT` §4 |
| 18 | **D18** | 监控与告警覆盖率 | `/health` · `/meta` indexer/evidence/pause · Admin observability 读面 · 告警 incident 路由 | `probe-health.json` · `probe-meta.json` · `TT-B480` · Admin `/observability` |
| 19 | **D19** | 发布 / 回滚 / 热修变更管理 | Fly deploy 脚本 · **TESTNET_FREEZE_OVERRIDE** 纪律 · rollback drill · `fly.toml` 模板 | `phase2-staging-fly-deploy-and-sync.sh` · `deploy/fly/*` |
| 20 | **D20** | Production Readiness Review 多维签审 | 功能/权限/数据/财务/安全/运营/恢复/监控/发布 **九维** 机读 · **`TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED`**（非仅 HOLD） | human acceptance sprint · `PRODUCTION-GO-DECISION-PACKAGE` · infra audit JSON |

### 11.1 运营就绪毕业键（与 §9.1 · §10.1 合并 AND）

| 键 | 目标 |
|----|------|
| **`operational_readiness_pct`** | **100**（**D16–D20** 全 **PASS**） |
| **`full_closure_coverage_pct`** | **100**（**D1–D24** 全 **PASS** = `24/24`） |
| `missing_coverage` | **0** |
| `evidence_gap` | **0** |

**仅当** `blocking_open=0` **且** `missing_coverage=0` **且** `evidence_gap=0` **且** `full_closure_coverage_pct=100` **且** G-01～G-07 满足 → **方可** **G-09** `OWNER-SIGNOFF.md` → `TT_TESTNET_GRADUATION: CLOSED`。

**诚实边界：** D20 **`REQUESTED`** = ② 毕业后 **申请** ③ 宽表评审之 **程序性就绪** — **≠** ③ Production GO 已签 · **≠** `go-live-checklist` 全勾。

---

## 12 · Governance Closure Addendum（治理收口 · 2026-06-14 追加）

**地位：** **§11** 的 **强制续篇**；补齐 **提案 · 投票 · 委托 · 参数 · 质押 · 主理人走廊** 治理域深度验证。

| 序 | ID | 轨道 | 验收要点 | 主要证据 |
|----|-----|------|----------|----------|
| 21 | **D21** | Governance 提案/投票/委托链 | 列表/创建/详情 · 钱包 propose/vote · delegate | `smoke-governance-proposals-l5` · TN-P1-004 |
| 22 | **D22** | Governance 参数/质押/链上观测 | `/governance/params` · `/meta` governor · Timelock 只读 | `smoke-governance-params-l5` · Sepolia spine |
| 23 | **D23** | Governance 权限边界与主理人走廊 | steward `?from=steward_workbench` · hat 切换 · 非 admin 越权 deny | `smoke-steward-workbench-l5` · TN-P1-007/008 |

### 12.1 治理毕业键

| 键 | 目标 |
|----|------|
| **`governance_closure_pct`** | **100**（**D21–D23** 全 **PASS**） |

---

## 13 · Full Surface Coverage Addendum（全表面覆盖 · 2026-06-14 追加）

**地位：** **§12** 的 **强制终章**；对 **六角色** 全部可交互表面（页面 · 组件 · 按钮 · 表单 · Drawer · Modal · 搜索筛选 · 权限入口 · 钱包 · 治理 · Escrow · 订单 · 社区 · CMS · Growth · Settings）进行 **逐项登记 · 异常路径 · 真人验收**。

| 序 | ID | 轨道 | 验收要点 |
|----|-----|------|----------|
| 24 | **D24** | Full Surface Coverage Audit | `surface_coverage_pct=100` · `untested_ui_element=0` · `untested_user_action=0` |

**登记 SSOT：** [`registry/phase2-testnet-surface-coverage-registry.v1.yaml`](../../registry/phase2-testnet-surface-coverage-registry.v1.yaml)

**矩阵生成：**

```bash
node scripts/dev/gen-phase2-testnet-surface-coverage-matrix.mjs --evid-dir evidence/GO_phase2_testnet_graduation/<stamp>/
```

**产出：** `surface-coverage-matrix.v1.json`（每表面 `status` · `evidence_source` · `exception_path_verified` · `human_uat`）

### 13.1 全表面毕业键（与 §9.1 · §10.1 · §12.1 合并 AND）

| 键 | 目标 |
|----|------|
| **`surface_coverage_pct`** | **100** |
| **`untested_ui_element`** | **0** |
| **`untested_user_action`** | **0** |
| **`full_closure_coverage_pct`** | **100**（**D1–D24**） |

**仅当** §1.1 **G-01～G-08** 全 AND（含本节三键）→ **方可** **G-09** Owner 签字 → `TT_TESTNET_GRADUATION: CLOSED`。

**诚实边界：** 本注册表 **②** 轨覆盖 staging 可验证表面 — **≠** 96-20 全站每弹窗穷举 · **≠** ISS-007 93 矩阵 · 未登记表面 **不得** 冒充 PASS。

---

## 14 · L5 综合评分 10/10 硬判定（写死 · 禁止相对评分）

**地位：** **§1.1 G-01～G-09** 与 **§9–§13 D1–D24** 的 **唯一 L5 满分出口**；**禁止**相对评分 · 加权估算 · 主链路通过率 · Readiness 97 · 窄切片 `release_gate=GO` · G×A 部分 PASS **替代**满分判定。

### 14.1 满分必要条件（全部 AND · 缺一即 **不得** 10/10）

| # | 键 / 条件 | 目标 |
|---|-----------|------|
| 1 | **G-01～G-09** | **全部满足**（含 **G-09** Owner Sign-off 完成） |
| 2 | **D1–D24** | **全部 PASS**（`missing_coverage=0` · `evidence_gap=0`） |
| 3 | **Open Testnet P0 / P1** | **0 / 0** |
| 4 | **`blocking_open`** | **0** |
| 5 | **`surface_coverage_pct`** | **100** |
| 6 | **`full_closure_coverage_pct`** | **100** |
| 7 | **`reconcile_compound_pass`** | **true** |
| 8 | **`missing_projection`** | **0** |
| 9 | **`P2FC_SOAK_72H_STAGING`** | **`COMPLETED.json` 存在** |
| 10 | **`TT_TESTNET_PERFECT_VALIDATION_GO`** | **GO** |
| 11 | **`TT_TESTNET_GRADUATION`** | **CLOSED** |
| 12 | **Owner Sign-off** | `evidence/GO_phase2_testnet_graduation/<stamp>/OWNER-SIGNOFF.md` 已签署 |

### 14.2 机读裁决键

| 键 | 含义 |
|----|------|
| **`TT_PHASE2_L5_COMPOSITE_SCORE: 10`** | **仅当** §14.1 **全 AND** 时合法 |
| **`TT_PHASE2_L5_COMPOSITE_SCORE: NOT_ELIGIBLE`** | 任一未满足 — **禁止**对外宣称 10/10 |

**产出：** `graduation-matrix.v1.json` → `l5_composite_score` · `l5_composite_score_eligible` · `l5_composite_score_forbidden_reasons[]`

**禁止：** 审计报告 · Owner 签字 · AI 汇报中的「L5 ≈ 6.x/10」**不得**在 §14.1 未全 AND 时改写为 10/10。

### 14.3 Reliability Closure Mode（SUPERSEDED · 不扩维）

**毕业序 SSOT：** `bash scripts/dev/run-phase2-graduation-closure-program.sh`

**遗留入口（顺序已修正 · 仅兼容）：** `bash scripts/dev/run-reliability-closure-mode.sh`

**唯一目标：** 证明系统**长期可靠** — **禁止**新增审计维度 / 治理框架。**仅**关闭：

1. **TN-P1-009** — 72h Soak/监控告警/恢复闭环（**先于** TN-P1-010）  
2. **TN-P1-010** — Indexer/Reconcile/FeeRouter/五方对账（**须** post-soak @ freeze SHA · `tn-p1-010-graduation-gate.mjs`）  
3. **D6** — 52 表面 `human_uat=PASS` · `exception_path_verified=PASS`

**硬闸末行（全 AND 方可 L5=10）：** `reconcile_compound_pass=true` · `missing_projection=0` · `P2FC_SOAK_72H_STAGING=COMPLETED` · `human_uat`/`exception_path` **52/52 PASS** · `TT_TESTNET_GRADUATION:CLOSED` · `TT_PHASE2_L5_COMPOSITE_SCORE:10` · G-09 签字。

TT_PHASE2_TESTNET_CLOSURE_GOVERNANCE_STANDARD: ACTIVE · DEEP_v2 · ENTERPRISE_v1 · OPERATIONAL_v1 · GOVERNANCE_v1 · FULL_SURFACE_v1 · **L5_SCORE_v1** · **RELIABILITY_CLOSURE_MODE**
