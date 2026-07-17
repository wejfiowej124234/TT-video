# TravelTrust · Production Governance Closure（PGC）

**STATUS:** `ACTIVE`  
**Machine key:** `TT_PRODUCTION_GOVERNANCE_CLOSURE`  
**Constitution:** [../governance/TT-ARCHITECTURE-CONSTITUTION-v1.md](../governance/TT-ARCHITECTURE-CONSTITUTION-v1.md)  
**L0:** [../governance/TT-L0-ARCHITECTURE-GOVERNANCE.md](../governance/TT-L0-ARCHITECTURE-GOVERNANCE.md)  
**PSG:** [TT-PUBLIC-SURFACE-GOVERNANCE.md](./TT-PUBLIC-SURFACE-GOVERNANCE.md)  
**Solo workflow:** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md) · [`registry/psg-solo-developer-workflow.v1.yaml`](../../registry/psg-solo-developer-workflow.v1.yaml)  
**Matrix:** [registry/production-governance-closure.v1.yaml](../../registry/production-governance-closure.v1.yaml)  
**Traceability:** [TT-PGC-TRACEABILITY-MATRIX.md](./TT-PGC-TRACEABILITY-MATRIX.md)  
**Stamp:** `20260716T035000Z` · Solo gloss `20260717`

---

## 0 · 一句话

**PGC = 企业级治理收口，不新增业务功能。**  
消除平行发布入口；只保留一条路径：

```text
L0 Architecture Constitution
        ↓
       PSG   （唯一发布准入 · TT_PSG_PRODUCTION_CERT）
        ↓
  RC Sequence（展开）
  Foundation → Alignment → Baseline Freeze → Capability Cert
        ↓
        PF
        ↓
Production Entry Review
        ↓
   Production GO
```

**RC 证据纪律（多月主轨）：** [TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md](./TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md) · [`registry/psg-release-candidate-sequence.v1.yaml`](../../registry/psg-release-candidate-sequence.v1.yaml) — **先 Freeze 再 Cert**；Module Ladder ∥ PSG Cert 汇合后才 Entry。

**Solo Developer（默认）：** **Owner Self Review + Owner Sign-off + Release Archive** 替代团队 PR / Code Review / Approver / 双人审批。**不**放宽 Gate · Evidence · Freeze · Certification · Baseline · Archive。

---

## 1 · 硬规则（写死）

| 动作 | 硬依赖 |
|------|--------|
| Production Deploy（API/Web） | `TT_PSG_PRODUCTION_CERT=PASS` |
| Production Bootstrap（OCS 等） | `TT_PSG_PRODUCTION_CERT=PASS` |
| Production GO / Release Pipeline GO 步 | `TT_PSG_PRODUCTION_CERT=PASS` |
| 旁路 / 旧主链单独宣称 GO | **FORBIDDEN** |

绕过方式（手改脚本删闸、设 `TT_PGC_BYPASS=1` 无 Owner 书面）= **违宪**。

Owner 紧急旁路（仅 Blocking Incident）：

```bash
TT_PGC_BYPASS=1 TT_PGC_BYPASS_REASON='INCIDENT:…' TT_PGC_BYPASS_OWNER=… \
  bash scripts/dev/…   # 仍须事后补 PSG Cert · 记入证据
```

---

## 2 · 旧主链处置

| 旧入口 | 处置 |
|--------|------|
| `TT-LOCAL-FIRST-CONVERGENCE` | **SUPERSEDED** 作为「唯一发布主链」→ 降级为 **①→② 工程收敛**；③ 必须经 PSG |
| `release-pipeline.v1.yaml` / `TT-RELEASE-PIPELINE` | **ACTIVE 但硬依赖 PSG**（首闸） |
| `go-live-checklist` / `PRODUCTION-GO-DECISION-PACKAGE` / TT-9626 | **LEGACY_GO_NARRATIVE** · GO 前必须 PSG PASS · 团队 PR/双人条款已 **诚实降级为 Owner Self Review / Owner Sign-off**（见 Solo Workflow） |
| FPC B40 deploy / OCS prod bootstrap | **硬闸** |
| `restore-staging-ephemeral-media` | **LEGACY_INCIDENT_ONLY** |
| AGENTS / CONTRIBUTING 旧「Local-First 唯一」句 | **已改指向 Constitution→PSG** |

---

## 3 · 收口范围（多维审计 · 执行中）

架构 · 数据 · CMS · COS · API/DTO · Deploy · CI/CD · Runtime · Registry · 文档 · 环境 · 权限 · 证据 · 脚本 · 发布流程 · 回滚 · 监控 · 安全  

详见 [Traceability Matrix](./TT-PGC-TRACEABILITY-MATRIX.md)。

---

## 4 · 命令

```bash
# 硬闸自检（读证据 · 不部署）
bash scripts/gates/check-psg-production-cert-required.sh
```

---

## 5 · Solo 合入与人签（写死）

| 旧团队词 | PGC / PSG 现行 |
|----------|----------------|
| Pull Request / Merge Request | Owner commit（+ 可选 push）· 正式发布绑 Tag / Archive |
| Code Review / Reviewer | **Owner Self Review** |
| Approver / 双人复核 / 双签 | **Owner Sign-off** |
| 合线主持人 | **非** Production GO 硬闸（TT-9628 双人拆线 = 可选 LEGACY） |

**不放宽：** Gate · Evidence · Freeze · Certification · Release Baseline · Release Archive。

---

## 6 · 诚实边界

PGC ACTIVE ≠ `TT_PSG_PRODUCTION_CERT=PASS` ≠ PF 解冻 ≠ Production GO。  
基线 `v1.1.0-psg-go.20260717` 已 `TT_PRODUCTION_GO=GO` 时，**下一正式 GO** 须新 Release 周期 — 见 [Dev Strategy](./TT-PSG-PRODUCTION-BASELINE-DEV-STRATEGY-LATEST.md)。

**PSG 执行入口：** `scripts/gates/run-psg-runtime-certification.sh` · `scripts/gates/run-psg-production-cert.sh` · 证据 `evidence/GO_psg_foundation/production_cert/`（**PASS 仍须 Owner 跑 cert**；**≠** 第二 Approver）。
