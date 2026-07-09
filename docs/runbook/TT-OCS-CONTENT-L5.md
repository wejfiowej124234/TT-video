# TT-OCS-CONTENT-L5 · Phase② OCS Content L5（Content Engineering）

**Version:** 1.3.0 · **生效：** 2026-07-04  
**机读：** [`registry/ocs-content-l5.v1.yaml`](../../registry/ocs-content-l5.v1.yaml)  
**Content Brief SSOT：** [`data/official-cold-start/content-brief.v1.yaml`](../../data/official-cold-start/content-brief.v1.yaml)  
**Production Matrix SSOT：** [`data/official-cold-start/content-production-matrix.v1.yaml`](../../data/official-cold-start/content-production-matrix.v1.yaml)  
**技术 SSOT（冻结）：** [`data/official-cold-start/dataset.v1.json`](../../data/official-cold-start/dataset.v1.json) · [`assets.v1.json`](../../data/official-cold-start/assets.v1.json)

---

## 0 · 阶段链（禁止混线）

**阶段口径：** ① 本地 → ② 测试网 → ③ 生产

```text
Phase② Runtime Convergence          ✅ FROZEN_CLOSED
        │
        ▼
Phase② OCS Content L5              ✅ CLOSED · 四键同批 · L5 93.5
        │
        ▼  Production Preparation 入口已解闸（仍非 ③ GO）
Production Preparation             🟢 MAY_ENTER
        │
        ▼
Production GO                      ③ PENDING
```

| 机读键 | 当前 |
|--------|------|
| `TT_OCS_CONTENT_L5` | `CLOSED` |
| `TT_OCS_CONTENT_L5_EXECUTION` | `CLOSED` |
| `TT_OCS_CONTENT_L5_READY` | `YES` |
| `TT_CONTENT_PRODUCTION_MATRIX` | `PASS` |
| `TT_CONTENT_BRAND_CONSISTENCY` | `PASS` |
| `TT_RC_RUNTIME_CONVERGENCE` | `FROZEN_CLOSED` |

**禁止：** Runtime 绿 / Reveal 修复 **冒充** Content L5 READY · Content L5 **冒充** Production GO。

---

## 1a · Content First, Code Frozen {#content-first-code-frozen}

**写死纪律：**

> OCS Content L5 阶段禁止新增业务功能、禁止修改 Runtime、SSOT、API、DB、Catalog、Baseline、前端媒体链及治理框架；所有工作**仅允许**发生在 Content Brief、Content Production Matrix、`dataset.v1.json`、官方媒体资产（`media/`）及其对应验证 Evidence 中，**以内容质量驱动阶段关闭**。

| 冻结 | 允许 |
|------|------|
| Runtime · Baseline · API · DB · Catalog | `content-brief.v1.yaml` |
| 前端媒体渲染链 · 治理框架 | `content-production-matrix.v1.yaml` |
| 新业务功能 · 数据模型 | `dataset.v1.json`（同 chain 文案） |
| | `data/official-cold-start/media/` |
| | `evidence/.../ocs-content-l5/` |
| | 内容验证脚本（非业务功能） |

---

## 1 · 两条流水线

| 流水线 | 职责 | 本阶段 |
|--------|------|--------|
| **Content Supply（OCS）** | 图 · 文案 · 标签 · 城市主题 · manifest · bootstrap | **主轨** |
| **Official Ops（控制面）** | Deploy · Rollback · Featured · Campaign · Publish · Surface | **冻结架构 · 非 Content L5 主路径** |

---

## 2 · 冻结 vs 允许

**冻结：** Runtime SSOT · Baseline · API · DB · Catalog · 前端渲染链 · 治理链 · 数据模型

**允许：**

- 替换 `data/official-cold-start/media/*.jpg`（**文件名不变**）
- 同 chain 内 `dataset.v1.json` 文案校对
- 维护 `content-brief.v1.yaml`
- 维护 `content-production-matrix.v1.yaml`（逐图进度 · 设计/运营/开发共表）
- 资产 bootstrap / Staging 部署 / Evidence

**禁止：** 新业务功能 · schema 变更 · Admin 后台传图替代 OCS SSOT · 重跑 generate 生成纯色块 · **Manifest First 违规**（见 §3a）

---

## 3a · Manifest First（长期内容纪律） {#manifest-first}

**写死顺序：**

```text
1. 更新 Content Brief（content-brief.v1.yaml）
2. 同步 Production Matrix 对应行（content-production-matrix.v1.yaml）
3. 同步 dataset.v1.json 同 chain 文案
4. 替换 media/{filename} 二进制（文件名不变）
5. bootstrap · verify · Matrix 行 asset_status / review_status 更新
```

**禁止：**

- 直接换 Staging/线上 JPG 而不更新 Content Brief
- 只改文案不更新 Brief / Matrix
- Community 与 Provider 出现不同城市主题（同 chain 必须同城）

---

## 3 · Content Brief（内容定义 SSOT）

**文件：** [`content-brief.v1.yaml`](../../data/official-cold-start/content-brief.v1.yaml)

**结构：** 10 城 × 6 Slot = 60 文件 — 定义场景、构图、色调、文案映射、禁止重复。

**校验：** `node scripts/dev/validate-ocs-content-l5-brief.cjs`

---

## 3b · Content Production Matrix（进度/审核 SSOT）

**文件：** [`content-production-matrix.v1.yaml`](../../data/official-cold-start/content-production-matrix.v1.yaml)

**用途：** 设计 · 运营 · 开发 **只看这一张表** — 不各自维护内容清单。

| 列 | 含义 |
|----|------|
| `filename` | 官方媒体文件名（不可改） |
| `city` / `surface` / `slot` | 城市与公开展示面 |
| `scene` | 推荐场景（来自 Brief） |
| `copy_label` | 对应 manifest 文案摘要 |
| `asset_status` | `pending` → `replaced` → `verified` |
| `review_status` | `pending` → `pass` / `fail` |

**生成/刷新（保留已有 status）：**

```bash
node scripts/dev/generate-ocs-content-production-matrix.cjs --preserve-status
node scripts/dev/validate-ocs-content-production-matrix.cjs
```

**CLOSED 硬闸：** `node scripts/dev/validate-ocs-content-production-matrix.cjs --require-ready` → `TT_CONTENT_PRODUCTION_MATRIX: PASS`

---

## 4 · 内容生产工作流

```text
1. Content Brief 签字
2. Production Matrix 生成（60 行 · 全 pending）
3. 按 Brief 逐张产出 JPEG → media/ · Matrix asset_status=replaced
4. 内容审核 · review_status=pass · G9/G10 逐张过
5. Manifest First 同步 dataset.v1.json 文案
6. run-ocs-official-asset-baseline.sh · Staging UAT
7. 10 维评分 + Evidence · 四键 CLOSED（§6）
```

## 4b · 逐行执行（禁止批量跳过）

**顺序：** Matrix 第 1 行 → 第 60 行 · **完成一行 · 验证一行 · 证据一行**

```bash
# 1. Manifest First：Brief/Matrix/文案已对齐后，放入真实 JPEG
cp /path/to/real.jpg data/official-cold-start/media/ocs-tokyo-photo-provider-cover.jpg

# 2. 更新 Matrix 行状态
node scripts/dev/run-ocs-content-l5-row-complete.cjs \
  --filename ocs-tokyo-photo-provider-cover.jpg \
  --asset-status verified --review-status pass

# 3. 机读验证 + row evidence（G2/G3/G9/G10 仍须人工在 evidence 中签字）
node scripts/dev/run-ocs-content-l5-row-verify.cjs \
  --filename ocs-tokyo-photo-provider-cover.jpg
```

**Row evidence：** `evidence/GO_official_cold_start_dataset/ocs-content-l5/rows/<filename>.<stamp>.json`

**Destination Authenticity evidence：** `evidence/.../rows/<filename>.DESTINATION-AUTHENTICITY.json`

**禁止：** 未换真图批量改 Matrix 为 pass · 跳过 row verify · 跳过 Destination Authenticity · 无 evidence 宣称 CLOSED

**进度：** Matrix 中 `asset_status=verified` 且 `review_status=pass` 行数 → **目标 60/60**

---

## 4c · Destination Authenticity Review {#destination-authenticity}

**写死顺序（每行 · 在 G1–G10 + Cross-Chain + Global Consistency 之后）：**

```bash
node scripts/dev/run-ocs-content-l5-destination-authenticity-review.cjs \
  --filename ocs-<chain>-<slot>.jpg --visual-pass
```

**机读键：** `TT_DESTINATION_AUTHENTICITY_REVIEW: PASS`

**九维视觉核查（须全部属于当前 city + country_code）：**

| 维度 | 核查 |
|------|------|
| architecture | 建筑属于当前城市/国家 |
| streetscape | 街景不属于其它城市 |
| clothing | 服饰/着装符合当地文化语境 |
| language_signage | 可见文字/标识不暗示错误国家（允许当地语言） |
| transportation | 交通工具/路权符合当地 |
| natural_environment | 自然/气候/植被不属于错误地域 |
| food_dining | 饮食形态符合当地（若可见） |
| commercial_form | 商业形态不暗示错误市场 |
| cultural_elements | 文化符号不跨城/跨国混搭 |

**Manifest 机读对拍（100%）：** `manifest_field_alignment` — city · destination · tags · title · body · category · chain_id 与 Matrix/copy_label 一致。

**禁止：** 巴黎图+东京文案 · 京都图+首尔 tags · 跨 chain 素材复用 · 无 `--visual-pass` 宣称 PASS

**追溯批量（已 verified 行）：**

```bash
node scripts/dev/run-ocs-content-l5-destination-authenticity-review.cjs --all-verified --visual-pass
```

**聚合 Evidence：** `OCS-CONTENT-L5-DESTINATION-AUTHENTICITY-{N}of60.REVIEW.json`

---

## 4d · Guide Identity Diversity Review {#guide-identity-diversity}

**适用：** `guide-avatar` slot · 及后续含真人主体的 portrait 类 slot（Matrix 标注时同此闸）

**写死顺序：** 在 Destination Authenticity 之后 · row 标记 `verified+pass` 之前

```bash
node scripts/dev/run-ocs-content-l5-guide-identity-diversity-review.cjs \
  --filename ocs-<chain>-guide-avatar.jpg --visual-pass
```

**机读键：** `TT_GUIDE_IDENTITY_DIVERSITY_REVIEW: PASS`

| 检查项 | 要求 |
|--------|------|
| 跨城撞脸 | 不同 city Guide **不得**高度相似同一张脸 |
| 年龄层 | 多城 Guide 年龄感须有变化 |
| 性别/发型/脸型/气质 | 明显可区分 |
| 职业形象 | 符合当地文化（摄影/茶道/美食等） |
| 连续浏览 | 用户不会误认为是同一位向导 |

**示例（已验收 trio）：** Tokyo Ken 摄影师 · Kyoto Yuki 和服茶道 · Seoul Min 45+ 眼镜美食专家

**追溯（全部 guide-avatar）：**

```bash
node scripts/dev/run-ocs-content-l5-guide-identity-diversity-review.cjs --all-guide-avatars --visual-pass
```

**Evidence：** `rows/<filename>.GUIDE-IDENTITY-DIVERSITY.json`

---

## 4e · Provider Business Identity Review {#provider-business-identity}

**适用：** `provider-cover` slot

**写死顺序：** 在 Destination Authenticity 之后 · row 标记 `verified+pass` 之前

```bash
node scripts/dev/run-ocs-content-l5-provider-business-identity-review.cjs \
  --filename ocs-<chain>-provider-cover.jpg --visual-pass
```

**机读键：** `TT_PROVIDER_BUSINESS_IDENTITY_REVIEW: PASS`

| 检查项 | 要求 |
|--------|------|
| 商业空间 | 不同 city Provider **不得**高度相似同一空间/装修 |
| 经营模式 | 摄影工作室 / 茶室包场 / 美食团等须明显不同 |
| 当地业态 | 符合当地商业生态与服务形态 |
| 品牌气质 | 非通用网红店模板；连续浏览不会误认同一家商户 |

**示例（已验收 trio）：** Tokyo 台场半日旅拍 · Kyoto 私享茶室 · Seoul 夜市美食团长桌/排队

**追溯（全部 provider-cover）：**

```bash
node scripts/dev/run-ocs-content-l5-provider-business-identity-review.cjs --all-provider-covers --visual-pass
```

**Evidence：** `rows/<filename>.PROVIDER-BUSINESS-IDENTITY.json`

**六类专项审核（固定路线图）：**

| 审核 | Surface | 状态 |
|------|---------|------|
| Guide Identity Diversity | guide-avatar | ✅ 已上线 |
| Provider Business Identity | provider-cover | ✅ 已上线 |
| Acquisition Product Identity | acquisition-cover | ✅ 本批上线 |
| Official Guide Destination | official-guide-cover | ✅ Row 16 起正式判定 |
| Community Authenticity | community-cover / media | ✅ Row 17 起正式判定 |
| Destination Authenticity | 所有 Surface | ✅ 通用 |
| **Content Portfolio** | **Official Content Library** | ✅ **第七类 · 本批上线** |

---

## 4f · Acquisition Product Identity Review {#acquisition-product-identity}

**适用：** `acquisition-cover` slot

**写死顺序：** Destination Authenticity 之后 · `verified+pass` 之前

```bash
node scripts/dev/run-ocs-content-l5-acquisition-product-identity-review.cjs \
  --filename ocs-<chain>-acquisition-cover.jpg --visual-pass
```

**机读键：** `TT_ACQUISITION_PRODUCT_IDENTITY_REVIEW: PASS`

| 检查项 | 要求 |
|--------|------|
| 本地商品特色 | 明确韩国/城市限定零食、工艺或伴手礼 |
| 业务语义 | 可读作代购/悬赏标的，非 tour 服务 |
| Surface 隔离 | 禁止人物肖像、Guide/Provider/Official/Community 场景 |
| 跨城商品 | 不得与 Tokyo 镜头、Kyoto 和纸等高度相似 |

**追溯：**

```bash
node scripts/dev/run-ocs-content-l5-acquisition-product-identity-review.cjs --all-acquisition-covers --visual-pass
```

---

## 4g · Official Guide Destination Review {#official-guide-destination}

**适用：** `official-guide-cover` · **Row 16 起正式判定**（Seoul 首行执行）

```bash
node scripts/dev/run-ocs-content-l5-official-guide-destination-review.cjs \
  --filename ocs-<chain>-official-guide-cover.jpg --visual-pass
```

**机读键：** `TT_OFFICIAL_GUIDE_DESTINATION_REVIEW: PASS`

| 检查项 | 要求 |
|--------|------|
| 路线语义 | 多站点路线/地图封面，非单一景点海报 |
| Manifest | title/body/destination/tags 100% 对齐 |
| Surface 隔离 | 禁止 Guide/Provider/Acquisition/Community 语义混入 |
| 跨城路线 | 与 Tokyo 摄影线、Kyoto 文化线明显不同 |

**追溯：**

```bash
node scripts/dev/run-ocs-content-l5-official-guide-destination-review.cjs --all-official-guide-covers --visual-pass
```

**Evidence：** `rows/<filename>.OFFICIAL-GUIDE-DESTINATION.json`

---

## 4h · Community Authenticity Review {#community-authenticity}

**适用：** `community-cover` · `community-media` · **Row 17 起正式判定**

```bash
node scripts/dev/run-ocs-content-l5-community-authenticity-review.cjs \
  --filename ocs-<chain>-community-cover.jpg --visual-pass
```

**机读键：** `TT_COMMUNITY_AUTHENTICITY_REVIEW: PASS`

**长期固定检查项（优先于「好不好看」）：**

| ID | 要求 |
|----|------|
| authentic_share_feel | 像旅行者发布，而不是广告图 |
| natural_interaction | 人物动作、视线、环境符合真实旅行场景 |
| feed_thumbnail_readability | Feed 缩略图一眼能理解内容 |
| emotional_travel_expression | 传递旅行体验，而非仅展示景点 |
| ugc_style_not_commercial_poster | 高质量真实分享，非商业宣传海报 |

**Surface 隔离：** 禁止 Guide 肖像、Provider 服务场、Acquisition 静物、Official Guide 路线海报；Cover 与 Media 须不同场景。

**追溯：**

```bash
node scripts/dev/run-ocs-content-l5-community-authenticity-review.cjs --all-community-covers --visual-pass
```

**Evidence：** `rows/<filename>.COMMUNITY-AUTHENTICITY.json`

---

## 4i · City Chain Final Review（6/6 关闭闸） {#chain-final-review}

**适用：** 每 city chain 第 6 行（community-media）完成后 · **未通过禁止进入下一 Chain**

**Evidence：** `chains/{chain_id}-chain-FINAL.REVIEW.json`

**机读键：** `TT_{CHAIN}_CHAIN: CLOSED` · **City Content Score ≥ 85**

| 闸 | 检查 |
|----|------|
| Chain Narrative Continuity | 六 Surface 形成完整城市叙事弧 |
| Visual Diversity | 六 Slot 构图/主体/焦段无重复 |
| City Brand Identity | 城市视觉语言、文化元素、商业定位一致 |
| Consumer Experience | Feed→详情→Market→Official 浏览体验连贯 |
| 六类专项审核 | Guide/Provider/Acquisition/Official/Community/Destination 全 PASS |
| 全量回归 | 含已 CLOSED chain 无品牌漂移 |

**Seoul 示例弧：** Min 向导 → 4h 美食团 → 零食悬赏 → 48h 地图 → Cover 近景 → Media 市场过道

---

## 4j · No Quality Regression（长期纪律） {#no-quality-regression}

**写死：** 新增任一张官方素材，整体质量**不得下降**。

| 规则 | 要求 |
|------|------|
| 当前行 | 须 PASS |
| 已完成行/城市 | 须**继续保持** PASS |
| 若全局风格/品牌/真实性/多样性下降 | **返工当前行** · 禁止改历史行去适配 |

**机读 Evidence：** `OCS-CONTENT-L5-GLOBAL-REGRESSION-{N}of60.REVIEW.json`

**每新行触发：** 复核全部已完成 Matrix 行 + 六类专项 aggregate + 已 CLOSED chain

---

## 4k · Content Portfolio Review（Official Content Library） {#content-portfolio}

**第七类专项审核** · 审核**整个内容库**，非单张图。

```bash
node scripts/dev/run-ocs-content-l5-content-portfolio-review.cjs \
  --visual-pass --trigger-filename ocs-<latest>.jpg
```

**机读键：** `TT_CONTENT_PORTFOLIO_REVIEW: PASS`

| # | 固定检查项 |
|---|-----------|
| 1 | 城市辨识度（不同城市一眼可区分） |
| 2 | 国家文化真实性 |
| 3 | 品牌统一性（TravelTrust L5） |
| 4 | 商业真实性（每 Surface 符合业务） |
| 5 | 人物唯一性（Guide 不撞脸） |
| 6 | 商业业态唯一性（Provider 不重复） |
| 7 | 商品唯一性（Acquisition 不重复） |
| 8 | 官方路线唯一性（Official Guide 不重复） |
| 9 | 社区内容真实性（Community 不像广告） |
| 10 | 全局视觉节奏（浏览全库不模板化） |

**Evidence：** `OCS-CONTENT-L5-CONTENT-PORTFOLIO-{N}of60.REVIEW.json`

---

## 4l · Surface Boundary Review {#surface-boundary}

**第八类专项审核** · 防止 Surface 职责混用导致同质化。

```bash
node scripts/dev/run-ocs-content-l5-surface-boundary-review.cjs \
  --filename ocs-<chain>-<slot>.jpg --visual-pass
```

**机读键：** `TT_SURFACE_BOUNDARY_REVIEW: PASS`

| Surface | 禁止混入 |
|---------|----------|
| Guide | Provider 服务场 / Acquisition 商品 / Official 路线海报 / Community UGC |
| Provider | Guide 肖像 / 其它 Surface 同上 |
| Acquisition | 人物肖像 / 服务场景 / 路线宽幅 / UGC |
| Official Guide | Guide 肖像 / Provider 晚宴 / 商品静物 / Community 抓拍 |
| Community | Guide 肖像 / Provider / Acquisition / Official 海报 |

**Evidence：** `rows/<filename>.SURFACE-BOUNDARY.json`

---

## 4m · Visual Sequence Review（第九类 · 框架冻结） {#visual-sequence}

**最终专项审核** · 九类体系**不再扩展** · 后续聚焦 38/60 内容生产。

```bash
node scripts/dev/run-ocs-content-l5-visual-sequence-review.cjs \
  --filename ocs-<chain>-community-cover.jpg --visual-pass
```

**机读键：** `TT_VISUAL_SEQUENCE_REVIEW: PASS`

| 检查 | 要求 |
|------|------|
| 连续浏览 | 全库无构图/色调/主体/镜位/光线/节奏重复 |
| Chain 内 | 与 prior slot（尤其 Row 22 Official Guide 宽幅）须明显不同 |
| 质量 | No Quality Regression |

**Evidence：** `rows/<filename>.VISUAL-SEQUENCE.json` · `OCS-CONTENT-L5-VISUAL-SEQUENCE-{N}of60.REVIEW.json`

---

## 九类专项审核（冻结 · SSOT） {#nine-class-frozen}

| # | 审核 | 范围 |
|---|------|------|
| 1 | Guide Identity | guide-avatar |
| 2 | Provider Business | provider-cover |
| 3 | Acquisition Product | acquisition-cover |
| 4 | Official Guide Destination | official-guide-cover |
| 5 | Community Authenticity | community-* |
| 6 | Destination Authenticity | 所有 Surface |
| 7 | Content Portfolio | 全库 |
| 8 | Surface Boundary | 每行 |
| 9 | **Visual Sequence** | **每行 · 本批上线 · 最终类** |

**禁止**再增第十类；剩余 Matrix 行仅执行此九类 + G1–G10 + Global Regression。

### 执行纪律（冻结 · 不增第十类） {#execution-discipline}

| 触发 | 动作 | Evidence |
|------|------|----------|
| **每 1 行** | Row Review（G1–G10 + 九类 + Global Regression） | `rows/<filename>.*` · `GLOBAL-REGRESSION-{N}of60` |
| **每 6 行（1 城）** | City Chain Final Review + City Content Score | `chains/{chain_id}-chain-FINAL.REVIEW.json` |
| **24 / 36 / 48 / 60 行** | Global Official Content Library Milestone Review | `OCS-CONTENT-L5-OFFICIAL-CONTENT-LIBRARY-MILESTONE-{N}of60.REVIEW.json` |
| **60/60** | Final Production Content Audit | 四键 CLOSED 签字包 |

**生成纪律（Row32 起默认 · 非第十类审核）：** Content Safety 预检查 → 生成 → 技术质量检查（JPEG/体积/分辨率）→ 业务语义 → 国家真实性 → 全局回归。

**当前进度（2026-07-04）：** **60/60** · **四键 CLOSED** · L5 **93.5** · **Production Preparation IN_PROGRESS** · Staging 真图 rebootstrap **VERIFIED**（`20260704T155800Z` · 60/60 bytes parity）· 仍 **≠** ③ Production GO。

---

| ID | 维度 | 权重 |
|----|------|------|
| G1 | 60/60 真图素材 | 12 |
| G2 | 图文一致 | 12 |
| G3 | 6 Slot 差异化 | 12 |
| G4 | 跨 Surface 城市主题一致 | 8 |
| G5 | 品牌视觉统一 | 8 |
| G6 | 真实商业平台观感 | 12 |
| G7 | WCAG 与视觉质量 | 8 |
| G8 | Evidence + 矩阵归档 | 8 |
| **G9** | **Content Authenticity（内容真实性）** | **10** |
| **G10** | **Content Diversity（一致性与多样性平衡）** | **10** |

**G9：** 每张图符合城市、场景、业务角色；禁止地理/角色错误、AI 明显失真、版权风险、品牌冲突。

**G10：** 同 chain 6 Slot 覆盖不同场景类型；禁止仅换角度/色调；跨 Surface 有新鲜感且品牌统一。

**L5 Score：** 加权总分 **≥ 85** · 单维 **≥ 75** · G1–G10 全部 **PASS**

**品牌一致性机读：** `TT_CONTENT_BRAND_CONSISTENCY: PASS` ← G5 **且** G9 **且** G10 达标

---

## 6 · 阶段出口（四键同批 · 禁止单键解闸）

Production Preparation **仅当以下四键同时成立：**

| 机读键 | CLOSED 值 |
|--------|-----------|
| `TT_OCS_CONTENT_L5` | `CLOSED` |
| `TT_OCS_CONTENT_L5_READY` | `YES` |
| `TT_CONTENT_PRODUCTION_MATRIX` | `PASS` |
| `TT_CONTENT_BRAND_CONSISTENCY` | `PASS` |

**禁止** 仅以 `TT_OCS_CONTENT_L5_READY` 单键进入 Production Preparation。

---

## 7 · Evidence

**根目录：** `evidence/GO_official_cold_start_dataset/ocs-content-l5/<UTC>/`

**必含：**

- `content-production-matrix.json` — **10 维**分数 + 加权 L5 Score + 四键状态
- `content-production-matrix.v1.yaml` 快照或 diff
- `asset-verify.log` · `brief-validate.log` · `matrix-validate.log`
- `staging-uat-spotcheck.json` — G6 · G9 · G10 抽检
- `OCS-CONTENT-L5-CLOSED.json` — 四键签字

---

## 8 · 互指

| 文档 | 关系 |
|------|------|
| [`TT-OFFICIAL-COLD-START-DATASET.md`](TT-OFFICIAL-COLD-START-DATASET.md) | OCS 技术编排 · Asset Baseline V1 |
| [`TT-STAGING-RC-BASELINE-ENFORCEMENT.md`](TT-STAGING-RC-BASELINE-ENFORCEMENT.md) | Runtime Baseline（已闭） |
| [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md) | Ops 控制面（分线） |
| [`registry/catalog-asset-migration.v1.yaml`](../../registry/catalog-asset-migration.v1.yaml) | 长期自有 CDN 素材（PI3 · post Content L5） |

---

## 9 · Charter（阶段一句话）

> 保持 Runtime / 技术 SSOT 全部冻结，仅开展 OCS Content Engineering：以 Content Brief + Production Matrix 为内容 SSOT，Manifest First 替换 60 张真图并校对文案，满足 G1–G10 与四键 **`TT_OCS_CONTENT_L5: CLOSED`** 后，方可进入 Production Preparation。

---
