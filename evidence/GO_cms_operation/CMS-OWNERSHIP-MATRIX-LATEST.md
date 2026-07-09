# TravelTrust CMS Ownership Matrix

| | |
|---|---|
| **Version** | V1.1 |
| **Status** | FROZEN |
| **Baseline** | Ten Country CMS Content QA |
| **Last Updated** | 2026-07-07 |
| **Owner** | Solo Founder |

> **Ownership + Edit Policy** · 不仅知道归谁管，还知道改完走什么流程

## Edit Policy（四种）

| Policy | 含义 |
|--------|------|
| **Direct** | 改完即可 Publish · 无需 L5 全链 |
| **Verify** | 改完必须 Runtime Verify · 无需 Exit Check |
| **L5 QA** | 改完必须 Replace → Publish → Verify → Exit Check（+ Country Runtime 如适用） |
| **Immutable** | CMS 不可改 · 走 API / DB / Contract |

## 决策流程

```
收到需求
    ↓
查 Ownership Matrix
    ↓
确认 Owner（CMS / API / Contract）
    ↓
确认 Edit Policy（Direct / Verify / L5 QA / Immutable）
    ↓
决定走 CMS / API / Contract 流程
```

## Master Matrix

| 页面 | 元素 | Owner | Edit Policy | CMS | API | DB | Contract |
|------|------|-------|-------------|-----|-----|-----|----------|
| Home | Campaign Hero（OCS 冷启动） | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Home | Destination Hero（十国） | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Home | Destination Ambient | CMS | **Verify** | ✅ | ❌ | ❌ | ❌ |
| Home | 国家介绍文案 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Home | 城市介绍文案 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Home | Catalog 国家/城市标签 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Home | 热门国家排序 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Home | 创新行程预览卡 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Home | Featured / 冷启动展示条 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Home | SEO Metadata | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Travel | 品牌页 Hero / 视觉 | CMS | **Verify** | ✅ | ❌ | ❌ | ❌ |
| Travel | 品牌文案 / Web3 叙事 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Travel | Video Poster | CMS | **Verify** | ✅ | ❌ | ❌ | ❌ |
| Travel | Announcements 列表 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Guide | Hero / Background | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Guide | POI 配图 | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Guide | Guide Name / Bio | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Guide | Rating / Reviews | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Guide | Followers / Follow | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Guide | Wallet / Trust Score | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Guide | Available Time / 订单 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Guide | Services / 定价 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Provider | Listing Cover 图片 | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Provider | 商家名称 / 描述 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Provider | KYC / 入驻资料 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Provider | 商品 / 库存价格 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Acquisition | Listing Cover 图片 | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Acquisition | 收购条目文案 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Acquisition | 交易状态 / 报价 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Community | Official Feed Banner | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Community | UGC 帖子 / 媒体 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Community | 用户 Profile / 头像 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Community | Explore 目的地块 | CMS | **Verify** | ✅ | ✅ | ❌ | ❌ |
| Market | POI Hero / Food 图片 | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Market | City Hero | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Market | Hotel / Transport 库存图 | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Market | Banner / Campaign 视觉 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Market | Pricing · Intercity Routes | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Market | 订单卡封面 / Discover | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Market | 向导卡头像 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Market | 商品价格 / 库存 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Market | Market Feed 冷启动 | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Market | 页身 CSS 氛围 | Runtime | **Immutable** | ❌ | ❌ | ❌ | ❌ |
| Governance | 提案 Banner / 视觉 | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Governance | Proposal 数据 | Contract | **Immutable** | ❌ | ❌ | ❌ | ✅ |
| Governance | Vote / 投票结果 | Contract | **Immutable** | ❌ | ❌ | ❌ | ✅ |
| Governance | Stake / Seat / Claim | Contract | **Immutable** | ❌ | ❌ | ❌ | ✅ |
| Governance | Treasury 余额 | Contract | **Immutable** | ❌ | ❌ | ❌ | ✅ |
| Me | 用户资料 / 头像 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Me | 钱包 / DID | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Me | 订单 / Escrow | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Me | 关注 / 收藏 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Me | 消息 / 聊天 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Admin | CMS Content (/admin/content) | CMS | **L5 QA** | ✅ | ❌ | ❌ | ❌ |
| Admin | Translation · SEO Admin | CMS | **Direct** | ✅ | ❌ | ❌ | ❌ |
| Admin | OCS Public Ops | API | **Immutable** | ❌ | ✅ | ❌ | ❌ |
| Admin | Community 审核 | API | **Immutable** | ❌ | ✅ | ✅ | ❌ |
| Admin | Governance 运维 | Contract | **Immutable** | ❌ | ✅ | ❌ | ✅ |

## 示例

| 场景 | Owner | Edit Policy | 意思 |
|------|-------|-------------|------|
| POI Hero 改图 | CMS | L5 QA | 必须 Replace→Publish→Verify→Exit Check |
| Ambient 改图 | CMS | Verify | Runtime Verify 即可 |
| Banner 上线 | CMS | Direct | 直接 Publish |
| 钱包余额 | API | Immutable | CMS 无权限 |
| 投票结果 | Contract | Immutable | 链上不可改 |

## 按 Edit Policy 分组

### L5 QA（9）

- Home · Destination Hero（十国）
- Guide · Hero / Background
- Guide · POI 配图
- Provider · Listing Cover 图片
- Acquisition · Listing Cover 图片
- Market · POI Hero / Food 图片
- Market · City Hero
- Market · Hotel / Transport 库存图
- … +1 more

### Verify（4）

- Home · Destination Ambient
- Travel · 品牌页 Hero / 视觉
- Travel · Video Poster
- Community · Explore 目的地块

### Direct（9）

- Home · 国家介绍文案
- Home · 城市介绍文案
- Home · Catalog 国家/城市标签
- Home · SEO Metadata
- Travel · 品牌文案 / Web3 叙事
- Market · Banner / Campaign 视觉
- Market · Pricing · Intercity Routes
- Governance · 提案 Banner / 视觉
- … +1 more

### Immutable（36）

- Home · Campaign Hero（OCS 冷启动）
- Home · 热门国家排序
- Home · 创新行程预览卡
- Home · Featured / 冷启动展示条
- Travel · Announcements 列表
- Guide · Guide Name / Bio
- Guide · Rating / Reviews
- Guide · Followers / Follow
- … +28 more

## 治理配套

| 文档 | 回答 |
|------|------|
| Registry | 模块什么状态？ |
| **Matrix** | 归谁管 + 怎么改？ |
| Evidence | 为什么？ |
| Script | `node scripts/dev/run-cms-ownership-matrix.cjs` |
