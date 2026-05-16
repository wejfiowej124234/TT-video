# Staging vs production read-only probe report (template)

| **文档控制（IR）** | |
|------|------|
| **Owner** | Eng + IR |
| **Version** | 1.0.0-ir |
| **Status** | template |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | [RUNBOOK-III-PACK-A.v1.md](../RUNBOOK-III-PACK-A.v1.md) **§1.1** · `scripts/ops/read_only_staging_prod_probe.py` |

> **Copy** to `data-room/evidence/staging-probe-YYYYMMDD.md` **locally** or set `TT_PROBE_OUT=…` when running the probe.  
> **Do not commit** URLs, bearer tokens, or raw hostnames if policy requires off-repo storage.

## Run metadata

| Field | Value |
|-------|-------|
| Date (UTC) | |
| Operator | |
| Command | `TT_STAGING_API_BASE=… TT_PRODUCTION_API_BASE=… python scripts/ops/read_only_staging_prod_probe.py` |
| Exit code | |

## Summary (paste probe output below)

```

(paste Markdown summary here — redact secrets)

```

## Relation to Pack A

| Pack A 已增强 | `否` |
| Truth table filled | `否` |
| Notes | Probe **does not** replace UI steps A–H or `order_id` / `request_id` |
