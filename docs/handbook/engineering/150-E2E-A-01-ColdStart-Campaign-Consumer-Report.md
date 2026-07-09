# 150 · E2E-A-01 Cold Start Campaign Consumer Report

> **Sprint**：E2E-A-01 · **Cold Start Campaign Consumer**（149 E2E-A-01 · Post-O-S4）  
> **设计 SSOT**：[144 O-S4](./144-O-S4-Cold-Start-Campaigns-Deployment-Operations-Report.md) · [145 Operations Platform Freeze](./145-Operations-Platform-Release-Freeze-Report.md) · [149 Operations E2E Acceptance](./149-Operations-E2E-Acceptance-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**不修改** Catalog Consumer 默认 · Growth · 支付 · GOV · 报价主链 · Production 默认开关  
> **一键 gate**：`bash scripts/check-e2e-a-01-cold-start-campaign-consumer.sh`  
> **结论**：**`E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO`** · **`OPERATIONS_E2E_ACCEPTANCE_GO`**（Chain A Consumer 闭合）

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **公众只读 API** | **GO** — `GET /api/v1/official/cold-start/surfaces/:surface` |
| **Deploy 生命周期联动** | **GO** — 仅 `status=deployed` + items `status=active` 曝光；rollback → 空 campaign |
| **Surface 渲染** | **GO** — `home_hero` · `market_feed` · `community_feed` |
| **Admin→Consumer E2E** | **GO** — O-S4 deploy/rollback 语义 + Consumer 只读对拍 |
| **149 Chain A Consumer** | **GO** — 闭合 E2E-A-01 |
| **145/146/133 回归** | **不本 Sprint 改代码** — 149 gate step 5 复跑 |

**150 正式裁定：** **`E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO`** · 复跑 149 应为 **`OPERATIONS_E2E_ACCEPTANCE_GO`**。

---

## 2. 交付范围

### 2.1 后端（公众 RO）

| 模块 | 路径 | 能力 |
|------|------|------|
| DB consumer | `ops_cold_start_campaigns_consumer.rs` | deployed campaign by surface · active items · resolve refs |
| HTTP | `routes/official/` | `GET /api/v1/official/cold-start/surfaces/:surface` |
| 路由注册 | `routes/mod.rs` | `official::router()` merge |

**响应语义**

| 状态 | JSON |
|------|------|
| 有 deployed campaign | `{ status, surface, campaign: { id, name, surfaces, deployed_at, items[] } }` |
| 无 / rollback 后 | `{ status, surface, campaign: null }` |

**Item resolve（公众安全字段）**

| item_type | resolved 字段 |
|-----------|---------------|
| `official_account` | id · display_label · account_kind · linked_guide_id |
| `itinerary_template` | id · title · country_iso · cover_image_url · author_account_id |
| `guide_post` | id · title · destination · cover_url · community_post_id · tags |

### 2.2 前端 Consumer

| 模块 | 路径 |
|------|------|
| Client/hook | `frontend/lib/coldStartCampaign/*` |
| Surface UI | `components/coldStartCampaign/ColdStartCampaignSurfaceSection.tsx` |
| Home | `(home)/page.tsx` · `home_hero` |
| Market | `MarketPageClient.tsx` · `market_feed` |
| Community | `CommunityFeedMain.tsx` · `community_feed` |

**DOM 探针**：`data-tt-cold-start-surface` · `data-tt-cold-start-campaign` · `data-tt-cold-start-campaign-item-list`

### 2.3 门禁

| Gate | 命令 |
|------|------|
| E2E-A-01 | `bash scripts/check-e2e-a-01-cold-start-campaign-consumer.sh` |
| Smoke | `bash scripts/dev/smoke-official-cold-start-consumer-p0-local.sh` |
| Contract | `frontend/lib/coldStartCampaign/coldStartCampaignE2eA01.contract.test.ts` |
| Playwright | `frontend/e2e/e2e-a-01-cold-start-campaign-consumer.spec.ts` |
| 149 复跑 | `bash scripts/check-operations-e2e-acceptance.sh` |

---

## 3. Deploy → Rollback 生命周期

| Admin 动作 | DB | Consumer API |
|------------|-----|--------------|
| deploy | `status=deployed` · items `active` | surface 命中 → campaign + items |
| rollback | `status=rolled_back` · items `rolled_back` | **不**匹配 deployed → `campaign: null` |
| archive | `status=archived` | `campaign: null` |

---

## 4. 边界声明（纪律）

| 项 | E2E-A-01 | 不变 |
|----|----------|------|
| 公众 RO API/FE | **新增** | Admin API 不变 |
| `referral_code` item | **未实现** | 133 Growth 冻结 |
| Catalog Consumer | **未改** | `ENABLED=0` 默认 |
| 报价 UI 主链 | **未改** | TS SSOT |
| 支付 / GOV | **未改** | — |
| legacy env/TS showcase | **保留** | 无 deploy 时 UI 仍可用 |

---

## 5. 149 交叉裁定

| 149 Chain | E2E-A-01 前 | E2E-A-01 后 |
|-----------|-------------|-------------|
| A Admin | GO | **GO** |
| A Consumer | HOLD | **GO** |
| B/C/D | GO | **GO**（不变） |

**机读出口**：

```text
E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO
OPERATIONS_E2E_ACCEPTANCE_GO
```

---

**150 正式标记**：`E2E_A_01_COLD_START_CAMPAIGN_CONSUMER_GO` · npm `gate:e2e-a-01-cold-start-campaign-consumer`
