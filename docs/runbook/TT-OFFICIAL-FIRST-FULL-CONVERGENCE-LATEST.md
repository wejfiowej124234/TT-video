# Official-First Full Convergence（官网母版 · 全量产品/文档对齐）

**STATUS:** `IN_PROGRESS`  
**Gate:** `PRODUCT_AND_DOCUMENTATION_PARITY` = **FAIL**（身份层 1:1 已 PASS · **深度模块未闭** · **禁止**开始产品优化 / CMS 修复 / UI·UX 改造）  
**Identity gates (2026-08-22):** `TT_OFFICIAL_V9_1TO1_MAP: PASS` · `TT_OFFICIAL_V9_PLANE_MAP: PASS`  
**Recorded:** 2026-08-22  
**Constitution:** [Dual Truth Planes](TT-TRAVELTRUST-DUAL-TRUTH-PLANES-LATEST.md)  
**Official Living Pin:** [OPS-2026.08.20-v9](TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)  
**`TT_PRODUCTION_GO`:** **NO_GO**（全过程不翻转）

---

## 0 · Owner mandate（写死）

除 **Web3** 外，**Official Production（OPS-v9）** 是唯一 Living SSOT：产品、代码、配置、运行时、数据展示、**白皮书与所有非 Web3 真源文档**。

```text
Official Reality Capture → freeze Official Baseline
        ↓
Git / 主分支 / 发布分支 / Local / Staging / API / DB / CMS / OCS /
对象存储 / Auth·Admin / UI·UX / 路由 / i18n / Assets·CDN /
Env·Flags / Build·Image·Digest / Registry / Release Identity /
Runbook / 白皮书 / 非 Web3 文档
        ↓
Official = Git(main=tip) = Local = Staging   （产品身份 1:1）
        ↓
PRODUCT_AND_DOCUMENTATION_PARITY_PASS
        ↓
才允许产品优化 / 功能升级 / CMS 修复 / UI·UX 改造
```

对齐中只登记 **Residual / Defect**，**禁止**边对齐边擅自优化官网。

---

## 1 · Web3 唯一隔离例外

| 规则 | 口径 |
|------|------|
| SSOT | FTB + V9 Design Freeze + Candidate `b19b85810…` |
| 阶梯 | Local → Audit → Sepolia → Audit/Exact-Match → Owner Auth → Mainnet Reality |
| 禁止 | 用官网旧 Web3 **覆盖** Candidate |
| 禁止 | Mainnet V9 Reality 完成前把 Candidate 写成官网 **LIVE** |
| 反向更新 | 仅当 Mainnet 部署 + 资金/治理路由切换 + `OLD_ACTIVE_REFS=0` + Mainnet Reality PASS |
| 经济/权限 | 已冻结目标 **不得改** |
| Mainnet 广播 | **NOT_AUTHORIZED** |
| P0 | Sepolia ETA Reality 可打断本收敛 |

官网 Web3 文案仅允许：**LIVE / TARGET / LEGACY**。

---

## 2 · Official Baseline（本波冻结引用）

| Field | Value |
|-------|-------|
| Pin | TravelTrust Official · OPS-2026.08.20-v9 |
| Web | https://www.web3-ttg.com |
| `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` |
| `build_time` | `2026-08-20T00:51:57Z` |
| Image | `hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Bootstrap | v8 |
| API | `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51`（www freeze 不改 API） |
| Identity note | **身份 SHA ≠ 干净 checkout** · 回滚只许 Fly image restore |

**2026-08-22 live observe:** release-identity 与 pin **一致** · Fly image **一致** → `OFFICIAL_PRODUCT_BASELINE_FROZEN_FOR_CONVERGENCE = YES`（产品身份层）。  
更深 UI/CMS/Auth/DB Capture 层仍可继续补证据，**不得**因此推迟“以官网为母版”的对齐。

Capture pack: [TT-OFFICIAL-PRODUCT-REALITY-CAPTURE-LATEST](TT-OFFICIAL-PRODUCT-REALITY-CAPTURE-LATEST.md)

---

## 3 · 产品身份 1:1 公式（机读）

```text
Official www identity  = PIN 3e356617…
Staging  www identity  = PIN 3e356617…   (build_time 可不同)
Release WT HEAD        = PIN
main SHA               = tip SHA (release/official-ops-v9-product-ssot)
```

Frontend mother tree（文档/母版一致性）:

```text
Release Candidate = OPS Mother (3e356617)
                  + V9 Approved Allowlist（原子 manifest）
                  − HEAD-only 14 EXCLUDED_FROM_RELEASE
```

Gate: `bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh`  
Plane: `bash scripts/gates/check-official-v9-plane-map.sh`

**Staging API Sepolia / 不同 SHA = Expected Difference（Web3 平面）· 不得用 Official API 冒充 Staging。**

---

## 4 · 2026-08-22 Residual（更新）

| ID | Surface | Observed | Required | Class |
|----|---------|----------|----------|-------|
| R-01 | Staging www | **CLOSED** · live `git_sha=3e356617…` · `build_time=2026-08-22T03:27:28Z` | pin identity | **CLOSED**（align retry OK） |
| R-01a | Staging bake media | `region_steward.mp4` LFS | tip 种子 | **CLOSED** |
| R-01b | Staging bake labels | `psg_release_version=PSG-REL-…CAND-V2` · Candidate profile | 产品 www pin 已对齐；标签 = Staging Web3 ED | **CONFIRM_DESIGN**（plane-map ED） |
| R-02 | Repo main≠tip | **CLOSED locally** · main:=tip `c40444835…`（**未 push**） | main == tip | **CLOSED_LOCAL** · remote main 仍待 Solo push 另令 |
| R-03 | Tip vs pin | tip 含 V9 Candidate（**保护**） | 身份门认 pin；Candidate 不回退 | **WEB3_CANDIDATE_PROTECTED** |
| R-04 | Capture depth | UI/CMS/Auth/Admin/Assets/i18n/DB OPEN | 继续只读补证 | **CAPTURE_PARTIAL** |
| R-05 | Dirty WT | 收敛文档/evidence 未提交 | 可 COMMIT meta | **CONVERGENCE_META** |
| R-06 | 1to1 / plane-map | **PASS** | PASS | **CLOSED** |
| R-07 | Docs/白皮书 | Official-first note 已立 | 逐份扫残留 | **DOC_ALIGN_OPEN** |
| R-08 | Official routes | 若干 404 AS-IS | Capture only | **OFFICIAL_ROUTE_AS_IS** |

**禁止**把 OPEN 项当借口改官网像素/功能。

---

## 5 · 执行模块（顺序 · ETA 可打断）

| # | Module | Status |
|---|--------|--------|
| M0 | Sepolia ETA P0 | ACTIVE waiter |
| M1 | Official Reality Capture + Baseline freeze cite | **IDENTITY_FROZEN** · depth OPEN |
| M2 | Residual register | **OPEN**（上表） |
| M3 | Staging www → Official pin | **PASS**（`git_sha` pin） |
| M4 | main := tip（Solo 本地） | **PASS_LOCAL** · push 另令 |
| M5 | Local Runtime / env / flags vs Official | **DEPTH_SCAN_REGISTERED** · see `M5_M9_DEPTH_RESIDUALS_20260822.json` |
| M6 | API product behavior / DB schema inventory | **DEPTH_SCAN_REGISTERED**（API `/meta` ED 已录 · DB schema dump OPEN） |
| M7 | CMS/OCS / media refs | **DEPTH_SCAN_REGISTERED**（只登记 · 不修内容） |
| M8 | Auth/Admin/UI/routes/i18n | **DEPTH_SCAN_REGISTERED** |
| M9 | Registry / Release Identity / Runbook / 白皮书非 Web3 | **DEPTH_SCAN_REGISTERED** |
| M10 | `PRODUCT_AND_DOCUMENTATION_PARITY_PASS` | **NOT_ISSUED** |

**Identity-layer commit:** `8ca90a08a` · **Depth residuals commit:** `508a006e8`  
**Depth residual pack:** [`M5_M9_DEPTH_RESIDUALS_20260822.json`](../../evidence/GO_official_product_reality_capture/M5_M9_DEPTH_RESIDUALS_20260822.json)  
**28-item alignment plan:** [`TT-OFFICIAL-FIRST-M5-M9-ALIGNMENT-PLAN-LATEST`](TT-OFFICIAL-FIRST-M5-M9-ALIGNMENT-PLAN-LATEST.md) · [`M5_M9_ALIGNMENT_PLAN_20260822.json`](../../evidence/GO_official_product_reality_capture/M5_M9_ALIGNMENT_PLAN_20260822.json) — **OWNED_PLAN_ISSUED** · **execution NOT_STARTED_NO_FIX**

**Next:** Capture deepen + DOC_RETAG + ED/DESIGN confirm + DEFECT 入 Parity-后队列 → 再 Official→Git→Local→Staging 1:1 执行 → 才可申请 `PRODUCT_AND_DOCUMENTATION_PARITY_PASS`。**禁止**本波 CMS/UI/功能优化。

Staging align command（Owner Solo）:

```bash
TRAVELTRUST_STAGING_V9_ALIGN_OK=1 FLY_WEB_REMOTE_BUILD=1 \
  bash scripts/dev/align-staging-www-official-v9.sh
```

---

## 6 · 文档 / 白皮书 Official-first

| 类 | 真源 |
|----|------|
| 产品 / UI / CMS / 运营 / 非链上白皮书叙述 | **Official OPS-v9** |
| Web3 协议白皮书 Mainnet Edition | FTB / Plane A（LIVE 事实） |
| V9 Periphery Delta | Candidate / TARGET（≠ LIVE） |
| 禁止 | Local/Staging 叙述覆盖官网产品真源 |

---

## Machine

- Status: [`evidence/GO_official_product_reality_capture/OFFICIAL_FIRST_FULL_CONVERGENCE_STATUS.json`](../../evidence/GO_official_product_reality_capture/OFFICIAL_FIRST_FULL_CONVERGENCE_STATUS.json)
- Residuals: [`…/OFFICIAL_FIRST_FULL_CONVERGENCE_RESIDUALS.json`](../../evidence/GO_official_product_reality_capture/OFFICIAL_FIRST_FULL_CONVERGENCE_RESIDUALS.json)
- Registry: [`registry/official-first-full-convergence.v1.yaml`](../../registry/official-first-full-convergence.v1.yaml)
