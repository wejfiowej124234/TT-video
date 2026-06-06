# ② 测试网专项验收（Phase 2）

**Status:** **Community C1–C12 PASS · Closing Gap ACTIVE** — 宽轨 **[PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md)**；Community 槽已闭 · **`TT_PHASE2_GO_VERDICT: NOT_MET`**  
**阶段：** **② 测试网** — **不**替代 **③ 公网/生产 GO**。  
**硬边界：** **不改五主路由 UI**（[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）— 仅 **数据链路**、**API**、**`/governance/*` 治理层**、非五主路由页。

**① 已收口（勿再扩页面治理）：** [PHASE1-LINKAGE-GATES.md](../../frontend/evidence/GO_local_marketing_front_closure/PHASE1-LINKAGE-GATES.md) · matrix **126/126** · **`gate:me-routes`**

**①.5 前置（当前主轨）：** [PHASE1_5-DATA-LINK-MODEL-GATE.md](./PHASE1_5-DATA-LINK-MODEL-GATE.md) — 身份/钱包/资料/质押/状态机/DB **定稿后再开本文**

**企业缺口审计（② 未启动 · 宽/窄 ② 从属）：** [PHASE2-ENTERPRISE-GAP-AUDIT.md](./PHASE2-ENTERPRISE-GAP-AUDIT.md) · 窄 ② 入口 [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md)

**证据根目录（本阶段）：** [`evidence/GO_phase2_testnet_20260526/`](../../evidence/GO_phase2_testnet_20260526/README.md)（**NOT STARTED** — 见 [企业审计 §十](./PHASE2-ENTERPRISE-GAP-AUDIT.md#十remediation-状态2026-05-28--phase-①-freeze-证据工具)）

---

## 执行顺序（强制 · ①.5 通过后启用）

| 序 | 轨道 | 真源 | ② 收口 |
|----|------|------|--------|
| **1** | **Staging HTTP 全矩阵** | [95 §9 ISS-007](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md) · [93](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) · [R-001](../../docs/spec/R-001-全站回归报告模板与汇总JSON结构.md) | `report.json` **`environment.name=staging`** + **`release_gate=GO`**（**非** ISS-007 窄切片 **`PARTIAL_GO`**） |
| **2** | **D1–D4 did-rank 数据链** | [04-附录 §3.2](../../docs/spec/04-附录-did-rank对接说明.md) | §3.2 表 **D1–D4** 各行证据路径 |
| **3** | **C-GOV MANUAL-P1** | [93 C-GOV-004/005/010](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) | 投票/委托/Claim + 钱包日志 |
| **4** | **ISS-007/008/009** | [95 §9](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md) | 在 1–3 有 staging 证据后逐项 **`[x]`** |
| **5** | **PD-009 旅行收购（②）** | [acquisition-publish-trust-rules §8.2](../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--测试网--待验backlog) · [94 §9.1 M16～M21](../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md#91--测试网验收清单产品闭环--非-①-壳层) | staging **`smoke-acquisition-pd009-*`** + **M16～M21** 证据路径 |
| **6** | **Protocol Convergence · Steward 链上 stake（②）** | [TT-9629](TT-9629-protocol-convergence-steward-stake-testnet.md) · [protocol-convergence-P1-memo §4](../spec/governance-token/protocol-convergence-P1-memo.md) | **Anvil** `smoke-steward-stake-anvil.sh` **exit 0**；**Sepolia/staging** 部署地址 + 运维记录 |
| **7** | **TT 社区 UGC / 对象存储 / 93 COM（②）** | [COMMUNITY-PHASE-2-3-ROADMAP §②](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) · [COMMUNITY-L5-CLOSURE §①](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) | staging **`e2e/community-publishdrawer-staging-evidence.spec.ts`** · **P2-1～P2-5** · **COM-②-*** 证据于 `evidence/GO_phase2_testnet_20260526/community/` |
| **8** | **`/` Web3 创新行程（② 宽轨 · 非窄 onboarding）** | [WEB3-HOME-PHASE2-BACKLOG §WEB3-P2-001～012](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) · [GO_local_web3_itinerary_l5 §①](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md) | **WEB3-P2-002～004** staging 烟测/E2E · **WEB3-P2-003** 测试网 deposit · **WEB3-P2-005～006** R-003 + session · **WEB3-P2-009～010** 收藏/AI · **WEB3-P2-012** 跨 tab/账号态 |
| **9** | **`/traveltrust` 网络叙事（② 宽轨）** | [TRAVELTRUST-NETWORK-PHASE2-BACKLOG §TTNET-P2-001～008](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) · [HOMEPAGE-NON-DATA-CLOSURE §①](../../frontend/evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) | **TTNET-P2-001～006** 媒体/API/兑换 · **TTNET-P2-005** E2E · **TTNET-P2-007** = 轨 1 R-003 |
| **10** | **真自由市场三页筛选（② 宽轨）** | [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG §MKT-FILT-P2-001～012](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) · [MARKET-L5-CLOSURE §①](../../frontend/evidence/GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) | **MKT-FILT-P2-001～003** staging 三页筛选 · **MKT-FILT-P2-004** E2E · **MKT-FILT-P2-005～006** API/cursor · **MKT-FILT-P2-008～012** 主站 facet/收藏/Studio/nil-guide/服务端筛选 · **MKT-FILT-P2-007** = 轨 1 |

**禁止假完成：** `bash scripts/gates/local-e2e-chromium-full-matrix.sh` = **① 本机 PG** ≠ ② staging；`bash scripts/gates/local-phase1-linkage-quality-gates.sh` = **①** 编排闸；**①** **`acquisition-publish-trust-rules §8.1 CLOSED`** **≠** **②** staging 收购全链 **GO**；**①** **`smoke-steward-onboarding-local.sh`** **≠** **②** Sepolia **`REGION_STEWARD_STAKE_POOL`** 已验收。

---

## 0. 环境门禁（每次跑链前）

### 0.1 填写 staging 凭据（勿提交）

```bash
cp scripts/dev/r003-staging-chain.env.example scripts/dev/.env.r003.local
# 编辑：R003_API_BASE、R003_A_PASSWORD、R003_EXECUTOR、R003_OUT=evidence/GO_phase2_testnet_20260526
# 勿设 R003_LOCAL_CHAIN（② 交付）
```

### 0.2 预检

```bash
python scripts/dev/check_r003_staging_env_ready.py --env-file scripts/dev/.env.r003.local
# exit 0 → 可跑 §1
```

### 0.3 首轮 R-003 证据链

```bash
python scripts/dev/run_r003_staging_evidence_chain.py \
  --from-env \
  --env-file scripts/dev/.env.r003.local
```

机读收口（全矩阵 GO 时）：

```bash
python scripts/validate-regression-report.py \
  evidence/GO_phase2_testnet_20260526/report.json \
  --require-go
```

**勿**对 `evidence/GO_local_r002_verify/` 的 ISS-007 窄切片单独 `--require-go`（常为 **`PARTIAL_GO`**）。

---

## 1. Staging HTTP 全矩阵（轨 1）

| 步骤 | 命令 / 动作 |
|------|-------------|
| A 域→B 域 | `run_r003_staging_evidence_chain.py`（内调 `r003_staging_full_regression.py`） |
| 失败清单 | 更新 `evidence/GO_phase2_testnet_20260526/FAILURES.md` |
| 可选 E2E | `frontend` 设 staging `NEXT_PUBLIC_API_BASE_URL` → targeted Playwright（[TT-96-20-P0-E2E-LADDER-001](TT-96-20-P0-E2E-LADDER-001.md)） |

---

## 2. D1–D4 did-rank（轨 2 · 可动 API/DB）

**前置：** staging API · `GET /meta` → `.did_rank.guides_community_penalty_exclusion=db_backed` · **禁** `NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1`

```bash
export API_BASE_URL=https://<staging-api>   # 与 R003_API_BASE 同源
bash scripts/gates/smoke-api-public-routes.sh
bash scripts/dev/check-55-quick-verify.sh
```

按 [04-附录 §3.2](../../docs/spec/04-附录-did-rank对接说明.md) 填 **D1–D4** 证据（脱敏 JSON + `x-request-id`）。

---

## 3. C-GOV MANUAL-P1（轨 3）

| ID | 验收 |
|----|------|
| C-GOV-004 | `POST …/vote` + 链上再读或 **N/A** |
| C-GOV-005 | `GET/POST …/delegate` |
| C-GOV-010 | `/governance/distribution-claim` 钱包写；失败 **BLOCKED** 说明 |

**① 已跑：** `npm run gate:governance-matrix`（只读契约）**不替代** 本轨。

证据：`evidence/GO_phase2_testnet_20260526/governance-manual-p1/`

---

## 4. ISS 登记（轨 4）

| ISS | ② 闭证要点 |
|-----|------------|
| ISS-007 | staging **`report.json` GO** + 93 执行记录 |
| ISS-008 | staging **S3** presign→commit 头像链 |
| ISS-009 | 多实例幂等 / PG SSOT（Runbook 或 ADR） |

登记：[95 §9](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md) · 勿改 **07** 完成度 %（纯证据轮）。

---

## 5. PD-009 旅行收购（轨 5 · ② 增量）

**① 已闭：** [acquisition-publish-trust-rules §8.1](../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) — **禁止** 用 **①** IT/vitest/smoke 冒充 **②** staging **GO**。

| 步骤 | 命令 / 动作 |
|------|-------------|
| 环境 | staging **`API_BASE_URL`** + **`DATABASE_URL`** migrate；**禁** **`NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1`** |
| 发布→接单 | **`bash scripts/dev/smoke-acquisition-pd009-local.sh`**（**`API_BASE_URL`** 指向 staging） |
| 信任分 parity | **`bash scripts/dev/smoke-acquisition-trust-parity-local.sh`**（staging seed 用户 ID） |
| 清单 | [94 §9.1 **M16～M21**](../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md#91--测试网验收清单产品闭环--非-①-壳层) + [§8.2 表](../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--测试网--待验backlog) 逐项证据 |

**③ 不在本文完成标准内** — 见 [94 §9.2 P1～P8](../../docs/spec/94-自由市场-商家橱窗与旅行收购-链上托管技术规格.md#92--公网生产验收清单旅行收购-pd-009--增量) · [acquisition-publish-trust-rules §8.3](../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#83-第三阶段--公网生产--待验backlog) — **另闸**。

---

## 6. TT 社区 UGC / 对象存储（轨 7 · ② 增量）

**① 已闭：** [COMMUNITY-L5-CLOSURE §①](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) · PI-1 **8/8** · MinIO 证据 **`run-community-publishdrawer-browser-evidence.sh`** — **禁止** 用 **①** 冒充 **②** staging **GO**。

| 步骤 | 命令 / 动作 |
|------|-------------|
| backlog SSOT | [COMMUNITY-PHASE-2-3-ROADMAP §②](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md)（**P2-1～P2-6** · **COM-②-1～COM-②-8**） |
| **①→② 增量（2026-06）** | **COM-②-4** 真帖评论持久化 · **COM-②-5** Feed 抽屉 staging E2E · **COM-②-6** 逐条通知 API · **COM-②-7** C9 视觉复跑 · **COM-②-8** staging 视频发布/CDN（**HLS** 仍 **P2-1 pending**） |
| 环境 | staging **`COMMUNITY_MEDIA_S3_*`** + **`NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL`** · [COMMUNITY-MEDIA-OBJECT-STORAGE](./COMMUNITY-MEDIA-OBJECT-STORAGE.md) |
| 浏览器证据 | `frontend` · **`e2e/community-publishdrawer-staging-evidence.spec.ts`**（见 [community-publishdrawer-staging-evidence](./community-publishdrawer-staging-evidence.md)） |
| 矩阵 | 93 **COM** 域 · staging **`report.json` GO**（轨 1 并跑） |

**③ 公网/生产** 见 [COMMUNITY-PHASE-2-3-ROADMAP §③](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md)（**P3-COM-***）— **另闸**，**不在本文完成标准内**。

---

## 8. `/` Web3 创新行程（轨 8 · ② 增量）

**① 已闭：** [GO_local_web3_itinerary_l5](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md) · [FIVE-MAIN `/` UI 冻结](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) — **禁止** 用 **①** mock-pay / 本地烟测冒充 **②** 真 USDC / staging **GO**。

| 步骤 | 命令 / 动作 |
|------|-------------|
| backlog SSOT | [WEB3-HOME-PHASE2-BACKLOG §WEB3-P2-001～005](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) |
| 环境 | staging **`R003_API_BASE`** + staging DB · **TT-9630** 测试网合约/registry · **`P3_CHAIN_OFF=0`**（或 staging 链 SSOT 按 **04**） |
| API 全链 | **`bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh`**（**`API_BASE_URL`** 指向 staging）→ 目标末行 **`TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK (② staging)`** |
| 真 USDC / deposit | **`/pay`** + Escrow **`deposit`**（**WEB3-P2-003**）· tx + **`GET /orders/:id`** 对拍 |
| E2E | **`npm run e2e:web3-itinerary-10`**（staging Next + staging API）或 enterprise-10 staging 变体 |
| Phase B 视频 | **WEB3-P2-001** · [`public/media/landing/README.md`](../../frontend/public/media/landing/README.md) · **无 UI 结构改版 |
| 矩阵 | **WEB3-P2-005** = 轨 1 **`report.json` `release_gate=GO`**（含 `/` 域） |

**③ 不在本文完成标准内** — 主网真资金 Escrow · 生产 PSP · [go-live-checklist](../go-live-checklist.md) — 见 **WEB3-HOME-PHASE2-BACKLOG · WEB3-P3-***。

---

## 9. `/traveltrust` 网络叙事（轨 9 · ② 增量）

**① 已闭：** [HOMEPAGE-NON-DATA-CLOSURE](../../frontend/evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) · [FIVE-MAIN `/traveltrust`](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) — **禁止** 用 **①** cinematic 绿集冒充 **②** 真 page-brief / 实拍 / 测试网 swap **GO**。

| 步骤 | 命令 / 动作 |
|------|-------------|
| backlog SSOT | [TRAVELTRUST-NETWORK-PHASE2-BACKLOG §TTNET-P2-001～008](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) |
| 角色媒体 | **TTNET-P2-001** · [`DEFER-02-ROLE-MEDIA`](../../frontend/evidence/GO_local_cinematic_l5_closure/DEFER-02-ROLE-MEDIA.md) · `traveltrust-phase2-local-prep.sh` |
| page-brief | **TTNET-P2-003** · staging **`GET /api/v1/traveltrust/page-brief`** · **无** dev-fallback |
| 稳定币段 | **TTNET-P2-004** · 测试网兑换数据链 · **UI 壳不变** |
| E2E | **TTNET-P2-005** · `e2e/pi1-traveltrust-v6-browser-acceptance.spec.ts` on staging |
| 矩阵 | **TTNET-P2-007** = 轨 1 **`release_gate=GO`** |

**③ 不在本文完成标准内** — **TTNET-P3-001～004** — 生产 swap · 法务 · Lighthouse · go-live。

---

## 10. 真自由市场三页筛选（轨 10 · ② 增量）

**① 已闭（2026-06-03 · 数据链 · UI 未动）：** [`MARKET-L5-CLOSURE`](../../frontend/evidence/GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md)（**`/market` 旅行预约**）· [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG §①`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md)（**子站 catalog filter**）— **禁止** 用 **①** vitest / 本地 demo 冒充 **②** staging PG **`release_gate=GO`**。

| 步骤 | 命令 / 动作 |
|------|-------------|
| backlog SSOT | [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG §MKT-FILT-P2-001～012](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| 旅行预约 | **MKT-FILT-P2-001** · staging **`GET /guides`** + discover + facet registry · 深链 query |
| 商家 / 收购 | **MKT-FILT-P2-002～003** · staging **`GET …/market/{provider\|acquisition}/listings?country=&category=&sort=`** · 摘要条数 = 列表 |
| E2E | **MKT-FILT-P2-004** · staging Playwright provider + acquisition 筛选组合 |
| API 对拍 | **MKT-FILT-P2-005** · **94 §2.3.5** · `market_subsite_list_query.rs` |
| 分页 | **MKT-FILT-P2-006** · catalog **>200** · **`cursor=`** |
| 矩阵 | **MKT-FILT-P2-007** = 轨 1 **`release_gate=GO`**（**93 B-MKT**） |
| 主站 facet | **MKT-FILT-P2-008** · staging discover/guides **客户端 facet/天数/排序** 与 PG 对拍 |
| 收藏 | **MKT-FILT-P2-009** · **`/market`** localStorage → **`/me`** 或等价 |
| Studio | **MKT-FILT-P2-010** · 商家 **paid entitlement** FE（API 暴露后） |
| nil-guide | **MKT-FILT-P2-011** · 一步抢单（`MARKET-L5-CLOSURE` §②） |
| 服务端筛选 | **MKT-FILT-P2-012** · discover/guides **facet/天数/sort** 收敛进 API query |

**③ 不在本文完成标准内** — **MKT-FILT-P3-001～005** — 生产分页 · 搜索 · CDN · 收藏 · **go-live**。

---

## 互指

| 文档 | 用途 |
|------|------|
| [TT-9618](TT-9618-onboarding-local-testnet.md) | 准入费 **②** Stripe test（若在 scope） |
| [TT-9628 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) | 93/96-20 非穷举 |
| [缺口表 · R-01](../../docs/spec/缺口与待补-官方总表.md) | 完成度防混读 |
| [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) | 阶次纪律 |
| [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) | 六轨缺口 · ① vs ② 机读对照 |
| [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) | 窄 ② · G-0～G-4 |
| [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) | ① 已闭环 |

---

## 变更记录

| 日期 | 说明 |
|------|------|
| 2026-05-26 | 初版：② 四轨顺序 · 证据根 `GO_phase2_testnet_20260526` |
| 2026-05-27 | **轨 5**：PD-009 旅行收购 **②** 增量（**§5**）；互指 **acquisition-publish-trust-rules §8** · **94 §9.1 M16～M21** |
| 2026-05-28 | 互指 [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md)；证据根目录标注 **待建** |
| 2026-05-30 | **轨 7**：TT 社区 **②** 增量（**§6**）；**①** 见 **COMMUNITY-L5-CLOSURE** · **②③** **COMMUNITY-PHASE-2-3-ROADMAP** |
| 2026-06-01 | **§6**：**COM-②-4～COM-②-8** — ① 社区审计收口后 staging 待验（评论持久化 · 抽屉 E2E · 逐条通知 · C9 复跑 · staging 视频/CDN） |
| 2026-06-03 | **轨 8**：**`/` Web3 创新行程 **②** backlog（**WEB3-P2-001～005** · **§8**）— 补全原仅 **① 已闭**、宽轨未单列项 |
| 2026-06-03 | **轨 9** + **§9**：**`/traveltrust`** **TTNET-P2-001～008** · **WEB3-P2-006** 补 **`/`** session/登录 |
| 2026-06-03 | **轨 10** + **§10**：**真自由市场三页筛选** **MKT-FILT-P2-001～012** · **MKT-FILT-P3-001～005** — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) · **轨 8** **WEB3-P2-012** |
