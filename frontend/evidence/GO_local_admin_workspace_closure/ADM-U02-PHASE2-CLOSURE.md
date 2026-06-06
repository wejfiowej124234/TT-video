# ADM-U02 · Phase ② 收口（待 Fly Staging 全绿后填写）

**阶段口径：** ① 已绿见 [`ADM-U02-PHASE1-CLOSURE.md`](ADM-U02-PHASE1-CLOSURE.md)。**② 仅**在持久 Staging 证据全绿后把本文档标为 ACTIVE。

## ② 验收命令（与 ADM-U01 同序）

```bash
bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
```

或 Step 2 only（U01 已绿）：

```bash
bash scripts/dev/record-adm-u02-staging-evidence.sh
```

## ② 完成检查表（全绿后勾选）

顺序固定：**U01 持久 RBAC → U02 Staging → merge**（`record-phase2-admin-adm-u01-then-u02.sh`）。**仅**编排末行 `TT_PHASE2_ADMIN_STAGING: PASS` + `validate-phase2-admin-staging-closure.sh` PASS 后，才允许标 Admin Phase ②。

| # | 项 | 状态 |
|---|-----|------|
| 1 | `TT_ADM_U01_EVIDENCE: PASS`（Step 1） | ❌ |
| 2 | `TT_ADM_U02_STAGING_EVIDENCE: PASS`（Step 2） | ❌ |
| 3 | `closure-report.json` `release_gate: GO`（Step 3 merge） | ❌ |
| 4 | `TT_PHASE2_ADMIN_STAGING: PASS` | ❌ |
| 5 | `TT_PHASE2_ADMIN_STAGING_VALIDATE: PASS` | ❌ |
| 6 | `ADMIN-L5-AUDIT-TASKS.md` ADM-U01/U02 标 **② 已绿** | ❌ |

**诚实边界：** ② Staging GO **≠** ③ Production GO。
