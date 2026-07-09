# TravelTrust CMS Master Registry

| | |
|---|---|
| **Version** | V2 |
| **Status** | ACTIVE |
| **Baseline** | Ten Country CMS Content QA |
| **Last Updated** | 2026-07-07 |
| **Owner** | Solo Founder |

> **当前唯一有效版本。** Registry = 总账 · 不替代 Evidence · 不是项目管理工具

## 治理三层

```
CMS Master Registry  →  现在是什么状态？
        ↓
   今天做什么（下一步）
        ↓
Evidence             →  为什么是这个状态？
        ↓
Script               →  怎么重新生成？
```

| 层 | 职责 | 示例 |
|----|------|------|
| **① Registry** | 现在是什么状态？ | POI → Frozen · City Hero → Pilot |
| **② Evidence** | 为什么是这个状态？ | TT_CMS_CN_COUNTRY PASS · 330/330 LOCK · Exit PASS |
| **③ Script** | 怎么重新生成？ | `node scripts/dev/run-cms-master-registry.cjs` |

## 统计（5 秒一眼）

```
CMS Modules:     14
Frozen (P0):     3
Pilot (P1):      2
Backlog:         6
Registry Only:   3
L5 Ready:        3/11
```

**今日焦点：** Hotel → Discovery Complete · 等待实现决策 · 不进入 WP0/Admin/API

> Frozen = 基线冻结，除非 Bug 不改 · Registry = 登记归属，不走 CMS L5

## Master Table

| 模块 | 状态 | Business Critical | L5 | CMS | 下一步 |
|------|------|-------------------|-----|-----|--------|
| POI Content QA | ✅ Frozen | P0 | ✅ | CMS | 无 |
| Destination Ambient | ✅ Frozen | P0 | ✅ | CMS | 无 |
| Hero Assets | ✅ Frozen | P0 | ✅ | CMS | 无 |
| City Hero | ⏳ Pilot | P1 | ❌ | CMS | Pilot Architecture Validated · WP5 暂停 · 无 L5/Consumer/Ops 矩阵 |
| Hotel | ⏳ Pilot | P1 | ❌ | CMS | Discovery Complete · Brief+Matrix+Boundary · 等待实现决策 |
| Transport | 📋 Backlog | P1 | ❌ | CMS | P1 后续 · 按 Standard 规模化 |
| Listings | 📋 Backlog | P1 | ❌ | CMS | P1 后续 · 按 Standard 规划结构 |
| Banner | 📋 Backlog | P2 | ❌ | CMS | 上线后 |
| Video Poster | 📋 Backlog | P2 | ❌ | CMS | 上线后 |
| SEO | 📋 Backlog | P2 | ❌ | CMS | 上线后 |
| i18n Copy | 📋 Backlog | P2 | ❌ | CMS | 上线后 |
| Official Guides | Registry | — | — | OCS | 无 |
| Community | Registry | — | — | OCS | 无 |
| Governance | Registry | — | — | NON_CONTENT | 无 |

## 状态（仅四种）

| 状态 | 含义 |
|------|------|
| ✅ Frozen | 已完成并冻结 |
| ⏳ Pilot | 正在验证 |
| 📋 Backlog | 计划中 |
| Registry | 仅登记，不属于 CMS |

## 四个问题

1. 有哪些 CMS 模块？ → 上表
2. 哪些已冻结？ → POI · Ambient · Hero
3. 哪些还没做？ → Pilot + Backlog
4. 下一步做什么？ → **Hotel → Discovery Complete · 等待实现决策**（City Hero Pilot Architecture Validated · WP5 暂停）

**P1 Standard：** FROZEN v1.1.0 · [TT-CMS-P1-CONTENT-FAMILY-STANDARD.md](../../docs/runbook/TT-CMS-P1-CONTENT-FAMILY-STANDARD.md)

Execution / Runtime / Exit Check / Country Runtime → `evidence/GO_cms_operation/`

## 重新生成 Registry

```bash
node scripts/dev/run-cms-master-registry.cjs
```

## P1 路线图

```
P1 Standard  →  City Hero (Pilot Arch ✅ · 暂停)  →  Hotel (Discovery ✅)  →  Transport  →  Listings
   ✅                    Pilot                         Pilot · 等待实现        Backlog       Backlog
```

目标：POI + Ambient + Hero + City Hero + Hotel + Transport + Listings = 第一套完整 CMS 能力体系
