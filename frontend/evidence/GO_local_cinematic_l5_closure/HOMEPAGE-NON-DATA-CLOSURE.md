# `/traveltrust` 首页 · 除真实数据外前端收口（①）

**阶段：① 本地** — **不**等同 ②③ 真链、staging 全矩阵、Production GO。

**日期：** 2026-05-20（叙事页）；**2026-05-21** 增 L1/兑换/L0 对齐（见 [`../GO_local_marketing_front_closure/README.md`](../GO_local_marketing_front_closure/README.md)）  
**Maintainer：** 本地目视 + §6.2 已签（见 [`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md)）

---

## 已收口（可冻结 UI / 不再做大改版）

| 域 | 状态 | 真源 |
|----|------|------|
| 信息架构 | **layout lock** `hero → roles → liquidity → trust → settlement → faq → start`（**无** `#overview` 四卡） | **`traveltrustHomeLayoutLockL5`** · **[FIVE-MAIN-ROUTES](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** |
| 电影 L5 | **closed ①** `TT-CINEMATIC-L5` | runbook · §6.2 PNG |
| Hero 地球 | **closed ①** `TT-GLOBE-L5` | `GO_local_hero_globe_a_closure/` |
| 五角色 IA | 游客·向导·商家·收购·区域主理人 | `traveltrustIdentityModel` |
| 合规叙事 | FAQ / 预览条 / Escrow≠TTG | locales + strips |
| 页脚 /  rhythm | xl 三列 · 竖向节奏 token | `traveltrustCinematicNonGlobeL5` |
| Hydration | 剧场 + Hero 媒体 tier | `useTraveltrustMediaUrlsHydrated` |
| 工程闸 | Vitest + PNG | `verify-cinematic-l5-local.sh` |
| 子项 198–205 | **closed ①**（随 §6.2） | [`ISSUES-ENGINEERING-SYNC.md`](./ISSUES-ENGINEERING-SYNC.md) |
| 稳定币段 | **closed ①** 示意 UI + 三 CTA 暖金统一 | `TT_STABLECOIN_GATEWAY_L5` · [`marketing_front_closure`](../GO_local_marketing_front_closure/README.md) |
| L1 chrome | **closed ①** **`TravelTrustHomeLandingNavSlot`** portal + 章节 nav + **CSS** 公告跑马灯双行常驻 | **`TravelTrustHomeLandingNavSlot.tsx`** · **`TravelTrustLandingChrome.tsx`** · **[FIVE-MAIN-ROUTES](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** |
| L1 公告标签对比度 | **closed ①（2026-06-03）** — 「项目动态 · 全部 ›」暖金可读 | **[`L1-PULSE-LABEL-CONTRAST-FREEZE`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md)** |
| L0 四链（全站） | **closed ①** 暖金激活；`/traveltrust` 不亮 Web3 | `headerNavItemIsActive` · `marketingUi.ts` |
| tier-1 媒体出口 | 占位 MP4 + env 模板 | [`PHASE2-LOCAL-PREP.md`](./PHASE2-LOCAL-PREP.md) |

---

## 仅余「真实数据 / 外链 / 环境」（②③ · 不阻塞 UI 冻结）

**②/③ 编号任务 SSOT：** [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](../GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md)（**TTNET-P2-001～008** · **TTNET-P3-001～004**）

| 项 | 负责 | 文档 |
|----|------|------|
| 五角色 **实拍** MP4 | 媒体批 · ② | [`DEFER-02-ROLE-MEDIA.md`](./DEFER-02-ROLE-MEDIA.md) → **TTNET-P2-001** |
| 官方社媒 **https** env | 运维 · ② | `.env.traveltrust-media.example` → **TTNET-P2-002** |
| `page-brief` / 治理参数 **真 API** | 后端 · ② | `useTravelTrustPageBrief` → **TTNET-P2-003** |
| TTG **测试网**真兑换 | 链 + API · ② | 网关示意保持 L4 → **TTNET-P2-004** |
| 钱包 / Escrow **真链** | ②③ | **TTNET-P2-006** / 全局 Escrow backlog |
| 埋点 **生产 ingest** | ② | **TTNET-P2-008** · `TT-PH1-050` defer ② |
| Lighthouse / WCAG 深测 | 发版前 · ②③ | [`DEFER-03-LIGHTHOUSE-WCAG.md`](./DEFER-03-LIGHTHOUSE-WCAG.md) → **TTNET-P3-003** |
| 93 路由 / 角色交叉穷举 | 全站 · ②③ | **TTNET-P2-007** = R-003 轨 1 |

---

## 不纳入本页「未收口」（历史台账 · 别混进首页）

| ID | 说明 |
|----|------|
| TT-PH1-150～153 | 早期布局截图债；**不**阻塞 `/traveltrust` 叙事页 ① 冻结 |
| TT-PH1-190/191 | **`/`** 主站获客页，非 `/traveltrust` |

---

## 波 0 导流对齐（①）

见 [`WAVE-0-CTA-ALIGNMENT.md`](./WAVE-0-CTA-ALIGNMENT.md) · 机读 [`traveltrustHomepageFunnelL5.ts`](../../lib/traveltrustHomepageFunnelL5.ts)。

---

## 推送前（①）

```bash
bash scripts/gates/verify-cinematic-l5-local.sh
cd frontend && npm run test -- traveltrustHomepageFunnelL5 --run
# 可选：bash scripts/gates/traveltrust-phase2-local-prep.sh  # ② 播 tier-1 短片
```

**禁止假完成：** ① 冻结 **≠** ②③ Production GO。
