# PSG · Coverage Gap Completion（Non-Web3）· 测试补齐窗口

**Machine:** `TT_PSG_COVERAGE_GAP_COMPLETION_NON_WEB3`  
**Status:** **CLOSED** · Phase1 LIVE + Phase2 cell-fill + **Phase3 residual NOT_RUN=0** · Evidence **VERIFIED** · Metric **FINAL** · `2026-07-19`  
**Phase3：** 剩余 RBAC 13 + Data Create×2 定向补齐 → [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md)  
**停扩：** 禁止随机扩测 · 定向 NOT_RUN 已闭 · Fix=8 不动  
**Mode:** 补测试 / 补验证证据 · Register 关联最小修复仅 seed role（`ΔFix=0`）· **≠** Web3 Min-Fix  
**Authenticity：** [Audit](./TT-PSG-COVERAGE-GAP-NON-WEB3-AUTHENTICITY-AUDIT-LATEST.md)  
**标准：** [Threshold Matrix](./TT-PSG-COVERAGE-ACCEPTANCE-THRESHOLD-MATRIX-LATEST.md)  
**Metrics：** [Metrics Baseline](./TT-PSG-COVERAGE-METRICS-BASELINE-LATEST.md)（历史 Formal · **非**本窗估数）  
**Evidence dir：** `evidence/GO_pre_eta_production_prep/coverage-gap-non-web3-20260719/`

```text
PSG:                 CONDITIONAL_GO
Fix:                 8
Coverage Evidence:   VERIFIED
Coverage Metrics:    FINAL
Consistency Control: NOT_ALIGNED
Threshold Rollup:    NEED_FIX
```

> **Consistency Control：** [TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) —  
> 本窗 Phase1–3 证据 = **LOCAL_PASS**；**禁止**仅本地计入 Coverage Acceptance PASS。  
> 须 **Git SHA 固化 → Staging 同 SHA → Evidence → Recalculate** 后才升 **ALIGNED_PASS**。
> **是：** 真实运行证据归档 · 分母定义后正式 Recalculate  
> **否：** 用估数写「RBAC 95% / Journey 90%」· 改产品代码刷覆盖 · 大回归  
> **禁碰（等 48h / Release Window）：** WalletConnect · ACTIVE Runtime · 钱包签名 · 链上执行 · Timelock · Steward 链能力 · Money-Path · 全量 E2E/Perf/行覆盖  
> **不改变** Fix Required=8 · `CONDITIONAL_GO`

---

## 0 · 窗口纪律

| 允许 | 禁止 |
|------|------|
| 跑已有 smoke / vitest / cargo **非 Web3** 切片 | 改 FE/BE 产品逻辑「为了刷覆盖」 |
| 补 Evidence · 填 Measurement 格 · **禁止估 %** | 新开 Security/UI/CMS 深 Audit 轨 |
| 发现 **测试缺口** → 可补测试文件（窄） | 把结果写成新的 Release Fix（Web3 已入册的除外） |
| 发现 **产品缺陷** → 记 Register Deferred/已知桶 | 扩大为全站回归 |

---

## 1 · 本窗已做 vs Measurement 目标（估数禁用）

| 序 | 维 | Evidence | Metric FINAL（P3） | Threshold |
|----|-----|----------|-------------------|-----------|
| ① | **User Journey** | VERIFIED | **5/5 (100%)** | **PASS** |
| ② | **RBAC** | VERIFIED | **60/96 (62.5%)** | **NEED_FIX** |
| ③ | **Data Lifecycle** | VERIFIED | **20/20 (100%)** | **PASS** |
| ④ | **UI/UX P0** | VERIFIED | **24/24 (100%)** | **PASS** |
| ⑤ | **Functional** | Vitest 旁证 | （非本分母） | — |
---

## 2 · Journey 补齐范围（非 Web3）

| 角色 | 本窗要验 | **本窗不要碰** |
|------|----------|----------------|
| Tourist | 注册 · 登录 · 浏览市场 · 创建需求 · 查看订单 | 钱包签名 · Escrow 上链 |
| Guide | 创建/完善身份 · 接单 · 查看订单状态 | 链上 stake |
| Provider | 创建服务 · 发布 · 市场展示 | Web3 绑定 Fix |
| Steward | 申请 · 查看状态 | 链上治理能力 · ACTIVE FE |
| Admin | 登录 · 核心后台入口 | live 全角色攻击矩阵（可抽样 API 拒） |

脚本入口（优先复用）：

- Tourist/市场/订单：`smoke-web3-itinerary-full-chain-local.sh`（**停在预链上**）· `smoke-orders-list-local.sh` · auth register lib  
- Guide：`smoke-guide-workbench-l5-local.sh` · `smoke-guide-detail-booking-local.sh`  
- Provider：`smoke-provider-onboarding-local.sh` · `smoke-provider-workbench-l5-local.sh`  
- Steward（非链）：`smoke-steward-onboarding-local.sh` · workbench L5（**不对拍 ACTIVE 地址**）  
- Admin：`smoke-admin-pages-local.sh` · `smoke-admin-rbac-matrix-local.sh`

---

## 3 · RBAC 补齐矩阵（必须）

| 角色 | 正常能力（验） | 禁止能力（验拒绝） |
|------|----------------|--------------------|
| Tourist | 用户功能 | Admin API/页 → 401/403 |
| Guide | Guide 功能 | Provider/Admin 越权 → 拒 |
| Provider | Provider 功能 | Admin 越权 → 拒 |
| Steward | Steward 功能 | 越权 → 拒 |
| Admin | 后台功能 | 非授权角色 → 拒 |

验证面：UI 可见性 · API 401/403 · 后端门闸生效。

---

## 4 · Data / UI / Functional（摘要）

- **Data：** 只补 SSOT + 生命周期探针（Specialty/catalog smokes）· **禁** CMS 深挖  
- **UI P0：** `/` · Market · Orders · Escrow（草稿壳）· Profile · Governance（**只进页/态** · 不验链上投票）  
- **Functional：** 证据齐全度打分刷新 · 无新功能

---

## 5 · 暂缓（等解锁 / 另闸）

| 项 | 原因 |
|----|------|
| WalletConnect | Min-Fix / 48h |
| ACTIVE Runtime | Web3 Fix |
| Governance 真链操作 | Timelock |
| Steward 链能力 | Web3 |
| Money-Path | 另闸 |
| Code Coverage % | 不挡首次 |
| 性能压测 | 不适现在 |

---

## 6 · 本窗运行记录

| Stamp | 动作 | 结果 | Evidence |
|-------|------|------|----------|
| 2026-07-19 | Vitest Auth/Provider/Me/Acquisition | **42 PASS** | `vitest-non-web3-identity.log` |
| 2026-07-19 | Vitest Admin permission + Honesty + WalletCenter contract | **15 PASS**（Wallet=契约 only · **非** WC key Fix） | `vitest-admin-ui.log` |
| 2026-07-19 | Vitest homeMarketing + escrowExperienceUi | **16 PASS** | `vitest-home-escrow-ui.log` |
| 2026-07-19 | 本地 `_sqlx_migrations` checksum 对齐 | **OK** · 不清库 · 不改 SQL 文件 | `align-checksums.sql`（含 060000 / 140000 / 15120000） |
| 2026-07-19 | API `:8080` + FE `:3012` | **UP** · health/home 200 | `api-boot-aligned.log` · `fe-boot.log` |
| 2026-07-19 | **RBAC** `smoke-admin-rbac-matrix-local` | **PASS** | `smoke-rbac-matrix.log` |
| 2026-07-19 | Journey：orders / provider / guide / steward | **PASS** | 各 `smoke-*.log` |
| 2026-07-19 | Data：catalog-ops + catalog-consumer | **PASS**（FE 起后） | `smoke-catalog-*-fe.log` |
| 2026-07-19 | UI P0 enterability + admin-pages | **PASS** | `smoke-admin-pages-fe.log` · `ui-p0-enterability.log` |
| 2026-07-19 | 产品代码 / Min-Fix / Gate / Web3 | **未改** | Fix 仍=8 · F-02 不动 |

**合计：** Vitest 73 PASS + live smokes 上表脚本 **exit 0 / OK**（= 运行证据 · **≠** Coverage Metric FINAL）。

---

## 7 · 非 Web3 结论（Authenticity 后 · 禁止估 %）

| 维 | Evidence | Metric FINAL | Threshold |
|----|----------|--------------|-----------|
| Journey | VERIFIED | **5/5** | **PASS** |
| RBAC | VERIFIED | **60/96** | **NEED_FIX** |
| Data | VERIFIED | **20/20** | **PASS** |
| UI/UX P0 | VERIFIED | **24/24** | **PASS** |
| Security/Web3 | 未刷新 | — | Fix=8 · **不碰** |

**作废：** 估数 ~88–100%。**FINAL SSOT：** [Measurement FINAL](./TT-PSG-COVERAGE-MEASUREMENT-FINAL-LATEST.md)。

Overall Acceptance 仍 **CONDITIONAL**（RBAC 阈值 96/96 · Fix=8）。Phase3 定向 NOT_RUN **已闭**。

---

## 8 · 下一动作（写死 · 停随机扩测）

> 非 Web3 **Evidence VERIFIED** · 定向 NOT_RUN **= 0**。继续随机扩测 **禁止**。  
> 产品 Fix 仍只走 Release Window Min-Fix（Fix=8）。  
> RBAC Threshold NEED_FIX = 分母/阈值结构问题（36×N/A），**非**再补测格。

```text
Measurement FINAL（P3 · LOCAL）· NOT_RUN=0 · Consistency NOT_ALIGNED
        ↓
Git Commit SHA pin → Staging same SHA → Staging Evidence → Recalculate（ALIGNED）
        ↓
execute_allowed_now=true → Min-Fix（Fix=8 · Web3）
        ↓
受影响域验证 → Metrics refresh → PSG Final Gate
```
**不**把 Fix Required 从 8 改为 0 · **不**宣称 Production GO · **不**写估算覆盖率。
