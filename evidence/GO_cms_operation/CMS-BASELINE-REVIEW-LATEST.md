# CMS Baseline Review · 基线审查

| | |
|---|---|
| **Version** | V1 |
| **Matrix Baseline** | V1.1 |
| **Review Date** | 2026-07-07 |
| **Owner** | Solo Founder |
| **Verdict** | **PASS · Matrix V1.1 FROZEN** |

> 问题：全站还有哪些页面内容**本应归 CMS**，却未登记到 Ownership Matrix？

## 结论

**全部 CMS 元素已登记或明确排除。** 无遗漏 gap。locales/OCS/API 内容已标注为「非 CMS」，Registry Backlog 项已预登记。Matrix V1.1 可冻结。

## 统计

| 维度 | 数量 |
|------|------|
| Matrix 元素 | 58 |
| CMS-owned 行 | 22 |
| Checklist · 已覆盖 | 34 |
| Checklist · Registry 预登记（未接 UI） | 2 |
| Checklist · 非 CMS（locales/OCS/API） | 15 |
| Checklist · 遗漏 gap | 0 |

## 逐页 Checklist

### Home

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Hero | ✅ 已登记 | Campaign Hero · Destination Hero · OCS + CMS |
| Background / Ambient | ✅ 已登记 | Destination Ambient · CMS |
| Banner | ➖ 非 CMS | 无独立 Banner · Featured=OCS Public Ops |
| CTA 文案 | ➖ 非 CMS | locales · landing_hero_* · 非 CMS |
| SEO | ✅ 已登记 | SEO Metadata · CMS · Registry P2 · consumer 未接 catalog SEO |
| 国家介绍 | 📋 预登记 | 国家介绍文案 · CMS · Registry country_city_copy Backlog · UI 未接 |
| 城市介绍 | 📋 预登记 | 城市介绍文案 · CMS · 同上 |
| 活动卡片 | ✅ 已登记 | 创新行程预览卡 · API Runtime |
| 首页推荐 | ✅ 已登记 | Featured / 冷启动展示条 · OCS Public Ops |
| Footer CMS 文案 | ➖ 非 CMS | LandingFooter · locales · 非 CMS |
| Consumer Value 卡片区 | ➖ 非 CMS | HomeConsumerValueSection · locales + 静态 TS 图 |
| Catalog 国家/城市标签 | ✅ 已登记 | Catalog 国家/城市标签 · CMS |

### Travel

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Hero | ✅ 已登记 | 品牌页 Hero / 视觉 · CMS (Registry P2) · 当前 page-brief + FE frozen · Video Poster Backlog |
| Background | ✅ 已登记 | 品牌页 Hero / 视觉 · 同上 |
| Ambient | ➖ 非 CMS | cinematic CSS · FE frozen |
| Banner | ➖ 非 CMS | Pulse ticker · static TS |
| CTA / 叙事文案 | ✅ 已登记 | 品牌文案 / Web3 叙事 · locales + page-brief |
| SEO | ➖ 非 CMS | layout static locales · SEO admin 未接 |
| Video Poster | ✅ 已登记 | Video Poster · CMS · Registry P2 Backlog |
| Announcements | ✅ 已登记 | Announcements 列表 · API |

### Guide

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Hero / Background | ✅ 已登记 | Hero / Background · CMS/CSS · destination ambient on guide_detail=planned |
| POI 配图 | ✅ 已登记 | POI 配图 · CMS |
| Profile 数据 | ✅ 已登记 | Guide Name / Bio · Rating · … · API/OCS |
| List 页 Header 文案 | ➖ 非 CMS | guides_title · locales |

### Provider

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Listing Cover | ✅ 已登记 | Listing Cover 图片 · CMS |
| 商家文案 | ✅ 已登记 | 商家名称 / 描述 · API/DB |
| Subsite Hero 文案 | ➖ 非 CMS | locales market_segment_provider_* |

### Acquisition

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Listing Cover | ✅ 已登记 | Listing Cover 图片 · CMS |
| 收购文案 | ✅ 已登记 | 收购条目文案 · API/DB |
| Subsite Hero 文案 | ➖ 非 CMS | locales |

### Community

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Official Banner | ✅ 已登记 | Official Feed Banner · OCS |
| UGC | ✅ 已登记 | UGC 帖子 / 媒体 · API |
| Explore 目的地块 | ✅ 已登记 | Explore 目的地块 · CMS+API |
| Feed Header 文案 | ➖ 非 CMS | locales |

### Market

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| POI Hero / Food | ✅ 已登记 | POI Hero / Food 图片 · CMS |
| City Hero | ✅ 已登记 | City Hero · CMS · Registry P1 Pilot · consumer 未接 |
| Hotel / Transport 图 | ✅ 已登记 | Hotel / Transport 库存图 · CMS |
| Banner | ✅ 已登记 | Banner / Campaign 视觉 · CMS/OCS |
| Pricing / Routes | ✅ 已登记 | Pricing · Intercity Routes · CMS |
| Hero 区文案 | ➖ 非 CMS | MarketPageHero · locales |
| Flow Banner 文案 | ➖ 非 CMS | MarketFlowContextBanner · locales |
| 页身 CSS | ✅ 已登记 | 页身 CSS 氛围 · FE frozen |

### Governance

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| 提案 Banner | ✅ 已登记 | 提案 Banner / 视觉 · CMS · 营销 art · 链上数据=Contract |
| Proposal / Vote | ✅ 已登记 | Proposal · Vote · Contract |
| Hub 静态文案 | ➖ 非 CMS | locales governance_* |

### Me

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| Profile / 钱包 / 订单 | ✅ 已登记 | 用户资料 … 消息 · API |
| Identities Hub 文案 | ➖ 非 CMS | locales me_identities_* |

### Admin

| 检查项 | 状态 | Matrix / 说明 |
|--------|------|---------------|
| CMS Content Hub | ✅ 已登记 | CMS Content + Translation + SEO + Pricing + Routes · CMS |
| OCS Public Ops | ✅ 已登记 | OCS Public Ops · OPS/API |
| Community 审核 | ✅ 已登记 | Community 审核 · API |
| Governance 运维 | ✅ 已登记 | Governance 运维 · Contract/API |

## 明确排除（非 CMS · 不进入 Matrix）

- **locales 静态文案**：Hero CTA、Footer、Market/Community/Governance/Me 页头说明、Consumer Value 卡片
- **OCS / Public Ops**：Campaign Hero、Featured、Market/Community Feed 冷启动
- **API / Contract / UGC**：订单、向导资料、投票、钱包、聊天
- **FE frozen CSS**：Market/Guide 页身氛围、Travel cinematic

## Registry 预登记（Matrix 有行 · consumer 未接）

| Matrix 元素 | Registry 模块 | 状态 |
|-------------|---------------|------|
| 国家介绍文案 / 城市介绍文案 | country_city_copy | Backlog P2 |
| SEO Metadata | seo_metadata | Backlog P2 |
| City Hero | city_hero | Pilot P1 |
| Travel Video Poster | video_poster | Backlog P2 |

## 治理顺序（已确认）

```
Registry → Ownership Matrix → Evidence → Script → 开发
```

## 下一步

1. ~~CMS Baseline Review~~ ✅
2. ~~Freeze Matrix V1.1~~ ✅
3. **City Hero Pilot** → Frozen
4. Hotel → Transport → Listings
