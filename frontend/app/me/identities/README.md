# `/me/identities` · ① 本地 L5 多重身份 Hub（**UI 已锁 · Phase ① Freeze**）

> **Phase ① Freeze（2026-05-28）：** Hub **准入轨**（商家/主理人核心卡 · onboarding 深链）**仅** bugfix · 证据 · 注释；**收购 PD-009** 仍按 acquisition 规则。**②** → [PHASE2-START-CHECKLIST](../../../../docs/runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4** · [PHASE1-FREEZE-ONBOARDING-HUB](../../evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md)

**阶段：① 本地** — 与 [`/auth/login`](../../auth/login/README.md) / [`/auth/register`](../../auth/register/README.md) **同族暖金暗玻璃**。

**冻结 SSOT：** [`ME-IDENTITIES-UI-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) · **[IA 收口任务清单（① ACTIVE · ②③ backlog）](../../evidence/GO_local_auth_l5/MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md)** · **[企业级审计 100/100 ①](../../evidence/GO_local_auth_l5/MULTI-IDENTITY-IA-ENTERPRISE-AUDIT.md)** · **P2 Identity Center：** [`IDENTITY-CENTER-PHASE2-FREEZE.md`](../../evidence/GO_local_auth_l5/IDENTITY-CENTER-PHASE2-FREEZE.md) · **命名 P3：** [`ACCOUNT-NAV-NAMING-P3.md`](../../evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) · **L5 命名与升级轨：** [`docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md`](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md) · [`IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN.md`](../../evidence/GO_local_auth_l5/IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN.md)

## 名称与资料分层（L5 · 2026-06-10 · P2 已闭）

**Normative：** [identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md)

| 用户想改… | ① 入口 |
|-----------|--------|
| 社区昵称 / 头像 | **`/me/settings/profile`** |
| 向导市场挂牌（城市/bio/类型） | **`/me/identities/guide/settings`**（active）· 否则 **`/guide/register`** |
| 商家店铺资料 | **`/me/identities/merchant/settings`**（active）· 否则 **`/provider/register`** |
| 主理人区域资料 | **`/me/identities/region-steward/settings`**（active）· 否则 **`/steward/register`** |
| 收购简介 / trust 只读 | **`/me/identities/acquisition/settings`** · 能力链 **`/market/acquisition`** |

**市场列表大标题：** **`{city} 向导`**（`formatGuideDisplayName`）— **不是** nickname。

**Admin 审批：** 商家 [`/admin/provider-applications`](../../admin/provider-applications/README.md) · 主理人 [`/admin/steward-applications`](../../admin/steward-applications/README.md) · 向导 [`/admin/guide-applications`](../../admin/guide-applications/README.md)

## 核心身份卡状态（P1 · 2026-05-27 · ①）

商家 / 主理人核心卡接入 **application · entitlements · onboarding**，细粒度阶段：

| 阶段 | 信号来源（优先级高→低） |
|------|-------------------------|
| **已开通** | `users.role` 或 `identity_slots` active |
| **受限** | 申请 rejected 或 slot restricted |
| **待确认** | 已付 entitlement · 角色未 confirm |
| **审核中** | provider `submitted/reviewing` · steward `stake_pending/under_review` |
| **待支付** | entitlement pending · 申请 approved · slot pending |
| **草稿** | provider registration draft · steward `draft` |
| **未申请** | 默认 |

- 模型：`lib/me/meIdentitiesCoreCardModel.ts` · 数据 hook：`lib/me/useMeIdentitiesCoreCardSignals.ts`
- 烟测：`lib/me/meIdentitiesCoreCardModel.test.ts`
- **已开通 CTA**：向导 → **`/guide`**；商家 → **`/provider`**；主理人 → **`/governance?view=region`**；收购 → **`/market/acquisition`**
- **不**改写 login `returnUrl` 语义
- E2E：`e2e/me-identities-core-hub.spec.ts`

## 登录落点（小红书式 · 2026-05-28）

- **`/auth/login`** / **注册成功** 且无 **`returnUrl`** → **`/community` 动态**（`lib/auth/postAuthReturnPath.ts`）
- 顶栏从 **裸 `/community/me`** 登录 → **动态**（非资料壳）；**`?tab=posts|collects|…`** 深链仍回资料页
- **`/me`** → **`/me/identities`**（`app/me/page.tsx` · 多重身份 Hub 直链，非登录默认）
- **显式 `returnUrl`**（市场 / onboarding / `/me/identities` 等）→ **保留**（经站内校验）
- 烟测：`lib/auth/loginPostAuthDefaultReturn.contract.test.ts`

## 结构（自上而下）

1. `<main>` — `TT_ME_IDENTITIES_L5.pageShell` · `data-tt-me-identities-ui-frozen="1"` · `data-tt-auth-visual="l5"`
2. `AuthL5PageBackdrop`
3. 标题区（eyebrow · **`titleLogin` 渐变 h1** · 副标题）
4. **核心身份**：旅行者 callout（状态脊签）+ Provider / Region Steward 卡（槽位状态 · 准入费 onboarding 深链）
5. **分轨申请**：向导 · 旅行收购（gridHalo + `MeIdentitiesL5IdentityCard`）
6. Console 付费说明 + 入驻链 + 社区资料链 + `AuthL5CrossNavFooter`（`hideFeeRouterLinks`）

## 顶栏

`/me/identities` 纳入 `isAuthL5DarkHeaderPath` → **authL5** utility 胶囊。

## 数据链（允许 · 非 layout lock）

- **收购槽 / 信任分**：**`GET /api/v1/me`** → **`identity_slots.acquisition`** + **`trust.acquisition_*`**（**[identity-unified-model §3.5](../../../docs/spec/artifacts/identity-unified-model.v1.md)**）
- **Hub 卡片 CTA**：收购 **active** → **`/market/acquisition`**（子站即工作台）
- **子站 SSOT**：**[`/market/acquisition` README](../../market/acquisition/README.md)** · **规则** **[acquisition-publish-trust-rules §8.1](../../../docs/spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27)** · **① 烟测** **`bash scripts/dev/smoke-acquisition-pd009-local.sh`**
- **社区资料页**：**`CommunityMeAcquisitionTrustStrip`**（押金 / suspend CTA）

## 机读绿集

```bash
cd frontend && npm run test:i18n:ci && npm run test -- accountNavNamingP3 meIdentitiesUiFreeze meIdentityP2Settings meGuideProfileSettings meIdentitiesL5FullScore meIdentitiesL5 meIdentitiesPage uiSystem --run
bash scripts/dev/smoke-guide-profile-settings-local.sh
bash scripts/dev/smoke-identity-p2-settings-local.sh
```

## Token SSOT

- `lib/me/meIdentitiesL5.ts`
- `components/me/MeIdentitiesL5IdentityCard.tsx`
- `components/me/MeIdentitiesRouteLoading.tsx`
- `components/me/MeIdentitiesRouteError.tsx`
