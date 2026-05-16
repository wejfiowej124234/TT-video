# evidence — 投资级验收证据（②③ · 不进 LP zip）

| **文档控制（IR）** | |
|------|------|
| **Owner** | Eng + IR |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | [internal/50 §5.4](../../internal/50-企业级投资杠杆审计.md) · [internal/13](../../internal/13-投资人数据室索引.md) 索引登记 |

---

## 文件索引

| 文件 | Pack | 用途 |
|------|------|------|
| [RUNBOOK-III-PACK-A.v1.md](RUNBOOK-III-PACK-A.v1.md) | **A** | **②** staging：订单→托管 MRC、真值表 A–H、见证纪要 |
| [PACK-B-STATUS.v1.md](PACK-B-STATUS.v1.md) | **B** | Legal 签核、cap table、财务摘要落盘状态 + **执行清单**（**仅**事实发生后填） |
| [templates/TEMPLATE-staging-probe-report.md](templates/TEMPLATE-staging-probe-report.md) | — | **②** 只读探针报告模板（`TT_PROBE_OUT`；**勿**提交含密钥副本） |
| [LP-HUMAN-BLOCKERS-STATUS.v1.md](LP-HUMAN-BLOCKERS-STATUS.v1.md) | — | **LP 外发 已完成/未完成 填表真源**（§1 机读 · §2 人工 · §3 ②） |

**机读前置（① 旁证，非 III）**：

```bash
bash scripts/gates/runbook-iii-pack-a-preflight.sh
# 旁证日志（已发生，无 staging ID）：logs/pack-a-preflight-2026-05-16.txt
# Runbook 摘要：RUNBOOK-III-PACK-A.v1.md §0.1
```

**LP 外发（①）** 见 [PACK-RELEASE-CHECKLIST-001](../../PACK-RELEASE-CHECKLIST-001.md) · **勿**把本目录默认打进 `TravelTrust-Investor-Materials-*.zip`。

**离库模板（②）**：[IR-STAGING-CREDENTIALS-TEMPLATE-001](../../internal/IR-STAGING-CREDENTIALS-TEMPLATE-001.md) · **① 录屏**：[IR-DEMO-RECORDING-CHECKLIST-001](../../internal/IR-DEMO-RECORDING-CHECKLIST-001.md)。

---

## 落盘纪律

- **可提交**：脱敏 Runbook 状态、探针 Markdown 报告（无 URL/密钥）、[`logs/`](logs/README.md) 下 `pack-a-preflight-*.txt` 与脱敏 access 片段（见 Runbook **log_snippet_path**）。  
- **勿提交**：staging 密码、Bearer token、未脱敏 PII、仅内网 URL（用 DR/NDA 交付）。  
- **Reality Synchronization**：真值表**留空**优于猜测；见各文件文首。

---

## 父目录

[data-room/README.md](../README.md) · 模板 [templates/README.md](../templates/README.md)
