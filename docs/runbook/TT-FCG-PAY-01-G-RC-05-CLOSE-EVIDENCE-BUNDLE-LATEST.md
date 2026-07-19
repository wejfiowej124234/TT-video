# TT · FCG-PAY-01 · G-RC-05 Close Evidence Bundle（Staged · Not Closed）

**Machine:** `TT_FCG_PAY01_G_RC05_CLOSE_EVIDENCE_BUNDLE`  
**Status:** **STAGED_WAIT_WINDOW_BEFORE_ETA** · `2026-07-19`  
**机读：** [`registry/psg-fcg-pay01-g-rc05-close-evidence-bundle.v1.yaml`](../../registry/psg-fcg-pay01-g-rc05-close-evidence-bundle.v1.yaml)  
**Bundle：** [`g-rc-05-close-bundle/`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/g-rc-05-close-bundle/)  
**本轮会话：** [`G-RC-CLOSURE-CONVERGENCE-SESSION-LATEST.json`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/g-rc-05-close-bundle/G-RC-CLOSURE-CONVERGENCE-SESSION-LATEST.json)

```text
PREAUTH_ONLY · Protocol v2 Plan 不变
阶段:     WAIT_WINDOW · before_eta=true · Execute 禁止
G-RC-05:  REFUSE（条件未齐）· 未 CLOSED
禁止:     Step 3 · Money-Path 编码 · v2 部署 · ACTIVE 切换 · PASS/GO
```

---

## 0 · 本轮按序执行结果（诚实）

| # | 动作 | 结果 |
|--:|------|------|
| 1 | 等 ETA → Execute → Receipt | **STOPPED_BEFORE_ETA** · ETA `2026-07-20T11:37:37Z` · `execute_allowed_now=false` · **未** Execute |
| 2 | 修 I-01/F-01/F-02/F-03 | **未清零** · 仍 4× OWNER_REQUIRED |
| 3 | Playwright Real Wallet Real TX | **仍 OPEN** · WC `KEY_ABSENT` |
| 4 | Product Acceptance | **仍 OPEN**（等 Function+UI） |
| 5 | 重跑 G-RC-05 Close | **REFUSE_PRECONDITIONS_NOT_MET** · `rollback_to=S1_EXECUTE` |

### Step 2 细项

| Item | 本轮 | 说明 |
|------|------|------|
| **I-01** | 已试跑 → **FAIL** | 本地 API `chain_id=31337` · 证书要求 **纯 Sepolia 11155111** |
| **F-02** | 未跑 | 须先 Execute；且需 `FUNCTION_CERT_BROADCAST_OK=1` |
| **F-01 / F-03** | 拒跑 | 无 Owner broadcast 授权 · 属 Owner 活证 |

### 本轮已跑（只读/聚合）

- `stamp-v311-f02-execute-monitor-heartbeat.py` → MONITORING  
- `dry-run-v311-post-execute-ladder.py` → DRY_RUN_FAIL（before_eta）  
- `stamp-v311-ui-ux-full-cert-aggregate.py` → PARTIAL  
- `stamp-v311-product-cert-aggregate.py` → OPEN  
- `stamp-v311-governance-rc-close.py` → REFUSE  

---

## 1 · Owner 最短续跑（ETA 后）

```text
1) heartbeat execute_allowed_now=true
2) S1 Execute + Receipt → F-02 PASS
3) Sepolia 11155111 环境：I-01 + F-01 + F-03（BROADCAST_OK=1）
4) WC inject → Playwright real-wallet real-tx → P5 PASS
5) stamp Product PASS → stamp G-RC-05 CLOSE
```

未达 G-RC-05 前仍禁止 Step 3 / 部署 / ACTIVE 切换。

---

## 2 · Bundle 构件

| 文件 | 用途 |
|------|------|
| `G-RC-CLOSURE-CONVERGENCE-SESSION-LATEST.json` | 本轮五步会话 |
| `G-RC-CLOSURE-CONVERGENCE-LATEST.json` | 收敛板 |
| `G-RC-05-CLOSE-EVIDENCE-BUNDLE-MANIFEST-LATEST.json` | RB-01…10 |
| `GOVERNANCE-RC-CLOSE-ATTEMPT-COPY.json` | 最新 REFUSE |
