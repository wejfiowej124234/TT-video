# 多重身份 · 注册 / 申请 / 设置 IA 收口任务清单

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；禁止跳阶）

**互指：** [ME-IDENTITIES-UI-FREEZE](./ME-IDENTITIES-UI-FREEZE.md) · [MULTI-IDENTITY-IA-ENTERPRISE-AUDIT](./MULTI-IDENTITY-IA-ENTERPRISE-AUDIT.md) · [ACCOUNT-NAV-NAMING-P3](./ACCOUNT-NAV-NAMING-P3.md) · [app/me/identities/README.md](../../app/me/identities/README.md) · [stewardAdmissionNav.ts](../../lib/steward/stewardAdmissionNav.ts) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)

**诚实边界：** ① 本清单 **ACTIVE 段** 绿集 / smoke **≠** ② staging 全矩阵 GO **≠** ③ Production GO。

---

## 总表

| 项 | 结论 |
|----|------|
| **① 有没有收口（本域）** | **是**（2026-06-12 · IA sprint ACTIVE · 企业审计 100/100 ①） |
| **① 有没有 UI 冻结** | **是**（Hub / 注册 / 设置族 · 仅数据链/i18n/门闸） |
| **② / ③** | 见下表 · **未开始实施或另闸** |

---

## ① 本地 · ACTIVE 收口（已完成）

| # | 清单项 | 状态 | 验收 |
|---|--------|------|------|
| 1 | Hub 去重 footer onboarding 链 | ✅ 完成 | `meIdentitiesPage.contract` |
| 2 | Hub 资料链仅 active/role 展示 | ✅ 完成 | `meIdentitiesProfileLinksModel.test` |
| 3 | Hub 卡片信任 `deriveMeIdentitiesCoreCardView`（移除 slot 覆盖） | ✅ 完成 | `meIdentitiesPage.contract` |
| 4 | 主理人 USDC SSOT → 工作台 A 轨 `#steward-b-track-admission` | ✅ 完成 | `stewardAdmissionNav.test` · `smoke-steward-workbench-l5-local.sh` |
| 5 | `/me/onboarding?role=region_steward` redirect 至工作台 | ✅ 完成 | `meOnboardingPage.contract` |
| 6 | `/me` 直链 → `/me/identities` | ✅ 完成 | `accountNavNamingP3.contract` |
| 7 | 设置工作台捷径仅 `*WorkspaceUnlocked` | ✅ 完成 | `meIdentitySlotVisibility.test` |
| 8 | 收购设置捷径仅槽位 active/pending | ✅ 完成 | 同上 |
| 9 | account-nav smoke 绿 | ✅ 完成 | `bash scripts/dev/smoke-account-nav-local.sh` |
| 10 | E2E 主理人 `payment_pending` → 工作台 A 轨 | ✅ 完成 | `e2e/me-identities-core-hub.spec.ts` |
| 11 | `ME-IDENTITIES-UI-FREEZE` 与 Hub 结构对拍 | ✅ 完成 | 本文 + freeze 文 |
| 12 | `MeOnboardingPageMain` 移除主理人死 UI | ✅ 完成 | `meOnboardingPage.contract` |
| 13 | spec `onboarding-fee-schedule` UI/spec A-B 对照表 | ✅ 完成 | `docs/spec/artifacts/onboarding-fee-schedule.v1.md` |
| 14 | `steward/register/README` 步骤 3 对拍工作台 | ✅ 完成 | README |
| 15 | 企业十维审计 + sprint 机读 | ✅ 完成 | [MULTI-IDENTITY-IA-ENTERPRISE-AUDIT](./MULTI-IDENTITY-IA-ENTERPRISE-AUDIT.md) · `meIdentitiesIaClosure` |
| 16 | 专用烟测 `smoke-multi-identity-ia-closure-local.sh` | ✅ 完成 | 末行 `TT_MULTI_IDENTITY_IA_CLOSURE_SMOKE: OK` |
| 17 | 纯旅行者经营区 `<details>` 折叠 | ✅ 完成 | `meIdentitiesHubOperatorSectionDefaultOpen` |

**① 推送前绿集（窄）：**

```bash
bash scripts/dev/smoke-multi-identity-ia-closure-local.sh
bash scripts/dev/smoke-account-nav-local.sh
bash scripts/dev/smoke-steward-workbench-l5-local.sh
cd frontend && npm run test:i18n:ci && npm run test -- meIdentitiesIaClosure meIdentitiesPage meIdentitySlotVisibility meIdentitiesProfileLinksModel stewardAdmissionNav meOnboardingPage accountNavNamingP3 --run
# 可选 E2E
PLAYWRIGHT_MULTI_IDENTITY_IA=1 bash scripts/dev/smoke-multi-identity-ia-closure-local.sh
```

---

## ② 测试网 · 任务清单（未开始 · 须 G-1/G-2 后 Owner scope）

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 2-1 | staging 非零 USDC 准入费 · Stripe test PI + webhook | ❌ 未完成 | **②** |
| 2-2 | 主理人 TTG stake Sepolia / Anvil 与 staging 域名联调 | ❌ 未完成 | **②** |
| 2-3 | `smoke-onboarding-full-chain-local.sh` 等价 **staging** 烟测 | ❌ 未完成 | **②** |
| 2-4 | E2E 全栈（非 route mock）主理人 A 轨付 USDC + B 轨 stake | ❌ 未完成 | **②** |
| 2-5 | 顶栏 **身份切换**（P3 升级轨 · multi-slot switcher） | ❌ 未完成 | **②** 产品 |
| 2-6 | 商家准入 UI 是否与主理人工作台 **统一**（产品决策） | ❌ 未完成 | **②** 产品 |
| 2-7 | ISS-007 / 93 路由矩阵 staging **`release_gate=GO`**（非窄切片） | ❌ 未完成 | **②** |
| 2-8 | 跨设备收藏 / 市场 F-020 SLA（Hub 文档已留 ②） | ❌ 未完成 | **②** |
| 2-9 | API 长跑稳定性（PHASE2-API-PROCESS-STABILITY） | ❌ 未完成 | **②** 运维 |

**② 入口闸：** [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md)

---

## ③ 公网/生产 · 任务清单（另闸 · Owner-only）

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 3-1 | Production PSP / 真 USDC 收款与退款政策 | ❌ 未完成 | **③** |
| 3-2 | 主网 TTG stake / 治理栈 broadcast（非 Sepolia 测试 ETH） | ❌ 未完成 | **③** |
| 3-3 | `go-live` · Production GO 决策 | ❌ 未完成 | **③** |
| 3-4 | 全站 93 矩阵 · 每路由/角色交叉验收 | ❌ 未完成 | **③** |
| 3-5 | 五主路由 ②③ 真链 / 真 USDC / CDN / 通知 | ❌ 未完成 | **③** |
| 3-6 | 法务/财务书面锁定 `fee_schedule_v1` 标价 | ❌ 未完成 | **③** |

**③ 入口：** [go-live-checklist · GO Decision](../../../docs/go-live-checklist.md#go-decision-entry-point)

---

## 维护期 OPEN（① · 不阻塞本域 ACTIVE）

| # | 项 | 说明 |
|---|-----|------|
| M-1 | 代码内 `bTrack` / `useStewardOnboardingBTrack` 命名 | ✅ **① 已注释**（客户 UI A/B 对照见 hook 头注释 · fee-schedule 文） |
| M-2 | Hub 认知密度 | ✅ **① 已收口**（经营区 hint + 纯旅行者 `<details>` 折叠） |
| M-3 | `me_identities_onboarding_console_note` i18n 键 | ✅ **已删键**（2026-06-12 sprint） |

---

**一句话结论：** **① 本域 IA 收口 ACTIVE · 企业审计 100/100（可验证范围）**；**②③ 已写入上表，不得用 ① smoke 冒充。**
