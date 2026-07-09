# Phase② 测试网实施计划与风险清单

**Status:** **PLANNING · Phase① Exit Review 产物**  
**阶段：** **② 测试网 only** — **非** ③ Production GO  
**SSOT：** [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md)

---

## 1 · 实施目标（②）

在 **G-1/G-2 已清** 与 **宽表评审 APPROVED** 前提下，将 **Prepared** 态的 ② 证据/runbook **转化为可重复 staging 回归**，**不** 启动 ③ 主网/真 PSP。

---

## 2 · 建议实施波次（不新增功能面）

| 波次 | 范围 | 入口命令 / 文档 | 出口 |
|------|------|-----------------|------|
| **P2-W0** | G-1/G-2 复验 + transition audit | `bootstrap-phase2-g1-g2.sh` · `run-phase1-to-phase2-transition-audit.sh` | `READY_FOR_C1_C12` |
| **P2-W1** | Closing Gap 回归 | `PHASE2-CLOSING-GAP` · `closing-gap/STATUS.txt` | 宽轨证据 refresh |
| **P2-W2** | Onboarding B 轨 USDC / Stripe test | `smoke-onboarding-testnet.sh` · ONB-P2-* | staging 四方对拍 |
| **P2-W3** | Protocol Sepolia（Owner 授权） | `TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST` | chain_id=11155111 only |
| **P2-W4** | 六大域 UAT 复跑 | Fly staging hosts · UAT scripts | 25/0/0 或登记 delta |

**纪律：** 每波 **exit 0 证据** 落 `evidence/GO_phase2_testnet_20260526/`；**禁止** 用 ① 本地绿冒充 ② GO。

---

## 3 · 风险清单（P0 / P1）

| ID | Sev | 风险 | 缓解 | 责任 |
|----|-----|------|------|------|
| **R2-P0-01** | P0 | staging **密钥混用** ①/③ | [PHASE2-G1](./PHASE2-G1-ENV-ISOLATION-DECISION.md) · 独立 `.env.staging-*` | Owner |
| **R2-P0-02** | P0 | `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 上 staging | G-4 机读 · 非零 `amount_minor` | Eng |
| **R2-P0-03** | P0 | 用 Closing Gap / C7 **窄 GO** 冒充全站 93 GO | [TT-9628 覆盖边界](./TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) | Owner |
| **R2-P1-01** | P1 | Fly staging URL / 隧道 ephemeral | 持久 `tt-api-staging.fly.dev` 对拍 | Ops |
| **R2-P1-02** | P1 | API 长跑 exit 1 | [PHASE2-API-PROCESS-STABILITY](./PHASE2-API-PROCESS-STABILITY.md) | Eng |
| **R2-P1-03** | P1 | Sepolia broadcast 误触主网 | Owner-only · `chain_id=11155111` 硬闸 | Owner |
| **R2-P1-04** | P1 | Stripe webhook 未配置 → paid 不闭环 | ONB-P2-006 staging 绿 | Eng |
| **R2-P1-05** | P1 | HLS/CDN production pending（C4/C5） | 文档标注 **② slot PASS ≠ CDN GO** | Product |

---

## 4 · 不做清单（推迟到 ② 规划后或 ③）

- 新 DOMAIN / 新审计维度 / MASTER 清单扩行  
- 五主路由 UI / layout 变更（[FIVE-MAIN 冻结](../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）  
- ③ Production GO · 主网真链 · `sk_live` · go-live 签字  

---

## 5 · 跟踪

| 字段 | 值 |
|------|-----|
| **Plan version** | v1.0 · 2026-06-13 |
| **Review cadence** | 宽表评审 APPROVED 后每周 Owner 15min |
| **grep** | `TT_PHASE2_TESTNET_PLAN: ACTIVE` |
