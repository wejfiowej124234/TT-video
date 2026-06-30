# Regression Queue

Bug 修完后在此排队回归 · **不翻旧 Session**

| REG | Defect | 状态 |
|-----|--------|------|
| [REG-001](./REG-001.md) | DEFECT-002 | QUEUED |
| [REG-002](./REG-002.md) | DEFECT-003 | QUEUED |

状态：`QUEUED` · `IN_PROGRESS` · `PASS` · `FAIL`

## 配置漂移（post-CFG graduation）

`verify-cfg-drift-closure.sh` 失败 **≠** 重开 Configuration Sprint。

→ 开 **DEFECT**（`module`: `Config / …`）→ 修 → **REG-NNN** → verify PASS → 关闭。

SSOT: [TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md](../../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)

