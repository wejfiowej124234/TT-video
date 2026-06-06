# `/traveltrust` TravelTrust 网络叙事页 · Phase ②/③ 待验 backlog（2026-06-03）

**阶段：② 测试网** — **宽轨**（**非** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) 窄 onboarding 主清单）  
**① 已闭（不重做）：** UI 壳 + layout lock + cinematic L5 + 稳定币段 **示意 UI** — [`HOMEPAGE-NON-DATA-CLOSURE`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) · [`FIVE-MAIN` `/traveltrust` 段](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

**硬边界：** **不改** layout lock / 节序 / L1 chrome；② 仅 **真 API / 真媒体 / 测试网兑换 / staging 证据**。

**与 `/` Web3 旅行分工：** 顶栏 **「Web3旅行」→ `/`**（任务链见 [`WEB3-HOME-PHASE2-BACKLOG`](./WEB3-HOME-PHASE2-BACKLOG.md)）；**字标 TravelTrust → `/traveltrust`**（本文件）。

---

## 总表

| ID | 清单项 | ① 状态 | ② 任务 | ③ |
|----|--------|--------|--------|---|
| **TTNET-P2-001** | 五角色 **实拍** MP4 + poster（剧场 Tab） | tier-1 **暖棕占位** 已闭 | **② 待验** | — |
| **TTNET-P2-002** | 官方社媒等 **https** 外链 env | 占位 / 相对路径 **①** | **② 待验** | 生产 URL 轮换 → **③** |
| **TTNET-P2-003** | **`GET /api/v1/traveltrust/page-brief`** staging **真 API**（**非** dev-fallback） | 本地 fallback **①** | **② 待验** | — |
| **TTNET-P2-004** | **TTG 测试网真兑换**（`TravelTrustStablecoinGateway` 数据链；**UI 仍 L4 示意**） | 示意 UI **已冻** | **② 待验** | 生产 swap → **③** |
| **TTNET-P2-005** | **staging E2E** · `pi1-traveltrust-v6` / cinematic 验收 | ① 本地 E2E **可选** | **② 待验** | — |
| **TTNET-P2-006** | **测试网 RPC** · 页内只读链上引用诚实化（**非**主网） | chain_off / 占位 **①** | **② 待验** | 主网 RPC → **③** |
| **TTNET-P2-007** | **staging 全矩阵** `release_gate=GO`（含 `/traveltrust` 行） | — | **② 待验**（= [`WEB3-P2-005`](./WEB3-HOME-PHASE2-BACKLOG.md) · 轨 1） | — |
| **TTNET-P2-008** | 生产埋点 ingest（**TT-PH1-050** defer） | ① 无生产 ingest | **② 待验** | 全量观测 → **③** |
| **TTNET-P2-009** | **staging cinematic/Hero 探针** · `verify-cinematic-l5` + P0/P1 globe（**FIVE-MAIN cinematic defer**） | ① 本地 **已闭** | **② 待验** | — |

---

## 逐项说明

### TTNET-P2-001 · 五角色实拍

| 项 | 内容 |
|----|------|
| **真源** | [`DEFER-02-ROLE-MEDIA.md`](../GO_local_cinematic_l5_closure/DEFER-02-ROLE-MEDIA.md) · [`PHASE2-LOCAL-PREP.md`](../GO_local_cinematic_l5_closure/PHASE2-LOCAL-PREP.md) |
| **② 完成标准** | 四角色 MP4/poster 入库 · `NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback` · 剧场切换无冷闪 · **无** layout 改版 |
| **证据** | `capture-cinematic-l5-evidence.sh` · §6.2 PNG 更新 |

### TTNET-P2-002 · 社媒 / 外链 env

| 项 | 内容 |
|----|------|
| **真源** | `.env.traveltrust-media.example` · `useTraveltrustMediaUrlsHydrated` |
| **② 完成标准** | staging env 填 **https** 官方 URL · 页内链接可点击可达 |

### TTNET-P2-003 · page-brief 真 API

| 项 | 内容 |
|----|------|
| **真源** | `useTravelTrustPageBrief` · `TravelTrustPageBriefContext` · **04 §3.4** |
| **② 完成标准** | staging **`API_BASE`** 返回 200 · **`data-tt-traveltrust-page-brief-ready="1"`** · **无** `x-tt-page-brief-source: dev-fallback` |
| **① 对照** | `e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts` |

### TTNET-P2-004 · 测试网 TTG 兑换

| 项 | 内容 |
|----|------|
| **真源** | `TravelTrustStablecoinGateway` · `liquidity_contract.quote_path` |
| **② 完成标准** | 测试网钱包可完成 **quote → swap**（或项目等价路径）· **不**改 `TT_STABLECOIN_GATEWAY_L5` 壳 |
| **③** | 生产参数 + 真 swap — FIVE-MAIN §③ |

### TTNET-P2-005 · staging E2E

| 项 | 内容 |
|----|------|
| **② 完成标准** | staging Next URL + staging API · `pi1-traveltrust-v6`（或 subset）**exit 0** |
| **证据** | `evidence/GO_phase2_testnet_20260526/traveltrust-network/`（待建） |

### TTNET-P2-006 · 测试网 RPC 只读

| 项 | 内容 |
|----|------|
| **② 完成标准** | staging **`CHAIN_RPC_URL`** + `/meta` 链字段与页内叙事一致 · **L5 示意标注非主网** |
| **③** | 主网真 RPC · TT-MAINNET |

### TTNET-P2-007 · R-003 全矩阵

| 项 | 内容 |
|----|------|
| **真源** | 与 **`WEB3-P2-005`** 同源 — [PHASE2-TESTNET-ACCEPTANCE · 轨 1](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) |

### TTNET-P2-008 · 埋点

| 项 | 内容 |
|----|------|
| **真源** | **TT-PH1-050** defer ② |
| **② 完成标准** | staging analytics 管道可接收事件（脱敏验证） |

### TTNET-P2-009 · staging cinematic / Hero 探针

| 项 | 内容 |
|----|------|
| **真源** | [`verify-cinematic-l5-local.sh`](../../../scripts/gates/verify-cinematic-l5-local.sh) · [`GO_local_hero_globe_a_closure`](../GO_local_hero_globe_a_closure/README.md) |
| **② 完成标准** | staging URL 上 P0/P1 globe 探针 + cinematic 闸 **exit 0** · **无** WebGL/遮挡回流 |
| **与 P2-001 分工** | P2-001 = 角色剧场 MP4；P2-009 = Hero 地球 + cinematic 工程闸 |

---

## ③ 明确不在 ②（勿混入）

| ID | 项 |
|----|-----|
| **TTNET-P3-001** | **`TT_STABLECOIN_GATEWAY_L5` 生产参数 · 真 swap · 主网** |
| **TTNET-P3-002** | 法务文案终稿 · 审计披露 |
| **TTNET-P3-003** | Lighthouse / WCAG 全站深测 — [`DEFER-03-LIGHTHOUSE-WCAG.md`](../GO_local_cinematic_l5_closure/DEFER-03-LIGHTHOUSE-WCAG.md) |
| **TTNET-P3-004** | [`go-live-checklist`](../../../docs/go-live-checklist.md) Production GO · **93** 全站 |
| **TTNET-P3-005** | 生产社媒/CDN 媒体 URL 轮换与可用性（**TTNET-P2-002** 生产化） |

---

## 不在本页 ②/③ 单列（全站或其它 Phase · 勿混入）

| 项 | 阶段 | 说明 |
|----|------|------|
| **`/` 云朵/粒子背景** | — | FIVE-MAIN **明确不做** |
| **`#overview` 四卡** | — | layout lock **禁止恢复** |
| **80 Live Quote 页 / pricing_service** | 80 Phase 2 | 独立产品，非 Landing 壳 |
| **80 RAG / Import Quote** | 80 Phase 2/3 | 行程平台能力，非本两页 UI |
| **TT-PH1-222/223/230** | ① 已闭 | **`/market`** 专项，非 `/`/`/traveltrust` |

## 互指

| 文档 | 用途 |
|------|------|
| [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md) | ① 总表 #2 `/traveltrust` |
| [`app/traveltrust/README.md`](../../app/traveltrust/README.md) | 代码 SSOT |
| [PHASE2-TESTNET-ACCEPTANCE · 轨 9](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) | 宽 ② 执行 |
| [PHASE2-ENTERPRISE-GAP-AUDIT §3.9](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md) | 企业缺口 |
