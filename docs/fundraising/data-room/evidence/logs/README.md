# evidence/logs — Pack A 旁证与脱敏日志片段

| **文档控制（IR）** | |
|------|------|
| **Owner** | Eng + IR |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | [RUNBOOK-III-PACK-A.v1.md](../RUNBOOK-III-PACK-A.v1.md) · [evidence/README.md](../README.md) |

## 可提交

| 文件模式 | 内容 |
|----------|------|
| `pack-a-preflight-YYYY-MM-DD.txt` | `runbook-iii-pack-a-preflight.sh` 追加旁证（**无** staging URL/密钥/order_id） |
| `pack-a-<UTC日期>.txt` | Runbook **H** 步脱敏 access log 片段（**无** token/密码/PII） |

## 勿提交

- Staging 根 URL、测试账号密码、Bearer token  
- 未脱敏 PII、完整内网 URL（用 DR/NDA 交付）

## 相关

- [RUNBOOK-III-PACK-A.v1.md](../RUNBOOK-III-PACK-A.v1.md) · [evidence/README.md](../README.md)
