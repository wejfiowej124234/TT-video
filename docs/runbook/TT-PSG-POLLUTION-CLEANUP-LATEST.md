# TT · PSG Pollution Cleanup（FINAL RELEASE · Archive/Deprecated）

**STATUS:** `CLEANUP_APPLIED` · tip `97289a71…` · pin `PSG-REL-20260720-WEB3-CAND-V2`  
**Parent:** [FINAL RELEASE BASELINE](./TT-FINAL-RELEASE-BASELINE-LATEST.md) · [Engineering SSOT Anchor](./TT-ENGINEERING-SSOT-ANCHOR-LATEST.md)  
**PCR:** `PCR-20260722-POLLUTION-CLEANUP-FREEZE`  
**≠** 认证执行 · **≠** GO

## 原则

1. PSG + FINAL RELEASE + Engineering Anchor = **唯一**活体依据  
2. 历史证据 **保留** · 全部降为 Archive / Deprecated / SUPERSEDED_SNAPSHOT  
3. 旧入口脚本默认 **exit 2**（`TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1` 才可法医）  
4. 禁止平行 ACTIVE pin / tip / FG15-A living / STAGING-ALIGN 默认值

## 已清理类

| 类 | 处置 |
|----|------|
| API/Web/Dockerfile/gates 默认 STAGING-ALIGN | 重钉 Candidate |
| tip `652bbab5` 活体 gate/registry | 重钉 `97289a71` |
| FG-15-B registry RUNNING | → ELAPSED |
| `run-fg15-*` | DEPRECATED refuse |
| `mint-staging-align-w0` | refuse |
| `run-final-completion-closure` 软调 48h-start | 切断 |
| 42+ LATEST 活体 ACTIVE/RUNNING/旧 tip | Archive banner |
| dry-run 旧 tip | SUPERSEDED_SNAPSHOT |
| Reality W0–W7 当释放主链 | Cockpit/Planning 降级 |
| Contract `activeDeployBaselineId` | Candidate |

## 保留（不可删）

- `evidence/GO_fg15_observation_48h/`（FG-15-A）  
- `evidence/GO_phase2_gov_freeze_*`  
- PCR yaml 历史  
- Tag `v1.1.0-psg-go.20260717` Archive  

## FREEZE

本清理合入后 `freeze_status=FROZEN` · **本会话不启动** Delta/Inventory/Reality/GO。
