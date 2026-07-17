# TT · PSG Production Release Baseline（LATEST）

**Status:** `ACTIVE`  
**Stamp:** `20260717T110854Z`  
**Git Tag:** `v1.1.0-psg-go.20260717` → `0bbc7adbd3142b111463fc398288ab94be5c0b84`  
**Freeze:** `RC-FREEZE-20260717T094900Z`  
**TT_PSG_PRODUCTION_CERT:** `PASS`  
**TT_PRODUCTION_GO:** `GO`  
**Owner:** Sebastian Ward · signed `2026-07-17T11:03:31Z`

## 含义

本基线是 **后续 Hotfix / Patch / 下一版本开发的唯一起点**。

| 层 | 真源 |
|----|------|
| 代码 | Annotated tag `v1.1.0-psg-go.20260717` = freeze SHA（**不含**脏工作区） |
| 治理 | [OWNER-DECISION-PACKAGE-LATEST.json](../../evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json) + Matrix `TT_PRODUCTION_GO: GO` |
| 机读指针 | [registry/psg-production-release-baseline-LATEST.v1.yaml](../../registry/psg-production-release-baseline-LATEST.v1.yaml) |
| 不可变清单 | [RELEASE-BASELINE-LATEST.json](../../evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json) |

## 演进纪律

1. **Hotfix / Patch** — 从 `v1.1.0-psg-go.20260717`（或 SHA `0bbc7adbd314…`）拉出；记为 **Baseline Patch**；禁止平行「已 GO」叙事。  
2. **下一版本 / Feature** — 新分支自该 Tag；须 **新** `freeze_manifest_id`（新 RC Freeze）；**禁止** 静默改写本 Tag。  
3. **禁止** 用脏工作区或未认证 SHA 冒充本基线；禁止用文档改写冒充新 GO；禁止为「造基线」重跑已 PASS Gate。  
4. **Solo 默认** — [Solo Workflow](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)：Owner Self Review + Owner Sign-off + Release Archive；**不要求** PR / Approver。

## 创建 Tag（若尚未存在）

```bash
git tag -a v1.1.0-psg-go.20260717 0bbc7adbd3142b111463fc398288ab94be5c0b84 -m "PSG Production Release Baseline · RC-FREEZE-20260717T094900Z · TT_PSG_PRODUCTION_CERT=PASS · TT_PRODUCTION_GO=GO"
git rev-list -n1 v1.1.0-psg-go.20260717   # must equal 0bbc7adbd3142b111463fc398288ab94be5c0b84
# Owner: git push origin v1.1.0-psg-go.20260717   # 不自动 push
```

## 互指

- Freeze: [psg-release-candidate-freeze-LATEST.v1.yaml](../../registry/psg-release-candidate-freeze-LATEST.v1.yaml)  
- Sequence: [psg-release-candidate-sequence.v1.yaml](../../registry/psg-release-candidate-sequence.v1.yaml)  
- Production Cert: [PSG-PRODUCTION-CERT-LATEST.json](../../evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json)  
- Owner Decision: [OWNER-DECISION-PACKAGE-LATEST.json](../../evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json)

**诚实边界：** Tag = 已认证代码提交；本基线 ≠ 再次 Production Cert ≠ 允许跳过下一版 Freeze。
