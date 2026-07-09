# City Hero SSOT Verification

| | |
|---|---|
| **Date** | 2026-07-07 |
| **Question** | Registry「City Hero」= 已完成（A）还是独立模块（B）？ |
| **Verdict** | **B · 独立 CMS 模块 · 尚未实现** |
| **Registry Action** | **保持 Pilot · 不改为 Frozen** |

## 结论（一句话）

十国已冻结的是 **Hero Assets（国家级）** 和 **POI Content QA（poi_hero · 按 city 跑 runtime）**；
Registry 里的 **City Hero** 指 **`asset_kind=city_hero` 的独立城市主视觉模块**，Catalog 里 **0 条**，Brief/Admin/Frontend 均未建。

## 命名混淆点

| 口语 / 流水线 | 实际 SSOT 模块 | 状态 |
|--------------|---------------|------|
| Country Hero / da-hero-* | **Hero Assets** · landing_ambient | ✅ Frozen P0 |
| Destination Ambient | **Destination Ambient** | ✅ Frozen P0 |
| City Runtime + POI Hero | **POI Content QA** · poi_hero | ✅ Frozen · 330/330 |
| Registry「City Hero」 | **city_hero** · 按城市独立主视觉 | ⏳ Pilot · **未开始** |

## 硬证据

| 检查项 | 结果 |
|--------|------|
| Staging Catalog `city_hero` | count=0 |
| CMS Content Execution · City Hero | WAITING · 0/0 (catalog_empty) |
| Denominator Lock · city | 0/0 (catalog_empty) |
| L5 Gap Report · city_hero | NOT_SEEN · assets=0 |
| cms-content-brief asset_families | **无 city_hero** |
| cms-image-inventory | **无 city_hero**（仅有 poi_city → poi_hero） |
| Admin route | **无** /admin/content/city-hero |
| Frontend resolver | **无** city_hero 消费 |
| Ten Country Closure | POI 330/330 · **不含 city_hero** |

## 已 Frozen 的三项（≠ City Hero）

- **Hero Assets** — 十国 Home 全屏 Hero · da-hero-{iso}-home · asset_kind=landing_ambient · FROZEN P0
- **POI Content QA** — 按 City 跑 Execution → Content QA → Runtime · poi_hero 配图 · FROZEN P0 · 330/330 LOCK
- **Destination Ambient** — 十国氛围背景 · landing_ambient · FROZEN P0

## 建议

1. **不要**把 City Hero 改为 Frozen（会误用 POI/Hero Evidence）
2. **不要**重复十国验收
3. Registry 保持 **Pilot · P1 · L5 ❌ · 下一步：建立 L5 流程**
4. 若要做 City Hero：先写 brief + admin + catalog，再走 POI 同级 L5
5. 若 P1 优先运营价值：可先 **Hotel**，City Hero 待 brief 定义后再开

## 刷新

`node scripts/dev/run-cms-city-hero-ssot-verification.cjs`
