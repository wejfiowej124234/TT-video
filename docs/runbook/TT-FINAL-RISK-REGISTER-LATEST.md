# TT · Final Risk Register（分类版）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Status:** `SUPERSEDED_SNAPSHOT` · `CLASSIFIED_DRAFT_DURING_FG15`  
**机读:** [`FINAL-RISK-REGISTER-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/FINAL-RISK-REGISTER-LATEST.json)

## Closed

| ID | 项 | 关闭依据 |
|----|-----|----------|
| C-ARB-01 | Arbitrator Gate | L3 Hardened `onlyArbitrator` |
| C-EOA-01 | Owner EOA 作 guardian/owner | Timelock `0x4624…504C` |
| C-SR-01 | SettlementRouter 权限未绑 Timelock | Hardened Timelock-owned |
| C-REL-01 | 无双边确认即可 release | Release Guard |

## Accepted

| ID | 项 | 说明 |
|----|-----|------|
| A-SCALE-01 | 初期运营规模限制（Solo） | Owner 书面接受口径 |
| A-PAGER-01 | Pager OWNER_DEFERRED | 探针足够 · 非 L4 硬阻 |

## Deferred

| ID | 项 |
|----|-----|
| D-WC-01 | Mobile Wallet / WalletConnect / QR（DEFERRED_EXPLICIT） |
| D-CHAIN-01 | 后续链扩展 |
| D-L2-SEPOLIA-LIVE | Sepolia Timelock live lifecycle（阻主网 GO，非阻本窗 PSG 方程的唯一三项） |

## Blocking（现在应只有这三项）

| ID | 项 | 态 |
|----|-----|-----|
| **B-FG15** | FG-15 ELAPSED PASS | RUNNING · 未满窗 |
| **B-OWNER-SIGNOFF** | Owner 最终签名 | DRAFT · 未签 |
| **B-GO-DECISION** | GO / NO-GO | NOT_STARTED · 另闸 |
