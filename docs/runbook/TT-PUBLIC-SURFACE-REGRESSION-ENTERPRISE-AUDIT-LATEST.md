# Public Surface Regression · Enterprise Full-Link Audit（LATEST）

**Status:** `AUDIT_COMPLETE_NO_DATA_MUTATION`  
**Stamp:** `20260715T174800Z`  
**Phase:** ② Staging readonly · **≠** ③ Production GO  
**Freeze:** PF **FROZEN** · 整树 Staging Deploy **FORBIDDEN** · 禁止改数据掩盖 · **`TT_PRODUCTION_GO: NO_GO`**

**镜像证据目录（若可写）：** `evidence/GO_public_surface_regression_audit/`  
**Canvas：** `~/.cursor/projects/d-TravelTrust-V1-1/canvases/public-surface-regression-audit.canvas.tsx`

---

## 0 · 一句话根因

「修好又乱」= **Fly 热修盖 clean SHA** + **OCS STATE 幂等 / DB 不幂等（标题×3）** + **Guest 无去重 & 收购 `destinationCountryIso` 单键** → **PF 干净 redeploy `231ceb21` 抹掉热修**。

---

## 1 · 运行态实测（证据）

| 源 | 值 |
|----|-----|
| Staging `/meta.build.git_sha` | `231ceb211753891909e4a2b49028a870f1f68310` |
| Main HEAD | `0bbc7adbd3142b111463fc398288ab94be5c0b84` |
| PF worktree | `D:/TravelTrust-PF-RC2-scoped` @ `231ceb21` |
| ACQ fix | `D:/TravelTrust-ACQ-PUBLIC-FIX` @ `1e1171d0`（**未上 Staging**） |

| Surface | Unfiltered | country=AE | 形态 |
|---------|----------:|----------:|------|
| Acquisition | **30** | **0** | 10 标题 × 3；payload **仅 `countryIso`** |
| Provider | **30** | **3** | 10 标题 × 3 |
| Guides | **25** | — | CN 城堆叠 |
| Community | **20** | — | 全 `2026-07-04` · **非每日生成** |

**补充探针：** `country=JP|CN` 收购均为 **0**；`country=` 空则 30。  
三波：`2026-07-04`×10 空封面 · `2026-07-14`×10 uploads（无 `cover_source`）· `2026-07-14`×10 `cover_source=catalog`。  
媒体 HEAD：`/api/v1/uploads/community-posts/ocs-dubai-luxury-acquisition-cover.jpg` → **200** `image/jpeg` 115171B。  
Guest item keys：`id` · `payload` · `updated_at`（**无 `data_origin`**）。

---

## 2 · 「修好→又乱」因果链

```text
R-02 Fly hotfix (countryIso)
  --evidence--> git_sha=0bbc7adb + deployment-01KXHHV56671K3TYB9YRW594K5 · AE/JP PASS
  --git show 0bbc7adb--> payload_country_iso 仍单键 destinationCountryIso（热修未入该树）
        |
OCS ensureListing(STATE only) + CMS waves
  --> W1 Jul4 + W2 Jul14 + W3 catalog · 同标题三 UUID · 皆 production
        |
PF scoped redeploy --> 真 SHA 231ceb21（无 fallback / 无 title dedupe / 无 badge 硬闸）
        |
Guest NOW: acquisition country=* → 0 · 每面 30 卡 · 社区 20 · 导游 25
        |
ACQ 1e1171d0 LOCAL_PASS · STAGING_DEPLOY_WAITING（审计期禁止整树 deploy）
```

**证据锚：**

| # | 锚 |
|---|-----|
| A | `evidence/GO_acquisition_country_filter_fix/ACQUISITION-COUNTRY-FILTER-FORENSIC-LATEST.json` · `git_sha_at_deploy=0bbc7adb` · `image=deployment-01KXHHV…` |
| B | `git show 0bbc7adb:crates/api/src/routes/market_subsite_list_query.rs` · acquisition 仅读 `destinationCountryIso` |
| C | Staging `/meta` = `231ceb21`；现网 `GET …/acquisition/listings?country=AE` → **n=0** |
| D | `scripts/dev/run-official-cold-start-dataset.cjs` · `ensureListing`：`if (state.listings[lKey]?.id) return` |
| E | Live 30 = 10×3；W3 带 `cover_source=catalog` |
| F | `1e1171d0` 含 fallback + catalog title dedupe + `[color:var(--ref-sun)]`；**未部署** |

---

## 3 · 数据血缘图

```text
OCS Dataset (10 cities)
  ensureListing: STATE hit → return; else INSERT + publish + surfaces
   ├─ W1 UUID Jul-04 studio · cover empty
   ├─ W2 UUID Jul-14 cover_url=/api/v1/uploads/… · no cover_source
   └─ W3 UUID Jul-14 cover_source=catalog
        ↓
PG market_listings（多 UUID · data_origin≈production → 不过非 production 闸）
        ↓
GET /api/v1/market/{acquisition|provider}/listings
  filter: is_non_production only（不藏同标题多行）
  country: acquisition = destinationCountryIso ONLY；provider = countryIso
  DTO: { id, payload, updated_at } 剥 data_origin
        ↓
DOM 30 cards（空封面 → FE Unsplash / gradient 掩盖）
Disk COS: data/community_post_media → GET /api/v1/uploads/community-posts/:name（ephemeral）
```

---

## 4 · 部署覆盖矩阵

| 变更面 | R-02 热修图 | PF `231ceb21`（现网） | ACQ `1e1171d0` |
|--------|-------------|----------------------|----------------|
| API countryIso fallback | 运行态曾有 | **无（AE=0）** | committed · **未上 Staging** |
| API title/catalog dedupe | 无 | 无 | committed · 未上 Staging |
| Web badge color 硬闸 | 不稳 | **无** | committed · 未上 Staging |
| DB orphan purge/align | 无 | 无 | **本审计禁止** |
| COS / R2 CDN | ephemeral disk | ephemeral disk | 未改 |

---

## 5 · 问题清单

### P0

| ID | 问题 | 责任层 | 触发 | 影响页 |
|----|------|--------|------|--------|
| PSR-P0-01 | 部署证据 `git_sha` 可与树不一致 | Release/Deploy | 干净 SHA redeploy | 收购等 |
| PSR-P0-02 | OCS `ensureListing` 非 DB 幂等 | Ops Bootstrap | STATE 丢失/重跑 | Provider·Acquisition |
| PSR-P0-03 | Guest 列表无正式标题去重 | API Read | 多 published 同标题 | Provider·Acquisition |
| PSR-P0-04 | `countryIso` / `destinationCountryIso` 漂移 | API Contract | `country=` 筛选 | **Acquisition AE/JP/CN=0** |

### P1

| ID | 问题 | 责任层 |
|----|------|--------|
| PSR-P1-01 | `trustEscrowBadge` 无 `[color:var(--ref-sun)]`（Staging 树） | FE Token |
| PSR-P1-02 | Guest DTO 剥掉 `data_origin` | API DTO |
| PSR-P1-03 | Community 20＞正式 10（Jul4 固定批） | Ops Align |
| PSR-P1-04 | Guides 25 混 CN 旧号 | Catalog/seed |
| PSR-P1-05 | 媒体 SSOT=Fly 盘临时态 | Media Infra |

### P2

| ID | 问题 |
|----|------|
| PSR-P2-01 | FE Unsplash/渐变掩盖空封面 |
| PSR-P2-02 | 多 worktree 并行真源 |
| PSR-P2-03 | Cockpit CLOSED 不随新 deploy 自动失效 |

---

## 6 · 修复方案（顺序 · 本轮不改数 / 不整树）

1. **Gate 先于 Deploy** — provenance：`BUILD_GIT_SHA == 构建树`  
2. **Scoped only** — Owner 授权后仅推 `1e1171d0` API+Web  
3. **读路径** — countryIso fallback + catalog title dedupe + badge 硬闸  
4. **写路径（后闸）** — OCS DB upsert；CMS bind UPDATE 非第二 INSERT  
5. **Align orphans** — 单独 Owner 闸（unpublish，非静默 DELETE）  
6. **Media** — Staging 标注 ephemeral；③ R2 CDN  
7. **PF Step 5** — 公开面 Staging PASS 后解冻  

---

## 7 · 防复发 Gate（提案）

- `check-staging-meta-sha-matches-deploy-tree`
- `check-public-market-title-dedupe`（`unique_titles == formal_n`）
- `check-acquisition-country-filter`（AE/JP > 0）
- `check-trustEscrowBadge-hardgate`
- `check-community-feed-cap`
- `forbid-dirty-path-fly-deploy`

---

## 8 · 唯一 SSOT 规范（审计提案）

| 键 | 规范句 |
|----|--------|
| `DEPLOY_PROVENANCE` | `build.git_sha` 必须可复现；禁止脏 WT / 热修盖 clean SHA |
| `PUBLIC_SURFACE_CANONICAL` | Guest 每 `(variant,title)` ≤1；优先 `cover_source=catalog` |
| `OCS_UPSERT` | STATE 丢失不得第二 UUID；DB canonical key 为准 |
| `MEDIA_TIER` | Staging disk=ephemeral；③ 须 CDN |
| `NO_WHOLE_TREE` | 回归窗仅 scoped allowlist |
| `GO_SEMANTICS` | 审计 PASS ≠ 数据收口 ≠ Staging Batch ≠ Production GO |

---

## 9 · 诚实边界

本文件只读审计结论落档。未执行 DB purge / align unpublish / fly deploy / PF Step 5。  
**Production GO = NO_GO**。① ACQ 本地绿 **≠** ② Staging PASS。
