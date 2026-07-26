# Batch-13 · FP-C · Owner 硬页（订单 → 财务只读 → 平台设置）· LATEST

**Machine:** `TT_ADMIN_BATCH13_FP_C_OWNER_HARD_PAGES`  
**Stamp:** `20260726T081000Z`  
**Status:** **FP-C_CODE_LANDED · ① 机读绿 · ② Staging 复截/闸闭待**  
**Patch:** `PATCH-STG-017`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ FINANCE_WRITE**

---

## 1 · C1 · 订单（HU-504～511 路径）

| FO | 动作 | ① |
|----|------|---|
| FO6 | API `id`/`q` + URL + 筛选框 | **CODE** |
| FO7 | 争议行 → `/admin/disputes?orderId=` + 争议页客户端过滤 | **CODE** |
| FO8 | 游客/向导 → `/admin/users/:id`（`USERS_READ`） | **CODE** |
| FO5 | 支付入口降「更多」 | **CODE** |
| FO1 | 状态筛文案去 eng scare | **CODE** |
| FO10 | JumpPack 默认折叠 · 只读徽章修正（无写位=只读） | **CODE** |
| FO3 | 主操作「查看订单」+ 托管次级 | **CODE** |

**闸 510/511：** 仍 **OPEN**（须 ② R-O + B13-07′）

---

## 2 · C2 · 财务只读（HU-552～559）

| FN | 动作 | ① |
|----|------|---|
| FN2/FN5 | 七步 workflow = 主导航 · 磁贴墙折叠次级 | **CODE** |
| FN6/FN10 | 系统头寸折叠高级 | **CODE** |
| FN7/FN12 | 只读文案收紧 · 明示 FINANCE_WRITE 禁 | **CODE** |

**闸 558/559：** 仍 **OPEN**（须 ②）

---

## 3 · C3 · 平台设置（HU-560～567）

| CF | 动作 | ① |
|----|------|---|
| CF6 | 审批通知拉 pending **N** | **CODE** |
| CF10 | 可写诚实脚注 | **CODE** |
| CF11 | tip cite + HG/Cutover/GO LOCKED 页脚 · 无解锁 CTA | **CODE** |

**闸 566/567：** 仍 **OPEN**（须 ②）

---

## 4 · 验收（本波）

| 项 | 状态 |
|----|------|
| `cargo check -p traveltrust-api` | **PASS** |
| orders / finance / config vitest contracts | **PASS** |
| tip `ea71c577` | **未动** |
| Hard Gate / Cutover / Production GO | **LOCKED / NO_GO** |
| FINANCE_WRITE | **FORBIDDEN** |

---

## 5 · 下一波

**FP-D** · 争议→入驻→内容→官方→增长 IA/功能 — 见 [`FAST-PATH`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.md)

```text
TT_ADMIN_BATCH13_FP_C: CODE_LANDED
TT_ADMIN_BATCH13_FP_C_STAGING: PENDING
TT_ADMIN_BATCH13_NEXT: FP_D
TT_ADMIN_BATCH13_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
TT_FINANCE_WRITE: FORBIDDEN
```
