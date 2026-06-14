# Account Operating Model · ① Wave 1 本地收口（Context Spine · ACTIVE · 2026-06-12）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

| 项 | 结论 |
|----|------|
| **有没有 ① Wave1 代码收口** | **是** — W1-A1～A4 · W1-B1～B4 · W1-L1 |
| **有没有 ② staging GO** | **否** — W1-C* / W1-D* 全 **backlog** · 须 G-1/G-2 |
| **有没有 ③ Production GO** | **否** — W1-P* 全 **backlog** · 见 go-live-checklist |

**互指：** [ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md) · [PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md) · [ADR-20260613](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md)

**诚实边界：** ① 本地 closure **≠** ② `TT_PUBLISH_HUB_STAGING: OK` **≠** ③ Production GO。

---

## ① 清单（Wave 1 · 本地 · 已闭）

| # | ID | 清单项 | 状态 | 未完成应在哪阶 |
|---|-----|--------|------|----------------|
| 1 | W1-A1 | ADR accepted + HEADER freeze 例外 | ✅ 完成 · 已冻结 | — |
| 2 | W1-A2 | `activeWorkspaceContext.ts` + localStorage | ✅ 完成 | — |
| 3 | W1-A3 | Rust `GET /api/v1/me/publish-summary` | ✅ 完成 | ② staging curl（W1-C1/E6） |
| 4 | W1-A4 | BFF upstream-first + fallback 聚合 | ✅ 完成 | ② api 真源对拍（PH-B-1） |
| 5 | W1-B1 | 顶栏 Workspace Context 下拉 | ✅ 完成 · 已冻结 | ② PW staging（W1-C3） |
| 6 | W1-B2 | Context ↔ `/me/publish?identity=` | ✅ 完成 | ② E2/E6 |
| 7 | W1-B3 | Context ↔ 工作台 deep link | ✅ 完成 | ② E3 |
| 8 | W1-B4 | 发布中心 spine `{contextLabel} · 产出总览` | ✅ 完成 | ② i18n staging 目视 |
| 9 | W1-L1 | `smoke-publish-hub-local.sh` + Wave1 contract | ✅ 完成 | — |

---

## ② 清单（测试网 · backlog）

| # | ID | 清单项 | 状态 | 未完成应在哪阶 |
|---|-----|--------|------|----------------|
| 1 | W1-C1 | staging 五轨 CRUD | ❌ 未完成 | **②** |
| 2 | W1-C2 | 下架 ↔ discover | ❌ 未完成 | **②** |
| 3 | W1-C3 | PW staging multi-demo E1–E6 | ❌ 未完成 | **②** |
| 4 | W1-C4 | governance ?mine=1 staging | ❌ 未完成 | **②** |
| 5 | W1-D1 | PH-B 行改 closed | ❌ 未完成 | **②** |
| 6 | W1-D2 | `TT_PUBLISH_HUB_STAGING: OK` 证据 | ❌ 未完成 | **②** |

**入口闸：** [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md)

```bash
export STAGING_API_BASE=https://your-staging-api
bash scripts/dev/smoke-publish-hub-staging.sh
```

---

## ③ 清单（公网/生产 · backlog）

| # | ID | 清单项 | 状态 | 未完成应在哪阶 |
|---|-----|--------|------|----------------|
| 1 | W1-P1 | 主网 governance 轨 / exec 同步 | ❌ 未完成 | **③** |
| 2 | W1-P2 | Production PSP + go-live | ❌ 未完成 | **③** |
| 3 | W1-P3 | 93 全矩阵 Production GO | ❌ 未完成 | **③** |

**入口：** [go-live-checklist · GO Decision](../../../docs/go-live-checklist.md#go-decision-entry-point)

---

## 机读验收（①）

```bash
bash scripts/dev/smoke-publish-hub-local.sh
# 或一键栈 Step 6s（seed + W1-A3 API）
scripts\start-api-with-seed.bat
cargo test -p traveltrust-api publish_summary
cd frontend && npm run test -- accountOperatingModelUxWave1 --run
```

**Marker：** `account-operating-model-ux-wave1-local-20260612`

**Maintainer：** Sebastian Ward · ① 本地

**一句话结论：** **① Wave1 Context Spine 代码已闭** — ② 须 G-1/G-2 后按 W1-C/D 验收；③ 见 W1-P* 与 PH-C-*。
