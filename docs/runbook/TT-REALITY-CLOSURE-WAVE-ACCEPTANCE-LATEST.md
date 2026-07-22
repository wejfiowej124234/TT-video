# TT · Reality Closure · Wave 0–7 Acceptance（WAIT_ETA · FROZEN PREP）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_REALITY_CLOSURE_WAVE_ACCEPTANCE`  
**Status:** `SUPERSEDED_SNAPSHOT` · `ACCEPTANCE_PREP_FROZEN` · `NO_EXECUTION`  
**Recorded:** `2026-07-20`  
**总闸：** [TT-REALITY-CLOSURE-GATE-LATEST](./TT-REALITY-CLOSURE-GATE-LATEST.md)  
**规划：** [TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)  
**库存 / DB：** [Feature Inventory](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md) · [DB Audit](./TT-DATABASE-PRODUCTION-READINESS-AUDIT-LATEST.md)  
**评分挂载：** [TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md)（真实完成抬分 · 非新 Gate · 市场另轨）  
**三误判：** Formal Baseline≠架构完成 · **禁**只说「W5」· Reality-W3≠C-09（见 Uplift **§5**）

```text
每 Wave 四件套（写死）
  输入 → 验收标准 → 证据根 → 完成后如何重新认证
车辆：独立 PCR · Version Gate ·（Reality-W0）Deploy Identity · Runtime Certification
禁止：等窗执行 · 裸 fly deploy · 污染 CAND-V2 Archive · 文档假 PASS
评分：仅证据齐后按 Uplift Plan 重评 · 禁止文档刷分
命名：PSG-W5 Owner Time-Separated Review ≠ Reality-W5 UI/UX Closure
```

---

## Reality-W0 · Runtime Alignment（必须先 · 架构抬分起点）

| 项 | 内容 |
|----|------|
| **输入** | tip `652bbab5…` · Staging `/meta` · Candidate Money Path Identity · Pre-Final Snapshot |
| **目标** | 消「认证 A / 运行 B」· Staging SHA = tip · 合约投影对齐 |
| **验收** | `/meta`.git_sha = tip · escrow_factory_v2 / SettlementRouter / FeeRouter 对拍 · Indexer checkpoint 可解释 · Version Gate PASS |
| **证据** | 新根 `evidence/PSG-REALITY-CLOSURE/W0-*/`（示例）· Deploy Identity · Runtime Certification JSON |
| **再认证** | 本 Wave Runtime Certification 证书引用新 SHA；**禁止**用 FG-15-B / CAND-V2 Archive 旧包证新 Runtime |
| **PCR** | `PCR-STAGING-ALIGN-CAND-V2` · `PCR-WEB3-RUNTIME-IDENTITY` |
| **抬分** | **SU-ARCH** · 架构 →≥9.0 · **仅 Reality-W0**（Formal Baseline ≠ 架构完成） |

---

## Wave 1 · Auth Production Harden

| 项 | 内容 |
|----|------|
| **输入** | [Feature Inventory §1.1–1.5](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md) · Feature Readiness · Mapping Auth |
| **目标流** | Register → Pending → OTP 生成 → **邮件发送** → 验证 → Activate → **Audit** → Session |
| **横切面** | API · DB · Migration · UI · E2E · Evidence |
| **验收** | 七问梯子 Prod Ready=YES（注册/邮箱/找回）· Session PARTIAL→硬化 · 真邮件探针 · Inventory 行更新 |
| **证据** | `W1-AUTH-*/` · Staging 邮件投递日志脱敏 · E2E 脚本 exit 0 |
| **再认证** | Auth Identity 抽样流 `sample_flows.register|login|reset`；入 Delta（W7） |
| **PCR** | `PCR-AUTH-*` · `PCR-SEC-SESSION-REVOKE`（可跨 W3） |
| **抬分** | **SU-FEAT** Auth |

---

## Wave 2 · CMS Governance

| 项 | 内容 |
|----|------|
| **输入** | CMS Governance Audit · Inventory CMS 行 |
| **目标流** | Draft → Review → Approve → Publish → Rollback → Audit |
| **验收** | 展示源可证 Catalog/COS · **禁止** Unsplash 静默假绿 · QA LATEST 键无污染 · LOCK 纪律 · RBAC Editor/Approver 策略明确 |
| **证据** | `W2-CMS-*/` · Live 抽样 URL · bake 硬闸日志 |
| **再认证** | 首页/市场 POI 抽样 = catalog · 非 fallback |
| **PCR** | `PCR-CMS-GOV-*` · `PCR-CMS-RBAC` |
| **抬分** | **SU-FEAT** CMS 工程 + **SU-OPS** RACI 启动 |
| **≠ Content QA** | 本 Wave **不**清零多国内容六维 · 生产级内容 = 并行 [Content QA In-Process 轨 B](./TT-CMS-CONTENT-QA-IN-PROCESS-LATEST.md)（SU-PLUS-07） |

---

## Reality-W3 · Security / User / Admin（预案 · ≠ C-09）

> **误判 3：** 本 Wave = Threat Model + PenTest Plan + Audit SoW + Bug Bounty Prep（+ 功能侧）· **≠** 融资现实证明。现实证明 = **C-09**。

| 项 | 内容 |
|----|------|
| **输入** | Gap PRG-U* / PRG-S* / PRG-A* · **[Enterprise Maturity · Security Governance](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)** |
| **验收** | 改密 revoke-all · 多设备撤销 · Admin step-up · GDPR 路径 · **Threat Model v1** · PenTest Plan · Bug Bounty Prep · 第三方审计 SoW（实审可分期）· 仲裁/区域权限 Runbook · **仲裁抽样案 1 条干跑留证（SU-PLUS-06）** |
| **证据** | `W3-SEC-USER-ADM-*/` · `W3-SEC-GOV-*/` · `W3-DISPUTE-DRYRUN-*/` |
| **再认证** | Security + Admin 抽样 · `security_governance_prep_pass`（W7） |
| **PCR** | `PCR-SEC-*` · `PCR-USER-GDPR-*` · `PCR-ADM-*` · `PCR-SEC-GOV-*` · `PCR-BIZ-DISPUTE-*` |
| **抬分** | **SU-FEAT** Sec/仲裁 + **SU-FUND 预案** + **SU-PLUS-06** · **≠ C-09 融资现实证明**（真审计/渗透/整改/可披露证据） |

---

## Wave 4 · DB + Ops

| 项 | 内容 |
|----|------|
| **输入** | [DB Audit P0/P1 LOCK](./TT-DATABASE-PRODUCTION-READINESS-AUDIT-LATEST.md) · Inventory Payment/Provider · PRG-D*/O*/N* · **[Enterprise Maturity · SRE Lifecycle](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)** |
| **验收** | 高风险表十维无 OPEN_BLOCKING · Outbox/dual-write 武装 · **Monitor→Alert→Incident→Recovery→Postmortem→Improve** 五件套 Runbook · Backup/restore 可证或 Owner 接受 · **Restore 演练 1 次留证（SU-PLUS-05 · 非仅有文档）** · **Production Evidence Retention（备注）**：Incident / Restore 演练 / 发布回滚记录可检索 ≥6 个月（路径写入 Evidence 根索引 · **非新 Gate**） |
| **证据** | `W4-DATA-OPS-*/` · `W4-OPS-SRE-*/` · `W4-RESTORE-DRILL-*/` · `/meta` dual_write/outbox · retention 索引指针 |
| **再认证** | Ops 四布尔 + `sre_lifecycle_pass`（W7） |
| **PCR** | `PCR-DATA-*` · `PCR-OPS-*` · `PCR-OPS-MONITOR\|ALERT\|INCIDENT\|RECOVERY\|POSTMORTEM` · `PCR-OPS-EVIDENCE-RETENTION` · `PCR-ONB-*` |
| **抬分** | **SU-FEAT** DB + **SU-OPS** SRE/Retention + **SU-PLUS-05** |

---

## Reality-W5 · UI/UX Closure

> **全称强制：** **Reality-W5 UI/UX Closure** · **禁止**只说「W5 完成」· **≠** **PSG-W5 Owner Time-Separated Review**

| 项 | 内容 |
|----|------|
| **输入** | UI checklist · PRG-E* · 五主冻结边界 |
| **验收** | Loading/Empty/Error/Permission/Mobile/i18n · 无 mock 残留假按钮 · Pay/Escrow 失败态可读 · **禁止**五主结构回流 |
| **证据** | `W5-UI-*/` · 截图/E2E |
| **再认证** | UX 维 · sample_flows payment/escrow |
| **PCR** | `PCR-UI-PROD-CLOSURE` · `PCR-PAY-FAILURE-UX` · `PCR-ESC-*` |
| **抬分** | **SU-FEAT** UI/Pay（Scope 内 · 不宣称 WC/KYC/法币） · **不**抬 PSG Sign-off |

---

## Wave 6 · Documentation Hygiene

| 项 | 内容 |
|----|------|
| **输入** | [Hygiene Classification Plan](./TT-DOCUMENT-HYGIENE-CLASSIFICATION-PLAN-LATEST.md) · PRC-06/07 · **[Enterprise Maturity · Business Ops](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)** · [KYC Alignment](./TT-KYC-PRODUCT-SCOPE-ALIGNMENT-LATEST.md) |
| **验收** | ACTIVE 指针 → Candidate · ARCHIVE 横幅 · **CMS RACI** · 内容生命周期文书 · 对账 RACI · **不删 Archive** · **KYC 脏口径 Hygiene** · **Data Room 证据索引（SU-PLUS-08）** · **SBOM/依赖清单可早做（SU-PLUS-04）** · **Production Evidence Retention（备注）**：发布记录 · 安全测试报告 · 运营审批记录归入 ACTIVE/ARCHIVE 分类并可指回（**半年后仍能证明为何通过** · **非新 Gate**） |
| **证据** | `W6-HY-*/` · `W6-BIZ-GOV-*/` · `W6-DATA-ROOM-INDEX-*/` ·（可选）`W6-SBOM-*/` · retention 分类表行 |
| **再认证** | Document 维 · `business_ops_governance_pass`（W7） |
| **PCR** | `PCR-HY-*` · `PCR-HY-EVIDENCE-RETENTION` · `PCR-BIZ-CMS-RACI` · `PCR-BIZ-CONTENT-LIFECYCLE` · `PCR-HY-DATA-ROOM-INDEX` · `PCR-HY-SBOM`（可选） |
| **抬分** | **SU-OPS** Hygiene/BizOps + **SU-PLUS-04/08** → 运营 ≥7.0 · 融资整理 |

---

## Wave 7 · Delta Recertify

```text
位置（写死）
  发现问题 → 分类 → Wave 修复 → Version Gate → Runtime 验证
    → Delta Recertify（本 Wave）
    → Reality Closure PASS → Readiness → GO

禁止理解成：「重新认证一下就好了」
```

| 项 | 内容 |
|----|------|
| **输入** | **仅当** W0–W6 证据齐 · Feature Inventory 已按修复更新 · 十维清单可勾 |
| **前提** | tip = Staging Runtime · Auth/CMS/DB 等已按类修过 · 非「未修先 Delta」 |
| **验收** | 十维同钉 · `sample_flows_pass` · Ops 四布尔 · SHA 全链相等 · **`security_governance_prep_pass` · `sre_lifecycle_pass` · `business_ops_governance_pass`**（[Enterprise Maturity](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md) · **不新开 Gate**） |
| **证据** | `W7-DELTA-RECERTIFY-*/` + 武装 Reality + Inventory Gate JSON（`docs_only:false`） · W3/W4/W6 成熟度证据根可指 |
| **再认证** | `check-production-feature-inventory-gate.sh` + `check-reality-closure-gate.sh` → PASS；三布尔 false ⇒ 可声明「企业成熟度未闭」· **≠** 用规划冒充 GO |
| **禁止** | 改写 CAND-V2 Archive · 把 Delta 当治疗 · 把 dry-run 当 GO · **跳过 W0 地基** · **无证据刷评分** |
| **抬分** | [Uplift Plan](./TT-PROJECT-SCORE-UPLIFT-PLAN-LATEST.md) 全维复测 · 须附 W0–W6 证据根 |

---

## 总序（提醒）

```text
WAIT_ETA Maintain
  → Project A → Formal Baseline（≠ 架构完成）
  → Reality-W0（架构抬分起点）
  → W1 Auth → W2 CMS → Reality-W3（预案 ≠ C-09）→ W4（+ SRE）
  → Reality-W5 UI/UX Closure（≠ PSG-W5）
  → W6（+ BizOps）→ W7 Delta
  → Reality Closure PASS → Readiness
  → PSG-W5 Owner Time-Separated Review → Sign-off → Staging-grade GO
  → Post-GO C-09（融资现实证明）
```

**机读：** [`TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.json`](./TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.json)
