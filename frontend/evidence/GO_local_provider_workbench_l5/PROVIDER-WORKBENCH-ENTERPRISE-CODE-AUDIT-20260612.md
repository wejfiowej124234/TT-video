# Provider Workbench · 企业级代码审计（2026-06-12 · ① 本地 · 复审）

**阶段：① 本地** — 对标 [GUIDE-WORKBENCH-L5-FREEZE.md](../GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md) · [PROVIDER-WORKBENCH-L5-FREEZE.md](./PROVIDER-WORKBENCH-L5-FREEZE.md)

**代码真源：** `frontend/app/provider/page.tsx` · `frontend/lib/provider/providerWorkbenchWorkspaceL5.ts` · `frontend/lib/provider/merchantProfileSettingsNav.ts` · `crates/api/src/chain_off/auth.rs`（`seed_merchant_workbench_demo_accounts`）

**证据日志（复审）：** `frontend/evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-20260612T064622Z.log`  
末行：`TT_PROVIDER_WORKBENCH_L5_EVIDENCE: OK`

---

## 收口总表

| 项 | 结论 |
|----|------|
| **有没有收口** | 是（① · ACTIVE · 本审计 + FREEZE + smoke 绿） |
| **有没有 UI 冻结** | 是（① · `provider-workbench-l5-20260612`） |

**诚实边界：** ① 本地绿 / 烟测 **≠** ② staging GO **≠** ③ 生产真链/真 PSP。`multi-demo@test.com` 与烟测种子 `merchant@test.com` 数据态不同（演示商家可有 publish gate / 0 订单，属预期）。

---

## 复审修复项（2026-06-12 下午）

| ID | 严重度 | 问题 | 修复 | 状态 |
|----|--------|------|------|------|
| PW-L5-P0-04 | P0 | `merchantProfileSettingsNav` 从 `meIdentitiesProfileLinksModel` 导入未 re-export 常量 → 链接 `/undefined?from=provider` 404 | 改导入 `meIdentitiesCoreCardModel`；模型层补 re-export；`merchantProfileSettingsNav.contract.test.ts` | ✅ closed |
| PW-L5-P1-05 | P1 | 商家订单页「查看全部订单」链到 `/orders` 丢失 `hat=merchant` | `workspaceOrdersViewAllHref` · Header/Empty/Mobile 三处统一 | ✅ closed |
| PW-L5-P1-06 | P1 | 商家订单空态筛选时「清除筛选」与「查看全部」同义重复 | 商家 + 已筛选时隐藏次要 CTA | ✅ closed |
| PW-L5-P1-07 | P1 | 市场预览/资料设置重复：预览点进 settings · 设置页再嵌预览 · Billing 再链 settings | 对标 Guide：`previewOnly` · 设置仅 dirty 预览 · `from=provider` 隐藏预览与快捷链 · 去掉 Billing 重复链 | ✅ closed |

---

## IA 去重与逻辑分工（对标 Guide Workbench）

| 场景 | 原问题 | 优化后 |
|------|--------|--------|
| 工作台市场曝光预览 | 「查看详情」与「商家资料设置」同跳 settings | 预览 **只读**（`previewOnly`），编辑仅走「商家资料设置」 |
| 资料设置页底部「市场预览」 | 与工作台曝光卡重复 | `?from=provider` **不展示**；从 Hub 进入时 **仅表单 dirty** 时展示编辑中预览 |
| 资料设置「进入商家工作台」 | 已从工作台进来仍显示 | `from=provider` 时隐藏（顶栏已有「返回商家工作台」） |
| 经营统计 Billing 卡 | 底部再链一次「商家资料设置」 | 移除；曝光区保留唯一主 CTA |
| 橱窗创作台 vs 浏览公开橱窗 | 功能不同 | 保留：创作台 = studio 弹窗；浏览 = `/market/provider` 公开子站 |
| 发布门闸 vs 入驻页 | 资格已付仍显示 step3 | `multi-demo` 演示态；② 同步 stepper 与 entitlement |

---

## 全功能链路矩阵（逐按钮 · 复审）

| # | 入口（`/provider` 及走廊） | 目标路由 | 页面存在 | 数据链 | 状态 | 未完成应在哪阶 |
|---|---------------------------|----------|----------|--------|------|----------------|
| 1 | 工作台壳 `WorkspaceL5PageShell` | `/provider` | ✅ | `GET /me` | ✅ 完成 | — |
| 2 | 从设置进入 `?from=settings` | 回 `/me/settings` footer | ✅ | — | ✅ 完成 | — |
| 3 | 收件箱「查看全部服务单」 | `/orders?hat=merchant&state=in_progress` | ✅ | `GET /orders?hat=merchant` | ✅ 完成 | — |
| 4 | 下一单「进入订单」 | `/escrow/[id]` | ✅ | prefetch + escrow | ✅ 完成（有单时） | — |
| 5 | 商家资料设置 | `/me/identities/merchant/settings?from=provider` | ✅ | `GET /me/merchant-profile` | ✅ 完成（P0-04 后） | — |
| 6 | 市场曝光预览卡 | 只读展示（无「查看详情」跳转） | ✅ | 资料 → demo masonry | ✅ 完成 · 已冻结 | ② live listing |
| 7 | 橱窗创作台 | `/market/provider?studio=1` | ✅ | studio 门闸 | ✅ 完成 | — |
| 8 | 预览公开橱窗 | `/market/provider` | ✅ | 公开子站 | ✅ 完成 | — |
| 9 | 信任中心（曝光卡内链） | `/me/settings/trust` | ✅ | trust SSOT | ✅ 完成 | — |
| 10 | 发布门闸「查看入驻进度」 | `/me/onboarding?role=provider&from=provider_pending` | ✅ | eligibility | ✅ 完成 | — |
| 11 | 资料缺失 → 入驻注册 | `/provider/register?step=1` | ✅ | register 冻结页 | ✅ 完成 | — |
| 12 | 经营统计 Billing 卡 | 同页四指标（无重复 settings 链） | ✅ | `GET /me` stats | ✅ 完成（首单后展开） | — |
| 13 | StatsTeaser（新商家） | 同页折叠占位 | ✅ | 规则 `providerWorkbenchWorkspaceL5` | ✅ 完成 | — |
| 14 | 服务订单列表页 | `/orders?hat=merchant` | ✅ | seller filter API | ✅ 完成 | — |
| 15 | 订单页「返回商家工作台」 | `/provider` | ✅ | — | ✅ 完成 | — |
| 16 | 订单页「查看全部订单」 | `/orders?hat=merchant` | ✅ | 保留走廊（P1-05 后） | ✅ 完成 | — |
| 17 | slot 未解锁 | 锁定面板 | ✅ | identity slots | ✅ 完成 | — |

---

## 十维矩阵（复审后 · ACTIVE）

| # | 维度 | 结论 |
|---|------|------|
| 1 | IA / 导航 | ✅ `footerTarget` · settings `?from=provider` · Billing/settings 回链 · 无 `/undefined` |
| 2 | 收件箱 | ✅ `hat=merchant` · 暖色 `ref-sun` 经营轨（非 cyan DID） |
| 3 | 订单走廊 | ✅ 服务端 `OrdersListHat::Merchant` · 列表 CTA 保留 `hat=merchant` |
| 4 | 市场曝光 | ✅ 资料预览 · listings-summary · Trust 链 · publish gate |
| 5 | 橱窗摘要 | ✅ `GET /me/merchant-listings-summary` published/draft |
| 6 | 经营统计 | ✅ `GET /me` stats · StatsTeaser 首单前折叠 |
| 7 | 准入 SSOT | ✅ `/me/settings/trust` · onboarding 链 |
| 8 | 门闸 | ✅ profile 404 友好态 · slot/role 解锁 |
| 9 | 错误/空态 | ✅ inbox/曝光/摘要重试 · 订单空态 CTA 去重 |
| 10 | 证据链 | ✅ vitest 19（smoke）+ 扩展契约 32 · smoke API · evidence log · Step 6r · Playwright |

---

## UI / 配色 L5（对标首页）

| # | 清单项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | `WorkspaceL5PageShell` + `TT_WORKSPACE_L5` token | ✅ | 与 Guide 工作台同壳，非独立野路子页 |
| 2 | 暖色经营轨 `ref-sun` / 金边 section card | ✅ | 对齐营销深色 + 金 accent（非 Escrow cyan） |
| 3 | 44px touch target · focus ring | ✅ | `travelLinkFocus` / `FOCUS_RING` |
| 4 | 冻结探针 `data-tt-ui-frozen` | ✅ | `provider-workbench-l5-20260612` |
| 5 | 订单列表 hero 橙渐变 CTA | ✅ | `TT_ORDERS_LIST_L5` 与向导走廊一致 |
| 6 | 入驻页「本地演示」/ JSON 技术块 | ✅ ① 可接受 | ② 应默认隐藏开发者块 |

---

## 开放 / 延期（非 ① 阻塞）

| ID | 严重度 | 项 | 状态 | 阶段 |
|----|--------|-----|------|------|
| PW-L5-P2-01 | P2 | staging 一键商家账号 · 跨设备橱窗 SLA | deferred | ② |
| PW-L5-P2-02 | P2 | 生产 PSP / 真链经营报表 | deferred | ③ |
| PW-L5-P2-03 | P2 | 订单列表文案 `merchant_service` 英文化残留 | deferred（① 不阻塞） | ① optional i18n |

---

## 机读验收

```bash
bash scripts/dev/smoke-provider-workbench-l5-local.sh
bash scripts/dev/record-provider-workbench-l5-evidence.sh
cd frontend && npx vitest run lib/provider/merchantProfileSettingsNav.contract.test.ts lib/orders/ordersListHatQuery.contract.test.ts
```

末行：`TT_PROVIDER_WORKBENCH_L5_SMOKE: OK` / `TT_PROVIDER_WORKBENCH_L5_EVIDENCE: OK`

**烟测账号：** `merchant@test.com` / `Test123!`（API 种子 `seed_merchant_workbench_demo_accounts`）

---

## 一句话结论

商家工作台 **① 已收口且 UI 冻结**；复审确认 **全部可点击入口均有真实路由与数据链**，P0 `/undefined` 与商家订单走廊断链已闭；`multi-demo` 下 0 订单与发布门闸为演示数据态。② staging 账号/SLA、③ 生产 PSP 仍 OPEN。
