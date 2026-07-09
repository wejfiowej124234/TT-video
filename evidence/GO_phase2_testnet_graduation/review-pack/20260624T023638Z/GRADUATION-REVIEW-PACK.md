# Phase ② · Graduation 审核材料包

**Generated:** 2026-06-24T02:36:38Z
**Verdict:** **PARTIAL**
**Soak COMPLETED:** 否（等待 COMPLETED.json）

## 一次性执行入口

```bash
bash scripts/ops/p2fc-post-soak-one-shot-execute.sh --watch
```

## G-01～G-09 清单

| ID | 项 | Ready | 阶段 |
|----|-----|-------|------|
| G-06 | P2FC soak COMPLETED.json | ❌ | post-soak |
| G-07a | TN-P1-010 evidence (tn-p1-010-indexer-reconcile-*) | ✅ | post-soak step 1 |
| G-02 | staging /meta 200 (api+web) | ❌ | post-soak deploy |
| G-01 | Deep release gate PASS --require-meta-green | ❌ | post-soak |
| G-08 | graduation-matrix.v1.json CLOSED | ❌ | graduation closure |
| G-09 | OWNER-SIGNOFF.md | ❌ | graduation closure |

## 诚实边界

② testnet graduation **≠** ③ Production GO · mainnet · sk_live 另闸。

