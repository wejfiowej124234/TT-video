# Provider Workbench L5 · ① 本地全页冻结（2026-06-12）

**阶段：① 本地** — `/provider` 商家工作台全页（收件箱 · 市场曝光 · 经营统计；**资料编辑** 在 `/me/identities/merchant/settings`）+ seller 订单走廊 `hat=merchant`；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/app/provider/page.tsx` · `frontend/components/provider/MerchantWorkbenchMarketExposureCard.tsx` · `frontend/lib/provider/providerWorkbenchL5ClosureSprintModel.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **全页 UI** | `data-tt-provider-workspace-page="1"` · `data-tt-ui-frozen=provider-workbench-l5-20260612` |
| **收件箱** | 首屏 · 待处理服务单 · `GET /orders?hat=merchant&state=in_progress` |
| **市场曝光** | 未解锁：顶部门闸单卡（入驻/准入/资料）· 折叠预览与计数；已解锁：预览 + 计数 + **我的橱窗商品**（下架/删草稿）+ studio/settings |
| **经营统计** | `GET /me` `stats` 块 · `ProviderWorkbenchBillingPeriodCard` 四指标 |
| **订单走廊** | `GET /orders?hat=merchant` 服务端 seller（`order_guide_user_id`）过滤 |
| **导航去重** | 收件箱仅订单空态 · 门闸 CTA 仅市场曝光 · 未解锁底栏无准入链 · `ProviderWorkbenchL5CrossNav` |
| **准入 SSOT** | `/me/settings/trust` · 入驻 `/me/onboarding?role=provider&from=provider_pending`（含回工作台链） |
| **统计折叠** | 新商家 `ProviderWorkbenchStatsTeaser` |
| **种子账号** | `merchant@test.com` / `Test123!` |
| **冻结日** | **2026-06-12** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流（对齐 Guide Workbench L5 纪律）。

**诚实边界：** ② 跨设备收藏 SLA · ③ 生产 PSP/真链 **未**纳入本冻结。

---

## 机读验收

```bash
bash scripts/dev/record-provider-workbench-l5-evidence.sh
```

末行：`TT_PROVIDER_WORKBENCH_L5_EVIDENCE: OK`

**快速烟测：**

```bash
bash scripts/dev/smoke-provider-workbench-l5-local.sh
```

末行：`TT_PROVIDER_WORKBENCH_L5_SMOKE: OK`

---

## 互指

| 读者 | 文档 |
|------|------|
| 商家入驻 UI | [PROVIDER-REGISTER-UI-FREEZE.md](../GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) |
| 商家资料 settings | `frontend/app/me/identities/merchant/settings/` |
| 橱窗 studio | `frontend/app/market/provider/README.md` |
| Guide 对标 | [GUIDE-WORKBENCH-L5-FREEZE.md](../GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md) |
| 发布中心 IA 边界 | [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](../GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md) |
| 企业审计 | [PROVIDER-WORKBENCH-ENTERPRISE-CODE-AUDIT-20260612.md](./PROVIDER-WORKBENCH-ENTERPRISE-CODE-AUDIT-20260612.md) |
| Agent | `AGENTS.md` |
