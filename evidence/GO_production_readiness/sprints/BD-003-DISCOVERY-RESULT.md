# BD-003 · Listings Cover Discovery

**Mode:** Discovery only · **Fix:** none · **ACTIVE:** false  
**Recorded:** 2026-07-08

## Executive

| 项 | 结果 |
|----|------|
| **Hypothesis** | Listings Cover 图不完整 |
| **Verdict** | **REJECTED**（staging 公开 Market 阻塞意义） |
| **Candidate RC** | `premature_listings_cover_hypothesis_on_staging` |
| **Exit 语义层** | Provider 10/10 + Acquisition 10/10 cover HEAD PASS · Market 可读 |

## Public Catalog（staging · production origin）

| Surface | Total | missing cover | HEAD fail | Market HTTP |
|---------|-------|---------------|-----------|-------------|
| Provider | 10 | 0 | 0 | 200 |
| Acquisition | 10 | 0 | 0 | 200 |

## 原假设 · REJECTED 依据

- Provider Day2 Images probe **PASS**（仅 sample[0] · 现全量 public 10/10 亦 PASS）
- 公开 `/market/provider/listings` + `/market/acquisition/listings` **无缺失 cover**
- **非** HEAD 404 · **非** missing cover_url

## 次要信号（不升格为「Cover 不完整」阻塞）

1. **路径约定**：cover 在 `/uploads/community-posts/ocs-*` · 0/10 在 `market/ocs/{chain_id}/` manifest（DDG 轨 · 非 Market 不可读）
2. **Draft/demo**：Sprint B HAT probe listings 无 cover · **未上 public catalog**
3. **BDR Day3**：`listings` 域 **未探** · Step1 Day3 pending

## 关联 SSOT

- `registry/business-data-readiness.v1.yaml` · listings NOT_READY
- `registry/market-media-ddg-remediation.v1.yaml` · legacy Unsplash 轨（独立 · PLANNED）
- `scripts/dev/run-provider-business-data-readiness-probes.cjs`

## 门禁

- BD-003 **仍 OPEN**（Discovery 完成 · 待 Owner REDEFINE）
- `fix_authorized=false` · `TT_SPRINT_B_ACTIVE=false`
