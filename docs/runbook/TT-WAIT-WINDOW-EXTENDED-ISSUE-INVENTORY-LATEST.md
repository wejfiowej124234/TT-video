# TT · Wait Window · Extended Multi-Dimension Issue Inventory（LATEST）

**STATUS:** `INVENTORY_SSOT · OFFICIAL_AND_TRACK1_FREEZE · LOCAL_PREP_ALLOWED`  
**Revision:** `v2-deep` · **Stamp:** `2026-08-11T02:40:36Z`（闸口同步）  
**Mode:** 债地图真源 · ETA 前允许按 Ladder **Local Prep** · **禁止** Official Deploy / Track1 mutate  
**Parent Freeze:** [`TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST`](./TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.md) · **`OFFICIAL_AND_TRACK1_FREEZE · LOCAL_PREP_ALLOWED`**  
**Remediation Ladder（Local Prep ACTIVE）:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST.md) · **USDC_ONLY** · **Web3 已部署地址不乱改**  
**Route Matrix（207 路由）:** [`TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST`](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.md)  
**Assurance:** [`TT-WAIT-WINDOW-PRE-FINALIZE-REALITY-ASSURANCE-LATEST`](./TT-WAIT-WINDOW-PRE-FINALIZE-REALITY-ASSURANCE-LATEST.md)  
**Machine:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST.json`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 读前纪律（写死）

```text
存在 OPEN ≠ 当前阻塞 ≠ 现在要 Official 修
ETA 前 = Local Prep（CHECK→GAP→Local FIX→Local Test→LOCAL_READY_NOT_DEPLOYED）
优先 R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1 → Legal/文档诚实
禁止 Official Deploy · 造数 · Indexer 美化 · execute/release/Seal/GO
下一关键主网里程碑 = Track1 Reality Finalize（ETA 后独占）
本清单 = 分类债地图 · 程序见 Remediation Ladder
全项目支付/双边 = USDC_ONLY · 已部署 Web3 以 FTB 为准禁止乱改
```

| when_to_address | 含义 |
|-----------------|------|
| **HOLD_ETA** | Timelock / Reality Finalize 串行本身 |
| **POST_SERIAL** | Track1 串行完成后再评 |
| **POST_SEAL_HARD_GATE** | Reality Seal 后 Hard Gate 重评队列 |
| **POST_GO_QUEUE** | 仅在考虑 Production GO 前必须清 |
| **SEPARATE_TRACK** | 独立轨 · 永不插队 Track1 |
| **COVERAGE_ONLY** | 缺活样本 · 禁止造数补绿 |
| **ACCEPT_KNOWN** | 已知 Expected Difference / 设计 interim |
| **PROBE_NEEDED** | 文档有登记 · 活网本轮未复验 / 可能过期 |

---

## 维度地图（v2）

| # | 维度 | 节 |
|---|------|----|
| 1 | 商业 / Money / Narrative | §1 |
| 2 | 旅客用户 | §2 |
| 3 | 导游 / 商家 | §3 |
| 4 | 管理员 | §4 |
| 5 | Web3 / Indexer | §5 |
| 6 | 社区 · 视频 · 评论 · 媒体 | §6 |
| 7 | 前端 UI/UX 功能 | §7 |
| 8 | 配置 / 发布级设置 | §8 |
| 9 | **Auth Identity / 安全** | §11 |
| 10 | **RBAC / 角色边界** | §12 |
| 11 | **Stripe / PSP / 法币** | §13 |
| 12 | **治理 / DID / 质押深** | §14 |
| 13 | **市场 / 获客 / Listing / Bond** | §15 |
| 14 | **消息 / Inbox / 通知** | §16 |
| 15 | **运维 / 可观测 / 事故** | §17 |
| 16 | **i18n / a11y / 真机** | §18 |
| 17 | **法务 / 争议 / 退款政策** | §19 |
| 18 | **Staging↔Prod 漂移** | §20 |
| 19 | **CMS 多国 Content QA** | §21 |
| 20 | **Phase② 残差闸** | §22 |
| 21 | **PFA Fix=8 / Owner 人闸** | §23 |
| 22 | **覆盖真实性 / 度量** | §24 |
| 23 | **Open-Issues / Build 基建** | §25 |
| 24 | **公开路由逐页矩阵（207）** | [`PUBLIC-ROUTE-MATRIX`](./TT-WAIT-WINDOW-PUBLIC-ROUTE-MATRIX-LATEST.md) |

---

## 1 · 商业视角（Commercial / Money / Narrative）

| ID | 问题 | 精度/影响 | when |
|----|------|-----------|------|
| **C-01** | Official live = Mainnet Money Path **PARTIAL** · `USER_FUNDS=0` · 不可对公众宣称「全量资金闭环已上线」 | 商业叙事 | ACCEPT_KNOWN → POST_SEAL |
| **C-02** | Track1 setEscrow **等 ETA** · Settlement/Fee **尚未**对真实 Reality 单完成到账证明 | 资金闭环 | **HOLD_ETA** |
| **C-03** | FeeRouter legs = Safe/Treasury **interim** · **≠** 83 RegionVault / 主理人分账终局 | 白皮书 vs 活网 | ACCEPT_KNOWN · 83 SEPARATE |
| **C-04** | `/meta` factory 仍挂 **lineage**（非 Wired）· alignment FAIL | 运维/合约身份诚实 | POST_SEAL_HARD_GATE（**H1/H2**） |
| **C-05** | 公开产品币种政策 **USDC only** · Admin 投影仍见 **USD** 字段 | 对内账本精度 | **R-USDC-1 `LOCAL_READY_NOT_DEPLOYED`**（Seal 后 Official Cut） |
| **C-06** | Hard Gate **REFUSED** · 多轴 OPEN（Safe/Ops/Readiness/Owner auth…） | 发布决策 | POST_SEAL_HARD_GATE |
| **C-07** | `TT_PRODUCTION_GO=NO_GO` · Seal **不自动**翻 GO | 发布闸 | ACCEPT_KNOWN |
| **C-08** | TrustedFactory / Track2 Fast Checkout | 第二轨 | BLOCKED_UNTIL_TRACK1_SEAL |
| **C-09** | CMS Content QA：部分国 CLOSED、多国仍 OPEN（见 §21） | 内容商业质量 | SEPARATE_TRACK |
| **C-10** | Wait-window Batch **6/7/8**（perf / security / narrative）**PENDING** | 审计完备度 | POST_SERIAL |
| **C-11** | 对外「Production GO / 全站已闭」话术与 living `NO_GO` 冲突风险（Owner Queue 历史文） | 叙事诚实 | ACCEPT_KNOWN · 以 FTB/Freeze 为准 |
| **C-12** | PSG Gate 可呈 `CONDITIONAL_GO` / Fix Required=8 时仍 **≠** ③ GO | 发布语义 | ACCEPT_KNOWN |

---

## 2 · 用户视角（Traveler）

| ID | 问题 | when |
|----|------|------|
| **U-01** | 旁路态缺活样本 Cancelled/Funded/Completed/PartiallyRefunded/Slashed | COVERAGE_ONLY（B5-G-006） |
| **U-02** | Guide 接待空 · 等接单深路径未复验 | COVERAGE_ONLY（B5-G-005） |
| **U-03** | `/me/payments` 深链 404（菜单已无死链） | **R-PAY-IA-1 Local**：redirect→`/orders` · Official 待 Seal 后 Cut |
| **U-04** | OrderActions `canConfirmCompletion` 漂移风险 | POST_SERIAL（B5-G-004） |
| **U-05** | Reality Funded escrow ∉ Traveler 列表 | ACCEPT_KNOWN |
| **U-06** | 无 escrow 终态 Indexer fail-closed | ACCEPT_KNOWN（H4） |
| **U-07** | 五主 UI 冻结 | ACCEPT_KNOWN |
| **U-08** | B5 Blocking 假暗示 | **CLOSED** |
| **U-09** | Tourist 下单/需求专廊证据缺口（覆盖审计） | COVERAGE_ONLY |
| **U-10** | UI P0 loading/error/empty 覆盖 NOT_FOUND（覆盖审计） | COVERAGE_ONLY |
| **U-11** | Wallet Connect Project ID 缺 → 真机钱包走廊 BLOCKED | POST_GO_QUEUE（OA-01） |
| **U-12** | `/me/trust` Trust Surface redirect / PFA-UI-TRUST-01 | POST_GO_QUEUE |

**Official 抽查：** Traveler 列表 Refunded×2@12 USDC + In dispute@10 USDC；`/me/payments` API **401**（需登录；未证明 200 业务面）。

---

## 3 · 导游 / 商家（Guide / Provider）

| ID | 问题 | when |
|----|------|------|
| **G-01** | Guide 接待矩阵未活验 | COVERAGE_ONLY |
| **G-02** | Guide EN bio DEFER | SEPARATE_TRACK |
| **G-03** | Provider UI ① 冻 · ②③ PSP/主网资金未 GO | POST_GO_QUEUE |
| **G-04** | Acquisition/Provider PASS_PARTIAL · Deploy Evidence 未闭 | POST_SERIAL |
| **G-05** | PD-009 bond/listing ①≠②③ GO | ACCEPT_KNOWN |
| **G-06** | Role Navigation PFA-UI-ROLE-01/02 PENDING | POST_GO_QUEUE |

---

## 4 · 管理员（Admin）

| ID | 问题 | when |
|----|------|------|
| **A-01** | Disputes 宇宙 vs 旅客 disputed | **DEFER**（R-ADMIN-1 · 需登录同对象 · 禁造数） |
| **A-02** | Can write vs read-only 双信号 | **R-ADMIN-1 Local**：Disputes 页头强制 Read-only |
| **A-03** | Orders Currency=USD | **R-USDC-1 Local Prep 已修展示** · Official 待 Seal 后 Cut |
| **A-04** | Orders `?q=` 过滤弱 | **R-ADMIN-1 Local**：`routes.admin.orders` 序列化 id/q |
| **A-05** | V65 PRV-2 · Owner Cert UAT 未执行（**挡 GO**） | **POST_GO_QUEUE** |
| **A-06** | V65 G014 Performance baseline | POST_GO_QUEUE |
| **A-07** | tip FROZEN 35872b40 residual GAP | ACCEPT_KNOWN |
| **A-08** | pause RPC plan limit 噪声 | POST_SEAL_HARD_GATE |
| **A-09** | Disputes orderId 过滤 | **CLOSED** |
| **A-10** | Admin live RBAC / role-matrix 人闸 DEFERRED（PFA） | POST_GO_QUEUE |
| **A-11** | V65 RC-E-06 UAT-01…05 Owner Human UAT PENDING | POST_GO_QUEUE |
| **A-12** | Six-role「100%」声称 vs 仅 Admin CS 矩阵 | COVERAGE_ONLY |

---

## 5 · Web3 / Indexer

| ID | 问题 | when |
|----|------|------|
| **W-01** | Funded + 10 USDC + op pinned · 等 ETA | **HOLD_ETA** |
| **W-02** | isEscrow=false · settlementState=0 | HOLD_ETA |
| **W-03** | API factory lineage ≠ Wired | POST_SEAL_HARD_GATE |
| **W-04** | Indexer checkpoint 0/0 | POST_SERIAL（不插队） |
| **W-05** | Indexer PREP_HONEST_DEGRADED ≠ GO | ACCEPT_KNOWN |
| **W-06** | AXIS-11 NOT_THIS_WAVE | ACCEPT_KNOWN |
| **W-07** | Evidence 模板 alignment 字样 STALE | POST_SERIAL（H5） |
| **W-08** | Indexer production lag SLA / on-call DEFERRED | POST_SERIAL |
| **W-09** | `/api/v1/meta` 本轮 **401** vs 根 `/meta` **200**（路径/门闸差异） | PROBE_NEEDED · POST_SERIAL |

---

## 6 · 社区 · 视频 · 评论 · 媒体

| ID | 问题 | 证据 | when |
|----|------|------|------|
| **M-01** | 视频发布能力 READY | capabilities 200 · ready=true | READY |
| **M-02** | 孤儿 media 404 | B3-G-007 | SEPARATE_TRACK |
| **M-03** | 评论写读往返未本轮登录压测 | feed comment_count>0 只读 | POST_GO_QUEUE |
| **M-04** | B9 media/mobile/search DEFER | UX B9 | SEPARATE_TRACK |
| **M-05** | PI3 R2 CDN Owner CF + Acceptance PENDING | open-issues | SEPARATE / POST_GO |
| **M-06** | Feed 可读 | feed 200 · 15 帖含 video | OK |
| **M-07** | COM-②-4 staging 真 UGC 评论再验 OPEN | roadmap | COVERAGE_ONLY |
| **M-08** | COM-②-8 staging 视频+CDN 读路径 OPEN | roadmap | SEPARATE_TRACK |
| **M-09** | C4 HLS / C5 prod CDN pending（② PASS≠产 CDN） | Phase2 status | SEPARATE_TRACK |
| **M-10** | Catalog Unsplash→owned 资产迁移 DEFERRED | open-issues | SEPARATE_TRACK |

---

## 7 · 前端 UI/UX

| ID | 问题 | when |
|----|------|------|
| **F-01** | 五主冻结 | ACCEPT_KNOWN |
| **F-02** | Auth/Provider/Escrow draft/PD-009 ① 冻 | ACCEPT_KNOWN |
| **F-03** | `/me/payments` | **R-PAY-IA-1 `LOCAL_READY_NOT_DEPLOYED`**（redirect→`/orders`） |
| **F-04** | Escrow UX DEFER | SEPARATE_TRACK |
| **F-05** | CMS Announcements/POI DEFER | SEPARATE_TRACK |
| **F-06** | Batch 6/7/8 未跑 | POST_SERIAL |
| **F-07** | 已上链订单页未冻 | POST_GO_QUEUE |
| **F-08** | FE tip PARTIAL | ACCEPT_KNOWN |
| **F-09** | Wallet tip createPortal vs ① dropdown 设计漂移 | POST_SERIAL |
| **F-10** | Public Surface Home/Guides/Campaign/Hero… 多叶 PENDING | SEPARATE_TRACK |
| **F-11** | Legacy Governor / Steward stake UI Fix-Required | POST_GO_QUEUE |
| **F-12** | SEO / public meta DEFERRED | SEPARATE_TRACK |
| **F-13** | `/privacy` `/terms` `/trust` **200** · `/legal/*` **404**（双路径） | POST_GO_QUEUE（IA 精度） |

**Official：** auth/login · did-rank · governance/proposals · privacy/terms/trust **200**。

---

## 8 · 配置 / 发布级设置

| ID | 缺口 | when |
|----|------|------|
| **CFG-01** | TT_PRODUCTION_GO=NO_GO · Hard Gate REFUSED | HOLD / POST_SEAL |
| **CFG-02** | USER_FUNDS 未开 | ACCEPT_KNOWN |
| **CFG-03** | factory lineage on /meta | POST_SEAL_HARD_GATE |
| **CFG-04** | Indexer checkpoint 空 | POST_SERIAL |
| **CFG-05** | public_video_spec_required=false | POST_GO_QUEUE |
| **CFG-06** | pause RPC plan limit | POST_SEAL_HARD_GATE |
| **CFG-07** | Admin Cert UAT | **POST_GO_QUEUE** |
| **CFG-08** | Media CDN Acceptance PENDING | SEPARATE / POST_GO |
| **CFG-09** | CFG Sprint FROZEN | ACCEPT_KNOWN |
| **CFG-10** | Sepolia DEMOTED | ACCEPT_KNOWN |
| **CFG-11** | CSP/HSTS/WAF hardening DEFERRED | POST_GO_QUEUE |
| **CFG-12** | SBOM/签名/provenance NOT_RUN | POST_GO_QUEUE |
| **CFG-13** | TLS 续期责任链 DEFERRED | POST_GO_QUEUE |
| **CFG-14** | Publish pin / image digest PFA PENDING | POST_GO_QUEUE |

---

## 11 · Auth Identity / 安全（v2 补）

| ID | 问题 | when |
|----|------|------|
| **SEC-01** | OTP/邮件生产级 fail-closed 不足 · register auto-verified（AIL-01） | POST_GO_QUEUE · PROBE_NEEDED |
| **SEC-02** | 密码重置 stub / GAP（AIL-02） | POST_GO_QUEUE · PROBE_NEEDED |
| **SEC-03** | 邮箱变更能力缺失（AIL-03） | POST_GO_QUEUE |
| **SEC-04** | 改密后 session 全撤 PARTIAL（AIL-04） | POST_GO_QUEUE |
| **SEC-05** | auth_email_tokens / Resend / limit 未全接线（AIL-X1） | POST_GO_QUEUE |
| **SEC-06** | 账号枚举风险（register/send-code 409） | POST_GO_QUEUE |
| **SEC-07** | 重置路径 rate-limit PARTIAL | POST_GO_QUEUE |
| **SEC-08** | 外部安全审计 R-01 OPEN（③ 前） | POST_GO_QUEUE |
| **SEC-09** | Wait-window Auth B2 ACCEPT/DEFER 残项 | SEPARATE_TRACK · PROBE_NEEDED |
| **SEC-10** | STRICT_SESSION_GATE 已强制（本轮 401 证据） | ACCEPT_KNOWN（正向） |

---

## 12 · RBAC / 角色边界（v2 补）

| ID | 问题 | when |
|----|------|------|
| **RBAC-01** | Admin UI live RBAC DEFERRED | POST_GO_QUEUE |
| **RBAC-02** | 全角色 live matrix DEFERRED | POST_GO_QUEUE |
| **RBAC-03** | Tourist Admin-deny Alignment 未宣称全闭 | POST_SERIAL |
| **RBAC-04** | PI3 Admin RBAC/SSO/audit OPEN | POST_GO_QUEUE |
| **RBAC-05** | 六角色覆盖声称 GAP | COVERAGE_ONLY |

---

## 13 · Stripe / PSP / 法币（v2 补）

| ID | 问题 | when |
|----|------|------|
| **PSP-01** | Stripe **live** + 产 PSP 实例 OPEN | POST_GO_QUEUE |
| **PSP-02** | Fiat Onboarding 可选 DEFER · 不挡 Web3 GO | ACCEPT_KNOWN |
| **PSP-03** | Stripe test refund ② 证据残差 | COVERAGE_ONLY |
| **PSP-04** | Refund/dispute Dashboard 测试事件 backlog | COVERAGE_ONLY |
| **PSP-05** | PAY-W01… 清单与主网 FTB 活态需对拍 | POST_SEAL_HARD_GATE · PROBE_NEEDED |

---

## 14 · 治理 / DID / 质押深（v2 补）

| ID | 问题 | when |
|----|------|------|
| **GOV-01** | B11 mobile + fee-routes + ledger meta DEFER | SEPARATE_TRACK |
| **GOV-02** | Hub PARTIAL / Timelock wait / Sepolia demoted | ACCEPT_KNOWN |
| **GOV-03** | TTG params 非 live / 非 GO | ACCEPT_KNOWN |
| **GOV-04** | Legacy Governor UI Fix-Required | POST_GO_QUEUE |
| **GOV-05** | Steward stake UI Fix-Required | POST_GO_QUEUE |
| **GOV-06** | CERT-7/8 Timelock treasury 类 TIME 残差 | HOLD_ETA / POST_SEAL |
| **GOV-07** | CERT-10–12 Tabletop/DR/GORP HUMAN | POST_GO_QUEUE |
| **GOV-08** | Settlement splitNetProfit execute 残差 | HOLD_ETA |
| **GOV-09** | `/meta` governor class PFA-UI-GOV-02 | POST_SEAL_HARD_GATE |
| **GOV-10** | protocol-reference Official **200**（只读可达） | OK / 监测 |

---

## 15 · 市场 / 获客 / Listing / Bond（v2 补）

| ID | 问题 | when |
|----|------|------|
| **MKT-01** | UX B1 Market ACCEPT/DEFER 残项 | SEPARATE_TRACK · PROBE_NEEDED |
| **MKT-02** | Public Surface 多叶 PENDING | SEPARATE_TRACK |
| **MKT-03** | CMS Governance 相关 deploy 禁令/延迟 | HOLD_ETA / SEPARATE |
| **MKT-04** | Acquisition Deploy Evidence OPEN | POST_SERIAL |
| **MKT-05** | Tourist `/orders` FE journey 覆盖 GAP | COVERAGE_ONLY |
| **MKT-06** | Discover API 本轮 **200**（公网可读） | OK / 监测 |
| **MKT-07** | Discover Draft 边界等已 B3 收 · 勿回潮 | ACCEPT_KNOWN |

---

## 16 · 消息 / Inbox / 通知（v2 补）

| ID | 问题 | when |
|----|------|------|
| **MSG-01** | per-item notifications API（评论/@/关注+已读）OPEN | SEPARATE_TRACK |
| **MSG-02** | staging 真 UGC 评论再验 | COVERAGE_ONLY |
| **MSG-03** | PostDetail/Feed drawer staging E2E OPEN | SEPARATE_TRACK |
| **MSG-04** | C9 视觉再签 HUMAN | POST_GO_QUEUE |
| **MSG-05** | Community create→DB→API→UI 覆盖不全 | COVERAGE_ONLY |
| **MSG-06** | Admin Inbox 渠道路径已有 crash-class 闸（部署前） | ACCEPT_KNOWN（正向控制） |

---

## 17 · 运维 / 可观测 / 事故（v2 补）

| ID | 问题 | when |
|----|------|------|
| **OPS-01** | DB backup drill DEFERRED | POST_GO_QUEUE |
| **OPS-02** | 外部状态页模板 DEFERRED | ACCEPT_KNOWN |
| **OPS-03** | Dependency Ownership 待 Owner 确认 | POST_GO_QUEUE |
| **OPS-04** | Solo on-call = Owner · 升级=pause+HOLD | ACCEPT_KNOWN |
| **OPS-05** | Indexer lag SLA / reconcile on-call DEFER | POST_SERIAL |
| **OPS-06** | 72h staging soak 残差 | HOLD_ETA / POST_SERIAL |
| **OPS-07** | Indexer deep reconcile post-soak | POST_SERIAL |
| **OPS-08** | Artifact integrity DEFERRED | POST_GO_QUEUE |
| **OPS-09** | TLS renewal chain DEFERRED | POST_GO_QUEUE |
| **OPS-10** | Deploy Freshness Gate（10×4+attestation）跳过即债 | COVERAGE_ONLY |

---

## 18 · i18n / a11y / 真机（v2 补）

| ID | 问题 | when |
|----|------|------|
| **UXQ-01** | 全站 a11y/i18n DEFERRED | SEPARATE_TRACK |
| **UXQ-02** | 多端 / OA-02 真机 DEFERRED · 被 OA-01 锁 | POST_GO_QUEUE |
| **UXQ-03** | UI P0 空/错/载状态覆盖缺口 | COVERAGE_ONLY |
| **UXQ-04** | Escrow URL 未进部分 UI P0 可进入探针 | COVERAGE_ONLY |
| **UXQ-05** | SEO DEFERRED | SEPARATE_TRACK |
| **UXQ-06** | B11/B9 mobile 深验 DEFER | SEPARATE_TRACK |

---

## 19 · 法务 / 争议 / 退款政策（v2 补）

| ID | 问题 | when |
|----|------|------|
| **LEG-01** | ToS DEFERRED（PSG-LEGAL-TOS） | POST_GO_QUEUE |
| **LEG-02** | Privacy DEFERRED | POST_GO_QUEUE |
| **LEG-03** | Token disclosure DEFERRED | POST_GO_QUEUE |
| **LEG-04** | Trust Center 材料 DEFERRED | POST_GO_QUEUE |
| **LEG-05** | Investor material DEFERRED | POST_GO_QUEUE |
| **LEG-06** | Reality 争议演练 ≠ 主网仲裁 ≠ 法币退款 PSP | ACCEPT_KNOWN |
| **LEG-07** | 84/LEGAL counsel 签字前勿宣称产经经济学 | POST_GO_QUEUE |
| **LEG-08** | 页面 `/privacy` `/terms` 可达 · 法律文本是否签收级 | POST_GO_QUEUE · PROBE_NEEDED |
| **LEG-09** | G24 Legal LEG-XJ-05 signoff 残差 | POST_GO_QUEUE |

---

## 20 · Staging↔Prod 漂移 / 钱包 Tip（v2 补）

| ID | 问题 | when |
|----|------|------|
| **DRF-01** | Wallet UI tip 与 ① 设计漂移 | POST_SERIAL |
| **DRF-02** | WC Project ID KEY_ABSENT · OA-01 BLOCKED | **POST_GO_QUEUE** |
| **DRF-03** | Coverage RESULTS.json STALE | COVERAGE_ONLY |
| **DRF-04** | Owner Queue「GO CLOSED」文 vs living NO_GO | ACCEPT_KNOWN（以 living 为准） |
| **DRF-05** | Ambient/Guest SLA HOLD | SEPARATE_TRACK |
| **DRF-06** | FE bake Wired OK · API factory lineage 漂移（同源 H1） | POST_SEAL_HARD_GATE |

---

## 21 · CMS 多国 Content QA（v2 补 · 细于 C-09）

| ID | 问题 | when |
|----|------|------|
| **CMS-01** | JP Country Content QA **CLOSED** | ACCEPT_KNOWN |
| **CMS-02** | KR/FR/ES Country CLOSED（以各 LATEST 为准） | ACCEPT_KNOWN |
| **CMS-03** | AU/CN/TH/AE/US Content QA + Country **OPEN** | SEPARATE_TRACK |
| **CMS-04** | Singapore LATEST 键名疑似串国（FR keys） | PROBE_NEEDED |
| **CMS-05** | Execution CLOSED ≠ Country CLOSED 纪律 | ACCEPT_KNOWN |
| **CMS-06** | Catalog asset migration DEFERRED | SEPARATE_TRACK |
| **CMS-07** | B6 Announcements/POI Accuracy DEFER | SEPARATE_TRACK |

---

## 22 · Phase② 残差闸（v2 补）

| ID | 问题 | when |
|----|------|------|
| **P2G-01** | G-1/G-2 历史机读绿 · 非当前 P0 | ACCEPT_KNOWN |
| **P2G-02** | Perfect Validation 非 GO（soak/indexer） | HOLD_ETA / POST_SERIAL |
| **P2G-03** | G-09 Testnet graduation Owner signoff | POST_GO_QUEUE |
| **P2G-04** | HC-77 / ENT-146 人证矩阵残差 | POST_GO_QUEUE |
| **P2G-05** | RB live-wallet Sepolia 路径残差 | HOLD_ETA |
| **P2G-06** | Phase③ entry HOLD · P3-COM NOT STARTED | POST_GO_QUEUE |
| **P2G-07** | ONB Stripe test refund 残差 | COVERAGE_ONLY |

---

## 23 · PFA Fix=8 / Owner 人闸（v2 补）

| ID | 问题 | when |
|----|------|------|
| **PFA-01** | Wallet WC absent OWNER_ACTION | **POST_GO_QUEUE** |
| **PFA-02** | Role Navigation 01/02 PENDING | POST_GO_QUEUE |
| **PFA-03** | Trust Surface `/me/trust` PENDING | POST_GO_QUEUE |
| **PFA-04** | Publish pin / digest PENDING | POST_GO_QUEUE |
| **PFA-05** | Governor class `/meta` Fix-Required | POST_SEAL_HARD_GATE |
| **PFA-06** | Fix Required 开着时 CONDITIONAL_GO ≠ ③ GO | ACCEPT_KNOWN |
| **PFA-07** | V65 PROD-003 R013 Web3-depth DEFER | POST_SEAL_HARD_GATE |
| **PFA-08** | Owner Final Human Queue 四类仍为人闸 | POST_GO_QUEUE |

---

## 24 · 覆盖真实性 / 度量（v2 补）

| ID | 问题 | when |
|----|------|------|
| **COV-01** | Coverage % 为估计 · 非 Metrics Recalculate | COVERAGE_ONLY |
| **COV-02** | cargo-auth 定向测证据 GAP | COVERAGE_ONLY |
| **COV-03** | Tourist create-demand 专廊证据 GAP | COVERAGE_ONLY |
| **COV-04** | Community/Announcement 数据生命周期链 GAP | COVERAGE_ONLY |
| **COV-05** | 为覆盖造数 **禁止**（B5 纪律） | ACCEPT_KNOWN |

---

## 25 · Open-Issues Registry / Build（v2 补）

| ID | 问题 | when |
|----|------|------|
| **OIR-01** | PI3-MEDIA-R2-CDN-FINAL WAITING_OWNER_CF | SEPARATE_TRACK |
| **OIR-02** | MEDIA_CDN_PRODUCTION_ACCEPTANCE PENDING | POST_GO_QUEUE |
| **OIR-03** | PI3-CATALOG-ASSET-MIGRATION DEFERRED | SEPARATE_TRACK |
| **OIR-04** | CI-BUILD V49 OOM OPEN LOW | SEPARATE_TRACK |

---

## 26 · 优先级总表（冻结期 · v2）

| 优先级 | 集合 | 现在 |
|--------|------|------|
| **P0 等 ETA** | W-01/02 · C-02 · GOV-06/08 | **只等 + 只读** |
| **P0 不插队** | H1–H5 · M-02 · A-03 · W-04 · CMS OPEN 国 · Auth/Legal/PSP 债 | **记债 · 不修** |
| **挡 GO 不挡 Track1** | A-05 · CFG-07 · PFA-01/DRF-02 · LEG-* · SEC-* · PSP-01 | GO 队列 |
| **Seal 后 Hard Gate** | C-04/06 · CFG-03/06 · GOV-09 · PFA-05/07 | Seal 后重排 |
| **Coverage** | U-01/02 · G-01 · COV-* · MSG-02 | 有真单再验 |
| **已闭 / READY** | U-08 · A-09 · M-01/M-06 · SEC-10 · GOV-10 · MKT-06 | 不重开 |

---

## 27 · 诚实边界

- **v2 更全 ≠ 现在要开工** · **≠** Freeze 失败  
- 文档 OPEN 可能 **PROBE_NEEDED**（活网未复验）  
- 页面 200 ≠ 法律签收 / ≠ Content QA Country CLOSED  
- 视频 READY ≠ Media Acceptance · 评论 count>0 ≠ 本轮写评压测 PASS  
- Admin Cert / WC / Legal **挡 Production GO** · **不挡** ETA Track1 Finalize  

**下一动作（唯一）：** ETA → fail-closed Preflight → Track1 串行。
