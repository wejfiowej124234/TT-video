<!-- SUPERSEDED BY: evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md -->
> **ARCHIVED · SUPERSEDED BY:** `TESTNET-SIGNOFF-20260701T002252Z.md` · Do not use for gate decisions.  
> **Canonical keys:** `TT_TESTNET_SIGNOFF: CLOSED` · `TT_TESTNET_GRADUATION: CLOSED`

# ② Testnet Sign-off — Graduation Close-out (G-09)

**Prepared UTC:** `2026-06-30T16:31:00Z`  
**Session:** `TN-20260630T144813Z`  
**Checklist SSOT:** [TT-TESTNET-SIGNOFF-CHECKLIST.md](../../docs/runbook/TT-TESTNET-SIGNOFF-CHECKLIST.md)

## 清单结论

| 状态 | 数量 |
|------|------|
| **PASS** | **20/22** |
| **PARTIAL** | **2** (T-GOV-01 · T-SIGN-01) |
| **BLOCKED** | **0** |

### 本轮关闭项

| ID | 状态 | 证据 |
|----|------|------|
| T-RBAC-01 | ✅ PASS | `run_20260630T155708Z` API 102/102 + Playwright 6/6 |
| T-ESC-01 | ✅ PASS | `tn-p1-006-escrow-20260630T160404Z` |
| T-GOV-01 | ◐ PARTIAL | `t-gov-01-vote-evidence.json` — propose on-chain · castVote 未完成 |
| T-SIGN-01 | ◐ PARTIAL | 见下 · **非 CLOSED** |

## 裁决键（诚实）

```
TT_TESTNET_SIGNOFF: OPEN
TT_TESTNET_GRADUATION: OPEN
```

**未满足 CLOSED 原因：**

1. **T-GOV-01** — Sepolia `castVote` 未成功归档（RPC TLS 抖动 + 投票窗 `GovBadState`；API 返回 `vote_on_chain_required` + calldata 已验）
2. **TT_TESTNET_GRADUATION** — 毕业审计 `G07`：`probe-indexer-reconcile` 只读探针 `rpc_escrow_samples` 子闸 intermittent fail → `reconcile_compound_pass=false`（TN-P1-010 全量证据 `@ 20260630T153818Z` 仍 PASS）

## ③ 前置

**禁止跳阶。** 须在上述两项 Owner 关闭后，方可将 Sign-off 改为 `CLOSED` 并进入 ③ Mainnet Preparation。

---

*End of TESTNET-SIGNOFF close-out v1.1.0*
