# Complexity Convergence · Evidence Index（① + ② 双阶段）

**SSOT 台账**：[181-Complexity-Audit-Final-Candidate-Before-Soak.md](../../docs/handbook/engineering/181-Complexity-Audit-Final-Candidate-Before-Soak.md)

**机读**：

- `registry/complexity-convergence-fix-ledger.v1.yaml`
- `evidence/COMPLEXITY_CONVERGENCE/ledger-status.latest.json`
- `evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/gap-inventory.latest.json`

**刷新**：

```bash
python scripts/dev/gen-complexity-convergence-ledger-status.py
bash scripts/dev/validate-complexity-convergence-ledger-sync.sh
```

**目录约定**：

| 路径 | 阶段 | 内容 |
|------|------|------|
| `evidence/COMPLEXITY_CONVERGENCE/<LEDGER_ID>/` | ① | `phase1.closed.json` |
| `evidence/P2FC_SOAK_72H_STAGING/final-candidate-pre-soak/items/<LEDGER_ID>/` | ② | `phase2.closed.json` |

**阶段纪律**：① 本地绿 **≠** ② staging live **≠** 72h Soak COMPLETED **≠** ③ Production GO。
