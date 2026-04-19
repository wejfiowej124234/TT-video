# TT-B321 · i18n `en`/`zh` 键对称与 lint 规格（审计登记）

**卡号**：`TT-B321-I18N-KEY-PARITY-LINT-SPEC-001` · **母表** `B-321`  
**日期**：2026-04-15  
**范围**：仅 **文档 / 台账 / 索引**；**先审计后登记**；**不改** `frontend/**` 实现、`package.json` 脚本语义、CI workflow（本卡 **不**新增 npm 脚本、**不**改门禁逻辑）。

**定位（与 B-320 同批「第二轮轻度收敛」）**

- **B-320**：登记 **`NEXT_PUBLIC_*`** 示例与代码键的 **真实缺口**（示例漏键）。  
- **B-321**：把 **en/zh 键级对称** 与 **既有 CI 机读门** 的 **规格** 写清，并 **仅记录** 审计时是否仍有缺口；**不**在本文档轮改实现。

---

## 1. 本轮仅读文件清单（≤8）

| # | 路径 |
|---|------|
| 1 | `frontend/locales/en.ts` |
| 2 | `frontend/locales/zh.ts` |
| 3 | `frontend/scripts/check-i18n-coverage.mjs` |
| 4 | `frontend/package.json`（`scripts` 段） |
| 5 | `.github/workflows/build.yml`（`test:i18n:ci` 步骤） |
| 6 | `docs/spec/13-1-UI产品级SSOT与页面规范.md`（异常态 / 机器键 → locale 纪律相关段落） |
| 7 | `docs/spec/53-阶段开发技术文档.md`（**BB2** / 多环境与前端叙事互指） |
| 8 | `docs/AI任务卡索引.from-stash.md`（一览 **331** / **TT-B321** 登记行） |

---

## 2. 已落地的「规格 = 实现」真值（审计结论）

仓库 **已**通过 **`npm run test:i18n:ci`**（`node scripts/check-i18n-coverage.mjs`）在 **CI**（`build.yml`）中执行，**非**仅纸面规格。

**机读规则摘要**（与脚本行为一致，供台账引用）

1. **键集对拍**：自 **`en.ts` / `zh.ts`** 用正则提取 **顶层** `key:` 名，计算 **`missing_in_en`**、**`missing_in_zh`**（须均为空方通过）。  
2. **关键前缀非空**：`common_`、`orders_`、`disputes_`、`order_`、`escrow_` 在各 locale 须 **均有至少一个键**（脚本内 `criticalPrefixes`）。  
3. **关键路由**：若干页面/组件须检测到 **`useTranslation` / `t(`** 用法，且 **关键路径** 上 **可见 JSX 硬编码 CJK** 判失败（见脚本内 `keyRouteChecks` / `hardcodedAllowlist`）。  
4. **产出物**：`frontend/.i18n-coverage.json`；失败 **exit 1**。

**本轮复跑（审计）**：在 **`frontend/`** 下执行 **`node scripts/check-i18n-coverage.mjs`** → **`[i18n-gate] passed.`**、**exit 0**。

---

## 3. 缺口登记（仅记录 · 本卡不改实现）

| 类别 | 结论 |
|------|------|
| **键对称（en/zh）** | **无缺口**（脚本通过；`missing_in_*` 为空）。 |
| **关键前缀 / 关键路由** | **无缺口**（脚本通过）。 |
| **规格与产品文档** | **13-1** 已要求异常态经 **`formatCommunityApiMessage`** 等映射到 locale，**与** 键级门禁 **互补**；**53 BB2** 强调多环境与配置叙事，**不**替代本机读键表。 |

**已知边界（登记，非本卡修复）**

- 提取器仅覆盖 **locale 文件顶层 `key:`**；若未来出现 **嵌套对象** 文案结构，须 **另开 TT** 扩展脚本或改数据结构约定。  
- **「可选 npm 脚本」** 在母表中的表述指 **历史上** 可补门禁；当前 **`test:i18n:ci`** **已存在且已接入 CI**，本卡将其 **升格为台账级规格说明**，**不**重复实现。

---

## 4. 验收（本卡 · docs-only）

- 本 Runbook + **母表 B-321** + **from-stash 一览 331** 互证完成。  
- **未**修改 `check-i18n-coverage.mjs`、`package.json`、`build.yml`、**`locales/*.ts`**。

---

## 5. 互证

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-321**  
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **331** · **`### TT-B321-I18N-KEY-PARITY-LINT-SPEC-001`**
