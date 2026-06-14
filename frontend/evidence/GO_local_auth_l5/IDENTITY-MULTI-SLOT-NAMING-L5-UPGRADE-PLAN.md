# Identity Multi-Slot · Naming L5 — ① 工程升级计划



**阶段：① 本地** — 实施 backlog；**非** ②③ GO。



**Normative SSOT：** [docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md)



**PD 真源：** [identity-unified-model.v1.md](../../../docs/spec/artifacts/identity-unified-model.v1.md)（PD-001～009）



**UI 冻结（动 Hub 壳须绿集）：** [ME-IDENTITIES-UI-FREEZE.md](./ME-IDENTITIES-UI-FREEZE.md) · [IDENTITY-CENTER-PHASE2-FREEZE.md](./IDENTITY-CENTER-PHASE2-FREEZE.md) · [ME-SETTINGS-PROFILE-L5-FREEZE.md](./ME-SETTINGS-PROFILE-L5-FREEZE.md)



---



## ① 现状快照（2026-06-10 · P2 sprint 后）



| 能力 | 状态 | 代码/文档锚 |

|------|------|-------------|

| Account nickname/avatar | ✅ | `/me/settings/profile` |

| 市场向导标题 `{city} 向导` | ✅ | `lib/guideDisplayName.ts` |

| Identity Hub 五卡 | ✅ UI 冻结 | `/me/identities` |

| Provider Admin 队列 | ✅ | `/admin/provider-applications` |

| Steward Admin 队列 | ✅ | `/admin/steward-applications` |

| Acquisition 能力链 | ✅ ① 已闭 | PD-009 · smoke-acquisition-pd009 |

| Guide 业务 settings 页 | ✅ P1 | `/me/identities/guide/settings` · admin guide-applications |

| Merchant/Steward/Acquisition settings | ✅ P2 | 三子页 + `meIdentityP2Settings` |

| Hub 卡 blocked_reason 三行 | ✅ | settings + Hub 卡 · `useMeIdentityHubBlockedReasons` |

| 顶栏身份切换 | ❌ OUT | P3 · ADR |

| profile 页「分场景资料」提示 | ✅ P0 | `meSettings*` |



**Identity Center 产品面：** **ACTIVE · 已冻结** — [IDENTITY-CENTER-PHASE2-FREEZE](./IDENTITY-CENTER-PHASE2-FREEZE.md)（**禁止**再增身份体系功能；仅 bugfix / 数据链 / i18n / ②③ 对齐）



---



## P0 — 文档与文案 ✅



| ID | 任务 | 状态 |

|----|------|------|

| P0-1 | SSOT 方案 v1 | ✅ |

| P0-2 | Hub README 读序 | ✅ |

| P0-3 | settings profile 提示 i18n | ✅ |

| P0-4 | Operator Guide 一节 | ✅ |



---



## P1 — 向导资料 settings ✅



| 交付 | 状态 |

|------|------|

| `/me/identities/guide/settings` | ✅ |

| `GET/PATCH /api/v1/me/guide-profile` | ✅ |

| `/admin/guide-applications` + review card | ✅ |

| `smoke-guide-profile-settings-local.sh` | ✅ |

| Hub CTA → settings | ✅ |



---



## P2 — 商家/主理人/收购 settings ✅（Hub 卡 blocked 原因 ⚠️）



| ID | 交付 | 状态 |

|----|------|------|

| P2-1 | `/me/identities/merchant/settings` | ✅ |

| P2-2 | `/me/identities/region-steward/settings` | ✅ |

| P2-5 | `/me/identities/acquisition/settings` | ✅ |

| P2-6 | `GET/PATCH` merchant / steward / acquisition profile API | ✅ |

| P2-7 | `smoke-identity-p2-settings-local.sh` + P2HA 探针 | ✅ |

| P2-3 | Hub 卡 `blocked_reason` 三行 | ✅ Hub + settings |

| P2-4 | i18n 三因文案 | ✅ settings 页 |



---



## P3 — 顶栏 workspace 切换（须 ADR · OUT）



| ID | 交付 |

|----|------|

| P3-1 | ADR：workspace vs role | **accepted** · [ADR-20260613](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md) |
| P3-2 | `lib/header/activeWorkspaceContext.ts` + localStorage | **① done** · Wave1 W1-A2 |
| P3-3 | Header 下拉 · 仅 active/pending 槽 | **① done** · Wave1 W1-B1 |
| P3-4 | 例外修订 `HEADER-UTILITY-MENU-L5-FREEZE.md` | **① done** · 2026-06-12 |



---



## ① 机读验收（P1+P2 Done）



```bash

bash scripts/dev/smoke-guide-profile-settings-local.sh

bash scripts/dev/smoke-identity-p2-settings-local.sh

cd frontend && npm run test -- meIdentitiesUiFreeze meIdentityP2Settings meGuideProfileSettings meIdentitiesPage meIdentitiesCoreCardModel guideDisplayName --run

```



**人工四角色：** `bash scripts/dev/record-phase2-human-acceptance-sprint-evidence.sh`（含 Identity P2 探针；② 须 staging 可达）



---



## 禁止（冻结后仍须遵守）



- 新增第六 `users.role` 或新 identity slot 类型

- 在 `/me/settings/profile` 编辑 guide.city / business_name

- ① 默认开启 `{nickname} · {city} 向导` 市场标题

- 未跑 Hub/Settings 绿集即改 Hub layout lock

- **Identity Center 新产品功能**（见 [IDENTITY-CENTER-PHASE2-FREEZE](./IDENTITY-CENTER-PHASE2-FREEZE.md)）



---



## 完成定义（P1+P2 Done · ①）



- [x] 向导改 city 后市场标题变、nickname 不变（`guideDisplayName`）

- [x] Admin 向导队列可 approve/reject

- [x] 四轨 settings + 市场预览 + blocked_reasons（settings 页）

- [x] `meIdentitiesUiFreeze` + `meIdentityP2Settings` + `meGuideProfileSettings` exit 0

- [x] ① smoke 脚本 exit 0（**非** ② GO）

- [x] Hub 卡三行 blocked_reason（P2-3 · 2026-06-13）


