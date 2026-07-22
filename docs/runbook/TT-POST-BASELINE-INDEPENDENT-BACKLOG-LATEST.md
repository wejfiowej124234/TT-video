# Post-Baseline Independent Backlog（Discovery Freeze 归档）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_POST_BASELINE_INDEPENDENT_BACKLOG`  
**Status:** `SUPERSEDED_SNAPSHOT` · `QUEUED_UNTIL_FORMAL_BASELINE`  
**Recorded:** `2026-07-20`  
**Source freeze:** [TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.md)  
**Planning SSOT（目标升级 · 两阶段 · 十维同钉）：** [TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)  
**执行准备（R* 绑定 · 非新框架）：** [TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST](./TT-POST-BASELINE-REALITY-CLOSURE-EXECUTION-PREP-LATEST.md) · [Residual Risk](./TT-POST-ETA-ORDER-PSG-RESIDUAL-RISK-LATEST.md)  
**Wave 验收：** [TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST](./TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.md) · [Feature Inventory](./TT-PRODUCTION-FEATURE-INVENTORY-LATEST.md) · [DB Audit](./TT-DATABASE-PRODUCTION-READINESS-AUDIT-LATEST.md) · [Hygiene Plan](./TT-DOCUMENT-HYGIENE-CLASSIFICATION-PLAN-LATEST.md) · [**Enterprise Maturity**](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)（Sec/SRE/BizOps · PLAN_FROZEN · 入 W3/W4/W6）

```text
开工闸：Candidate Formal Baseline 完成之后
车辆：独立 PCR（非 Candidate pin · 非 FG-15-B 证据根 · 非裸 fly deploy）
Project A 梯子：不受本 Backlog 插队
目标：PSG PASS 后不再「认证 A、运行 B」· 十维同钉
```

---

## 0 · 工作流（写死）

```text
第一阶段 · Project A（ETA 后先做完）
  Settlement finalize → Bridge A → Manifest → Baseline Gate
  → FG Capture → L5 Final → S7 → Formal Baseline

第二阶段 · Reality Closure（≠ 马上 Production GO）
  W0 Runtime Alignment
  → W1 Auth Harden
  → W2 CMS Governance
  → W3 Sec/User/Admin（+ Security Governance）
  → W4 DB + Ops（+ SRE Lifecycle）
  → W5 UI/UX Production
  → W6 Hygiene（+ BizOps 文书）
  → W7 Delta Recertify（+ 三成熟度布尔）
```

**十维同钉验收：** [Reality Closure Planning §3](./TT-POST-PSG-REALITY-CLOSURE-PLANNING-LATEST.md)  
**Pri / Mapping：** [Production Reality §0.0](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) · [Implementation Mapping](./TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.md)

明细映射：  
- [WAIT_ETA Production Readiness Backlog](./TT-WAIT-ETA-PRODUCTION-READINESS-BACKLOG-LATEST.md)  
- [Consistency PRC-01…08](./TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md)  
- [**Gap Audit PRG-* + PCR 队列**](./TT-WAIT-ETA-PRODUCTION-READINESS-GAP-AUDIT-DRY-RUN-LATEST.md)（User/Sec/Admin/Ops/Data/Onb/Esc）  
- [**PSG SSOT Consistency · Master Checklist**](./TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md)（八类：PSG_VALID…NEEDS_OWNER）  
- [**Production Reality Consistency · 终卷**](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md)（六维等式 · 六大生产面 · Post-Formal-Baseline PCR Wave 0–7）  
- [**Implementation Reality Mapping**](./TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.md)（七态：ALIGNED / NOT_REGISTERED / NOT_PRODUCTION_READY / … · **Ops 抬升**）

**Final Closure 后遗漏声明：** 仅完成 Candidate Formal Baseline **不等于** Staging/Auth/CMS/Data/Ops Reality 已对齐；必须以 Reality 终卷 + Mapping 七态为独立修复队列。  
**不透明原则：** 有表/有测/有文档 ≠ 生产闭环；Wave 1/4 优先消解 NOT_REGISTERED 与 NOT_PRODUCTION_READY（接线或删孤儿），禁止只改文档冒充齐。

| PRC / PRG | Class | → Stream |
|-----------|-------|----------|
| PRC-01/02/08 | OLD_RUNTIME · CODE_NOT_DEPLOYED | STAGING-RUNTIME-ALIGNMENT |
| PRC-03 · PRG-S01 | TRUE_FEATURE_GAP | AUTH-PROD-HARDENING |
| PRC-04/05 · PRG-A01 | TRUE_FEATURE_GAP · DATA_DRIFT | CMS-GOV-CLEANUP |
| PRG-U01…07 · PRG-S02…07 · PRG-A02…04 | TRUE_FEATURE_GAP / UNKNOWN | USER-GDPR · SEC · ADMIN |
| PRG-D* · PRG-O* · PRG-N* | TRUE_FEATURE_GAP · CODE_NOT_DEPLOYED | DATA · OPS · ONB |
| PRG-E* · PRG-U03/04 | TRUE_FEATURE_GAP | ESC-PAY · ACQ-② |
| PRC-06/07 | DOC_DRIFT · SCRIPT_DRIFT | Hygiene `PCR-HY-*` |

---

## 1 · AUTH-PROD-HARDENING

**Class:** Production Feature Hardening · **≠** Runtime Drift  

| 输入证据 | Drift / Feature Audits · Auth Delta dry-run |
|----------|-----------------------------------------------|
| 核心结论 | 功能存在 · 生产生命周期不完整 |
| 焦点 | OTP 真投递 · Email ownership · Reset lifecycle · Audit · Rate limit · Session revoke |
| PCR 族 | `PCR-AUTH-*` · `PCR-SEC-SESSION-REVOKE` |
| 验收 | Staging 真邮件探针 + 统一枚举响应 + 无 stub 假 ok |

---

## 2 · CMS-GOV-CLEANUP

**Class:** Governance Drift  

| 输入证据 | CMS Production Governance Audit |
|----------|----------------------------------|
| 焦点 | Unsplash 静默回退 · bake 硬闸 · QA LATEST（含 SG 污染）· Family 板 · 外链图禁令 |
| PCR 族 | `PCR-CMS-GOV-*` |
| 验收 | 展示源可证明 Catalog/COS · 证据键一致 · LOCK 纪律保持 |

---

## 3 · STAGING-RUNTIME-ALIGNMENT

**Class:** OLD_RUNTIME + Web3 Runtime Mismatch · **P0**  

| Candidate tip | `652bbab5…` |
| Staging `/meta` | `f8181b63…`（差 4 commits） |
| Web3 症状 | `escrow_factory_v2=null` · SR 缺失 · FeeRouter 不一致 · Indexer cp=0 |

**强制梯子（禁止裸 deploy）：**

```text
PCR
 → Version Gate
 → Deploy Identity
 → Staging Alignment（镜像 = tip + Candidate 合约 env）
 → Runtime Certification（/meta 对拍 Release Identity）
 → （必要时）Indexer / Money Path 烟测
```

**纪律：** 不能用旧 Evidence 证明新 Runtime。

| PCR 建议 | `PCR-STAGING-ALIGN-CAND-V2` · `PCR-WEB3-RUNTIME-IDENTITY` |
|----------|----------------------------------------------------------|

---

## 4 · Delta Recertify（复审）

| 时机 | Alignment + Hardening 证据齐后 |
|------|--------------------------------|
| 范围 | Auth Identity · Staging Runtime ·（可选）CMS 展示源 |
| 禁止 | 当成 Project B 全仓开启 · 翻 PSG Complete · 污染 CAND-V2 Archive |

---

## 5 · Hygiene（可并行文档批）

| 项 | FG-15-A 活命令清理 · `09c72b93`「当前 HEAD」措辞 · Registry `active_*=clean` 命名债 |
|----|----------------------------------------------------------------------------------|
| PCR | `PCR-HY-*` · 不删 Archive |

---

## 5b · Enterprise Maturity（Sec / SRE / BizOps · 规划已冻）

**SSOT:** [TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md)  
**纪律：** 不新开 Gate · Formal Baseline 后按 Wave 执行 · **≠** 等窗实施渗透/赏金/监控采购

| 支柱 | Wave | PCR 族（队列） |
|------|:----:|----------------|
| Security Governance | W3 | `PCR-SEC-GOV-THREAT-MODEL` · `PCR-SEC-GOV-THIRD-PARTY-AUDIT` · `PCR-SEC-GOV-PENTEST-PLAN` · `PCR-SEC-GOV-BUG-BOUNTY-PREP` |
| SRE Lifecycle | W4 | `PCR-OPS-MONITOR` · `…POSTMORTEM` · **`PCR-OPS-EVIDENCE-RETENTION`** |
| Business Ops | W2/W3/W6 | `PCR-BIZ-*` · **`PCR-HY-EVIDENCE-RETENTION`**（发布/安全报告/审批） |
| W7 增补布尔 | W7 | `security_governance_prep_pass` · `sre_lifecycle_pass` · `business_ops_governance_pass` |

**备注（非新 Gate）：** Production Evidence Retention =「现在通过」+「半年后仍能证明为何通过」→ 仅 **W4 Ops + W6 Hygiene**。

---

## 6 · 明确不在本 Backlog

| 项 | 原因 |
|----|------|
| Project A Settlement→S7 | 主梯子 · 优先 |
| Production GO / Hard Gate / 真 ETH Wave | 另闸 |
| 等窗 redeploy / 修码 | Discovery Freeze 禁止 |

---

## 7 · 诚实边界

```text
Backlog 登记 ≠ 已修复
Formal Baseline ≠ Staging 已对齐
Staging 对齐 ≠ PSG Complete ≠ Production GO
```
