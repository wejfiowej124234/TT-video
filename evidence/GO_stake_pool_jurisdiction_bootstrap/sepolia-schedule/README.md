# Stake Pool · 10 国 Jurisdiction Bootstrap · Sepolia

**Phase:** ② Sepolia · **≠** ③ Production GO

## 状态（2026-06-16T035617Z）

| 项 | 值 |
|----|-----|
| Schedule | DONE |
| Execute | 待 Timelock 48h · ready_at_unix=1781755056 ≈ 2026-06-18T03:57:36Z |
| Strict audit | 待 execute 后 |

## 下一命令

```bash
bash scripts/dev/bootstrap-stake-pool-jurisdictions-sepolia.sh execute
bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh --strict
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only
```
