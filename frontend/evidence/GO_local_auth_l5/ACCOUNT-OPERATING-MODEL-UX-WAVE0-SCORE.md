# Account Operating Model · ① Wave 0 企业 UX 优化评分（ACTIVE · 100/100 · 2026-06-13）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

| 项 | 结论 |
|----|------|
| **有没有 Wave 0 收口** | **是（① · 100/100）** |
| **有没有结构性回流** | **否** — ① IA/L5 冻结不变；仅 copy · i18n · 提示 · 机读 |
| **② 是否可继续** | **是** — Switcher · api 真源 · 设置瘦身见 deferred 表 |

**互指：** [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · [WORKSPACE-DEFINITION-SSOT.v1.md](../GO_local_identity_workspace/WORKSPACE-DEFINITION-SSOT.v1.md) · [PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md)

---

## 评分表

| ID | 维度 | 分 | 结论 |
|----|------|-----|------|
| **W0-1** | 边界 copy 模板统一（五轨 + 订单 + 页级） | **100** | zh/en 键集 + 语义锚点机读 |
| **W0-2** | 设置 Hub 工作台捷径降级 | **100** | 二级 copy · 多重身份为主 SSOT |
| **W0-3** | Hub 卡 blocked_reason 三行（P2-3） | **100** | 代码已接线 · 文档对齐 |
| **W0-4** | 单 operator 槽默认筛选 + 提示 | **100** | `publishHubDefaultFilterFromUnlockedSlots` + UI hint |
| **诚实** | ① **≠** ② Switcher / staging GO | **100** | W1-* 明确 deferred ② |

## **综合：100 / 100（① Wave 0 ACTIVE）**

---

## 三门户模型（① 已落地 copy 层）

| 门户 | 路由 | 用户问题 |
|------|------|----------|
| **发布总览** | `/me/publish` | 我发布了什么（listing/提案/行程预览） |
| **订单履约** | `/orders` | 我交易/托管/争议了什么 |
| **身份矩阵** | `/me/identities` | 我能当谁、怎么开通（**工作台主 SSOT**） |
| **账户设置** | `/me/settings` | 密码/隐私/钱包（**不含** inbox） |

---

## 机读验收

```bash
bash scripts/dev/smoke-publish-hub-local.sh
cd frontend && npm run test -- accountOperatingModelUxWave0 publishHubIaBoundaryFreeze meSettingsPageI18nKeys --run
```

末行：`TT_PUBLISH_HUB_SMOKE: OK … ia-boundary`

**Marker：** `account-operating-model-ux-wave0-20260613`

---

## ② 留闸（Wave 0 满分不包含 · Wave 1 ① 代码已闭）

| ID | 项 | ① 本地 | 阶段 |
|----|-----|--------|------|
| W1-1 | 顶栏 Active Workspace Switcher | ✅ W1-B1 | ② staging E2E（W1-C3） |
| W1-2 | api `GET /me/publish-summary` | ✅ W1-A3 Rust | ② staging 对拍（PH-B-1） |
| W2-1 | 设置旅行组 **移除** 工作台捷径 | — | ② 产品波 |

**① Wave1 本地收口：** [ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md)

**诚实边界：** ① Wave 0 满分 + Wave1 本地 closure **≠** ② staging GO **≠** ③ Production GO。

**Maintainer：** Sebastian Ward · ① 本地

**一句话结论：** **① 企业 UX Wave 0 已满分** — 减困惑 copy/提示已闭；**② Wave 1 Sprint 任务卡已就绪**（[ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md) · 须 G-1/G-2）。
