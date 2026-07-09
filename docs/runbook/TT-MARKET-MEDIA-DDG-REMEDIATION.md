# Market Media DDG Remediation · 数据治理收尾

**机读：** [`registry/market-media-ddg-remediation.v1.yaml`](../../registry/market-media-ddg-remediation.v1.yaml)  
**轨道：** Data Governance → **Independent Track**  
**不挂：** G3 · OCS · PCP

## 定位

OCS Post-Apply DDG 收尾闸（`OCS_DDG_REMEDIATION_MODE=1`）将 **market listing legacy Unsplash cover** 记为 **ADVISORY**（约 41 条）。  
本轨**单独**完成迁移 + **strict 全站 DDG**，与 OCS 职责分离。

## 目标

| 步骤 | 说明 |
|------|------|
| 1 · 迁移 | Listing Cover 从历史 URL → manifest 已定义的 OCS/CDN 路径 |
| 2 · Strict DDG | `OCS_DDG_REMEDIATION_MODE=0` |
| 3 · 验收 | `staging-full-site-display-governance-audit` **PASS** · blocking=0 |
| 4 · 证据 | `evidence/GO_market_media_ddg_remediation/<UTC>/` |

```text
OCS_DDG_REMEDIATION_MODE=0
        ↓
staging-full-site-display-governance-audit
        ↓
PASS（全站一致）
```

## Manifest 路径（SSOT）

| 类型 | 路径模板 |
|------|----------|
| Provider cover | `/api/v1/uploads/market/ocs/{chain_id}/provider-cover.jpg` |
| Acquisition cover | `/api/v1/uploads/market/ocs/{chain_id}/acquisition-cover.jpg` |

真源：[`data/official-cold-start/dataset.v1.json`](../../data/official-cold-start/dataset.v1.json)

## 执行

```bash
bash scripts/dev/run-market-media-ddg-remediation.sh
```

**当前：** `TT_MARKET_MEDIA_DDG: PLANNED`（迁移实现待补 · strict 闸已就绪）

## 与 Release Train 关系

```text
Official Content Baseline READY
        ├── G3-01 Production Network（PLANNED → IMPLEMENTING → VERIFIED）
        └── Market Media DDG Remediation（PLANNED · 数据治理 · 可并行）
```

G3-01 专注生产网络（Domain · DNS · TLS · CDN · WAF · CORS）— **不回到内容体系**。

## 诚实边界

- ② Staging strict DDG PASS **≠** ③ Production GO  
- 本轨 **不**替代 OCS 10 项验收或 G3 Production-only VERIFIED 纪律
