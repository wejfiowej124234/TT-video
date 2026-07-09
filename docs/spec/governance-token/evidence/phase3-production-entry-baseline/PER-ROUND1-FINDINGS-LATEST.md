# PER Round 1 — Findings Log (record only · no fixes)

**Review:** Production Entry Review · Round 1  
**Host:** `http://127.0.0.1:3012` (**Local SSOT**)  
**API:** `http://127.0.0.1:8080`  
**Stamp:** `20260709T142800Z`  
**Alignment gate:** [LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md](./LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md) · `LOCAL_SSOT_READY`  
**Rule:** Record **Confirmed Issue (CI)** only · mark **Verification Pending (VP)** where not inspected · **no fixes during Round 1**

---

## Round 1 verdict (rolling)

| Item | Result |
|------|--------|
| **Pages walked** | 10 / 10 (escrow = invalid-ID error path only) |
| **Open Confirmed Issues (new R1)** | **15** (`PER-R1-CI-01` … `PER-R1-CI-15`) |
| **Carry-over CI (prior audit)** | CI-04 · CI-05 |
| **Verification Pending (site)** | **9** (`PER-R1-VP-01` … `PER-R1-VP-09`) |
| **Suggested Wave** | **Wave A** hygiene/dev-surface · **Wave B** copy/IA · **Wave C** data/SEO/mobile/a11y |
| **PER Round 1 status** | **COMPLETE (record-only)** → **[Wave backlog FROZEN](../../../../../docs/runbook/PER-WAVE-REMEDIATION-PLAN-v1.md)** |

---

## 13 dimensions (per page)

| # | Dimension |
|---|-----------|
| 1 | Visual UI |
| 2 | UX Flow |
| 3 | Copy |
| 4 | IA |
| 5 | CTA |
| 6 | Empty State |
| 7 | Error State |
| 8 | Loading |
| 9 | Permission |
| 10 | Mobile |
| 11 | SEO |
| 12 | Accessibility |
| 13 | Production Hygiene |

**Legend:** ✅ PASS · ⚠️ CI · ⏳ VP · — not checked this round

---

## Site-wide Confirmed Issues (cross-page)

| ID | Finding | Pages | Wave |
|----|---------|-------|------|
| **PER-R1-CI-01** | **Next.js Dev Tools** affordance visible in public DOM (`Open Next.js Dev Tools`) | `/` · `/traveltrust` · `/market` · `/community` · `/escrow/*` · `/traveltrust/announcements` | **A** |
| **PER-R1-CI-02** | Consumer **footer「技术」** exposes operator links **费路由（治理）** · **费路由自检** — not end-user IA | `/` · `/market` · (shared footer) | **B** |
| **PER-R1-CI-03** | **Logged-out chrome** OK on walk; **seed/test personas** on public chrome when session active (prior **CI-04**) | global chrome | **A** (③ policy) |
| **PER-R1-CI-04** | **Mock TTG / mock-swap** surface still present in local dev HTML (`mock-swap`); production-build kill-switch not walked live (prior **CI-05**) | `/traveltrust` | **A** |
| **PER-R1-CI-05** | **Phase / engineering jargon** in user-visible copy: `Sepolia ②` · `Phase 1/2/3` · `① 本地` · `测试网 RUNTIME` | `/traveltrust` · `/governance` · `/market` · `/traveltrust/announcements` | **B** (③ polish vs ② honest disclosure — Owner classify) |

---

## Site-wide Verification Pending

| ID | Item | Notes |
|----|------|-------|
| **PER-R1-VP-01** | Mobile **375px** layout | Desktop walk only |
| **PER-R1-VP-02** | Full **en** locale parity | zh default walked; en toggle not swept |
| **PER-R1-VP-03** | **axe / keyboard** sweep | Skip-link present on all pages ✅ spot only |
| **PER-R1-VP-04** | **hreflang / canonical** consistency | `/` og:url = localhost · `/traveltrust` og:url = traveltrust.app |
| **PER-R1-VP-05** | **Logged-in** `/me` · chrome personas | Anonymous walk — body empty/shell only |
| **PER-R1-VP-06** | **Escrow happy path** + Mock Pay visibility | Only invalid UUID + loading observed |
| **PER-R1-VP-07** | **Community** feed populated state | Captured loading/empty sidebar only |
| **PER-R1-VP-08** | **Forced error** states (API 5xx / offline) | Not triggered |
| **PER-R1-VP-09** | **Production build** (`next build` + start) hygiene proof | Dev server walk |

---

## Page matrix (10 routes · priority order)

### 1 · `/` 首页

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | ① freeze · hero + form IA coherent |
| UX | ✅ | CTA cluster: 开始规划 / 浏览向导 / 逛社区 |
| Copy | ✅ | Production-grade hero |
| IA | ✅ | Five-main nav consistent |
| CTA | ✅ | Primary「AI 生成行程」visible |
| Empty | ⏳ VP | Itinerary preview empty not triggered (no generate) |
| Error | ⏳ VP | — |
| Loading | ⏳ VP | — |
| Permission | ✅ | Anonymous OK |
| Mobile | ⏳ VP | — |
| SEO | ⚠️ **PER-R1-CI-06** | `og:url` = `http://127.0.0.1:3012` (local leak in meta) |
| a11y | ✅ | Skip link · labelled form fields |
| Hygiene | ⚠️ CI-01 · CI-02 | DevTools + footer operator links |

**L5 (Round 1):** ★★★★☆ (4.0)

---

### 2 · `/traveltrust`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | Cinematic shell · Pulse CMS |
| UX | ✅ | FAQ accordion · chapter nav |
| Copy | ⚠️ **PER-R1-CI-07** | SR-only list item exposes **「① 本地 Mock」** phase vocabulary |
| IA | ✅ | Product vs TTG vs trust lanes separated |
| CTA | ✅ | 规划行程 · 帮助 · 治理 links |
| Empty | ✅ | Pulse items populated |
| Error | ⏳ VP | — |
| Loading | ✅ | 3D layer degrade copy present |
| Permission | ✅ | Public |
| Mobile | ⏳ VP | — |
| SEO | ⚠️ **PER-R1-CI-08** | meta/og description embeds **Sepolia ② Web3 Runtime ACTIVE** |
| a11y | ✅ | SR chapter list · reduced-motion path |
| Hygiene | ⚠️ **PER-R1-CI-09** · CI-04 | **间距调试** toggle on public page · DevTools · mock-swap |

**L5:** ★★★★☆ (4.0)

---

### 3 · `/market`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ⚠️ **PER-R1-CI-10** | **13× duplicate「杭州 向导」** cards — catalog dedup / display quality |
| UX | ✅ | Empty orders state with 3-step guidance |
| Copy | ⚠️ **PER-R1-CI-11** | Guide card **「多重身份演示 · 向导轨」** · **Playmate** tag · **币种未提供** |
| IA | ✅ | Subsite nav · dual-column |
| CTA | ✅ | 自定义行程 · 发布行程 |
| Empty | ✅ | 「暂无待撮合订单」+ steps |
| Error | ⏳ VP | API degrade banner not forced |
| Loading | ⏳ VP | — |
| Permission | ✅ | Anonymous browse OK |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | curl timeout — not captured |
| a11y | ✅ | Tabs · region labels |
| Hygiene | ⚠️ **PER-R1-CI-12** · CI-01 | Footnote **「① 本地已过滤测试/演示数据」** user-visible · DevTools |

**L5:** ★★★☆☆ (3.5)

---

### 4 · `/escrow` (`/escrow/{uuid}`)

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ⏳ VP | Loading shell only (invalid UUID `00000000-…` / `e2e-test-id`) |
| UX | ⏳ VP | Need seeded real order |
| Copy | ⏳ VP | — |
| IA | ✅ | Title「订单详情」 |
| CTA | ⏳ VP | — |
| Empty | ⏳ VP | — |
| Error | ⏳ VP | Error panel not awaited post-load |
| Loading | ✅ | 「加载中…」status present |
| Permission | ⏳ VP | Login-gated actions not exercised |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | — |
| a11y | ✅ | main + region labelled |
| Hygiene | ⚠️ CI-04 · CI-05 | Mock pay — **VP-06** |

**L5:** ★★★☆☆ (3.0 · coverage-limited)

---

### 5 · `/governance`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | Portal hub layout |
| UX | ✅ | Suggested path note (wallet → pools → proposals) |
| Copy | ⚠️ CI-05 carry | **Sepolia ② Web3 Runtime ACTIVE** in hero |
| IA | ⚠️ **PER-R1-CI-13** | Public hub lists **管理台：*** admin/ops deep links alongside user paths |
| CTA | ✅ | 投票委托 · 提案 |
| Empty | ⏳ VP | Pool snapshot was loading at capture |
| Error | ⏳ VP | — |
| Loading | ✅ | 「加载中…」observed |
| Permission | ⏳ VP | Admin link reachability not clicked |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | — |
| a11y | ✅ | notes + nav regions |
| Hygiene | ⚠️ CI-02 | 费路由自检 in public nav |

**L5:** ★★★★☆ (3.8)

---

### 6 · `/trust`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | Trust pillars layout |
| UX | ✅ | Auto-check + refresh |
| Copy | ⚠️ **PER-R1-CI-14** | User copy cites internal spec **`D-4555-A/B`** |
| IA | ✅ | Links to governance params |
| CTA | ✅ | 立即刷新 |
| Empty | ⏳ VP | Trust check result pending at capture |
| Error | ⏳ VP | — |
| Loading | ✅ | 「正在核对…」 |
| Permission | ✅ | Public read-only |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | — |
| a11y | ✅ | regions labelled |
| Hygiene | ⚠️ CI-02 | Footer operator links |

**L5:** ★★★★☆ (4.0)

---

### 7 · `/community`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | Feed shell · filters |
| UX | ✅ | Publish · search · tabs |
| Copy | ✅ | Tagline OK |
| IA | ✅ | TT community subnav |
| CTA | ✅ | 发布 |
| Empty | ✅ | Sidebar「暂无新作者」 |
| Error | ⏳ VP | — |
| Loading | ✅ | 「正在加载官方精选…」「正在加载帖子」 |
| Permission | ⏳ VP | Post auth not exercised |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | — |
| a11y | ✅ | searchbox labelled |
| Hygiene | ⚠️ CI-01 | DevTools · TODO in HTML source (grep) |

**L5:** ★★★★☆ (3.8 · feed content VP)

---

### 8 · `/me`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ⏳ VP | Anonymous — header only in snapshot |
| UX | ⏳ VP | Login redirect / empty gate not confirmed |
| Copy | ⏳ VP | — |
| IA | ⏳ VP | — |
| CTA | ⏳ VP | — |
| Empty | ⏳ VP | — |
| Error | ⏳ VP | — |
| Loading | ⏳ VP | — |
| Permission | ⏳ VP | **VP-05** |
| Mobile | ⏳ VP | — |
| SEO | ✅ | title「社区资料 \| TravelTrust」 |
| a11y | ⏳ VP | — |
| Hygiene | ⏳ VP | — |

**L5:** — (insufficient coverage)

---

### 9 · `/help`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | FAQ accordion |
| UX | ✅ | Deep links to pay · escrow · disputes |
| Copy | ⚠️ carry **CI-help** | **`08-4`** · **`GET /meta`** · **Runbook §7.1** · env var names in user FAQ |
| IA | ✅ | Grouped sections |
| CTA | ✅ | Accordion + outbound links |
| Empty | ✅ | N/A |
| Error | ⏳ VP | — |
| Loading | ✅ | Static |
| Permission | ✅ | Public |
| Mobile | ⏳ VP | — |
| SEO | ⏳ VP | curl incomplete |
| a11y | ✅ | buttons + headings |
| Hygiene | ⚠️ CI-02 | 费路由自检 links in FAQ |

**L5:** ★★★☆☆ (3.5)

---

### 10 · `/traveltrust/announcements`

| Dim | Result | Notes |
|-----|--------|-------|
| UI | ✅ | Lane filters · cards |
| UX | ✅ | Back link · TTG vs product separation |
| Copy | ✅ | CMS production copy · honest TTG disclaimers |
| IA | ✅ | Product / TTG / protocol zones |
| CTA | ✅ | 查看详情 · 浏览治理提案 |
| Empty | ⏳ VP | Brief「加载公告中…」then populated |
| Error | ⏳ VP | — |
| Loading | ✅ | Loading copy observed |
| Permission | ✅ | Public CMS |
| Mobile | ⏳ VP | — |
| SEO | ⚠️ **PER-R1-CI-15** | `<title>` **English** `Project updates & announcements` while UI zh |
| a11y | ✅ | regions + headings |
| Hygiene | ⚠️ CI-01 · CI-05 | DevTools · 测试网 section label (intentional ② disclosure — classify) |

**L5:** ★★★★☆ (4.2)

---

## Wave assignment (for Round 2 planning only)

| Wave | Scope | IDs |
|------|-------|-----|
| **Wave A** | Dev surface · mock · test identity · build proof | CI-01 · CI-03 · CI-04 · CI-05 · PER-R1-CI-01 · CI-04 · CI-09 |
| **Wave B** | Copy · IA · internal refs · footer nav · SEO meta | PER-R1-CI-02 · CI-06 · CI-07 · CI-08 · CI-11 · CI-12 · CI-13 · CI-14 · CI-15 · help 08-4 |
| **Wave C** | Data quality · mobile · a11y · escrow/community/me depth | PER-R1-CI-10 · VP-01..09 |

---

## Next step (frozen workflow)

```
PER Round 1 ✅ (this log)
    ↓
Wave A/B/C backlog freeze (Owner sign-off)
    ↓
Local batch fix
    ↓
Local Gate green
    ↓
Commit SSOT
    ↓
Deploy Staging (one-shot)
    ↓
Env-diff verify only
```

**Do not fix during Round 1.** No code changes in this pass.

---

## Evidence

- Browser walk: Local SSOT `20260709T142800Z`
- Hygiene grep: local HTML patterns (`mock-swap` · `08-4` · `TODO` · `测试`)
- Alignment: [LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json](./LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json)
- Machine matrix: [PER-ROUND1-MATRIX-LATEST.json](./PER-ROUND1-MATRIX-LATEST.json)

**Honest boundary:** Round 1 local walk **≠** PER exit **≠** Production GO.
