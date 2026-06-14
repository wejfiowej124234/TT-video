# Identity Center · P2 收口冻结（IDENTITY-P2-SPRINT · 2026-06-10 · ① 本地）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；**本冻结仅覆盖 ① Identity Center 产品面**）

**Normative：** [identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md) · [IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN.md](./IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN.md)

**Hub UI 壳（仍有效）：** [ME-IDENTITIES-UI-FREEZE.md](./ME-IDENTITIES-UI-FREEZE.md) — **`/me/identities` 页身 layout 锁**；P2 仅增 **CTA href** 与子路由，**不**改 grid/视觉 token。

---

## 收口结论

| 项 | 状态 |
|----|------|
| **Identity Center 产品面** | **ACTIVE · P2 已闭（①）** |
| **分身份 settings 四页** | guide · merchant · region-steward · acquisition |
| **新增身份体系功能** | **禁止**（见下「OUT」） |
| **顶栏 workspace 切换** | **未做 · 仍 OUT（P3）** |
| **机读绿集** | `meIdentitiesUiFreeze` · `meIdentityP2Settings` · `meIdentitiesPage` · `meIdentitiesCoreCardModel` |

**诚实边界：** ① 本地 smoke / P2HA 探针 **≠** ② staging 全矩阵 GO **≠** ③ Production GO。

---

## 已交付 settings 子页（① · 数据链 + L5 壳）

| 路由 | API | 预览 |
|------|-----|------|
| `/me/identities/guide/settings` | `GET/PATCH /api/v1/me/guide-profile` | `GuideCard` |
| `/me/identities/merchant/settings` | `GET/PATCH /api/v1/me/merchant-profile` | 商家橱窗 masonry |
| `/me/identities/region-steward/settings` | `GET/PATCH /api/v1/me/region-steward-profile` | 区域简介卡 |
| `/me/identities/acquisition/settings` | `GET/PATCH /api/v1/me/acquisition-profile` | 收购 masonry |

共享：`components/me/identitySettings/*`（审核只读 · blocked_reasons · Auth L5 壳）

---

## Hub CTA 边界（允许 · 非 layout 回流）

- 槽位 **非 inactive** → 对应 `…/settings`；否则仍 `/guide/register` · `/provider/register` · `/market/acquisition` 等
- 核心轨 **active** → `meIdentitiesCoreCardModel` 指向 merchant/steward settings

**禁止：** 改 Hub 段序 · 改 `MeIdentitiesL5IdentityCard` 结构 · 改顶栏 identity switcher（P3）

---

## ① 机读验收（2026-06-10 自留）

| 项 | 结果 |
|----|------|
| `smoke-identity-p2-settings-local.sh` | **exit 0** |
| `smoke-guide-profile-settings-local.sh` | **exit 0** |
| vitest 绿集（33 tests） | **exit 0** |
| P2HA 四角色 · **① local** | **PASS**（`evidence/phase2-human-acceptance-sprint/20260611T005928Z/local/`） |

## ② 测试网验收（Local-to-Staging Sync Sprint · 20260611T121915Z · SHA `5ab1f8ba`)

| 项 | 结果 |
|----|------|
| **Identity P2 API parity** | **PASS** · `evidence/phase2-human-acceptance-staging-sprint/20260611T121832Z/` |
| **P2HA 四角色 · ② staging** | **PASS**（manifest `evidence/phase2-human-acceptance-sprint/20260611T121915Z/phase2-human-acceptance-manifest.v1.json`） |
| **P2HA 四角色 · ① local** | **PASS**（同 manifest · `20260611T121915Z/local/`） |
| **staging SHA = git HEAD** | **PASS** · `5ab1f8ba2229ccf20b99deb35e7ae1370954a328` |
| **Phase ③ PRA** | **REQUESTED** |

**诚实边界：** ② staging PASS **≠** ③ Production GO · **≠** 主网真链。

---

```bash
bash scripts/dev/smoke-identity-p2-settings-local.sh
bash scripts/dev/smoke-guide-profile-settings-local.sh
cd frontend && npm run test -- meIdentitiesUiFreeze meIdentityP2Settings meGuideProfileSettings meIdentitiesPage meIdentitiesCoreCardModel guideDisplayName --run
# ②（deploy 后）：bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh
```

---

## OUT（Identity Center 冻结后禁止）

- 第五 `users.role` 或新 identity slot 类型
- 顶栏 HeaderIdentitySwitcher / workspace 路由表（**P3 单独立项**）
- `{nickname} · {city} 向导` 市场标题（**P3 ADR**）
- 在 `/me/settings/profile` 编辑 guide/merchant/steward 业务字段
- 新增 Identity Center **产品功能**（仅允许 **bugfix · 数据链 · i18n · a11y · ②③ 真链对齐**）

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| settings 子页字段与 API 对齐 | Hub layout / 五主 UI |
| Admin 审核队列数据链 | 身份槽 JSON schema 破坏性变更 |
| blocked_reasons 文案 | 顶栏 switcher |
| ② staging 探针扩展 | 用 ① smoke 冒充 ③ GO |
