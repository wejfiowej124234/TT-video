# TT-MASTER-PUBLISH-GO-CHECKLIST-001 · 十日首发总闸（勾完 = 无缺口 · 可上线）

**Version:** 1.0.9  
**Status:** `Active` — **十日首发 · 表全勾 + 签字闸 + go-live 子项 = 可发布（scope 内）**  
**目标：** **D0 起 10 日**（可 **S-10** 延至 12 日）完成三阶段；见 **[§0.4 发布保证](#tt-master-publish-can-ship)**、**[§0.11 企业终审](#tt-master-publish-enterprise-audit-v108)**  
**阶次：** **① 本地 → ② 测试网（Fly）→ ③ 发布**；**禁止跳阶**；**禁止** ① 冒充 ②③。

<a id="tt-master-publish-intro"></a>

## 0. 怎么用（只认这一张表）

| 规则 | 说明 |
|------|------|
| **无缺口、能上线** | **§0.5** + **§1 全段（含 Z 签字闸、O 审计并入行）** + **M-00**；**PI-x 问题清单闭卷 + PH-x 签字** 后禁止下一阶段 |
| **阶段问题清单** | 每阶段独立 Markdown；路径见 **[§0.6.2](#tt-master-publish-phase-issue-lists)**；**PI-1/PI-2/PI-3 勾了才能签 PH-1/PH-2/M-00** |
| **阶段签字** | **[§0.6.1 关口四步](#tt-master-publish-phase-checkpoints)**；§1 内 **🛑 / 🚦**；[phase-signoff 模板](evidence-templates/GO_10DAY_PUBLISH-phase-signoff.md) |
| **发布后 backlog** | 仅 **[§0.3 下阶段](#tt-master-publish-post-launch)** 所列（已书面排除在本窗口外） |
| **单人 / 无 PR** | **[§0.2](#tt-master-publish-solo-ci)**：不建 PR；Owner = 本人；C-03 / M-00 = 本人书面签字 |
| **三阶段** | **[§0.6](#tt-master-publish-three-phases)**：一本地全功能手验 → 二 Fly 测试网 + **CI②** → 三生产发布 + **CI③** |
| **CI** | **阶段一不跑 CI**；**阶段二** push → Actions **`e2e`**；**阶段三** 生产部署 / cutover |
| **D0 证据** | 复制模板 → `evidence/GO_YYYYMMDD/`：[README](evidence-templates/GO_10DAY_PUBLISH-README.md)、[SCOPE](evidence-templates/GO_10DAY_PUBLISH-SCOPE.md)、**[issues-phase1-local](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)**（阶段二/三清单见 **§0.6.2**） |
| **细则展开** | [go-live-checklist](../go-live-checklist.md)（E 区逐条）、[缺口总表 P0](../spec/缺口与待补-官方总表.md#-发版前必做p012-项闭环清单)（D 区） |

### 0.1 进度（D0 = ______　D10 = ______）

| 阶段 | 对应阶 | 日历 | 段 | 已勾/合计 | 阶段出口 |
|------|--------|------|-----|-----------|----------|
| **一 · 本地** | ① | **D0～D3** | **A** + **PI-1** + **PH-1** | 10 / ~12 | **PI-1 清单** → **PH-1 签字**（清单见 **§0.6.2**） |
| **二 · 测试网** | ② | **D4～D6** | §0.5 余 + **B、C**（不含 C-04b）+ **L** + **PI-2** + **PH-2** | 0 / ~29 | **PI-2 清单** → **PH-2 签字** |
| **三 · 发布** | ③ | **D7～D10** | **D、E、F、G、I、J 余、K～P、H、PI-3、M-00** | 0 / ~63 | **PI-3 清单** → **M-00** 总闸 |
| **全表** | ①②③ | D0～D10（可 **S-10**→12 日） | §0.5 + §1 | **10 / ~105** | **M-00** |

---

<a id="tt-master-publish-solo-ci"></a>

### 0.2 单人 · 无 PR · CI 分阶段

| 项 | 写死口径 |
|----|----------|
| 协作 | `git commit` → `git push`，**不建 PR** |
| **阶段一（①）** | **不跑** GitHub Actions / `ci-local` / `local-delivery-expanded`；仅 `cargo test -p traveltrust-api`、本地 `npm run dev`、手验 |
| **阶段二（②）** | **首次 push 到 staging 分支或 main** → **`.github/workflows/build.yml` → job `e2e`**；证据入 `evidence/GO_*` |
| **阶段三（③）** | 生产 Fly 部署 + Stripe Live + **go-live** cutover；可选 release workflow |
| 禁止 | ① 本地绿 **顶替** B-09；Actions e2e **顶替** C-01 `report.json` |

---

<a id="tt-master-publish-post-launch"></a>

### 0.3 下阶段（勾完本表**不算欠账** · 勿阻塞上线）

| 项 | 说明 |
|----|------|
| 93 矩阵全文、96-20 每弹窗 | 首发不验；**H-03** 对外口径已锁 |
| TT-PHASED P2（MinIO/HLS/审核台…） | 产品迭代 backlog |
| TT-NEXT 各域新功能 | 同上 |
| 融资 LP / PitchDeck | 与上线无关 |
| **Mainnet G0～G6+SL** | **S-01** 已排除；上主网另开窗口 |
| **mTLS / OFAC 供应商** | **S-03/S-04** 已排除；Phase-2 |
| 完整 PCI SAQ 归档 | **S-02** 已排除；Stripe Live 即可勾 F-01 |

---

<a id="tt-master-publish-can-ship"></a>

### 0.4 勾完 = 无缺口 · 能上线

<a id="tt-master-publish-ship-guarantee"></a>

**十日发布保证（写死 · 仅本 scope）：** 当且仅当下列 **A～G 全部成立**，你可宣称 **本窗口内已可发布（Production GO）**；**任一条不成立 = 不能发布**（即使汇总行已勾）。

| 字母 | 必须成立 |
|------|----------|
| **A** | **§0.5** 九行（含 **S-10** 若滑期）全 `[x]` |
| **B** | **§1 每一汇总行**全 `[x]`（约 **~105** 行，含 **PI-1/2/3**、**PH-1/PH-2**、**GL-00**、**I～P**） |
| **C** | **PI-1、PI-2、PI-3** 已勾；**PH-1、PH-2** 已在 `phase-signoff.md` **签字**（或 **M-00** 在 README）；本表 **PH/M-00** 已勾 |
| **D** | **[go-live](../go-live-checklist.md) §0～§10 约 70 条子项** 已逐条 `[x]`，且 **GL-00** 已勾 |
| **E** | **E-01～E-12** 在 **D** 完成后才可 `[x]` |
| **F** | **`evidence/GO_*`** 含 SCOPE、RELEASE-SCOPE、manifest（**M-02**）、签字 README |
| **G** | **②③** 环境与密钥分离；**F-01** Live 一笔；**C-04b** 生产 smoke |

| 条件 | 结论 |
|------|------|
| **A～G 全成立** | **可以上线**（十日首发 scope） |
| 仅缺 **§0.3** 所列项 | **不**算欠账，**不**阻塞 **G** |
| 对外话术 | **Production GO（十日 scope）**；**不可**宣称 93/96-20 穷举（**S-06 / H-03**） |

---

<a id="tt-master-publish-three-phases"></a>

### 0.6 三阶段总览（10 日 · 个人独立开发）

> **读法：** 每阶段：**§1 技术行全勾 → 阶段问题清单 P0 全闭 → 勾 PI-x → `phase-signoff` 签字 → 勾 PH-x（或 M-00）→ 才能开下一阶段**。

<a id="tt-master-publish-phase-checkpoints"></a>

#### 0.6.1 阶段关口（四步 · 写死）

| 步 | 阶段一 ① | 阶段二 ② | 阶段三 ③ |
|----|----------|----------|----------|
| **1 完成** | A 区 + S-07/08 全 `[x]` | B 区 + **C-01/C-02** + L + A-02 全 `[x]` | 余下 §1 全 `[x]` + go-live 子项 |
| **2 问题清单** | **[PI-1](#tt-master-publish-pi1-gate)**：`issues-phase1-local.md` **P0 全 closed** | **[PI-2](#tt-master-publish-pi2-gate)**：`issues-phase2-staging.md` **P0 全 closed** | **[PI-3](#tt-master-publish-pi3-gate)**：`issues-phase3-production.md` **P0 全 closed** |
| **3 签字** | `phase-signoff.md` **PH-1** | **PH-2** | `README.md` **M-00** |
| **4 勾选** | 本表 **PI-1** + **PH-1** `[x]` | **PI-2** + **PH-2** `[x]` | **PI-3** + **M-00** `[x]` |
| **未做 2～4 步** | **禁止** S-01、B-11… | **禁止** D-01、E-00… | **禁止**对外上线 |

<a id="tt-master-publish-phase-issue-lists"></a>

#### 0.6.2 阶段问题清单（PI-1 / PI-2 / PI-3 · 路径真源）

> **登记：** 手验/联调发现的问题写入对应文件；**P0 未闭不得签本阶段 PH/M-00**。  
> **与 TT-PHASED / TT-NEXT 关系：** 清单只管**本十日窗口内挡阶段出口**的项；长期 backlog 可 defer 并记入 **§0.3**，须在清单 **defer** 列写明。

| 阶段 | 主表行 | 证据路径（`evidence/GO_YYYYMMDD/`） | 模板 |
|------|--------|--------------------------------------|------|
| **一 · ① 本地** | **[PI-1](#tt-master-publish-pi1-gate)** | **`evidence/GO_*/issues-phase1-local.md`**；TravelTrust v6：**[闭卷表](issues-phase1-local-traveltrust-v6.md)** · **[UI/UX 明细](issues-phase1-ui-ux-traveltrust-v6.md)** · **[TT-PH1 审计](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)**（例：`evidence/GO_20260518/`） | [issues-phase1-local](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md) |
| **二 · ② 测试网** | **[PI-2](#tt-master-publish-pi2-gate)** | **`issues-phase2-staging.md`** | [issues-phase2-staging](evidence-templates/GO_10DAY_PUBLISH-issues-phase2-staging.md) |
| **三 · ③ 生产** | **[PI-3](#tt-master-publish-pi3-gate)** | **`issues-phase3-production.md`** | [issues-phase3-production](evidence-templates/GO_10DAY_PUBLISH-issues-phase3-production.md) |

**闭卷判据（写死）：**

1. 清单表内所有 **P0** 行 **`状态=closed`**（修复证据写在「处理/证据」列）。  
2. **P1** 行 **`closed`** 或 **`defer`**（defer 须填目标阶段：二/三/§0.3）。  
3. 清单末 **「阶段出口核对」** 已勾；**PI-x 行** 在本表已 `[x]`。  
4. **然后** 才能在 `phase-signoff.md` / README 签 **PH-1 / PH-2 / M-00**。

#### 阶段一 · 本地 — 全功能跑通 + 你手验（① · D0～D3 · **无 CI**）

| 目标 | 你在本机 Docker/本机进程启动 API + Next + PG，**逐项点功能**，确认主流程可用 |
|------|--------------------------------------------------------------------------------|
| **必须勾** | **S-07、S-08**；**A-01～A-07、A-08**（A-01 已勾）；**A-06** 证据目录 |
| **不跑** | GitHub Actions、`ci-local`、`local-delivery-expanded`、R-003 staging |
| **参考** | [TT-9618](TT-9618-onboarding-local-testnet.md) **§2～§4**（内网 webhook / 可选 Stripe CLI） |
| **本地启动（示例）** | ① `DATABASE_URL` + `sqlx migrate`；② API `8080`；③ `frontend` `npm run dev`；④ 按 TT-9618 跑准入费 + 订单主脊 |
| **阶段出口** | **A-08** + **A-09** + 本节技术项全勾 → **`issues-phase1-local.md` P0 全闭** → 勾 **PI-1** → 签 **PH-1** |

> **⛔ 阶段一完成提醒：** 勾满 **A 区 + A-08 + A-09** 后，先闭 **[PI-1](#tt-master-publish-pi1-gate)** 问题清单，再在 `evidence/GO_*/phase-signoff.md` **签署 PH-1**；**未签 PH-1 不得**勾 **S-01** 或 **B-00**（阶段二）。

#### 阶段二 · 测试网 — Fly.io + 域名 + **CI②**（② · D4～D6）

| 目标 | **公网 HTTPS** 测试环境；Stripe **test**；**R-003 GO**；**Actions `e2e` 绿** |
|------|-------------------------------------------------------------------------------|
| **要不要域名？** | **要公网可达 URL**（Stripe / Resend / 手测浏览器）。**不必**自购域名 — **[Fly.io](https://fly.io/)** 默认 `https://<app>.fly.dev` 即满足 **HTTPS**（**B-00、B-04**） |
| **Fly 建议拓扑** | **3 个 app（可后并）**：`tt-api-staging`、`tt-web-staging`、`tt-api-preprod`（预发）；**Postgres** 用 Fly Managed Postgres 或 Neon/Supabase，**勿与 ① 同库** |
| **环境变量** | staging：`API_BASE_URL=https://tt-api-staging.fly.dev`；Next `NEXT_PUBLIC_API_BASE_URL` 同源或 rewrite；Stripe webhook → `https://tt-api-staging.fly.dev/api/v1/hooks/...` |
| **必须勾** | **PH-1 已签字**；**S-01～S-06、S-09**；**B-11→B-00b→B-00**…**B-12**；**C-01～C-04a**；**L、A-02、J-01** |
| **CI②（D5～D6）** | `git push` → Actions **job `e2e` 逐步绿**（非仅 workflow 顶栏）→ **C-01** |
| **阶段出口** | **B-09 + C-01 + B-12** → **`issues-phase2-staging.md` P0 全闭** → 勾 **PI-2** → 签 **PH-2** |

> **⛔ 阶段二完成提醒：** 勾满 **B/C/L/A-02** 与 **B-09、C-01** 后，先闭 **[PI-2](#tt-master-publish-pi2-gate)**，再 **签署 PH-2**；**未签 PH-2 不得**勾 **D-01** 或 **E-00**（阶段三）。

**Fly 最小步骤（staging API 示例）：**

```bash
# 安装 flyctl 后（见 https://fly.io/docs/）
fly auth login
fly apps create tt-api-staging    # 一次性
fly postgres create --name tt-pg-staging   # 或外链 DATABASE_URL
fly secrets set DATABASE_URL=... INTERNAL_API_SECRET=... -a tt-api-staging
fly deploy -a tt-api-staging      # 仓库内需 fly.toml / Dockerfile（无则 fly launch 生成）
fly certs show -a tt-api-staging  # 确认 *.fly.dev HTTPS
```

前端同理 `fly launch` → `tt-web-staging`，`NEXT_PUBLIC_API_BASE_URL` 指向 API 的 `fly.dev`。

#### 阶段三 · 发布 — 生产 + **CI③**（③ · D7～D10）

| 目标 | 生产 Fly（或同账号第二 region app）、**Stripe Live**、go-live 全文、Check-G、**M-00** |
|------|----------------------------------------------------------------------------------------|
| **必须勾** | **D-01～D-12**；**J-02～J-04**；**E-00～E-12**；**F、G、I**；**K～P、H**；**C-04b、C-03**；**M-01～M-04、N、M-00** |
| **Fly 生产** | `tt-api-prod` / `tt-web-prod`（**≠ staging 密钥/DB**）；**E-00** 可用自有域名 CNAME 到 Fly，或继续 `*.fly.dev`（对外公告写清 URL） |
| **CI③** | 生产部署 tag/workflow **或** 手工 `fly deploy` + **go-live §7** 生产 smoke（**C-04b**） |
| **阶段出口** | **M-00** 总闸（含 **PH-2 已签** 复核） |

> **⛔ 阶段三入口：** 仅当 **PH-2** 已签字；结束于 **M-00** 本人总闸签字。

#### 三阶段与 §1 对照（速查）

| §1 段 | 阶段 |
|-------|------|
| **A、A-08、A-09、PI-1、PH-1** | 一 |
| **B（含 B-11/12/00b）、C（除 C-04b）、L、A-02、J-01、PH-2** | 二 |
| **D、E、F、G、I、J-02～05、K、M、N、P、H、C-04b、M-00** | 三 |
| **§0.5** | S-07/08 → **D0**；S-01～06、S-09 → **D4**（**PH-1 后**）；**S-10** 滑期可选 |

---

<a id="tt-master-publish-scope-lock"></a>

### 0.5 十日首发范围锁定（D0 · 必须先勾）

> 勾完本节，**§1** 中带 **「按 S-xx」** 的 N/A 行才有据可查；**未勾 S 区不得开始 B 区**。

| 勾 | ID | 锁定内容 | §1 联动 |
|----|-----|----------|---------|
| [ ] | **S-01** | 首发**不含** Ethereum Mainnet cutover | **E-10** → 勾「N/A」+ 本行证据 |
| [ ] | **S-02** | 首发 **Stripe Live** + Hosted（SAQ 全文 Phase-2） | **F-01** 按 Live 验收 |
| [ ] | **S-03** | Webhook：**TLS + Stripe/可选 HMAC**（**mTLS Phase-2**） | **F-02** → N/A + SCOPE |
| [ ] | **S-04** | 合规：**env denylist + 08-4**（**OFAC 供应商 Phase-2**） | **F-03** → N/A + SCOPE |
| [ ] | **S-05** | 回归：**R-003 staging GO**（非 93 全文） | **B-07、C-01～C-02** |
| [ ] | **S-06** | **不**对外宣称 UI/93 穷举 | **H-03** |
| [x] | **S-07** | 已读 **§0.2** 单人/无 PR/CI②③ | — |
| [x] | **S-08** | `evidence/GO_YYYYMMDD/SCOPE.md` + `README.md` 已从模板落盘 | [模板](evidence-templates/GO_10DAY_PUBLISH-README.md) · **`evidence/GO_20260517/`** |
| [ ] | **S-09** | **`RELEASE-SCOPE.md`** 列出 **K/H** 必验行（96-15 Tier、TT-GATE） | [模板](evidence-templates/GO_10DAY_PUBLISH-RELEASE-SCOPE.md) |
| [ ] | **S-10** | **日历滑期**（可选） | Fly/CI 未就绪：书面 **D6→D8、D10→D12**，总 **12 日**；**不**冒充已上线 | evidence README |

---

<a id="tt-master-publish-10day-sprint"></a>

### 0.7 十日日历（按三阶段）

| 日 | 阶段 | 必须勾满的 ID | 关键动作 |
|----|------|----------------|----------|
| **D0** | **一** | **S-07、S-08**、**A-06** | `evidence/GO_*` + SCOPE；**不部署 Fly** |
| **D1** | **一** | **A-03** | `cargo test -p traveltrust-api`；本地 PG migrate |
| **D2** | **一** | **A-07**、**J-01**（可选） | TT-9618 ① 内网/Stripe CLI webhook；04 路由闸 |
| **D3** | **一** | **A-04、A-05、A-08、A-09**、**PI-1**、**PH-1** | 本地手验；**issues-phase1-local** P0 闭卷 → **PH-1 签字** |
| **D4** | **二** | **S-01～S-06、S-09**、**B-01、B-11** | **PI-1 + PH-1 已勾/已签**；`fly.toml`；RELEASE-SCOPE |
| **D5** | **二** | **B-00b、B-00、B-12、B-02～B-06、B-10** | Fly API+FE；**fly-secrets.md**；Stripe test |
| **D6** | **二** | **B-07～B-09、C-01、C-02、L、A-02**、**PI-2**、**PH-2** | R-003；**issues-phase2-staging** 闭卷 → **PH-2 签字** |
| **D7** | **三** | **D-01～D-12**、**C-03、C-04a** | P0 文书；预发 smoke；② E2E 证据归档 |
| **D8** | **三** | **E-00～E-06、J-02～J-05、F-04、N** | Fly **生产**；**W-GATE**；go-live 前半 |
| **D9** | **三** | **E-07～E-12、F、G、I、M-01～M-04** | Stripe Live；Check-G（**E-08** 引用 C-04 证据） |
| **D10** | **三** | **C-04b、K、P、H、M-00** | 生产 smoke；深度登记；**总闸** |

**CI②（阶段二 · D6）：** `git push` → [build.yml](../../.github/workflows/build.yml) **`e2e`** → artifact 入 `evidence/GO_*`。**无 Actions：** ② 手跑 R-003 全量，B-09 注「手跑等效」。

**阶段一本地测试提示：** 用浏览器走 **注册 → 市场/发现 → 下单 → 支付（test/mock）→ 消息/评价/社区写路径**；失败记 issue 在 `evidence/GO_*/local-smoke.md`，**A-08 前须清零 P0 阻断项**。

---

<a id="tt-master-publish-master-table"></a>

## 1. 发布总表

> **勾完本表 + §0.5 = 无缺口、可上线。**  
> **三阶段顺序：** 阶段一 → **PI-1 清单闭卷** → **🛑 签 PH-1** → 阶段二 → **PI-2** → **🛑 签 PH-2** → 阶段三 → **PI-3** → **🛑 签 M-00**（见 **[§0.6.1](#tt-master-publish-phase-checkpoints)** / **[§0.6.2](#tt-master-publish-phase-issue-lists)**）  
> **硬条件：** [go-live](../go-live-checklist.md) 子项全勾后再勾 **E**；**B-09** 须 **job `e2e`** 证据 + **C-01**。

### A · 阶段一 · ① 本地（**不跑 CI**）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [x] | A-01 | 全 chromium 矩阵 | `OK: local-e2e-chromium-full-matrix` | 已完成 | CY |
| [ ] | A-02 | CI② 等价（**阶段二**） | **禁止** 阶段一跑 expanded；**D6** 以 Actions **`e2e` 绿** 勾 | D6 | |
| [x] | A-03 | API 单测 | `cargo test -p traveltrust-api` exit 0 | D2 | `evidence/GO_20260517/artifacts/a03-cargo-test-api.log` |
| [x] | A-04 | 96-18 收官 A～F | §2.2.7 表 exit 0 | **D3** | `a04-9618-doc-complete-align.md` + `a08-tt9618-pg-evidence.log`（① PG） |
| [x] | A-05 | pre-release 预检 | `bash scripts/gates/pre-release-automation.sh` exit 0 | **D3** | `artifacts/a05-pre-release-automation.log` · `SKIP_FORGE_VERIFY=1` |
| [x] | A-06 | GO 证据索引 | `evidence/GO_*/README.md` | D0 | `evidence/GO_20260517/README.md` |
| [x] | A-07 | 支付/Webhook ① 闭环 | 签名/幂等/重试 ① 留证 | D2 | `artifacts/a07-*.log` |
| [x] | **A-08** | **本地全功能手验** | [local-smoke 模板](evidence-templates/GO_10DAY_PUBLISH-local-smoke.md) 入 `evidence/GO_*` | **D3** | `evidence/GO_20260517/local-smoke.md` + `artifacts/a08-*.log` |
| [x] | **A-09** | **A8 社区写路径闸** | `cd frontend && npm run check:e2e:tsc && npm run test:a8-community` exit 0 | **D3** | `artifacts/a09-*.log`（409 tests） |

---

> ## 🛑 阶段一完成 — 先闭问题清单，再签字，再进阶段二
>
> **若上一表 A 区（含 A-08、A-09）与 S-07、S-08 均已 `[x]`，按顺序做：**
>
> 1. 维护 `evidence/GO_*/issues-phase1-local.md`（[模板](evidence-templates/GO_10DAY_PUBLISH-issues-phase1-local.md)）；**P0 全 closed**  
> 2. 回到下文 **[PI-1](#tt-master-publish-pi1-gate)** 勾选  
> 3. 打开 `evidence/GO_*/phase-signoff.md`（[模板](evidence-templates/GO_10DAY_PUBLISH-phase-signoff.md)）→ **PH-1** 签字  
> 4. 回到 **[PH-1](#tt-master-publish-ph1-gate)** 勾选  
>
> **未勾 PI-1 / 未签 PH-1 → 禁止勾阶段二（S-01、B-11、B-00…）**

<a id="tt-master-publish-pi1-gate"></a>

### PI-1 · 阶段一问题清单（勾了才能签 PH-1）

| 勾 | ID | 项 | 完成判据 | 证据路径 |
|----|-----|-----|----------|----------|
| [x] | **PI-1** | **阶段一问题清单已闭卷** | `evidence/GO_*/issues-phase1-local.md`：**P0=closed**（含 **PH1-FE-*** 浏览器手验）；P1 **closed** 或 **defer**；清单末「阶段出口核对」已勾 | 例：`evidence/GO_20260518/` · [TT-PH1 审计](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md) · [闭卷表](issues-phase1-local-traveltrust-v6.md) |

<a id="tt-master-publish-ph1-gate"></a>

### PH-1 · 阶段一出口签字（勾了才能开阶段二）

| 勾 | ID | 项 | 完成判据 | 日 |
|----|-----|-----|----------|-----|
| [ ] | **PH-1** | **本人已签阶段一** | **PI-1** 已勾；`phase-signoff.md` **PH-1** 已签字；**A 区 + S-07/08** 已全勾；**PH1-FE-01～03** 浏览器 P0 已 closed | **D3** |

---

> ## 🚦 阶段二入口 — 仅当 **PI-1 + PH-1 均已勾选**
>
> 若 **PI-1** 或 **PH-1** 仍为 `[ ]`，请 **回到上一节 🛑 阶段一** 完成清单与签字，**不要**勾下列 B 区。

### B · 阶段二 · ② 测试网 / Fly（**CI②**）

> **顺序：** **B-11** → **B-01** → **B-12** → **B-00b** → **B-00** → B-02…

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | **B-11** | **Fly 部署制品** | API：`fly.toml` + 根 [Dockerfile](../../Dockerfile) 可 `fly deploy`；FE：`fly.toml` 路径入 evidence | **D4** | O-2 |
| [ ] | B-01 | ② 环境摘要 | Fly app 名、DB、密钥、回调 **≠ ①** | **D4** | |
| [ ] | **B-12** | **Fly secrets 清单** | [fly-secrets 模板](evidence-templates/GO_10DAY_PUBLISH-fly-secrets.md) 对照 `.env.example` staging/preprod/prod **分列** | **D5** | O-8 |
| [ ] | **B-00b** | **staging FE 可访问** | `tt-web-staging`（或等价）`https://*.fly.dev` 首页 200 | **D5** | O-1 |
| [ ] | **B-00** | **staging API 可访问** | API `https://*.fly.dev` **HTTPS**；`GET /health` 200；**且 B-00b 已勾** | **D5** | Fly API URL |
| [ ] | **B-10** | **预发环境摘要** | 第二 Fly app；URL/DB **≠ staging** | **D5** | |
| [ ] | B-02 | ② DB migrate | Fly/外链 PG 上 `sqlx migrate` exit 0 | D5 | |
| [ ] | B-03 | Stripe test + 入库 | Dashboard webhook → **Fly API URL** | D5 | |
| [ ] | B-04 | 公网 webhook | `https://<api>.fly.dev/...`（**非** 仅 stripe listen） | D5 | |
| [ ] | B-05 | 真邮件 | Resend ② 收件箱 | D5 | |
| [ ] | B-06 | 主脊 ② | 注册→市场→订单 在 **Fly staging** 绿 | D5 | |
| [ ] | B-07 | R-003 封口 | R-003 D1～D5（**S-05**） | D6 | |
| [ ] | B-08 | R-002 分轨 | `environment.name` = staging | D6 | |
| [ ] | B-09 | staging CI e2e | Actions **job `e2e` 逐步绿** + artifact（**非**仅 workflow 顶栏；job 为 `continue-on-error`）；**且 C-01** | **D6** | O-3 |

### C · 阶段二 · ② 发布准入（R-002 · 与 B/L/A-02 同属阶段二）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | C-01 | report.json 机读 | `validate-regression-report.py --fail-on-no-go` exit 0 | **D6** | |
| [ ] | C-02 | release_gate | 符合 93 §7.1（**S-05**） | **D6** | |

> **阶段二还须勾：** **L-01～L-03**、**A-02**（见 **L 区**、**A 区**），与上表 **B-09** 一并完成后再签字。

---

> ## 🛑 阶段二完成 — 先闭问题清单，再签字，再进阶段三
>
> **若 B 区、上表 C-01/C-02、L 区、A-02、B-09、B-12 均已 `[x]`，按顺序做：**
>
> 1. 维护 `evidence/GO_*/issues-phase2-staging.md`（[模板](evidence-templates/GO_10DAY_PUBLISH-issues-phase2-staging.md)）；**P0 全 closed**  
> 2. 勾选 **[PI-2](#tt-master-publish-pi2-gate)**  
> 3. `phase-signoff.md` **PH-2** 段（**e2e URL、report.json 路径**）**签字**  
> 4. 勾选 **[PH-2](#tt-master-publish-ph2-gate)**  
>
> **未勾 PI-2 / 未签 PH-2 → 禁止勾阶段三（D-01、E-00、C-03…）**

<a id="tt-master-publish-pi2-gate"></a>

### PI-2 · 阶段二问题清单（勾了才能签 PH-2）

| 勾 | ID | 项 | 完成判据 | 证据路径 |
|----|-----|-----|----------|----------|
| [ ] | **PI-2** | **阶段二问题清单已闭卷** | `evidence/GO_*/issues-phase2-staging.md`：**P0=closed**；P1 **closed** 或 **defer**；清单末核对已勾 | [issues-phase2-staging](evidence-templates/GO_10DAY_PUBLISH-issues-phase2-staging.md) |

<a id="tt-master-publish-ph2-gate"></a>

### PH-2 · 阶段二出口签字（勾了才能开阶段三）

| 勾 | ID | 项 | 完成判据 | 日 |
|----|-----|-----|----------|-----|
| [ ] | **PH-2** | **本人已签阶段二** | **PI-2** 已勾；`phase-signoff.md` **PH-2** 已签字；**B + C-01/02 + L + A-02 + B-09** 已全勾 | **D6** |

---

> ## 🚦 阶段三入口 — 仅当 **PI-2 + PH-2 均已勾选**

### C2 · 阶段三 · 发版准入（R-002 续）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | C-03 | 发版四样齐 | 路径+sha256+gate+**本人 GO 书面** | D7 | |
| [ ] | **C-04a** | **预发 cutover smoke** | go-live §7 **预发**（Fly preprod） | D7 | |
| [ ] | **C-04b** | **生产 cutover smoke** | go-live §7 **生产**（Fly prod） | D10 | |

### D · 阶段三 · P0 十二项（本人 Owner）

| 勾 | ID | 项 | 日 | 证据 |
|----|-----|-----|-----|------|
| [ ] | D-01 | P0 #1 08-4 签字 | D7 | |
| [ ] | D-02 | P0 #2 08-2 Owner+backup | D7 | |
| [ ] | D-03 | P0 #3 审查一 11 行 | D7 | |
| [ ] | D-04 | P0 #4 审查二 | D7 | |
| [ ] | D-05 | P0 #5 08-4 定稿检查 | D7 | |
| [ ] | D-06 | P0 #6 Runbook P0 九项 | D7 | |
| [ ] | D-07 | P0 #7 evidence 路径 | D7 | |
| [ ] | D-08 | P0 #8 00 发版前 7 项 | D7 | |
| [ ] | D-09 | P0 #9 P26 | D7 | |
| [ ] | D-10 | P0 #10 E2E 三项（汇总） | D7 | 见 **L 区** 三文件 |
| [ ] | D-11 | P0 #11 资损演练 | D7 | |
| [ ] | D-12 | P0 #12 02 §十三 | D7 | |

### E · 阶段三 · go-live §0～§10（须展开子项）

> 细则：[go-live-checklist](../go-live-checklist.md) — **先勾 GL-00，再勾 E-01～E-12**（正文约 **70** 条 `- [ ]`）。

| 勾 | ID | 节 | 日 | 证据 |
|----|-----|-----|-----|------|
| [ ] | **GL-00** | **go-live 子项全勾** | [go-live](../go-live-checklist.md) **§0～§10 每一条**已 `[x]`；[go-live-checked 模板](evidence-templates/GO_10DAY_PUBLISH-go-live-checked.md) | D7～D9 | **未勾禁止勾 E-01～E-12** |
| [ ] | **E-00** | **生产 DNS + TLS** | 证书有效；API/FE 公网可达 | D8 | |
| [ ] | E-01 | §0 冻结与 R-002 | **含 0.1** tag/SHA/digest | D8 | |
| [ ] | E-02 | §1 合约与链 | **RELEASE-SCOPE** 链/地址表；**非 Mainnet** | D8 | |
| [ ] | E-03 | §2 数据库 | D8 | |
| [ ] | E-04 | §3 后端 API | D8 | |
| [ ] | E-05 | §4 Indexer | D8～D9 | |
| [ ] | E-06 | §5 前端 | D8 | |
| [ ] | E-07 | §6 密钥 | D9 | |
| [ ] | E-08 | §7 Cutover smoke | **引用 C-04a/b 证据路径**，不重复测 | D9 | O-7 |
| [ ] | E-09 | §8 回滚 | D8 | |
| [ ] | E-10 | §9 Mainnet | D9 | **按 S-01：勾 N/A** |
| [ ] | E-11 | §10 监控值班 | D9 | |
| [ ] | **E-12** | **§11 并联确认** | D 区十二项与 go-live §11.1～11.12 **一致** | D9 | |

### J · 契约 / ABI 机读（企业必补）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [x] | J-01 | **04 路由闸** | `bash scripts/gates/run-check-04-routes.sh` exit 0 | D2 或 D6 | `evidence/GO_20260517/artifacts/j01-run-check-04-routes.log` |
| [ ] | J-02 | **55-S13 ABI** | `bash scripts/gates/check-55-s13.sh` exit 0 | D8 | |
| [ ] | J-03 | **08 一致性** | `bash scripts/gates/check-08-consistency.sh` exit 0 | D8 | |
| [ ] | J-04 | **治理文档互指** | `bash scripts/gates/check-governance-doc-linkage.sh` exit 0 | D8 | |
| [ ] | **J-05** | **W-GATE 发版前聚合** | `bash scripts/check-w-gate-prerelease.sh` exit 0（**不**替代 **I** 区 Check-G） | D8 | O-4 · [TT-B420](TT-B420-GO-W-GATE-PRERELEASE-001.md) |

### F · ③ 生产硬闸

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | F-01 | 生产 PSP | **Stripe Live** 一笔成功（**S-02**） | D9 | |
| [ ] | F-02 | Webhook 硬闸 | **按 S-03：N/A mTLS**；TLS+签名校验已开 | D9 | SCOPE |
| [ ] | F-03 | OFAC | **按 S-04：N/A 供应商**；denylist+08-4 已勾 | D9 | SCOPE |
| [ ] | F-04 | 生产 env | 无 test seed / chain_off | D8 | |
| [ ] | F-05 | B-421 doclink | `check-runbook-golive-doclink-gate.sh` exit 0 | D9 | |

### G · GO 决议

| 勾 | ID | 项 | 日 | 证据 |
|----|-----|-----|-----|------|
| [ ] | G-01 | Production GO 人签 | D9 | |
| [ ] | G-02 | 96-05 / Hub | D9 | |
| [ ] | G-03 | 08 发版链路 | D9 | |
| [ ] | G-04 | GO manifest + sha256 | D9 | |
| [ ] | G-05 | Check-G（汇总） | 见 **I 区** 逐条 | D9 | |
| [ ] | G-06 | 15 附录〇（汇总） | 见 **P 区** 要点 | D9 | |

### I · Check-G 与 go-live §11.13～18（企业必补）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | I-01 | **dual-score 闸** | `bash scripts/check-dual-score-gate.sh` exit 0 | D9 | |
| [ ] | I-02 | **signoff 校验** | `python scripts/dev/validate_dual_score_signoff.py` + bundle 根 | D9 | |
| [ ] | I-03 | **manifest 校验** | `python scripts/dev/validate_evidence_manifest.py validate`；**`--verify-artifact-files`** 若 GO_FINAL | D9 | |
| [ ] | I-04 | **commit 绑定** | signoff / 工单含 **40 位 commit**（§11.16） | D9 | |
| [ ] | I-05 | **供应链锁文件** | Cargo.lock + package-lock 入工单/证据 | D9 | |
| [ ] | I-06 | **封口日志** | Check-G 三连输出入 `artifacts/check-g-seal.log` | D9 | |

### K · 96-15 深度三维（scope 内 · 须 RELEASE-SCOPE）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | K-01 | **Tier A** | 59 P0 快扫 + B-421（**F-05** 可互证） | D9 | `GO_96_15_deep_*` |
| [ ] | K-02 | **Tier B** | [96-15 §1 Tier B](../spec/96-15-深度多维度检查与审计体系.md) scope 行 | D10 | |
| [ ] | K-03 | **Tier C** | [96-15 §1 Tier C](../spec/96-15-深度多维度检查与审计体系.md) **RELEASE-SCOPE** 列出行 | D10 | |

### L · E2E 三项留痕（展开 D-10）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | L-01 | **正常发布 E2E** | `artifacts/e2e-normal-release.md`；**②** 环境执行 | **D6** 起草 / D7 归档 | |
| [ ] | L-02 | **三端争议 E2E** | `artifacts/e2e-dispute-three-terminals.md` | **D6** / D7 | |
| [ ] | L-03 | **三超时 E2E** | `artifacts/e2e-three-timeouts.md` | **D6** / D7 | |

### M · 发布冻结与 Indexer 证据

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | M-01 | **Git tag + digest** | 与 **E-01 / I-04** 同源 | D8 | |
| [ ] | M-02 | **manifest.json + .sha256** | [evidence/README](../../evidence/README.md) 字段齐全 | D9 | |
| [ ] | M-03 | **前端 manifest** | `gen-frontend-manifest.sh`（可选 EVIDENCE_GO_DIR） | D9 | |
| [ ] | M-04 | **Indexer 留痕** | `write-indexer-evidence.sh` 或 Runbook §12.5 | D9 | |

### N · 生产接入与安全

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | N-01 | **internal 不外露** | 公网无 `/api/v1/internal/*` | D8 | |
| [ ] | N-02 | **CORS / SSOT** | 生产 origin；STRICT_SSOT 若启用已填 | D8 | |

### P · 15 附录〇要点（展开 G-06）

| 勾 | ID | 项 | 完成判据 | 日 | 证据 |
|----|-----|-----|----------|-----|------|
| [ ] | P-01 | **附录〇 发版前表** | [15 附录〇](../spec/15-多维度文档与技术检查报告.md#发版前勾选总表) 责任人确认 | D10 | |
| [ ] | P-02 | **07 §四 4.3** | 与 D 区、附录〇 **联合勾选** | D10 | |
| [ ] | P-03 | **14 §4 ABI 五项** | 合约-API-ABI 对齐五项确认 | D10 | |

### H · 深度登记（首发 scope 内）

| 勾 | ID | 项 | 日 | 证据 |
|----|-----|-----|-----|------|
| [ ] | H-01 | **TT-GATE 登记** | **RELEASE-SCOPE** 行已闭或 N/A | D10 | |
| [ ] | H-02 | **96-15 §3 勾选** | [96-15 §3](../spec/96-15-深度多维度检查与审计体系.md) 与 K 区一致 | D10 | |
| [ ] | H-03 | 覆盖边界确认（**S-06**） | 对外话术已写进 README/公告 | D10 | |

<a id="tt-master-publish-phase-gates"></a>

### Z · 阶段问题清单 + 签字闸索引（真源在阶段末尾）

| ID | 位置 | 未闭/未签禁止 |
|----|------|----------------|
| **PI-1** | [A 区后 · PI-1](#tt-master-publish-pi1-gate) | 签 **PH-1** |
| **PH-1** | [PI-1 后 · PH-1](#tt-master-publish-ph1-gate) | 阶段二 |
| **PI-2** | [C 区后 · PI-2](#tt-master-publish-pi2-gate) | 签 **PH-2** |
| **PH-2** | [PI-2 后 · PH-2](#tt-master-publish-ph2-gate) | 阶段三 |
| **PI-3** | [H 区后 · PI-3](#tt-master-publish-pi3-gate) | 签 **M-00** |
| **M-00** | 下文总闸 | 对外上线 |

---

> ## 🛑 阶段三收尾 — 先闭问题清单，再总闸签字（D10）
>
> **若 §0.5 + §1（含 PI-1/2、PH-1、PH-2）全 `[x]`，且 go-live 子项已勾：**
>
> 1. 维护 `evidence/GO_*/issues-phase3-production.md`（[模板](evidence-templates/GO_10DAY_PUBLISH-issues-phase3-production.md)）；**P0 全 closed**  
> 2. 勾选 **[PI-3](#tt-master-publish-pi3-gate)**  
> 3. 打开 `evidence/GO_*/README.md` **M-00** 段 → **本人签字**  
> 4. 勾选下表 **M-00**

<a id="tt-master-publish-pi3-gate"></a>

### PI-3 · 阶段三问题清单（勾了才能签 M-00）

| 勾 | ID | 项 | 完成判据 | 证据路径 |
|----|-----|-----|----------|----------|
| [ ] | **PI-3** | **阶段三问题清单已闭卷** | `evidence/GO_*/issues-phase3-production.md`：**P0=closed**；P1 **closed** 或 **defer**；清单末核对已勾 | [issues-phase3-production](evidence-templates/GO_10DAY_PUBLISH-issues-phase3-production.md) |

### M-00 · 总闸

| 勾 | ID | 项 | 完成判据 | 证据 |
|----|-----|-----|----------|------|
| [ ] | **M-00** | **无缺口 · 可上线** | **PI-3** 已勾；**[§0.4 A～G](#tt-master-publish-ship-guarantee)** 全成立；[README](evidence-templates/GO_10DAY_PUBLISH-README.md) **M-00** 签字 | **D10** |

---

<a id="tt-master-publish-audit"></a>

## 0.8 审计附录（简版 · 详见 §0.9）

v1.0.3 简表已并入 **§0.9 / §0.10**。当前 **~101 项中 1 项已勾（A-01）**；见 **v1.0.6**。

---

<a id="tt-master-publish-enterprise-audit"></a>

## 0.9 企业级多维审计（2026-05-17 · v1.0.4 基线）

> **最新一轮（三阶段 + Fly）：** 见 **[§0.10](#tt-master-publish-enterprise-audit-v105)**。

### 一、审计结论（你问的两件事）

| 问题 | 裁定 |
|------|------|
| **表全勾完能否发布？** | **能** — 在 **§0.5 十日首发 scope** 内，可 **Production GO / 已上线** |
| **表是否企业级「全」？** | **对「首发上线」闭环：是**（v1.0.4 已并入 G-1～G-8 必补行）；**对「整个产品/93 全文/主网/完整合规」：否**（§0.3） |

**三条硬条件（违反 = 不能发布）：**

1. **[go-live](../go-live-checklist.md) §0～§10 每一条**已勾，再勾 **E** 汇总。  
2. **C-01 `report.json`** 与 **B-09** 同时有证据（不能只贴 CI e2e）。  
3. **②③ 环境**可审计 + **`evidence/GO_*`** 含 SCOPE、RELEASE-SCOPE、manifest。

### 二、十维矩阵（企业级）

| 维度 | 表内落点 | 全勾后证明什么 | 仍不证明 |
|------|----------|----------------|----------|
| **1 范围治理** | §0.5、M-00、SCOPE | 发布边界书面锁定 | 产品 roadmap 全完成 |
| **2 环境与部署** | B-00/01/10、N、E-00/E-06 | staging/预发/生产可访问 | 多区域 HA |
| **3 安全合规** | F、S-03/04、D-01/05、N | Live+TLS+08-4+denylist | 完整 OFAC/mTLS |
| **4 质量测试** | A、B、C、L、R-003 | staging GO + 主脊 + E2E 三项 | 93 全文 |
| **5 运维 SRE** | E-05/08/09/11、D-06/11、M-04 | Indexer/回滚/值班/演练 | 全年 SLO |
| **6 数据链** | E-02/03、J-02、S-01 | 链/DB/ABI 与 scope 一致 | Ethereum Mainnet |
| **7 文档 SSOT** | D、J、P、F-05 | P0+04+15+08 对拍 | spec 全删 |
| **8 深度多维** | K、H、RELEASE-SCOPE | Tier A/B/C scope 内 | 96-20 穷举 |
| **9 证据审计** | I、M、G、C-03 | Check-G+manifest+四样齐 | 外部审计报告 |
| **10 发布工程** | M-01、E-01、I-04/05 | tag/digest/锁文件 | 蓝绿全自动 |

### 三、v1.0.3 → v1.0.4 必并入表项（已完成）

| 原缺口 | 新 ID |
|--------|--------|
| 部署落点 | **B-00** |
| 预发环境 | **B-10**、**C-04a/b** |
| RELEASE-SCOPE | **S-09**、**K/H** |
| B-09≠R-003 | **B-09** 注 + **C-01** |
| DNS/TLS | **E-00** |
| Check-G 展开 | **I-01～I-06** |
| 08/ABI 机读 | **J-01～J-04** |
| 96-15 三维 | **K-01～K-03** |
| E2E 三文件 | **L-01～L-03** |
| manifest/indexer | **M-01～M-04** |
| internal/CORS | **N-01～N-02** |
| 15 附录要点 | **P-01～P-03** |

### 四、仍故意在表外（勾完不算欠账）

同 **§0.3**：93 全文、96-20 每弹窗、MinIO/HLS、Mainnet G0～G6+SL、mTLS/OFAC 供应商、完整 SAQ、融资 LP。

### 五、10 天可行性（v1.0.4）

| 项 | 评估 |
|----|------|
| 行数 | **~93**（原 66 + 必补 27） |
| 单人全职 + 环境就绪 | **可冲刺 10 日** |
| 无 staging / Stripe 未就绪 | **不够** |
| 建议内部里程碑 | D5=②闭；D7=P0闭；D7～D10=E 逐节；D10=M-00 |

### 六、勾完能否上线（最终裁定）

```
§0.5（9）+ §1 全部段（~93 项，含 I～P）+ M-00 全 [x]
+ go-live §0～§10 子项已逐条勾
+ 证据在 ②③ + evidence/GO_*
⇒ 本十日首发窗口：无缺口，可以发布
```

---

### 七、v1.0.3 历史审计（已收口）

v1.0.3 曾列 **G-1～G-8** 为「建议补行、未入表」；**v1.0.4 已全部并入 §1**（见上表 **§0.9 三**）。  
v1.0.3 量化 **66 项 / 65 未勾** 已升级为 **~94 项**；进度以 **§0.1** 为准。

---

<a id="tt-master-publish-enterprise-audit-v105"></a>

## 0.10 企业级审计（2026-05-17 · v1.0.5 · 三阶段）

### 一、能否发布？（最终裁定）

| 问题 | 答案 |
|------|------|
| **§0.5 + §1 + M-00 全勾，能否发布？** | **能** — 仅限 **§0.5 十日首发 scope**（无 Mainnet 全文、无 93/96-20 穷举、无完整 OFAC/mTLS/SAQ） |
| **只勾汇总行、不展开 go-live，算完成吗？** | **不算** — **E-01～E-12** 前须 [go-live](../go-live-checklist.md) **§0～§10 每一条**已 `[x]` |
| **只完成阶段一，能对外上线吗？** | **不能** — ① **禁止**冒充 ②③（[CONTRIBUTING · 禁止假完成](../CONTRIBUTING.md#no-false-completion)） |
| **阶段二出口后算上线吗？** | **不能** — 仅 **staging GO**；上线须 **阶段三 + M-00** |
| **对外怎么说？** | 可说 **Production GO（十日首发 scope）**；**不可**说「全站矩阵/每弹窗已验」（**S-06 / H-03**） |

**发布硬门槛（5 条，缺一 = 不可宣称上线）：**

1. **三阶段 + 签字闸**：**PH-1** →（**PH-2** 前 **B-09 + C-01**）→ **M-00**  
2. **go-live 子项**全勾，再勾 **E**  
3. **`evidence/GO_*`**：SCOPE、RELEASE-SCOPE、README 签字、manifest（**M-02**）  
4. **②③ 密钥/DB 分离**；生产 **F-04** 无 test seed  
5. **Stripe Live** 一笔（**F-01**）+ 生产 cutover（**C-04b**）

### 二、十维矩阵（v1.0.5 · 含三阶段）

| 维 | 阶段 | 表内锚点 | 全勾后证明 | 仍不证明 |
|----|------|----------|------------|----------|
| **1 范围** | 二 | S-01～S-09、H-03 | 书面 scope | 全产品 backlog |
| **2 部署** | 二③ | B-00/10、E-00/06、Fly §0.6 | staging/预发/生产 HTTPS | 多区 HA、K8s 全套 |
| **3 安全** | ③ | F、N、D-01/05 | Live+TLS+denylist+08-4 | OFAC 供应商、mTLS |
| **4 质量** | 一② | A、A-08、B、C、L | 本地手验 + R-003 + e2e | 93 全文 |
| **5 SRE** | ③ | E-05/08/09/11、D-11、M-04 | 回滚/Indexer/演练留痕 | 全年 SLO |
| **6 链** | ②③ | E-02、J-02、S-01 | scope 内链/ABI | Ethereum Mainnet |
| **7 文档** | ③ | D、J、P | P0+04+15 对拍 | spec 删径程序 |
| **8 深度** | ③ | K、H、S-09 | Tier A/B/C **scope 行** | 96-15 全文 |
| **9 证据** | ③ | I、G、C-03、M | Check-G+四样齐 | 外部审计 |
| **10 发布工程** | ③ | M-01、E-01、I-04/05 | tag/digest/锁文件 | 蓝绿全自动 |

### 三、审计缺口 O-1～O-10（**v1.0.6 已并入 §1**）

| 原 ID | 并入行 ID |
|-------|-----------|
| O-1 Fly FE | **B-00b** |
| O-2 fly.toml | **B-11** |
| O-3 e2e job | **B-09** 判据 |
| O-4 W-GATE | **J-05** |
| O-5 A8 Vitest | **A-09** |
| O-6 L 过载 | **L** 区 D6 起草 / D7 归档 |
| O-7 E-08 重复 | **E-08** 引用 C-04 |
| O-8 Fly secrets | **B-12** + 模板 |
| O-9 旧审计 | 以 **§0.10** + **v1.0.6** 为准 |
| O-10 滑期 | **S-10**（可选） |
| （签字闸） | **PH-1、PH-2**（**Z 区**） |

### 四、表内一致性（v1.0.5 已修）

| 项 | 状态 |
|----|------|
| A-04/A-05 日历 **D3** vs 表 **D5** | **已改为 D3** |
| D-01～D-06 日历 D7 vs 表 D6 | **已改为 D7** |
| L 区阶段二 **D6** vs 表 D7 | **已注明 D6 起草 / D7 归档** |

### 五、当前完成度

| 指标 | 值 |
|------|-----|
| 汇总行 | **~101**（含 Z、O 并入行） |
| 已勾 | **1**（A-01） |
| 完成度 | **~1%** |
| 阶段一剩余 | **~8 项**（D0～D3） |
| go-live 展开量 | **~70** 子项（**不计入** §0.1 行数，但 **M-00 前必做**） |

### 六、10 天可行性（v1.0.5）

| 条件 | 评估 |
|------|------|
| 环境就绪（本地 PG + Fly 账号 + Stripe test/Live） | **10 日可冲刺** |
| 无 Fly / 无 staging DB | **不够**；先 **O-2**，日历改 **12～15 日** |
| 最大风险日 | **D6**（R-003 + CI + L）、**D8～D9**（go-live + Live） |

---

<a id="tt-master-publish-enterprise-audit-v108"></a>

## 0.11 企业级终审（2026-05-17 · v1.0.8 · 十日可发布保证）

> **最新终审：** 本节为 **v1.0.8** 真源；**§0.10** 为历史。发布保证见 **[§0.4 A～G](#tt-master-publish-ship-guarantee)**。

### 一、你问的三件事（最终答案）

| 问题 | 答案 |
|------|------|
| **10 天内表全勾完能发布吗？** | **能** — 前提见 **§二**；未就绪则勾 **S-10** 延 **12 日** |
| **表全勾 = 无缺口可发布？** | **能** — 须 **§0.4 A～G**（含 **GL-00**、**PH-1/2 签字**） |
| **企业级「全产品」？** | **否** — **§0.3** 排除项不算欠账 |

### 二、10 日硬前提（缺一 → S-10 延期，勿假完成）

| # | 前提 | 表行 |
|---|------|------|
| 1 | 本地 PG + `cargo test` | A-03 |
| 2 | Fly 可 deploy | B-11、B-00 |
| 3 | Stripe test + Live | B-03、F-01 |
| 4 | **job `e2e`** 或 ② 手跑 R-003 | B-09 |
| 5 | D7～D9 可投入 go-live **~70** 子项 | **GL-00**、D |

### 三、十维矩阵（表全勾后 / 仍不证明）

| 维 | 关键 ID | 证明 | 不证明 |
|----|---------|------|--------|
| 1 范围 | S、H-03、M-00 | scope 锁 | 全 backlog |
| 2 部署 | B-11/00b/00、E-00 | Fly 三环境 | 多区 HA |
| 3 安全 | F、N、D | Live+TLS+08-4 | OFAC/mTLS 全文 |
| 4 质量 | A-08/09、B、C、L、**GL-00** | ①②③ 质量链 | 93 全文 |
| 5 SRE | E-05/08/11、D-11、M-04 | 运维留痕 | 全年 SLO |
| 6 链 | E-02、J-02、S-01 | scope 链 | Mainnet |
| 7 文档 | D、J、P | P0+04+15 | spec 全删 |
| 8 深度 | K、H、S-09 | Tier scope 行 | 96-20 穷举 |
| 9 证据 | I、M、G | Check-G+manifest | 外部审计 |
| 10 发布 | PH-1/2、M-00 | 签字闸+冻结 | 蓝绿全自动 |

### 四、防假勾（已入表）

| 风险 | 对策 |
|------|------|
| 只勾 E 汇总 | **GL-00** |
| workflow 绿、e2e 红 | **B-09** job 级 |
| 跳阶段 | **PI-x 清单 + PH-1/PH-2** + 🛑 |
| 漏 FE / secrets | **B-00b**、**B-12** |

### 五、表外（全勾不算欠账）

同 **§0.3**。

### 六、发布保证书（可复制到 evidence README）

```
本人确认（十日首发 scope）：
□ §0.5 全勾  □ §1 全勾（含 PI-1/2/3、GL-00、PH-1、PH-2）
□ go-live 子项全勾  □ phase-signoff 已签
□ ②③ 证据齐  □ M-00 已签
⇒ 本窗口可 Production GO
不可宣称：93/96-20 全矩阵已验
签字：________ 日期：________
```

模板：[go-live-checked.md](evidence-templates/GO_10DAY_PUBLISH-go-live-checked.md)

---

## 2. 与其它文档

| 文档 | 关系 |
|------|------|
| [TT-PHASED](TT-PHASED-DELIVERY-CHECKLIST-001.md) | 日常 backlog；**十日首发只认本表** |
| [go-live](../go-live-checklist.md) | E 区展开 |
| [缺口总表](../spec/缺口与待补-官方总表.md) | D 区展开 |

---

## 3. 变更记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.9 | 2026-05-17 | **§0.6.2** 三阶段问题清单（**PI-1/PI-2/PI-3**）；**§0.6.1** 扩为四步（清单闭卷 → 签字）；证据模板 `issues-phase{1,2,3}-*.md` |
| 1.0.8 | 2026-05-17 | **§0.4 A～G 发布保证**；**GL-00** go-live 子项硬闸；**§0.11** 十日企业终审 |
| 1.0.7 | 2026-05-17 | **§0.6.1**；**🛑/🚦**；**PH-1/PH-2** 于阶段末尾 |
| 1.0.6 | 2026-05-17 | **O-1～O-10 并入**；**PH-1/PH-2** 签字硬闸 |
| 1.0.5 | 2026-05-17 | **§0.6 三阶段** + **§0.10**；**A-08**；日历对拍 |
| 1.0.4 | 2026-05-17 | **§0.9 企业级十维审计**；§1 **+27 必补行**；合计 **~93** 项 |
| 1.0.3 | 2026-05-17 | **§0.8 审计附录**（10 日可行性、65 项未勾、表内 G-1～G-8 缺口、E 区展开量） |
| 1.0.2 | 2026-05-17 | **勾完=无缺口可上线**；**§0.5 范围锁定**；十日逐日 ID；证据模板；F/E N/A 与 S-xx 联动 |
| 1.0.1 | 2026-05-17 | 单人/CI②③/十日冲刺 |
| 1.0.0 | 2026-05-17 | 初版 |
