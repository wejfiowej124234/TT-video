# L5 Edge-Case & Exception Audit · Findings Matrix

**Program ID:** `l5-edge-case-exception-audit-20260608`  
**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产  
**审计标准：** 功能存在 ≠ 通过 · 异常时须 **理解发生了什么 · 为什么 · 下一步**  
**机读 SSOT：** `frontend/lib/l5/l5EdgeCaseExceptionAuditModel.ts` · `l5EdgeCaseExceptionAudit.contract.test.ts`

---

## 总表

| 项 | 结论 |
|----|------|
| **有没有收口（① 五角色异常/空态/权限）** | **部分收口** — P0/P1 已闭；P2 留 ②③ |
| **有没有 UI 冻结** | **是** — 仅 i18n / 错误文案 / 空态引导 |

---

## 审计维度 × 五角色

| 维度 | Traveler | Guide | Merchant | Admin | Governance |
|------|:--------:|:-----:|:--------:|:-----:|:----------:|
| 空状态 | ● | ● | ○ | ● | ○ |
| 权限不足 | ● | ● | ○ | ● | ○ |
| 无数据 | ● | ● | ● | ● | ● |
| 取消流程 | ● | ○ | ○ | ○ | ○ |
| 超时 | ● | ● | ○ | ○ | ○ |
| 失败恢复 | ● | ● | ● | ● | ● |
| 重复操作 | ● | ● | ○ | ○ | ● |
| 边界输入 | ● | ○ | ● | ○ | ○ |
| 网络异常 | ● | ● | ● | ● | ● |
| 跨角色中断 | ● | ● | ○ | ○ | ○ |

---

## Edge-Case Findings Matrix

### P0（2/2 ✅）

| ID | 角色 | 场景 | 问题 | 状态 |
|----|------|------|------|------|
| EC-P0-01 | Traveler | 列表加载 | Orders ReferenceError | ✅ |
| EC-P0-02 | Traveler | 预览 | stablecoinPair 崩溃 | ✅ |

### P1（10/10 ✅）

| ID | 角色 | 场景 | 问题 | 修复 |
|----|------|------|------|------|
| EC-P1-01 | Traveler | 网络 | `orders_requestFailed` 裸「请求失败」 | 说明原因 + 重试 |
| EC-P1-02 | Traveler | 加载 | `escrow_loadFailed` 裸「加载失败」 | 刷新/返回订单列表 |
| EC-P1-03 | Traveler | 无数据 | 订单卡「链上投影」术语 | 改为「状态同步中/打开订单详情」 |
| EC-P1-04 | Traveler | 空态 | 市场选向导空态含「① 本地 seed」 | 消费者筛选/发布引导 |
| EC-P1-05 | Traveler | 空态 | 空态步骤 Escrow/DID | 改为订单详情/资质审核 |
| EC-P1-06 | Traveler | 支付 | `pay_step3` Approve/Deposit | 消费者付款步骤 |
| EC-P1-07 | Governance | 网络 | `governance_requestFailed` 裸错误 | 刷新/稍后重试 |
| EC-P1-08 | Admin | 权限 | Gate 暴露 admin/super_admin | 联系超管/返回首页 |
| EC-P1-09 | Guide | 超时 | 接单时限过期无 handoff | 刷新 + 联系游客 |
| EC-P1-10 | Traveler | 超时 | 付款时限过期无 recovery | 刷新 + 联系向导/重下 |

### P2 → ②③

| ID | 场景 | 阶 |
|----|------|-----|
| EC-P2-01 | 协议暂停/错链钱包深度引导 | ② |
| EC-P2-02 | 市场 bind backfill 与 bind_empty parity | ② |
| EC-P2-03 | 商家 KYB 字段级错误分组 | ② |
| EC-P2-04 | 版本冲突弹窗 consumer sweep | ② |
| EC-P2-05 | Admin 部分 inbox 通道聚合错误 | ③ |

---

## 验收

```bash
cd frontend
npx vitest run lib/l5/l5EdgeCaseExceptionAudit.contract.test.ts \
  lib/l5/l5CrossRoleRealityAudit.contract.test.ts \
  lib/l5/l5MultiDimensionalExcellence.contract.test.ts
```

---

## 一句话结论

**① 五角色异常/空态/权限 P0/P1 已全部关闭** — 用户在任何 audited 异常路径可见「发生了什么 + 下一步」，不再看到裸错误、① 本地或 Escrow/DID 噪声。**P2** 深度异常（错链、版本冲突、KYB 分组）留 **②③**。
