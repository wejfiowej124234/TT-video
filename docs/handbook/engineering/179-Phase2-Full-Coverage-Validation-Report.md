# 179 · Phase ② Full-Coverage Validation Report

**Version:** 1.1.0 · **最后更新：** 2026-06-08  
**状态**：**FAIL-CLOSURE · 32/33 GO · S01 待 72h 完成**  
**程序 SSOT**：[178 Blueprint](./178-Phase2-Full-Coverage-Validation-Blueprint.md)  
**纪律**：功能冻结 · strict **GO-only**

> **首次证据包**：`evidence/PHASE2_FULL_COVERAGE/full-20260608T063019Z/`  
> **FAIL-Closure 证据包**：`evidence/PHASE2_FULL_COVERAGE/full-closure-20260608T092200Z/`

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **P2FC strict 策略** | **FAIL** — **32/33 GO · 1 FAIL · 0 PARTIAL · 0 uncovered** |
| **FAIL-Closure Sprint** | **32 项 harness 根因已关闭**（T01 · D01/D04 · W03/W04 · B*/M* · F03） |
| **72h Soak (S01)** | **FAIL · in-flight** — 后台 job 运行中，须 `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json` |
| **Production GO** | **NO**（147/158 未动） |

```text
TT_PHASE2_FULL_COVERAGE: FAIL dir=evidence/PHASE2_FULL_COVERAGE/full-closure-20260608T092200Z failures=1 checks=33
```

> **说明**：orchestrator 曾在 **TRACK-G** 内联跑满 259200s 导致会话阻塞；已修复为 **仅 attestation COMPLETED.json** 或登记 in-flight FAIL（`p2fc-soak-attest.sh`）。**33/33 GO** 须在 soak job 完成后复跑 orchestrator。

---

## 2. 检查项结果（33/33 已覆盖）

| 域 | GO | FAIL |
|----|-----|------|
| 基线 + Business (P00,T01–T04) | 5 | 0 |
| Exceptions (E01–E06) | 6 | 0 |
| Consistency (D01–D04) | 5 | 0 |
| Web3/Community (W01–W04) | 4 | 0 |
| Browser/Mobile (B01–B04,M01–M02) | 6 | 0 |
| Fault deps (F01–F07) | 7 | 0 |
| Soak 72h (S01) | 0 | 1 |
| **合计** | **32** | **1** |

### 2.1 FAIL-Closure harness 修复（无业务功能变更）

| 问题 | 修复 |
|------|------|
| T01 缺 cohort | `p2fc-prep-cohort.sh` + track 前置 |
| D01 跨域/admin 403 | `p2fc-audit-admin-prep.sh`（Ops 角色 · 2FA off · abuse interval） |
| W03 治理探针 403 | 同上 + admin reuse |
| W04 Windows argv 过长 | `feed_has_post` 写 temp 文件 |
| B*/M* 全量 smoke 超时 | `p2fc-staging-smoke.spec.ts` + staging config |
| F03 RECOVERY_TIME_UNKNOWN | `fault_db_latency` 段 + bash loop 语法 |
| S01 orchestrator 阻塞 | `p2fc-soak-attest.sh` · 禁止内联 72h |

---

## 3. 复现

```bash
export DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
# 独立 72h soak（后台）
bash scripts/ops/p2fc-launch-soak-72h.sh
# 全量（soak 未完成时 honest FAIL 32/33）
bash scripts/ops/phase2-full-coverage-validation.sh
# soak 完成后（须存在 evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json）
bash scripts/ops/phase2-full-coverage-validation.sh
```

---

## 4. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-08 | P2FC 首次全量 run **FAIL 17/33 GO** |
| 2026-06-08 | FAIL-Closure Sprint **32/33 GO** · S01 in-flight · orchestrator soak 阻塞已修 |

---

## 5. 发布链路 · Staging-soak（2026-06-08）

| 阶段 | 状态 | 说明 |
|------|------|------|
| **L1 本地 CI 最小集** | **GO** | `ci-local-delivery-minimum.sh` **exit 0**（`cargo test` **1142/1142** · `check-04-routes` **OK** · 04 §3.4 已补 **13** 条 catalog/growth/me/referrals/official/community 路由） |
| **L2 全量 CI** | **PARTIAL** | `run_local_ci.sh` 在 **`npm run check:tokens`** 失败（**34 §5.3** 既有 UI token 债务 · **非** 本次 staging 部署阻塞项） |
| **L2 Fly deploy** | **SKIP（冻结）** | `TESTNET_STAGING_FREEZE` **ACTIVE** · `git_sha=bc5a939…` 与 **HEAD** 一致 · staging **200**（经代理 **`127.0.0.1:15715`** · `fly auth whoami` **OK**） |
| **L3 Staging 回归** | **GO** | `pra-staging-fullchain` **6/6** · `smoke-staging-web` **5/5**（Playwright 经 **`HTTPS_PROXY`** · CORS/首页断言已对齐 harness） |
| **L4 测试网冻结** | **ACTIVE** | `evidence/TESTNET_STAGING_FREEZE/ACTIVE.json` · deploy 脚本 **freeze guard** 已生效 |
| **L5 P2FC-S01 staging-soak** | **in-flight** | `evidence/P2FC_SOAK_72H_STAGING/job-20260608T100511Z` · API=`https://tt-api-staging.fly.dev` · **72h** · **health=200** 轮询中 |

**冻结期禁止：** redeploy · restart · migrations · config changes（override 仅 `TESTNET_FREEZE_OVERRIDE=1`）。

**Owner 决策（soak 窗口 · 2026-06-08）：** 保持 **`TESTNET_STAGING_FREEZE=ACTIVE`**；**不**在 soak 期间清 **`check:tokens`** 既有 UI token 债务；**仅**让 **P2FC-S01 staging-soak** 跑满 **72h**。**`check:tokens` / 34 §5.3** → **另开 Sprint**，须在 soak **COMPLETED** 且**解除冻结**后处理。

**Soak 完成后（自动 / 手动）：** 后台 **`scripts/ops/p2fc-rerun-after-soak.sh`**（watcher **`evidence/P2FC_SOAK_72H_STAGING/rerun-watcher.pid`** · 日志 **`evidence/P2FC_SOAK_72H_STAGING/rerun-watcher.log`**）检测 **`evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json`** 后跑 **post-soak graduation audit**（SSOT：`run-phase2-testnet-post-soak-graduation-closure.sh` · **非** legacy orchestrator）。手动复现：

```bash
P2FC_SOAK_DIR=evidence/P2FC_SOAK_72H_STAGING bash scripts/ops/p2fc-rerun-after-soak.sh
```

**预计 soak 结束（UTC）：** 约 **2026-06-11T10:05Z**（自 **2026-06-08T10:05:11Z** 冻结 + job 启动起 **259200s**）。

> **本地 spine soak（旧）** 已停止；**权威 S01** 以 **staging-soak** 目录 `COMPLETED.json` 为准。

**本机网络（2026-06-08）：** Fly / staging 探测须 **`HTTPS_PROXY=http://127.0.0.1:15715`**（小地球仪）；Fly 账户 **`github3344@hotmail.com`** 已登录。

---

## 6. 并行 UAT · token 审计（soak 窗口 · 只记录）

**SSOT**：[180-Parallel-UAT-During-Soak-Sprint.md](./180-Parallel-UAT-During-Soak-Sprint.md)

| 项 | 政策 |
|----|------|
| **环境** | **local / staging-dev**（`:8080` + `:3012`）— **不** redeploy **staging-soak** |
| **域** | CMS · Official OPS · Growth · 人工审核 + **token debt audit** |
| **产出** | `evidence/PARALLEL_UAT_SOAK_WINDOW/run-*/` · `findings.json` + 截图 |
| **修复** | soak 窗口内 **只记录**；token 与 UI 修复 → **解冻后** 另开 Sprint |

```bash
bash scripts/ops/parallel-uat-during-soak.sh
```
