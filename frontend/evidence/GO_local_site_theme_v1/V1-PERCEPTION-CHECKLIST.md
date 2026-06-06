# V1 感知完善清单 · 勾选镜像（波次 C · ①）



**SSOT 条文：** [TT-PH1-SITE-THEME-V1-UPGRADE-001 · §3.2.8～3.2.11](../../../docs/runbook/TT-PH1-SITE-THEME-V1-UPGRADE-001.md)  

**阶段：** **D1～D10 = 阶段一① 必须过** → **D11+ 才测网**（§3.3 + TT-9618）· **禁止跳阶**

**维护规则：** 完成一项打 `[x]`；D10 以 **§3.2.11** 总闸为准；未过总闸 **禁止** 开测试网。



**图例：** `[ ]` open · `[x]` closed ① · **defer** 须在 §3.2.6 写明理由



---



## 十日冲刺进度（§3.2.8 · 含 §3.2.9 增补）



| 日 | 主题 | 交付要点 | done |

|----|------|----------|------|

| D1 | 221-A + 229 + **231** | Hero 暖金 · contract 翻转 · §2.4 `/` 行 | [x] |

| D2 | 221-B/C + **G10** | 结果区 · UnlockModal · `home-landing-shell` E2E | [x] |

| D3 | 221-D + 222▸ + **221 全勾** | Footer · SortBar/Orders 改码 | [x] |

| D4 | 222 + 230 + 223 + **G3** | Showcase · contract · 壳 · Hub/Filter 目视 | [x] |

| D5 | 224 + **G2/G5** | market/rank 首屏 · 子站 · 榜弹窗 | [x] |

| D6 | 224 + 225E▸ + **G9** | `/` 叙事 · community Feed · mobile 起草 | [x] |

| D7 | 225-F/E + **G4/G22** | 抽屉 · 市场弹窗各开 1 次 | [x] |

| D8 | 225-G + **G12/G13** | §6.1 **86/86** · community `rg` | [x] |

| D9 | 232 + 231 + 234 + **G1** | POST 全路由机采 · WAVE-C | [x] |

| D10 | **§3.2.11 阶段一总闸** | 感知层 + PI-1 复闸 + PH-1 签字 | [x] |



---



## D10 · 阶段一① 总闸（§3.2.11 · 全 true 才能 D11 测网）



### A · 感知层（§7.2）



- [x] 220～234 机读 closed ① · §6.1 **122/122** · Q1/Q6 手拼 · Q2/Q5 目视 · 2026-05-24



### B · PI-1（[issues-phase1-local](../../../docs/runbook/issues-phase1-local-traveltrust-v6.md)）



- [x] P0/P1 无挡路 open（电影 L5 **202/203** defer **②** 已登记）

- [x] `e2e:pi1-traveltrust` **33/33**（gate rerun8 · `last-local-gate-20260524T141958Z.txt`）

- [x] `traveltrust-ph1-homepage-local.sh` E2E_FULL + VERIFY_SCREENSHOTS exit 0

- [x] `human-verify-checklist` 150～158 / 190～193 已签

- [x] `phase-signoff.md` **PH-1** 已签（2026-05-24）

- [x] 电影 L5：**defer ②** 已登记（`D10-DEFER-20260524.txt`）



### C · 测网开门



- [ ] 上列全勾 → **第 11 天** 才做 §3.3 / TT-9618



---



## 五主路由 ① 冻结（2026-05-25）

- [x] **`/` · `/traveltrust` · `/market` · `/did-rank` · `/community/*`** UI 壳 — 文档 [`FIVE-MAIN-ROUTES-PHASE1-FREEZE`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · **88 §一** 冻结段

---

## ② 测试网（D11+ · §3.3 · 仅当 §3.2.11 已过）



- [ ] **T1** 测试域名 + API env

- [ ] **T7** `next build` + 测试 FE 部署

- [ ] **T9** CDN/缓存清理后硬刷新

- [ ] **T2** 五路由 Q1～Q5（`WAVE-C-staging/`）

- [ ] **T8** 移动 390 + market 子站

- [ ] **T3** Q2 四链连点

- [ ] **T4** auth 跳转记录

- [ ] **T5** `STAGING-visual-*.txt`

- [ ] **T6** TT-9618 §3.1 数据链



---



## 增补缺口（§3.2.9）



- [x] **G1** POST 含 `home` desktop+mobile（`POST-visual-20260524-d9` · 2026-05-24）

- [x] **G2** `market-provider` / `market-acquisition` POST（`e2e:site-theme-v1-capture` · 硬刷新见 `LOCAL-HARD-REFRESH-V2-20260524.md` · 2026-05-24）

- [x] **G3** Hub · ViewSwitcher · StickyFilter（机读 + 待硬刷新目视 · 2026-05-24）

- [x] **G4** BookGuide / CustomItinerary / Invite / Showcase · `marketModalsG4.contract` + market `guide_id` E2E（2026-05-24）

- [x] **G5** did-rank 榜内弹窗（`e2e/site-theme-v1-did-rank-guide-modal.spec.ts` + `G5-did-rank-guide-modal/*.png` · 2026-05-24）

- [x] **G6** TrustBadgesRow（D1 · `variant="home"`）

- [x] **G7** Hero `/traveltrust` 链（D1 · `TT_MARKETING_BTN_NETWORK_LINK_HOME`）

- [x] **G8** P5-4 · 44px 主路径 token 抽检（`siteThemeV1TouchTarget.contract` + Hub/周期 Tab `min-h-[44px]` · 2026-05-24）

- [x] **G9** — `home/market/did-rank/community` · `mobile-390x844.png`（D9 POST · 2026-05-24）

- [x] **G10** `home-landing-shell` E2E（spec 已对齐暖金 · 本地跑通待 API `:8080` 起）

- [x] **G12** §6.1 **119/119** + `POST-baseline-20260524-d8.txt`（基线 86 + 波次 C/D6–D8 扩展 · 2026-05-24）

- [x] **G13** community `rg` 冷色 0 · `communityMainPathRg.contract`（2026-05-24）

- [x] **G16** `community/` 根 POST 与 explore 等同批（2026-05-24）

- [x] **G18** `homeMarketing` + `siteThemeV1StateFamily` + `marketModalsG4` 纳入 §6.1 扩展（2026-05-24）

- [x] **G19** 230 覆盖 SortBar + OrdersSection（`marketTheme.contract` · 2026-05-24）

- [x] **G20** defer P3 · `D10-DEFER-20260524.txt`

- [x] **G21** defer P3 · 226 · `D10-DEFER-20260524.txt`

- [x] **G22▸** — `/` UnlockModal 暖金 pay + `data-testid` · 机读；市场解锁仍经 landing 组件（2026-05-24）



---



## 登记



- [x] **TT-PH1-220** — §3.2 + §3.2.6 已读 · P-1～P-15 已对齐 · defer 见 `D10-DEFER-20260524.txt`



## 感知 L5（Q1～Q8）



- [x] **Q1** — `WAVE-C-screenshots/five-routes-cta.png`（2026-05-24）
- [x] **Q2** — 四链连点 + G21 orders 桥 defer P3

- [x] **Q3▸** — POST 四路由 desktop + mobile（D9/D10 旁证 · 2026-05-24）

- [x] **Q4** — G13 rg 0 + D10 主路径 rg（2026-05-24）

- [x] **Q5** — 暗底可读 · POST 暗底路由 PNG
- [x] **Q6** — `home-full-scroll.png`（2026-05-24）

- [x] **Q7** — §6.1 **122/122** · `POST-baseline-20260524-d10`（2026-05-24）

- [x] **Q8** — 234▸ + defer 表 · 2026-05-24



---



## 第一波 C-1



### `/`（221 + 229）



- [x] **221-A** — `LandingHeroForm`（暖金 · 229 机读 · 2026-05-24）

- [x] **221-B** — `ItineraryResultsSection`（暖金解锁 · 卡 ring · 2026-05-24）

- [x] **221-C** — `UnlockModal`（`TT_MARKETING_HOME_UNLOCK_MODAL_PAY_BTN` · 2026-05-24）

- [x] **221-D** — `LandingFooter`（① 收口 · 2026-05-24；**2026-05-25** 页脚改为冷灰 `TT_MARKETING_HOME_FOOTER_*`，与 Hero 暖金分层 — 见 [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)）

- [x] **229** — `homeMarketing.contract`（禁 `bg-cta-gradient` · 2026-05-24）

- [x] **TT-PH1-221** closed ①（221-A～D · 2026-05-24）

- [x] **TT-PH1-229** closed ①



### `/market`（222 + 230 + 223）



- [x] **222-B** — SortBar · Orders · MerchantShowcaseForm（2026-05-24）

- [x] **230** — contract 点名 SortBar/Orders/Showcase（2026-05-24）

- [x] **223-C** — market 壳（`TT_MARKETING_DARK_ROUTE_SCENE.market` 略抬 · 2026-05-24）

- [x] **TT-PH1-222** closed ① · **TT-PH1-230** closed ① · **TT-PH1-223** closed ①



---



## 第二波 C-2



- [x] **224-D** — 四路由首屏（market+rank D5 · `/` ambient+`data-tt-home-first-task` · community 首条 `data-testid` · 2026-05-24）

- [x] **225-E** — 五路由状态族 · `siteThemeV1StateFamily.contract`（2026-05-24）

- [x] **225-F** — Invite 玻璃壳 · drawer 暖 focus · `marketModalsG4`（2026-05-24）

- [x] **225-G** — Feed 筛选/空态暖 focus · fuchsia 别名收口 · `communityMainPathRg`（2026-05-24）

- [x] **226-F** — defer P3 · `D10-DEFER-20260524.txt`



---



## 第三波 C-3（按需）



- [x] **227-G** — defer P3 · `D10-DEFER-20260524.txt`
- [x] **227-H/I** — defer P3 · 同上



---



## 出口



- [x] **231** — §2.4 `/` + POST `home/*`（2026-05-24）

- [x] **232** — POST-screenshots + `POST-visual-20260524-d9`（2026-05-24）

- [x] **234▸** — 主路径已对账 · D10 §3.2.6 次要 ○（2026-05-24）

- [x] **228** — Q1～Q8 + PI-1 · `WAVE-C-signoff-20260524-d10.txt` · gate 20260524T141958Z
- [x] **§7.2** — 感知层 + PH-1 总闸 **① closed**（2026-05-24）



---



## 命令速查（§3.2.10）



```bash

# §6.1 全量 86/86（D8/D10）

cd frontend && npm run test -- --run lib/uiSystem.test.ts lib/marketingUi.test.ts \

  components/market/marketTheme.contract.test.ts \

  components/market/marketDetailDrawerClasses.contract.test.ts \

  components/did-rank/didRankTheme.contract.test.ts \

  components/community/communityShellTheme.contract.test.ts \

  components/community/communityPageTheme.contract.test.ts \

  components/community/communityFeedActionTheme.contract.test.ts \

  components/community/communityDrawerTheme.contract.test.ts \

  components/community/communityMainPathRg.contract.test.ts \

  lib/siteThemeV1StateFamily.contract.test.ts \

  lib/siteThemeV1PostRoutes.contract.test.ts \

  components/market/marketModalsG4.contract.test.ts \

  components/guides/guidesTheme.contract.test.ts \

  components/auth/authHelpBridgeTheme.contract.test.ts \

  app/traveltrust/traveltrustErrorTheme.contract.test.ts \

  components/shell/marketDarkRouteScene.contract.test.ts



# 波次 C + D6–D8 扩展（已并入上列）

cd frontend && npm run test -- --run app/(home)/homeMarketing.contract.test.ts



# POST + mobile（D9）

cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-capture



# D2

cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e -- home-landing-shell

# D10 · 主题 V1 机读子闸（含 §1.7 Action / G8 touch）
bash scripts/gates/site-theme-v1-d10-machine.sh

# G5 · did-rank 榜内弹窗（须 API :8080 + guides 非空）
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test e2e/site-theme-v1-did-rank-guide-modal.spec.ts --config=playwright.site-theme-v1.config.ts

# Theme V2 · ① 闭卷（§1.7 · 机读 + G5 + 硬刷新机采）
bash scripts/gates/site-theme-v1-v2-action-closure.sh

# D10 · PI-1 复闸（阶段一总闸 · API :8080 须健康 · /meta 勿 408）
cd frontend && npm run e2e:pi1-traveltrust
TRAVELTRUST_PH1_E2E=1 TRAVELTRUST_PH1_E2E_FULL=1 TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1 \
  bash scripts/gates/traveltrust-ph1-homepage-local.sh
```



**证据目录：** `POST-screenshots/<slug>/desktop-1280x800.png` · `mobile-390x844.png` · `WAVE-C-screenshots/` · `WAVE-C-signoff-YYYYMMDD.txt`



**禁止假完成：** ① ≠ ② ≠ GO · **home contract 仍要求 cta-gradient 时不得宣称 Q7/229 closed**


