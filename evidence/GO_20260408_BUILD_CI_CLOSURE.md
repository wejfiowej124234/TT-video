# Build（`build.yml`）全绿收口留痕 · 2026-04-08

| 字段 | 值 |
|------|-----|
| **收口结论** | **GitHub Actions · `build.yml` 全绿**（`frontend` / `e2e` / `build` / `a11y` 等 job 均 success） |
| **权威 Run ID** | **`24139191178`** |
| **触发提交（tip）** | **`2364f55`**（`test(e2e): scope dispute intent alert assertions to main content`） |
| **工作流** | 仓库根 **[`.github/workflows/build.yml`](../.github/workflows/build.yml)** |

本文档为 **可进 git 的静态台账**：记录本轮为打通 **Build** 所串联的修复要点，供后续 **新卡从新问题起算**，**不回扫**本条已收口链。

---

## 1. 本轮关键修复点（按链条顺序 · 摘要）

| # | 主题 | 要点 |
|---|------|------|
| 1 | **Gate / CI 脚本可移植性** | 工作流或门禁脚本中 **`rg` → `grep`** 等调整，避免在无 ripgrep 的 runner 上误伤（与 **check-invariants** / gate 步一致）。 |
| 2 | **regional-matrix** | 矩阵门禁与依赖安装/证据目录约定对齐，**Build** 并行 job 侧不再阻断。 |
| 3 | **E2E · API 8080** | Playwright 前 **traveltrust-api** 于 **8080** 启动链路稳定，与 **`PLAYWRIGHT_BASE_URL`** 前端联调一致。 |
| 4 | **Smoke · 主路径可访问** | **`smoke.spec.ts`** 等对 **53 主路径**区块的可见性/路由断言与当前 Next 页面对齐（含后续 **Link vs button** 修正，见下）。 |
| 5 | **Governance params · 标题可见** | 治理参数页 **reconcile** 相关 **heading** 在布局下保持可测可见（与前序 governance 门禁一致，**不回扩** escrow/traveltrust）。 |
| 6 | **TravelTrust · 段导航锚点** | **`TravelTrustSectionNav`** 增补 **`#problem` / `#solution`** 与 i18n，使 smoke 对 **Problem / 痛点** 等链路与落地页 IA 一致。 |
| 7 | **Escrow rate · 单测 locale** | **`page.test.tsx`**：**`beforeEach` 清理 `LOCALE_STORAGE_KEY`**；上传按钮用 **`findByRole`**，消除 Vitest worker 间 **`traveltrust_locale=en`** 污染导致的 **`提交审核`** / **`Submit for review`** 错配。 |
| 8 | **Smoke · 社区私信返回** | 占位 DM 线程：断言 **`getByRole('link')`** 而非 **`button`**（顶栏返回为 **`next/link`**，`aria-label` / 文案仍匹配 **Back / 返回**）。 |
| 9 | **trust-gate · 执行裁决意向** | **`trust-gate-dispute-execute-intent.spec.ts`**：告警断言改为 **`page.getByRole('main').getByRole('alert')`**，避开 **`#__next-route-announcer__`** 与业务 **`role="alert"`** 的 **strict mode** 双匹配（503 / 403 / 429 三用例同型一次修）。 |

---

## 2. 使用约定（给后续任务）

- **本条 Run** **`24139191178`** 视为本轮 **Build 闭环** 的 **可复核指针**（GitHub → Actions → 对应 run）。
- **新需求 / 新回归**：单独开卡；**默认不**再对本表所列路径做「预防性回扫」，除非 **04/07** 或工单明确要求同批。
- **并联索引**：通用 evidence 目录说明仍见 **[evidence/README.md](README.md)**；SSOT Guard 总览仍见 **[GO_20260407_SSOT_GUARDS.md](GO_20260407_SSOT_GUARDS.md)**。

---

**登记日**：2026-04-08（与 Run 触发日一致）。
