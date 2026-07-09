# Production Readiness · Sprint A 执行

**Framework：** FROZEN · **今天不做其它任何事**

---

## Sprint A（唯一目标）

**Sprint Goal：** Guide Business Data Ready  
**执行一句话：** 不要修 Guide · 不要修 Pricing · **只验证并关闭 BD-001**

**Active Root Cause：** BD-001 · Guide Availability

**今天 KPI：**

```text
OPEN → IN_VALIDATION → CONFIRMED → CLOSED
```

禁止：BD-002 · HAT-003 · 框架扩展

---

## Step 1：验证（不要修其它问题）

**只做：** 配置一条正确的 Guide Availability（staging）  
**不做：** 改 Pricing · 改 HAT · 改其它数据

| 结果 | 行动 |
|------|------|
| **Case A** Avail PASS + Pricing PASS | CONFIRMED · 进入 Step 2 |
| **Case B** Avail PASS + Pricing FAIL | BD-001 CLOSED（Availability）· **验证后**登记 BD-004 · **验证前禁止创建** |

```bash
node scripts/dev/run-root-cause-validation-bd001.cjs
```

---

## Step 2：连续验证

PASS → PASS → PASS（3 次）· **期间不修改代码**

→ `TT_BD001_ROOT_CAUSE_VALIDATION: CONFIRMED`

---

## Step 3：Exit Condition

Availability PASS **AND** Pricing PASS **AND** Guide HAT 下单 PASS

→ BD-001 CLOSED · `closed_at` · MTTC · Sprint Review（含 Lesson Learned）

---

## Step 4：Guide Ready

```bash
node scripts/dev/run-guide-business-data-readiness-probes.cjs
```

Ready：`FAIL=0` · `WARN-D=0` · `WARN-P=0` · WARN-C 不阻挡

---

## Step 5：Sprint B

仅当 BD-001 CLOSED · Open Root Causes **5→4**

---

## 每日三问

```bash
node scripts/dev/run-production-readiness-master-checklist.cjs
```

① Active Sprint · ② 今天关闭了什么 · ③ Open RC 是否减少
