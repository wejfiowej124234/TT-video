# WAIT_ETA · Production Readiness Backlog（Auth / CMS / Security）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Status:** `SUPERSEDED_SNAPSHOT` · `BACKLOG_FROZEN_UNTIL_FORMAL_BASELINE` · **Discovery = FROZEN**  
**Recorded:** `2026-07-20`  
**Mode:** 排队 + 优先级 · **零开工改码**

**Discovery Freeze SSOT：** [TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.md)  
**Post-Baseline 独立周期：** [TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST](./TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST.md)

**Audits（只读 · 已冻结 · 不再扩扫）：**  
- [Hygiene](./TT-WAIT-ETA-RELEASE-HYGIENE-AUDIT-LATEST.md)  
- [Feature / Auth](./TT-WAIT-ETA-PRODUCTION-FEATURE-READINESS-AUDIT-LATEST.md)  
- [CMS Governance](./TT-WAIT-ETA-CMS-PRODUCTION-GOVERNANCE-AUDIT-LATEST.md)  
- [Delta Recertify Auth DRY-RUN](./TT-PSG-DELTA-RECERTIFY-AUTH-IDENTITY-DRY-RUN-LATEST.md)  
- [Runtime Drift DRY-RUN](./TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.md)

```text
GATE（写死）
  现在（WAIT_ETA）     → Maintain + ETA Gate only · Discovery FROZEN
  Formal Baseline 后   → AUTH-PROD-HARDENING → CMS-GOV-CLEANUP → STAGING-RUNTIME-ALIGNMENT → Delta Recertify
  禁止                 → redeploy · 修码 · 改 pin · Project B · L5/S7 提前跑
```

**关键诚实句：** 认证目标（Candidate `652bbab5`）≠ Staging Runtime（`f8181b63`）· **≠** 错误版本已 PASS（因无层 PASS）。

**诚实：** Backlog ≠ 已修复 · Formal Baseline ≠ Staging 已对齐 · 对齐 ≠ PSG Complete ≠ Production GO。

---

## 0 · 泳道总览

| 泳道 | 审计结论 | 最早开工 |
|------|----------|----------|
| **A · AUTH-PROD-HARDENING** | 非 Runtime Drift · 生产生命周期不完整 | Formal Baseline + **PCR-AUTH-*** |
| **B · Security（相邻）** | Reset stub · 枚举 · 会话 · 审计缺口 | Formal Baseline + **PCR-SEC-*** |
| **C · CMS-GOV-CLEANUP** | ② 运营强 · Governance **未 Ready** | Formal Baseline + **PCR-CMS-*** |
| **R · STAGING-RUNTIME-ALIGNMENT** | OLD_RUNTIME + Web3 Mismatch | Formal Baseline + **PCR-STAGING-ALIGN-***（禁裸 deploy） |
| **H · Hygiene** | 文档/脚本指针漂移 | Formal Baseline 后文档-only PCR |
| **W · Web3 ETA** | Settlement→L5→S7 | **Project A 主梯子** |

---

## 1 · Auth（P0 · 生产邮箱所有权）

**Delta Recertify（2026-07-20 dry-run）：** Prior Feature Audit **CONFIRMED** · 无实质代码收敛 · Gap 映射 `GAP-AIL-01…09` · **≠** 启动 Project B。

| ID | 项 | Pri | 生产缺口 | PCR 建议名 |
|----|-----|:---:|----------|------------|
| PR-AUTH-01 | Owner 产品决：OTP+Resend **或** PG 链接验证；禁「无投递即 verified」 | P0 | 注册即 `email_verified_at` | `PCR-AUTH-VERIFY-MODEL` |
| PR-AUTH-02 | 生产外发 fail-closed（Resend/SES） | P0 | OTP 路径仅 `log` | `PCR-AUTH-MAIL-TRANSPORT` |
| PR-AUTH-03 | 持久 OTP/token（抗多副本/重启） | P0 | 内存 HashMap | `PCR-AUTH-TOKEN-DURABILITY` |
| PR-AUTH-04 | 接线或删除孤儿层（`auth_email_tokens` / Resend / 过期 IT/docs） | P0 | 双层假信心 | `PCR-AUTH-LAYER-CONVERGE` |
| PR-AUTH-05 | Forgot / Reset 去 stub 或关闭 UI | P0 | `chain_off_stub` | `PCR-AUTH-PASSWORD-RESET` |
| PR-AUTH-06 | 枚举防护（send-code / forgot 统一响应） | P0 | 409 可枚举 | `PCR-AUTH-ANTI-ENUM` |
| PR-AUTH-07 | rate-limit + auth audit events | P1 | 死代码未调 | `PCR-AUTH-LIMITS-AUDIT` |
| PR-AUTH-08 | Email change | P1 | 缺失 | `PCR-AUTH-EMAIL-CHANGE` |
| PR-AUTH-09 | SPF/DKIM/DMARC 运维清单（域名侧） | P1 | UNKNOWN | `PCR-AUTH-DNS-MAIL` |

**验收口诀：** 有验证码页 ≠ Production Ready；须 **投递成功 + 所有权证明 + 限流/审计**。

---

## 2 · Security（P0/P1 · 与 Auth 相邻 · 分 PCR）

| ID | 项 | Pri | 说明 | PCR 建议名 |
|----|-----|:---:|------|------------|
| PR-SEC-01 | 改密 → revoke-all sessions | P0 | `put_me_password` 未强制 | `PCR-SEC-SESSION-REVOKE` |
| PR-SEC-02 | 多设备「撤销其他全部」产品闭环 | P1 | 现有 list/revoke 部分 | `PCR-SEC-MULTI-DEVICE` |
| PR-SEC-03 | Admin 高危操作二次确认矩阵 | P1 | 审计有 · 确认不足 | `PCR-SEC-ADMIN-STEPUP` |
| PR-SEC-04 | Admin 审计覆盖率抽验（含 CMS 写） | P1 | best-effort 面 | `PCR-SEC-ADMIN-AUDIT-COV` |
| PR-SEC-05 | 2FA / Passkey **ADR 规划**（先设计后实现） | P1 | 无生产证据 | `PCR-SEC-2FA-ADR` |
| PR-SEC-06 | OAuth / 第三方登录风险专册（若启用） | P1 | 本轮未深审 | `PCR-SEC-OAUTH-REVIEW` |
| PR-SEC-07 | RBAC 全 denom（PSG L3 residual） | P1 | 已 ACCEPTED_RESIDUAL | 跟 PSG Recalculate 分轨 |

---

## 3 · CMS（Governance · 非改 Candidate）

| ID | 项 | Pri | 为何挡生产治理 | PCR 建议名 |
|----|-----|:---:|----------------|------------|
| CMS-GOV-01 | 消除 / 显式化 Unsplash 静默回退 | P0 | 假绿 · 复现旧图 | `PCR-CMS-NO-SILENT-FALLBACK` |
| CMS-GOV-02 | 发布硬闸：Catalog bake + 十国 chaos | P0 | Persistence≠Render SSOT | `PCR-CMS-BAKE-GATE` |
| CMS-GOV-03 | 修复 QA LATEST vs CLOSURE（**SG=FR 污染**；TH/CN 等 OPEN 键） | P0 | 审计轨迹不可信 | `PCR-CMS-QA-EVIDENCE-REPAIR` |
| CMS-GOV-04 | 刷新 Family / Visual Gap 板对齐 330 LOCKED | P0 | 双真源 | `PCR-CMS-BOARD-REFRESH` |
| CMS-GOV-05 | 生产零外链图宿主 | P0 | Ownership 硬规则 | `PCR-CMS-NO-EXTERNAL-IMG` |
| CMS-GOV-06 | Publish→revision→rollback 演练 + Admin UX | P1 | 治理≠仅 schema | `PCR-CMS-ROLLBACK-DRILL` |
| CMS-GOV-07 | Catalog/COS/CMS 展示漂移清单（持续） | P1 | Anti-chaos | `PCR-CMS-DRIFT-CHECKLIST` |
| CMS-GOV-08 | Hotel + Transport 家族 · 同 LOCK 纪律 | P1 | 波次未完 | `PCR-CMS-FAMILY-WAVE` |
| CMS-GOV-09 | CMS Editor vs Approver（或 SuperAdmin+审计书面） | P1 | PSG-05 PARTIAL | `PCR-CMS-RBAC` |
| CMS-GOV-10 | Media Platform / Owned CDN 或书面延期 Sign-off | P1 | Priority D NOT_STARTED | `PCR-CMS-MEDIA-PLATFORM` |

**CMS 本窗：** 可继续既有 Daily Ambient/POI 运营（Owner 授权 · 不碰 Candidate）；**治理修复**一律等 Baseline 后 PCR。

---

## 4 · Hygiene（文档/脚本 · 可选并行）

| ID | 项 | Pri | PCR |
|----|-----|:---:|-----|
| HY-DOC-01 | FG-15-A LATEST → ARCHIVED + Candidate maintain 指针 | P2 | `PCR-HY-DOC-FG15A` |
| HY-DOC-02 | 旧 Tokenomics 20%/六桶 → V3.1.1 | P2 | `PCR-HY-DOC-TOKENOMICS` |
| HY-SCR-01 | `run-fg15-*` 头注释 DEPRECATED_DEFAULT | P2 | `PCR-HY-SCR-BANNER` |
| HY-REG-01 | `active_baseline_key=clean` 改名债 | P2 | `PCR-HY-REG-ALIAS`（**改 Registry 须独立 PCR**） |

**禁止：** 删除 Archive / Historical Evidence / Closed Incident。

---

## 5 · 钱 / Web3（分轨 · 勿混入 Auth-CMS PCR）

| ID | 项 | 轨 |
|----|-----|-----|
| PR-WEB3-ETA | Settlement finalize → L5 Final → S7 → Formal Baseline | **ETA 梯子 · 优先** |
| PR-PAY-01…03 | Stripe webhook / 幂等抽验 / Admin refund | ②/③ Fiat · 另 PCR |

---

## 6 · 建议执行序（人读）

```text
WAIT_ETA now
  ├─ Maintain FG-15-B
  └─ 本 Backlog 冻结排队（本文）

ETA reached
  └─ PR-WEB3-ETA 梯子 → Formal Baseline

AFTER Formal Baseline（独立 PCR，可并行主题）
  1. PCR-AUTH-*（P0 邮件所有权）     ← 强烈优先
  2. PCR-CMS-GOV-01…05（P0 治理真源）
  3. PCR-SEC-01…04
  4. PCR-CMS-GOV-06…10 + HY 文档批
  5. PR-PAY / 主网另闸
```

---

## 7 · 机读索引指针

| 文件 | 角色 |
|------|------|
| `TT-WAIT-ETA-HYGIENE-FEATURE-AUDIT-INDEX-LATEST.json` | 前序索引（可后续追加 cms 键 · 本轮以 md 为准） |
| 本文 | Auth / CMS / Security 统一排队 SSOT |

**变更纪律：** 增删 Backlog 行 = 文档轮；**实现**必须新 PCR，且 PCR 描述写明 `after_formal_baseline: true`。
