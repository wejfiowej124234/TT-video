# TT-PHASED-DELIVERY-CHECKLIST-001 · 分阶段交付勾选清单（① → ② → ③）

**Version:** 1.0.2  
**Status:** `Active`（**执行勾选表**；细则真源 **[TT-NEXT-BATCH-BACKLOG-001.md](TT-NEXT-BATCH-BACKLOG-001.md)**、**[96-18](../spec/96-18-未完成清单与多维检查.md)**、**[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)**、**[go-live-checklist](../go-live-checklist.md)**）  
**阶次纪律：** **须顺序递进** — 未完成 **① 当前优先级块** 前，**不**规划或宣称 **②③** 已验收；**禁止跳阶**、**禁止假完成**（**[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)**、**[TT-9628 · §0.0.5](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-no-false-completion)**）。

<a id="tt-phased-checklist-intro"></a>

## 0. 怎么用

| 规则 | 说明 |
|------|------|
| **勾选** | 完成后把 `- [ ]` 改为 `- [x]`，并在 **证据** 列填 **日期 + 路径/命令摘要** |
| **优先级** | **P0 → P1 → P2 → P3**（区内 **自上而下**）；数字越小越先干 |
| **挡路** | **挡自动化** = 没有则本机全栈 E2E 不可靠；**挡叙事** = 可开发但不可对外称全功能/②③已验 |
| **日常命令序** | 机械跑闸用 **[runbook/README · §0.2](README.md#runbook-readme-section-02)**（L1～L6 + L4b）；本清单管 ** backlog + 优先级** |
| **十日首发（勾完=无缺口·可上线）** | **[TT-MASTER](TT-MASTER-PUBLISH-GO-CHECKLIST-001.md#tt-master-publish-three-phases)** — **三阶段**（①本地 D0～D3 无 CI → ②Fly 测试网 D4～D6 + CI → ③发布 D7～D10） |
| **粗算工期** | **§6**；**1 人、与 2026-05-17 CY 同强度** 的量级，**非承诺** |

<a id="tt-phased-checklist-gap-summary"></a>

### 0.1 进度一览（2026-05-17 对拍）

| 分区 | 粗完成度 | 一句话 |
|------|----------|--------|
| **① P0** | **~90%** | **CY** 已 **`OK: local-e2e-chromium-full-matrix`**；余 **防回退习惯** |
| **① P1** | **~0%** | 日常闸 **未** 系统留证一轮 |
| **① P2** | **~20%** | A/B 轨 **Partial**；基建/运营/手验缺口大 |
| **① P3** | **~10%** | TT-GATE / 93 穷举 / Tier C **未闭** |
| **②** | **~0%** | 测试网 **整块未验收** |
| **③** | **~0%** | 生产 GO **另立项** |

### 0.2 挡路类型速查（摘要）

| 挡路类型 | 含义 | 对应 § |
|----------|------|--------|
| **挡自动化** | 没有则本机全栈 E2E 不可靠 | **§0.4 已闭**（CY）；**§0.3** P0 余量 |
| **防回退** | 不挡写代码；挡发版前习惯与证据 | **§0.3** ① P1 |
| **挡 demo / 全功能叙事** | 可跑矩阵；不可称「功能齐全」 | **§0.3** ① P2 |
| **挡深度 / 发版文档** | 机读绿 ≠ 93/96-15 穷举 | **§0.3** ① P3 |
| **挡 ②** | 不能用 ① 冒充测试网 | **§0.3** ② |
| **挡 GO / 生产** | 另闸 | **§0.3** ③ |

**挡不挡「本地全链路全跑通」？** — **① 自动化主链已闭（§0.4）**；**§0.3 全部为仍缺或未勾留证项**。

<a id="tt-phased-checklist-gap-master"></a>

### 0.3 缺口总表（全量可勾选 · 仍缺 / 未留证）

> **用法：** 本表 = **当前仍须做的缺口** 一览；勾选用 **`[x]`**。细则命令见 **§1～§3** 同号行。**已闭** 见 **§0.4**，勿重复开工。

#### 0.3.1 ① 本地 · P0 余量 + P1

| 勾 | 优 | 缺口 | 挡路 | 证据 |
|----|-----|------|------|------|
| [ ] | P0 | 矩阵前释 **8080 / 3012**（`taskkill` + `PLAYWRIGHT_REUSE_API_SERVER=0`） | 防回退 | |
| [ ] | P0 | **CY** 证据写入 **`evidence/GO_YYYYMMDD/README.md`** | 防回退 | |
| [ ] | P0 | 大改 E2E/订单/社区后 **全矩阵复验**（按需） | 防回退 | |
| [ ] | P1 | `bash scripts/dev-preflight.sh` | 防回退 | |
| [ ] | P1 | `bash scripts/gates/ci-local-delivery-minimum.sh` | 防回退 | |
| [ ] | P1 | **`local-delivery-expanded`** 含 Playwright 尾段（**去掉** `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1`） | 防回退 | |
| [ ] | P1 | **`local-delivery-expanded` 复跑**（CY 后确认一致） | 防回退 | |
| [ ] | P1 | `bash scripts/gates/e2e-stability-probe.sh` | 防回退 | |
| [ ] | P1 | `bash scripts/run-check-04-routes.sh`（改路由/契约时） | 防回退 | |
| [ ] | P1 | `npm run check:e2e:tsc && npm run test:a8-community`（改社区写路径时） | 防回退 | |
| [ ] | P1 | **① 巩固证据包**（§1.0～1.1 勾选 + exit 摘要） | 防回退 | |

#### 0.3.2 ① 本地 · P2（功能 / demo / 运营）

| 勾 | 优 | 缺口 | 挡路 | 证据 |
|----|-----|------|------|------|
| [ ] | P2↑ | **MinIO/S3** 对象存储真链（视频发布非长期 skip） | 挡 demo | §1.2.1 |
| [ ] | P2↑ | **Feed 视频 HLS / 转码 CDN** | 挡 demo | §1.2.1 |
| [ ] | P2↑ | **举报 → Admin 审核台**（非仅 F-018 API） | 挡运营 | §1.2.1 |
| [ ] | P2↑ | **社区规范法务正文定稿**（`/terms/community-guidelines`） | 挡合规 | §1.2.1 |
| [ ] | P2 | **Resend / ② 邮件** 准备清单（① 仍可用 `log`） | 挡 ② 准备 | §1.2.2 A0 |
| [ ] | P2 | 社区 **commerce / media** 93 全形态 / Tier C | 挡叙事 | A1 |
| [ ] | P2 | 评论 **sort / 二级 / 分页** 93 手验 | 挡叙事 | A2 |
| [ ] | P2 | **关注** Feed 跨页 / 多 Tab / 冷启动 手验 | 挡叙事 | A3 |
| [ ] | P2 | 上传 **59 恶意样本** + upload 93 手验全文 | 挡安全 | A4 |
| [ ] | P2 | **全 Admin RBAC / 审计矩阵**（非 deep 切片） | 挡运营 | A5 |
| [ ] | P2 | **96-16 深度手验** / 全路由 **a11y** | 挡 UX | A6 |
| [ ] | P2 | **② staging 部署** / 生产 CDN | 挡 ② | A7 |
| [ ] | P2 | **429 / 幂等** 93 全矩阵 **Tier C** 叙事 | 挡深度 | A8 |
| [ ] | P2 | 横屏 / **screen.orientation** / 安全区真机 | 挡 UX | B2 |
| [ ] | P2 | 赞藏关 **多 Tab、冷启动** 一致性 | 挡叙事 | B4 |
| [ ] | P2 | **96-20 逐路由 PASS**；全站关键词搜 Tier C | 挡全站 | B6 |
| [ ] | P2 | **「我的」浏览记录**；生产 **bio** 策略手验 | 挡叙事 | B9 |
| [ ] | P2 | **31 附录 × 04** 字段逐项手验 | 挡契约 | B11 |
| [ ] | P2 | **96-18 支付/Webhook ① 最小闭环** 专项留证（签名/幂等/重试） | 挡资金叙事 | TT-9618、§1.2.2 |
| [ ] | P2 | **钱包验签 / 管理审计** 深矩阵（A0 余量） | 挡 A0 | §1.2.2 A0 |

#### 0.3.3 ① 本地 · P3（深度多维 / 发版文档）

| 勾 | 优 | 缺口 | 挡路 | 证据 |
|----|-----|------|------|------|
| [ ] | P3 | **TT-GATE** 缺口登记（闭一项登一项） | 挡深度 | §1.3 |
| [ ] | P3 | **93 矩阵** 分批扩面（10～30 条/批） | 挡深度 | §1.3 |
| [ ] | P3 | **96-20 × 93** 每路由×权限×弹窗手验 | 挡深度 | §1.3 |
| [ ] | P3 | **96-15 Tier C** 勾选 | 挡发版 | §1.3 |
| [ ] | P3 | **96-18 §2.2.7** 收官闸（04/ABI/registry 同批） | 挡发版 | §1.3 |
| [ ] | P3 | **ISS-007 / R-002** 分轨（勿 `PARTIAL_GO` 当 staging GO） | 挡误报 | §1.3 |
| [ ] | P3 | **93-R003-STAGING**（① 仅登记「≠ 已封口」） | 挡 ② 冒充 | §1.3 |
| [ ] | P3 | **Modal/抽屉走读**（TT-9628 §0.0.1） | 挡 UI 穷举 | §1.3 |
| [ ] | P3 | **TT-9628 覆盖边界** 对拍（93 §8.0 / 96-20 / R-002） | 挡误报 | TT-9628 |

#### 0.3.4 ② 测试网 / staging

| 勾 | 优 | 缺口 | 挡路 | 证据 |
|----|-----|------|------|------|
| [ ] | P0 | **② 立项**：环境摘要（域名/DB/密钥/回调 **≠ ①**） | 挡 ② | §2.0 |
| [ ] | P0 | **Stripe test** + 回调进测试库 | 挡 ② | §2.0 |
| [ ] | P0 | **公网 webhook** 可达（`stripe listen` 等） | 挡 ② | §2.0 |
| [ ] | P0 | **Resend（或等价）真邮件** | 挡 ② | §2.0 |
| [ ] | P0 | **② 独立 DB** + `sqlx migrate` | 挡 ② | §2.0 |
| [ ] | P1 | 主脊/约定用例在 **②** 复跑 | 挡 ② | §2.1 |
| [ ] | P1 | **93-R003-STAGING** 封口留证 | 挡 ② | §2.1 |
| [ ] | P1 | **R-002** `environment.name` ② 分轨 | 挡误报 | §2.1 |
| [ ] | P1 | **staging 全矩阵** 或 **CI e2e**（CI 恢复后） | 挡 ② | §2.1 |
| [ ] | P2 | **只读探针** `read_only_staging_prod_probe.py` | 挡 ② 旁证 | §2.2 |

#### 0.3.5 ③ 公网 / 生产

| 勾 | 优 | 缺口 | 挡路 | 证据 |
|----|-----|------|------|------|
| [ ] | P0 | **缺口总表 P0 十二项** 逐项 ☑ | 挡 GO | §3.0 |
| [ ] | P0 | **生产 PSP / PCI**（Hosted、3DS、SAQ） | 挡 GO | §3.0 |
| [ ] | P0 | **Webhook 生产硬闸**（mTLS、PSP 签名） | 挡 GO | §3.0 |
| [ ] | P0 | **制裁 / OFAC** 真合规（≠ env denylist） | 挡 GO | §3.0 |
| [ ] | P0 | **主网 / 真链**（部署、env、indexer 证据） | 挡 GO | §3.0 |
| [ ] | P1 | **Production GO** 人签 | 挡 GO | §3.1 |
| [ ] | P1 | **96-05 / Hub Declaration** 对齐 | 挡 GO | §3.1 |
| [ ] | P1 | **08-4 / 08-2** 发版链路（审查表） | 挡 GO | §3.1 |
| [ ] | P1 | **ops/RUNBOOK P0 九项** 值班/批准人 | 挡 GO | §3.1 |
| [ ] | P2 | 投资人 **LP 包**（**不**证明 ②③） | 融资 | §3.2 |
| [ ] | P2 | **IR 外发 preflight**（**不**证明 ②③） | 融资 | §3.2 |

<a id="tt-phased-checklist-gap-closed"></a>

### 0.4 已闭缺口（① 自动化主链 · 勿重复当「仍缺」）

| 勾 | 阶次 | 缺口 | 批次/证据 |
|----|------|------|-----------|
| [x] | ① | 全 chromium 矩阵 **`OK:`** | **CY** · `matrix-console-rerun.txt` |
| [x] | ① | `local-delivery-expanded` | **CU** |
| [x] | ① | b466+b467 mock-pay | **CV/CQ** |
| [x] | ① | E2E 分片 CH–CL | **CT–CL** |
| [x] | ① | cargo + tt-9618-pg + i18n + registry + fe-build | **CM** |
| [x] | ① | mock-pay UI bake-in | **CO** |
| [x] | ① | auth 邮件切片（log transport） | **CF** |
| [x] | ① | 钱包验签 Playwright/API | **CD+CE** |
| [x] | ① | CX 末 5 项（community 429 / F-021 / P04） | 窄切片 6 passed |

---

## 1. ① 本地（本机 / Docker · 真栈）

> **真源：** [TT-NEXT · A/B](TT-NEXT-BATCH-BACKLOG-001.md) · [TT-LOCAL §2.2](TT-LOCAL-CI-DELIVERY-GATE-001.md) · [solo-dev §6.5](../solo-dev-rhythm.md)

<a id="tt-phased-checklist-local-p0"></a>

### 1.0 P0 · 本地全栈自动化主链（**挡自动化 · 优先收口**）

**目标：** **`OK: local-e2e-chromium-full-matrix`** + 关键分片/expanded **可复现**。

| 勾 | 项 | 命令 / 要点 | 挡路 | 证据 |
|----|-----|-------------|------|------|
| [x] | **全 chromium 矩阵（终验）** | `PLAYWRIGHT_REUSE_API_SERVER=0 bash scripts/gates/local-e2e-chromium-full-matrix.sh` | 挡自动化 | **CY** · `evidence/.../matrix-console-rerun.txt` |
| [x] | **扩充本地交付闸** | `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 bash scripts/gates/local-delivery-expanded.sh` | 挡自动化 | **CU** |
| [x] | **链下 mock-pay（b466+b467）** | `PLAYWRIGHT_FE_USE_PRODUCTION_START=1` | 挡自动化 | **CV/CQ** |
| [x] | **E2E 分片簇** | smoke 60 / admin 54 / core-release 25 / p0-spine 21 / trust-gate 25 / 93-admin 8 | 挡自动化 | **CT–CL** |
| [x] | **API 单测 + 机读闸** | `cargo test -p traveltrust-api`；tt-9618-pg；i18n/regional；registry；`check-frontend-npm-build` | 挡自动化 | **CM** |
| [x] | **mock-pay UI bake-in** | `run-e2e-default.mjs` · `.next/tt-e2e-chain-off-mock-pay-ui-v1` | 挡自动化 | **CO** |
| [ ] | **矩阵前释端口（固定习惯）** | `taskkill traveltrust-api`；确认 **8080、3012** 空闲；**`PLAYWRIGHT_REUSE_API_SERVER=0`** | 挡回退 | |
| [ ] | **CY 证据写入 GO 目录** | 复制/索引至 **`evidence/GO_YYYYMMDD/README.md`**（命令 + `OK:` 行 + 334/14 skip） | 挡回退 | |
| [ ] | **大改后全矩阵复验（按需）** | 订单/社区/E2E helper 大改后复跑；**非每日** | 挡回退 | |

<a id="tt-phased-checklist-local-p1"></a>

### 1.1 P1 · 防回退与日常闸（**不挡矩阵 · 建议 ① 巩固周做完**）

**粗算：** **0.5～2 工作日**。

| 勾 | 优先级 | 项 | 命令 / 入口 | 挡路 | 证据 |
|----|--------|-----|-------------|------|------|
| [ ] | P1 | **dev-preflight** | `bash scripts/dev-preflight.sh` | 防回退 | |
| [ ] | P1 | **ci-local 最小三连** | `bash scripts/gates/ci-local-delivery-minimum.sh` | 防回退 | |
| [ ] | P1 | **expanded 含 Playwright 尾段** | **去掉** `CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1` 跑 **`local-delivery-expanded`** | 防回退 | |
| [ ] | P1 | **expanded 复跑（CY 后）** | 全矩阵已绿后 **再跑一轮** expanded，确认与 CY 一致 | 防回退 | |
| [ ] | P1 | **e2e-stability-probe** | `bash scripts/gates/e2e-stability-probe.sh` | 防回退 | |
| [ ] | P1 | **04 路由闸（改路由/契约时）** | `bash scripts/run-check-04-routes.sh` | 防回退 | |
| [ ] | P1 | **A8 社区写路径（改 mapOrderWriteError 等时）** | `cd frontend && npm run check:e2e:tsc && npm run test:a8-community` | 防回退 | |
| [ ] | P1 | **① 巩固证据包** | **`evidence/GO_YYYYMMDD/README.md`** 含 §1.0～1.1 勾选 + exit 摘要 | 防回退 | |

<a id="tt-phased-checklist-local-p2"></a>

### 1.2 P2 · 功能与体验缺口（**挡「全功能 / 投资人 demo」· 不挡矩阵**）

**粗算：** 单专项 **3～10 天**；全扫 **约 3～6 周**。**建议一次只开 1～2 行**，且 **不与全矩阵抢 8080**。

#### 1.2.1 P2 · 高优先（基建 / 演示最明显）

| 勾 | 项 | 仍缺 / 动作 | 挡路 | 真源 |
|----|-----|-------------|------|------|
| [ ] | **A4 · MinIO/S3 对象存储真链** | 本地或 Docker MinIO；**`public_video_publish_ready`** 非长期 skip；PublishDrawer 证据脚本可选 | 挡 demo | [COMMUNITY-MEDIA-OBJECT-STORAGE](COMMUNITY-MEDIA-OBJECT-STORAGE.md)、**A4** |
| [ ] | **B1 · Feed 视频 HLS/转码 CDN** | 真 CDN 或 staging 等价；**非** 仅 overlay 单测绿 | 挡 demo | TT-GATE §2、**B1** |
| [ ] | **B5 · 举报 → Admin 审核台** | 状态机 + Admin UI 全链路；**非** 仅 F-018 API 绿 | 挡运营叙事 | **B5**、F-018 |
| [ ] | **B10 · 社区规范法务定稿** | `/terms/community-guidelines` **正文**定稿 + Tier C | 挡对外合规 | **B10** |

#### 1.2.2 P2 · 中优先（TT-NEXT A 轨剩余）

| 勾 | 轨 | 仍缺要点 | 挡路 | 真源 |
|----|-----|----------|------|------|
| [ ] | **A0** | **② 侧准备**：Resend 密钥/模板清单（① 仍可用 `log`） | 挡 ② | **A0** |
| [ ] | **A1** | 社区字段 **93 全形态** / Tier C（HLS 与 B1 重叠） | 挡叙事 | **A1** |
| [ ] | **A2** | 评论分页/排序/二级 **93 手验** | 挡叙事 | **A2** |
| [ ] | **A3** | 赞藏 **已有** reload E2E；**关注**跨页/冷启动 93 手验 | 挡叙事 | **A3** |
| [ ] | **A4** | **59 恶意样本**上传安全；upload **93 手验全文** | 挡安全叙事 | **A4**、spec 59 |
| [ ] | **A5** | **全 Admin RBAC / 审计矩阵**（非仅 deep 切片） | 挡运营 | **A5**、Epic-C |
| [ ] | **A6** | **96-16 深度手验** / 全路由 **a11y** | 挡 UX 叙事 | **A6**、96-13 |
| [ ] | **A7** | **② staging 部署** / 生产 CDN（与 ② 区重叠） | 挡 ② | **A7** |
| [ ] | **A8** | **93 全矩阵** 429 退避 **Tier C** 勾选叙事 | 挡深度验收 | **A8** |

#### 1.2.3 P2 · 中优先（TT-NEXT B 轨剩余）

| 勾 | 轨 | 仍缺要点 | 挡路 | 真源 |
|----|-----|----------|------|------|
| [ ] | **B2** | 横屏 / `screen.orientation` / 安全区 **真机 Tier C** | 挡 UX | TT-31 §5 |
| [ ] | **B4** | 赞藏关 **多 Tab、冷启动** 一致性手验 | 挡叙事 | **B4** |
| [ ] | **B6** | **96-20 逐路由 PASS**；全站关键词搜索 Tier C | 挡全站叙事 | **B6**、96-20 |
| [ ] | **B9** | **浏览记录**；生产 **bio** 策略手验 | 挡「我的」完整 | **B9** |
| [ ] | **B11** | **31 附录 × 04** 字段 **逐项手验** | 挡契约叙事 | **B11** |

<a id="tt-phased-checklist-local-p3"></a>

### 1.3 P3 · 深度多维与发版文档闸（**挡「验收已穷举 / 可发版」**）

**粗算：** **2～4 周**（与 P2 并行时取并集，非简单相加）。

| 勾 | 优先级 | 项 | 说明 / 动作 | 挡路 | 真源 |
|----|--------|-----|-------------|------|------|
| [ ] | P3 | **TT-GATE 缺口登记更新** | 每闭一项在 **[TT-GATE](TT-GATE-COVERAGE-vs-96-15-GAP-REGISTRY-001.md)** 登记；**禁** 仅改勾选冒充已闭 | 挡深度叙事 | `#tt-gate-intro` |
| [ ] | P3 | **93 矩阵分批扩面** | 每批 **10～30** 条 **跑绿再扩**；登记 **93-matrix-batch-tracker** | 挡深度叙事 | 93-matrix |
| [ ] | P3 | **96-20 × 93 手验** | **每路由×权限×弹窗** 未穷举；见 **§0.1.0 覆盖边界** | 挡深度叙事 | 96-20、runbook §0.1.0 |
| [ ] | P3 | **96-15 Tier C** | 按 **[96-15](../spec/96-15-深度多维度检查与审计体系.md)** 正文勾选 | 挡发版多维 | 96-15 |
| [ ] | P3 | **96-18 §2.2.7 收官闸** | `run-check-04-routes`、ABI、`sync-abi`、registry 等 **同批 exit 0** | 挡发版文档 | `#9618-doc-complete-align` |
| [ ] | P3 | **ISS-007 / R-002 分轨** | **`PARTIAL_GO`** **勿** `--require-go` 当 staging 全矩阵 GO | 挡误报 GO | `evidence/GO_local_r002_verify/` |
| [ ] | P3 | **93-R003-STAGING（① 侧仅登记）** | ① 矩阵绿 **≠** staging 封口；② 再验 | 挡 ② 冒充 | R-002、93 |
| [ ] | P3 | **Modal/抽屉走读（可选）** | [TT-9628 · modal walk](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-0-0-1-modal-walk) | 挡 UI 穷举 | TT-9628 |

---

## 2. ② 测试网 / staging

> **整块未验收**；**禁止**用 **①** `.env` / CY 矩阵冒充。**入口：** [TT-9618](TT-9618-onboarding-local-testnet.md) · [§0.1.4](README.md#runbook-readme-section-014)

<a id="tt-phased-checklist-testnet-p0"></a>

### 2.0 P0 · ② 环境与外部依赖（**挡「测试网已验」**）

**粗算：** **1～2 周**（环境齐）；不齐则卡在等待配置。

| 勾 | 项 | 完成判据 | 挡路 | 证据 |
|----|-----|----------|------|------|
| [ ] | **② 立项 / 环境摘要** | 测试域名、DB、密钥沙箱、回调 URL 写入 **§0.1.3 表** 或任务卡；**明确 ≠ ①** | 挡 ② | |
| [ ] | **Stripe test 模式** | 测试密钥；下单/支付回调进 **测试库** | 挡 ② | TT-9618 |
| [ ] | **公网 webhook 可达** | `stripe listen` 或等价；签名校验 **可执行** | 挡 ② | TT-9618 §3+ |
| [ ] | **Resend（或等价）真邮件** | 注册/找回/验证 **非** `TRAVELTRUST_EMAIL_TRANSPORT=log` 冒充 ② | 挡 ② | TT-NEXT **A0** |
| [ ] | **② DB 与 migrate** | 测试库 **独立**；`sqlx migrate` 证据 | 挡 ② | TT-9618 |

### 2.1 P1 · ② 集成复跑与封口

| 勾 | 项 | 完成判据 | 挡路 | 证据 |
|----|-----|----------|------|------|
| [ ] | **主脊 / 约定用例在 ②** | 登录、订单、支付、社区主干 **`exit 0`** 或审计手验 | 挡 ② | TT-9618 |
| [ ] | **93-R003-STAGING** | 按 **93** staging 口径留证 | 挡 ② 封口 | 93 |
| [ ] | **R-002 ② 环境名** | `environment.name` 与 **①** 报告 **分轨** | 挡误报 | R-002 |
| [ ] | **staging 全矩阵或 CI e2e** | 远端 **build.yml** 恢复后复跑，或 ② 等价编排 | 挡 ② CI 旁证 | CONTRIBUTING |

### 2.2 P2 · ② 可选探针

| 勾 | 项 | 说明 | 证据 |
|----|-----|------|------|
| [ ] | **只读探针** | `scripts/ops/read_only_staging_prod_probe.py` + 真实 URL/RPC | `evidence/93-batch-agent-full-verify-*/` |

**② 全分区粗算：** **约 1～3 周**（1 人，环境齐）。

---

## 3. ③ 公网 / 生产

> **另闸**；**不能**用 CY 线性外推。**入口：** [go-live-checklist](../go-live-checklist.md) · [缺口总表 P0](../spec/缺口与待补-官方总表.md)

<a id="tt-phased-checklist-prod-p0"></a>

### 3.0 P0 · ③ 生产硬门槛（**挡 GO / 真生产**）

| 勾 | 项 | 完成判据 | 挡路 | 真源 |
|----|-----|----------|------|------|
| [ ] | **缺口总表 P0 十二项** | 逐项 **☑** + 证据路径 | 挡 GO | 缺口总表 |
| [ ] | **生产 PSP / PCI** | Hosted、**3DS**、**SAQ**；**Target 须标明** | 挡 GO | 96-18 §0 P0 |
| [ ] | **Webhook 生产硬闸** | **mTLS**、PSP 签名；**≠** ① HMAC-only | 挡 GO | 96-18、go-live |
| [ ] | **制裁 / OFAC 真合规** | **≠** 仅 env 子串 denylist | 挡 GO | 96-18 P0 |
| [ ] | **主网 / 真链（若在范围）** | 合约部署、env、**indexer 块高**表行证据 | 挡 GO | 96-18 P2、14、110 |

### 3.1 P1 · ③ 决议与留痕

| 勾 | 项 | 完成判据 | 挡路 | 证据 |
|----|-----|----------|------|------|
| [ ] | **Production GO 人签** | [go-live · GO Decision](../go-live-checklist.md#go-decision-entry-point) | 挡 GO | `evidence/GO_*/` |
| [ ] | **96-05 / Hub Declaration** | 外生产验收分册与阶段对齐 | 挡 GO | 96-索引 |
| [ ] | **08-4 / 08-2 发版链路** | 定稿日期、Owner、审查表 | 挡 GO | runbook §0.1.1 阶段 1 |
| [ ] | **ops/RUNBOOK P0 九项** | 值班/批准人 **真实有效** | 挡 GO | ops/RUNBOOK |

### 3.2 P2 · ③ 可选（融资 / 外发）

| 勾 | 项 | 说明 | 挡路 |
|----|-----|------|------|
| [ ] | **投资人 LP 包** | `bash scripts/gates/release-investor-lp-pack.sh` | **不**证明 ②③ 链 |
| [ ] | **IR 外发 preflight** | `ir-preview-send-preflight.sh` / `ir-outbound-status.sh` | **不**证明 ②③ |

**③ 粗算：** **数周～数月**（组织/合规节奏）。

---

## 4. 推荐执行顺序与「下一批 5 行」

<a id="tt-phased-checklist-next-five"></a>

```text
① P0 余量（释端口、GO 证据）
    → ① P1 整列日常闸
    → ① P2 挑 1 项（建议 A4 MinIO 或 B5 审核台）
    → （你明确开 ② 后）② P0 环境摘要 + Resend + Stripe
    → ③ 单独立项
```

| 顺序 | 区 | 建议勾选行 | 说明 |
|------|-----|------------|------|
| 1 | ① P0 | §1.0 **释端口** + **CY 证据归档** | **~0.5 天** |
| 2 | ① P1 | §1.1 **整列** | **~1～2 天** |
| 3 | ① P2 | **A4 MinIO** *或* **B5 审核台**（二选一） | **~3～10 天** |
| 4 | ② P0 | **环境摘要 + Resend + Stripe**（须先备密钥/域名） | **开 ② 后** |
| 5 | ① P3 | 闭一项登记一项 **TT-GATE** | 与 P2 并行 |

**禁止：** 全矩阵长跑与 **② 起栈**、**MinIO 专项** 同一天抢 **8080/3012**。

---

## 5. 粗算工期对照（汇总）

| 范围 | 优先级区 | 粗算（1 人） | 挡本地自动化全绿？ |
|------|----------|--------------|-------------------|
| ① 巩固 | P0 余量 + P1 | **0.5～2 天** | 否（已绿） |
| ① 功能/demo | P2 高优先 1～2 项 | **3～10 天/项** | 否 |
| ① 功能全扫 | P2 全部 A/B | **约 3～6 周** | 否 |
| ① 深度/发版 | P3 | **约 2～4 周** | 否 |
| ② 全链路 | P0～P1 | **约 1～3 周** | 挡 **②** |
| ③ GO | P0～P1 | **另立项** | 挡 **生产** |

---

## 6. 变更记录

| Version | Date | 摘要 |
|---------|------|------|
| 1.0.2 | 2026-05-17 | **§0.3 缺口总表**（**~55 行可勾选**）+ **§0.4 已闭**；与 §1～§3 同键。 |
| 1.0.1 | 2026-05-17 | **补** **§0.2 还缺什么**；**P1～P3 拆细**（P2 高/中、挡路列）；**②③ 分 P0/P1/P2**；**§4 下一批 5 行**。 |
| 1.0.0 | 2026-05-17 | 初版：**①②③ 分区**；**CY** P0 已勾。 |
