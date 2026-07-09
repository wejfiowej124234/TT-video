# TT-LOCAL-UI-MANUAL-UAT-CHECKLIST

**Version:** 1.0.1 · **2026-06-25** · **FREEZE ACTIVE（① UI 手测 · 三层文档树已冻结）**  
**阶段口径：** **① 本地** — [TT-LOCAL-TEST-ACCOUNTS-MATRIX](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md) **Business Personas** C1–C4 / E1–E2 的 **② UI 固定账号验收**；**≠ ② staging GO** · **≠ ③ Production GO**。

> **冻结纪律：** 下列 **Persona × 走廊** 清单项**不变** · **不新增**固定种子 · **不新增**本轨 smoke/脚本 · **不新增**第四套验收轨。日常**仅**维护 §1 勾选 · §2 签字 · [§0.2 UI 列](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) — 见矩阵 [§0a.0](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-three-layer-doc-tree)。TL#1 前不做 Graduation 序；TL#1 后见 [PHASE2-GRADUATION-CLOSURE-PROGRAM](PHASE2-GRADUATION-CLOSURE-PROGRAM.md)。

**固定种子 SSOT：** [TT-TEST-ACCOUNTS-QUICK-REFERENCE.md](TT-TEST-ACCOUNTS-QUICK-REFERENCE.md)（**Immutable ID** C1–E2 · 日常邮箱）· [Matrix](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md)（完整规范）· **Admin** [§10](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-admin-console-personas) · **不混用**

> **身份体系隔离（与矩阵 [§0](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-test-accounts-root) 同句）：** 产品业务账号（**Business Personas**）与 **Admin Console Personas** 属于两套独立身份体系，任何文档、测试、验收、证据均**不得混用**。
>
> **Business 三层验收（[§0a](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance) · 均需 · 互不替代）：**
>
> | 层 | 执行 | 目的 |
> |----|------|------|
> | **① API** | **脚本** | 每日登录 + 核心 API 回归 |
> | **② UI** | **人工** | 浏览器逐页 — 流程 · 交互 · 文案 · 视觉 |
> | **③ P0** | **人工为主** | 发布前完整闭环 — Escrow · 审批 · 治理 · 支付 · 争议 |
>
> **本文档 = ②**（Business 六账号 UI 走廊）。**不**替代 ③ [P0 手测](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md) · **不**替代 Admin 六角色 RBAC（P0-01 · §10）。

**走廊摘要 SSOT（勿分叉）：** [矩阵 §0a.2](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance) · **路径旁证：** [LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md)（Playwright **不**替代本表勾选）

**统一密码（Business 固定种子）：** `Test123!` · 登录 **`http://localhost:3012/auth/login`**

---

## 0 · 使用方式

1. 先跑 **`scripts\start-api-with-seed.bat`**（Step **6b5** 等）— 证明 **① API**（[§0a.1](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance)）。
2. 确认 **Frontend :3012** · **API :8080** 已起；**E1** 须 Step **6b4**（`seed-trust-gate-e2e`）已执行。
3. 按 **§1** 逐项浏览器手点并勾选；每 Persona 完成后勾选 **§1 末「本账号通用」**。
4. **可选旁证**（**不**替代勾选）：`bash scripts/dev/run-local-six-account-ui-l5-audit.sh` — 见 [LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md)。
5. 全勾后填 **§2 签字行**；在 **[manual-uat](../../evidence/manual-uat/README.md)** **只新增** `sessions/<stamp>/`（**不迁目录**）· 轮末跑 `python scripts/dev/generate-manual-uat-dashboard.py`；更新 [§0.2 Coverage Matrix](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) **UI** 列。
6. 再进入 **③** [P0 手测](TT-LOCAL-P0-MANUAL-UAT-CHECKLIST.md)（**不**计入本表）。

**人工须看（每个 Persona 均适用）：** 页面无白屏/异常 · 文案可读 · 按钮与权限提示合理 · 流程自然 · 视觉与状态变化符合预期。

---

## 1 · UI 清单（① 版本回归 · Business 六账号）

> 勾选列：**□** 未验 · **☑** 已验。备注栏可写截图路径或简短问题。

---

### C1 · `multi-demo@test.com` · 多重身份 / 主理人捷径

| # | 检查项 | 路径 / 动作 | □ | 备注 |
|---|--------|-------------|---|------|
| 1 | 登录成功 | `/auth/login` | □ | |
| 2 | 多身份 Hub 可进入 | `/me/identities` | □ | 身份切换 · 收购入口 |
| 3 | Publish Hub | `/me/publish` | □ | |
| 4 | 主理人工作台 | `/governance?view=region` | □ | CN 已批/已质押捷径 UI |
| 5 | 收购子站 | `/market/acquisition` | □ | |
| 6 | **本账号通用** | 见 §0「人工须看」 | □ | |

---

### C2 · `tourist@test.com` · 旅行者 / 五主路由 / Admin 捷径

| # | 检查项 | 路径 / 动作 | □ | 备注 |
|---|--------|-------------|---|------|
| 1 | 登录成功 | `/auth/login` | □ | |
| 2 | 首页 Landing | `/` | □ | 行程卡 · 解锁动线 |
| 3 | 市场主站 | `/market` | □ | debounce · 收藏 |
| 4 | 社区 Feed | `/community` | □ | |
| 5 | 订单列表 | `/orders` | □ | |
| 6 | Admin SuperAdmin **入口** | `/admin` | □ | **≠** 六角色 RBAC GO（见 P0-01） |
| 7 | **本账号通用** | 见 §0「人工须看」 | □ | |

---

### C3 · `guide@test.com` · 向导工作台

| # | 检查项 | 路径 / 动作 | □ | 备注 |
|---|--------|-------------|---|------|
| 1 | 登录成功 | `/auth/login` | □ | |
| 2 | 向导工作台 | `/guide` | □ | 接单流程起点 |
| 3 | 市场选向导 | `/market?view=guides` | □ | |
| 4 | **本账号通用** | 见 §0「人工须看」 | □ | |

---

### C4 · `merchant@test.com` · 商家工作台

| # | 检查项 | 路径 / 动作 | □ | 备注 |
|---|--------|-------------|---|------|
| 1 | 登录成功 | `/auth/login` | □ | |
| 2 | 商家工作台 | `/provider` | □ | listing 管理入口 |
| 3 | 商家身份设置 | `/me/identities/merchant/settings` | □ | |
| 4 | **本账号通用** | 见 §0「人工须看」 | □ | |

---

### E1 · Escrow **链 A**（双账号 · 不可合并）

| # | 检查项 | 账号 | 路径 / 动作 | □ | 备注 |
|---|--------|------|-------------|---|------|
| 1 | 旅行者订单入口 | C2 `tourist@test.com` | `/orders` | □ | 链 A 订单可见 |
| 2 | 链 A 向导工作台 | E1 `tg_guide_main@trustgate-e2e.local` | `/guide` | □ | 须 6b4 种子 |
| 3 | **本走廊通用** | — | 见 §0「人工须看」 | □ | catalog UI 与链 B 勿混 |

---

### E2 · `provider-did-rank-demo@test.com` · DID 榜

| # | 检查项 | 路径 / 动作 | □ | 备注 |
|---|--------|-------------|---|------|
| 1 | DID 榜主页 | `/did-rank` | □ | 可未登录浏览；建议亦用 E2 登录复验 |
| 2 | 收购副榜 | `/did-rank?board=acquisition` | □ | |
| 3 | **本账号通用** | 见 §0「人工须看」 | □ | |

---

## 2 · 签字行（版本 UI 收口）

| 项 | 值 |
|----|-----|
| 验收阶段 | ① 本地 |
| git SHA | `git rev-parse --short HEAD` |
| Reviewer | |
| Date (UTC) | |
| 结论 | **UI 全勾** / 部分（列未勾 Persona） |
| Playwright 旁证（可选） | `run-local-six-account-ui-l5-audit.sh` exit / 证据目录 |
| **Session 证据包** | `evidence/manual-uat/sessions/<timestamp>/` · Requirement：[REQUIREMENT-TRACEABILITY](../../evidence/manual-uat/summary/REQUIREMENT-TRACEABILITY.md) |
| Coverage 更新 | [§0.2 UI 列](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-coverage-matrix) → ✅ |

---

## 3 · 与一键栈 Step 的关系

| Step | 证明什么 | **不能**替代本 UI 表 |
|------|----------|----------------------|
| **6b5** | C1 C2 C3 C4 E2 可登录 | 页面文案 · 动线 · 视觉 |
| **6b4** | E1 trust-gate 种子 | E1 `/guide` UI 体验 |
| **6p** / **6t** / **6r** | C1/C4 API 切片 | 浏览器交互与状态变化 |
| Playwright 审计 | 17 路径 route loaded | 人工体验判断 · Escrow 全终态（→ P0-06） |

---

## 4 · 禁止假完成（写死）

- **① API 脚本绿** **≠** 本表全勾 **≠** **③** P0 全勾 **≠** [93 全站矩阵](../spec/93-全站功能验证矩阵-域别回归清单.md) GO  
- **Playwright PASS** **≠** 本表签字「UI 全勾」  
- **C2 `/admin` 可达** **≠** Admin 六角色 RBAC GO（→ P0-01 · ADM-U01）  
- **② 本表全勾** **≠** **②** staging / Graduation GO **≠** **③** Production GO  
- 见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion)

---

## 5 · 变更纪律

- 增删 **② UI 走廊项**须同步 [矩阵 §0a.2](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance) · [LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT](LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md) 路径表 · **§0 / §10** 身份隔离  
- **不**为 UI 项新增 `auth.rs` 固定种子；全终态闭环归 **③** P0  
- **不**新增第四套产品验收轨 — 见 [§0a](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-local-three-layer-acceptance)

---

*End of TT-LOCAL-UI-MANUAL-UAT-CHECKLIST v1.0.1*
