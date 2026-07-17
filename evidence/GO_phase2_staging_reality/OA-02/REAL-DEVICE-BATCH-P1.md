# P1 Real Device Batch · Wallet · Order · Provider · Guide

**Status:** `LOCKED_BY_OA01`  
**Batch:** [TT-PHASE2-STAGING-REALITY-CLOSURE-LATEST](../../docs/runbook/TT-PHASE2-STAGING-REALITY-CLOSURE-LATEST.md)  
**Unlock when:** `WC_PROJECT_ID: KEY_PRESENT` + Staging Web rebuild verified  

**Atomic:** 四卡同批 · 仅 `PASS` | `BLOCKED` · **无 PARTIAL** · `TT_REAL_DEVICE_BATCH_P1`

## Exit Criteria（解锁后）

| Card | 真人动作 | PASS 证据 |
|------|----------|-----------|
| Wallet | WC QR / Deep Link 连上 Staging | 截图 + 时间戳 |
| Order | 下一单可走通（Staging） | 订单 id + 截图 |
| Provider | 商家侧关键路径可走通 | 截图 |
| Guide | 导游侧关键路径可走通 | 截图 |

全部 PASS → 写 `evidence/GO_phase2_staging_reality/OA-02/REAL-DEVICE-BATCH-P1-LATEST.json` · `TT_REAL_DEVICE_BATCH_P1: PASS`

**禁止：** OA-01 未 KEY_PRESENT 时宣称本批 PASS。
