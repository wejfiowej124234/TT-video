# Reality-W3 · 争议仲裁 / 区域权限 Runbook

**STATUS:** ACTIVE  
**Machine key:** `TT_REALITY_W3_DISPUTE_ARBITRATION_RUNBOOK`  
**PCR:** `PCR-BIZ-DISPUTE-ARBITRATION` · `PCR-BIZ-REGION-RBAC` · `PCR-BIZ-DISPUTE-DRYRUN`  
**SU-PLUS-06：** 须附 1 条 Staging 干跑证据（见 `evidence/PSG-REALITY-CLOSURE/W3-DISPUTE-DRYRUN-*/`）

## 1 · 争议决策树（② Staging）

```text
订单进行中 / 已支付
  → 任一方 POST /api/v1/orders/:id/dispute（须会话）
  → 订单态 → disputed · disputes 行可见
  → 仲裁方 / 授权角色 POST /api/v1/disputes/:id/resolve
  → 终态（按实现：refunded / partially_refunded / rejected …）
  → Audit / meta.dispute_* 可观测
```

### 角色

| 角色 | 动作 |
|------|------|
| Tourist (C2) | 开争议（己方订单） |
| Guide (C3) | 开争议 / 响应 |
| Admin Risk/SuperAdmin | 介入、只读列表、合规 |
| 非当事人 | 403 / unauthorized |

## 2 · 区域 / 国家权限（矩阵摘要）

| 写面 | 谁可写 | 备注 |
|------|--------|------|
| CMS 治理公告 | SuperAdmin（Solo ACCEPT） | Ops 车道 403（W2） |
| Region steward | `region_steward` / 入驻门闸 | ≠ 业务 C1–C4 混验 |
| Acquisition 子站 | PD-009 trust/bond | 非 region_steward |
| Admin 六角色 | SuperAdmin/Ops/CS/Risk/Finance/Auditor | ≠ 业务测试账号 |

**抽样：** Staging 上非 Admin Bearer 调 `/api/v1/admin/*` → 401/403；Ops 无治理发布（W2 已证）。

## 3 · 干跑步骤（SU-PLUS-06）

1. Health OK · tip SHA 记入证据  
2. `bash scripts/dev/smoke-phase25-h1-escrow-intent-dispute-staging.sh`（或等价 UAT）  
3. 记录 `order_id` · `dispute_id` · HTTP 码 · 终态  
4. 写入 `W3-DISPUTE-DRYRUN-<stamp>/` · **禁止**写密码  

## 4 · 诚实边界

干跑 **≠** 主网仲裁 · **≠** 法币退款 PSP 真链 · **≠** Production GO。
