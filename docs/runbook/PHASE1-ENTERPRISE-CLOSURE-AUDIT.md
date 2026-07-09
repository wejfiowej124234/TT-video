# Phase ① 企业级收口审计 · onboarding 垂直已闭环 / 全仓第一阶段未 100%

**Status:** **① 本地工程封版 CLOSED（2026-06-03）** — onboarding 垂直 Freeze · **② Prepared / Not Started**  
**审计日期：** 2026-05-28  
**类型：** 企业级阶段边界（证据补充 · Phase ① Freeze 允许）  
**阶段：** **① 本地** 收口判定 — **不** 授权 **② 测试网实施** · **不** 等价 **③ Production GO**

**仓库总态：** [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)

**阶段治理（2026-05-28）：** 主轨为 **阶段治理**，非功能扩张。

**封版与合法宣称（强制）：**

- **① G-0 机读留痕已落盘（2026-05-29）：** [`acceptance.latest.log`](../../frontend/evidence/GO_local_phase1/acceptance.latest.log) · `TT_GO_LOCAL_PHASE1: OK`；[`site10.acceptance.latest.log`](../../frontend/evidence/GO_local_phase1/site10.acceptance.latest.log) · `TT_ENTERPRISE_SITE_10_LOCAL: OK` — 维护后复跑 [§3.1](#31-机读证据g-0)。
- **Phase ②：** **严格** **Prepared / Not Started** — **不等同** 已开工、已部署、已验收。
- **② 实施类宣称**（staging 已通、Stripe 真 webhook、测试网 GO、链上 stake 完成、`smoke-onboarding-testnet` 跑绿、`report.json` GO）— **仅当** [G-1/G-2 已清闸](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前) 后**方可**成立；此前**一律不合法**。

**诚实边界（必读）：**

| 可宣称 | **禁止**冒充 |
|--------|----------------|
| ① onboarding / Hub 准入轨 / `fee_schedule_v1` **本地链已闭** | ② staging **`release_gate=GO`** |
| [onboarding-fee-schedule §8.1](../spec/artifacts/onboarding-fee-schedule.v1.md#81-第一阶段--①-本地--全链路2026-05-28) **CLOSED** | ② Stripe **真 webhook** 已验收 |
| `run-go-local-phase1-acceptance.sh` **exit 0** + G-0 双日志已落盘 | ① `internal/webhook` / `local-dev/mark-paid` = ② PSP |
| ② **Prepared**（runbook · smoke · G 闸 · 证据目录） | ISS-007 **`PARTIAL_GO`** = staging 全矩阵 **GO** |

见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) · [TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) · [`evidence/GO_local_r002_verify/README.md`](../../evidence/GO_local_r002_verify/README.md)。

---

## 互指（SSOT）

| 文档 / 证据 | 用途 |
|-------------|------|
| [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) | **① onboarding 垂直** 总验收证据包 |
| [PHASE1-FREEZE-ONBOARDING-HUB](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) | ① Freeze 纪律 |
| [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) | **① Freeze + ② Prepared/Not Started** 仓库总态 |
| [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) | **② 实施** G-0～G-4 入口闸 |
| [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) | ② 缺口全景 |
| [ENTERPRISE-SITE-10-L5-MATRIX](./ENTERPRISE-SITE-10-L5-MATRIX.md) | **① 全站 10** L5 矩阵 · **②③ 公网/生产需求** |
| [PHASE1_5-DATA-LINK-MODEL-GATE](./PHASE1_5-DATA-LINK-MODEL-GATE.md) | 宽 ② 前 **①.5** 隐藏依赖 |
| [onboarding-fee-schedule.v1 §8](../spec/artifacts/onboarding-fee-schedule.v1.md#8-验收分阶①-closed--②③-backlog) | ① CLOSED / ② backlog |

**范围从属：**

```
本审计（① onboarding 垂直收口）
    ⊄ 全仓「第一阶段 100%」（含 ①.5 · 五主路由 · 93 全矩阵 · 收购 §8.2 等）
    ⊄ Phase ② 测试网 GO（窄 / 宽均另闸）
```

---

## 一、审计结论（企业口径）

| 问题 | 答案 |
|------|------|
| **① onboarding 垂直是否可称已闭环？** | **是** — 在 [Freeze](./PHASE1-FREEZE-ONBOARDING-HUB.md) 维护前提下；契约见 [§8.1](../spec/artifacts/onboarding-fee-schedule.v1.md#81-第一阶段--①-本地--全链路2026-05-28) |
| **全仓「第一阶段」是否 100% 完成？** | **① 工程可验项 100% 已闭（2026-06-03）** — 见 [`PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md`](../../frontend/evidence/GO_local_phase1/PHASE1-LOCAL-ENGINEERING-CLOSED-20260603.md) · **L-001/002/004 诚实 mock** · **Owner 签字** [`PHASE1-OWNER-SIGNOFF`](../../frontend/evidence/GO_local_phase1/PHASE1-OWNER-SIGNOFF-SEBASTIAN-WARD-20260603.md)；**仍非** ② staging GO / ③ 生产 / 持牌法务 / **93 全矩阵** |
| **是否符合开启 Phase ② 测试网「实施」？** | **否** — **G-1/G-2 OPEN**；官方态 **[② Prepared / Not Started](./PHASE2-REPOSITORY-STATUS.md)** |
| **② 准备是否就绪？** | **是（文档/脚本层）** — **≠** staging 已跑绿 · **≠** GO |

---

## 二、① onboarding 垂直 · 已闭环项

**链路（无 Stripe / 无链上 PSP · ①）：**

```
GET quote → POST payment-intents → GET entitlements/me (pending)
  → POST internal/webhook 或 local-dev/mark-paid
  → GET entitlements/me (paid) → POST role-confirm
  → GET /me → Hub 阶段（payment_pending → confirm_pending → active）
```

| 域 | ① 状态 | SSOT |
|----|--------|------|
| B 轨 `fee_schedule_v1` | 三方对拍 + PG·IT | [GO_local_onboarding_fee_schedule_v1](../../frontend/evidence/GO_local_onboarding_fee_schedule_v1/README.md) |
| 商家 / 主理人全链烟测 | 脚本已建 | `smoke-onboarding-full-chain-local.sh` 等 |
| Hub / returnUrl | 契约 + L5 冻结 | [ME-IDENTITIES-UI-FREEZE](../../frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) |
| Console L5 | 冻结 | [ME-ONBOARDING-CONSOLE-L5-FREEZE](../../frontend/evidence/GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md) |
| 总验收编排 | 脚本已建 | `run-go-local-phase1-acceptance.sh` |

**成功末行（① · grep 留痕）：** `TT_GO_LOCAL_PHASE1: OK` · `TT_SMOKE_ONBOARDING_FULL_CHAIN: OK (① local · no PSP · no on-chain)`

---

## 三、全仓第一阶段 · 未完成 / 未证明项

### 3.1 机读证据（G-0）· ① 已落盘 · Freeze 维护复跑

| 项 | 状态 | 路径 / 末行 |
|----|------|-------------|
| **Phase1 G-0** | **已落盘** | [`acceptance.latest.log`](../../frontend/evidence/GO_local_phase1/acceptance.latest.log) · `TT_GO_LOCAL_PHASE1: OK` |
| **全站 10 G-0** | **已落盘** | [`site10.acceptance.latest.log`](../../frontend/evidence/GO_local_phase1/site10.acceptance.latest.log) · `TT_ENTERPRISE_SITE_10_LOCAL: OK` |

```bash
# 维护复跑（前置：API :8080 · DATABASE_URL · INTERNAL_API_SECRET；全站 10 另须 P3_CHAIN_OFF=1）
bash scripts/dev/record-go-local-phase1-acceptance-log.sh
bash scripts/dev/record-enterprise-site-10-acceptance-log.sh
```

> **① 垂直已闭** 的**企业可审计**最低集 = 脚本 CLOSED + **双日志**最近一次 **exit 0**。  
> **封版后：** 无「补齐 G-0」义务；仅 **Freeze 维护** 后按需复跑；仓库 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) **稳定态** 直至 G-1/G-2 清零开 ② **实施**。

### 3.2 ①.5 数据建模闸（宽 ② 前置）

[PHASE1_5 §6](./PHASE1_5-DATA-LINK-MODEL-GATE.md#6-出口判据满足后才开-②) **① 工程项已勾（2026-06-03）：**

- [x] 资料 + 质押两表 — **§3 工程矩阵 LOCKED**；**Compliance** Owner 自证（见 **GO_local_phase1** 签字证据）
- [x] 状态机 — **①** PD-007 + admin 路径已登记（**96-17 §0.3 对拍** 另项）
- [x] 本地 seed — `smoke-phase15-identity-demo-local.sh`（S1–S4 烟测编排）
- [x] API·IT 覆盖 S1–S4 — **`phase15_identity_s*`** + **`role_identity_dual_write_*`** · **`run-phase15-s1-s4-it-green.sh`**
- [x] 96-17 §0.3 — **DOC-CLOSED** + **`didRankUtils` 脊签机读**（五签含 **`itinerary`**）

**已勾：** PD-001～009 LOCKED · ER/migration · 双写 · 双写 IT 等（见 PHASE1_5 原文）。

**影响：** [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) 宽 ②（R-003 全矩阵）**不应**以「onboarding ① 已闭」 alone 开工。

### 3.3 平行冻结线（不计入 onboarding ① 包 · 全仓 ① ≠ 100%）

| 垂直 | ① 态 | 说明 |
|------|------|------|
| 五主路由 UI | Freeze · 数据链另轨 | [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) |
| 收购 PD-009 | §8.1 ① CLOSED | **≠** §8.2 staging · **≠** `region_steward` 发布门闸 |
| 商家入驻 / Auth L5 | ① 烟测绿 | ② staging 重复验收另列 |
| 全站 93 / ISS-007 | **非** ① 收口标准 | 窄切片 `PARTIAL_GO` **≠** staging GO |
| 链上 stake 真值 | ② | Anvil 预演 **≠** Sepolia 部署 GO |

---

## 四、是否符合开启 Phase ② 测试网？

**结论：不符合 Phase ②「实施」；符合维持 ② Prepared。**

对照 [PHASE2-START-CHECKLIST · G-0～G-4](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前)：

| 闸 | ①/② 态 | 说明 |
|----|---------|------|
| **G-0** | **① 双日志已落盘** | `acceptance.latest.log` + `site10.acceptance.latest.log`（维护复跑见 §3.1） |
| **G-1** | **① Owner 已签** | [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) · **Sebastian Ward（塞巴斯蒂安·沃德）** 2026-06-03 · ② 机读绿另闸 |
| **G-2** | **OPEN** | 无登记 HTTPS staging API + 测试 PG 生产证据 |
| **G-3** | 满足 | ② ≠ ③ |
| **G-4** | ① 已验 · **② OPEN** | staging 非零 `amount_minor` 未验 |

**机读预检（② 窄 · onboarding）：** `check-phase2-onboarding-staging-ready.sh` — 须 `.env.staging-onboarding.local` 真实填写 + `/health` 200。

**宽 ②：** 另须 `check_r003_staging_env_ready.py` **exit 0** + `run_r003_staging_evidence_chain` → `report.json` **`release_gate=GO`**。

---

## 五、开 Phase ② 还差什么（优先级）

### P0 — 不开工则 ② 无法进行

1. **G-2** — staging HTTPS API + 测试 PostgreSQL + `sqlx migrate` + 与 ① 同版镜像  
2. **G-1** — 环境隔离决策书签字 + `staging-onboarding.env.example` → `.env.staging-onboarding.local`（**禁止** staging `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`）  
3. ~~**G-0 留痕**~~ — **① 已完成**（双日志已落盘；② 开工前仅维护复跑）

### P1 — 窄 ② onboarding 最小可验集

4. Stripe Dashboard test → staging **`payment_intent.succeeded` 真投递**（ONB-P2-003）  
5. `check-phase2-onboarding-staging-ready.sh` **exit 0**  
6. `smoke-onboarding-testnet.sh` **exit 0** + ONB-P2-005 四方对拍  

### P2 — 链上（与 B 轨并行 · 分证据）

7. TT-9630 部署 · registry 填址 · `smoke-steward-stake-testnet-readonly.sh`  

### P3 — 宽 ②

8. PHASE1_5 §6 剩余项  
9. [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) 六轨 + R-003 **GO**  

---

## 六、禁止假完成 · 机读对照表

下列 **① 绿** **不得**在结论句中替代右列 **②/ staging** 目标：

| ① 已验（可引用） | **不能** 冒充 |
|------------------|---------------|
| `POST /api/v1/internal/onboarding/payments/webhook` | Stripe **`payment_intent.succeeded`** 真投递 |
| `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` · `amount_minor=0` | staging **非零** computed amount |
| `matrix_93_*` 合成 `whsec` PG·IT | Dashboard / `stripe listen` 公网入站 |
| `run-go-local-phase1-acceptance.sh`（无 staging 日志） | `smoke-onboarding-testnet.sh` **exit 0** on staging |
| `smoke-steward-stake-anvil.sh` | Sepolia broadcast + registry 地址 |
| `gen-r002-iss007-prereport` 43 锚 PASS | `environment.name=staging` + **`release_gate=GO`** |
| [acquisition §8.1 CLOSED](../spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) | [§8.2](../spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--②-测试网--待验backlog) staging 九项 |
| 本文「① onboarding 垂直已闭」 | 「全仓第一阶段 100%」或「② 已启动/已 GO」 |

---

## 七、维护纪律（与 Freeze 同源）

至 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) 载明的 **G-1/G-2 清零** 前：

- **允许：** onboarding / Hub / `fee_schedule_v1` **bugfix**、证据/runbook、G-0 **维护复跑**  
- **禁止：** 上述三域 **新功能**；无 G 闸的 Stripe 出网 / 合约 broadcast / 宣称 ② GO  

---

## 八、变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：① onboarding 垂直 CLOSED vs 全仓 ① 未 100%；互指 REPOSITORY-STATUS · START-CHECKLIST · GO_local_phase1 |
| 2026-05-28 | 阶段治理跃迁：G-0 封版动作登记 · 其后 Freeze+Prepared 长期稳定 |
| 2026-05-29 | **G-0 双日志已落盘**（Phase1 + 全站 10）· 清理「唯一剩余/建议补齐」表述 · 进入 Freeze 维护收敛 |

---

**End of PHASE1-ENTERPRISE-CLOSURE-AUDIT · ① 垂直收口 · ② 另闸**
