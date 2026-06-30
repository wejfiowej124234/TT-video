# Local First · 本地真源收敛 SSOT

**生效：** 2026-06-30  
**阶段：** ① 本地（唯一开发真源）→ ② 测试网（验证已部署 qualified 基线）→ ③ 生产（另闸）

---

## 0 · 一句话

**本地仓库 = 唯一开发真源。** 先在本地收敛代码、部署配置、脚本与文档，再按 S5 标准流程推测试网；**禁止**用测试网 SHA 回退本地，**禁止**把工作区/证据 gap 误判为 staging runtime 漂移。

---

## 1 · 真源分层

| 层 | 含义 | 当前锚点（示例） |
|----|------|------------------|
| **本地 HEAD** | 开发 + 配置 SSOT | `740233a3`（审计工具 + runbook；含 `6e1fb5ac` build.env governor） |
| **Staging runtime** | 已部署镜像 | `9979b35e`（Local First closure slice） |
| **Graduation / Soak** | 历史冻结证据 | `fc9266ce`（**不覆写**） |
| **Phase③ WIP** | stash / 未跟踪 | **隔离**，不混入 deploy |

**本地领先未部署（LOCAL_AHEAD_UNDEPLOYED）** ≠ **runtime 漂移（DRIFT）**。

---

## 2 · 收敛顺序（持续）

1. **Runtime / 配置** — committed deploy 路径与 `deploy/fly/*`、`build.env.local`、onboarding env 对拍 registry + live `/meta`
2. **脚本 / 审计** — `emit-local-first-alignment-audit.mjs`、`gen-phase2-baseline-consistency-audit.py` 等须区分 WT gap vs runtime
3. **Runbook** — 本文 + [PHASE2-LOCAL-STAGING-PARITY-LOOP](./PHASE2-LOCAL-STAGING-PARITY-LOOP.md)
4. **证据** — Local First sync @ `9979b35e`；Phase③ Entry Review ACTIVE
5. **S5 deploy** — Owner 授权 + `TESTNET_FREEZE_OVERRIDE=1`；**仅**正式 Web/API deploy 时带入本地未部署 commit（当前：`740233a3`…HEAD vs staging `9979b35e`）

---

## 2a · 本地收敛闸（① · 推 staging 前）

```bash
bash scripts/dev/run-local-first-convergence-gate.sh
```

顺序：清 meta 缓存 → `emit-local-first-alignment-audit.mjs` →（可选）`gen-phase2-baseline-consistency-audit.py @ HEAD` → 末行 **`TT_LOCAL_FIRST_RUNTIME_DRIFT: NONE`** 且无 **P0** gap。

---

## 3 · 机读闸

```bash
# ① 本地收敛闸（推 staging 前）
bash scripts/dev/run-local-first-convergence-gate.sh
bash scripts/dev/run-local-first-convergence-gate.sh --with-baseline-audit

# 对齐审计（单独）
rm -f evidence/.tmp-ssot-meta.json evidence/.tmp-ssot-web-meta.json
node scripts/dev/emit-local-first-alignment-audit.mjs

# 多维 baseline 审计（只读 · 默认 @ git HEAD）
python scripts/dev/gen-phase2-baseline-consistency-audit.py
```

**末行：** `TT_LOCAL_FIRST_ALIGNMENT: …` — `NOT_100_PERCENT_ALIGNED` 若仅含 `GAP-PHASE3-WIP`、`GAP-LOCAL-AHEAD-UNDEPLOYED`、`GAP-EVIDENCE`（历史闸）**不得**宣称 staging 漂移。

---

## 4 · 禁止

- 为清 WT gap 而 deploy staging
- 把 Phase③ WIP 合入 Phase② deploy
- 用 staging 覆盖本地 HEAD
- 改写 Soak / Graduation / Final HA @ `fc9266ce` 证据

**诚实边界：** Local First 收敛完成 ≠ Production GO。
