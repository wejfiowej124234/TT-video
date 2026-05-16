# Distribution log — bilingual (IR / DD)

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / Legal |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | confidential |
| **Last Updated** | 2026-05-16 |
| **SSOT** | [internal/19-对外分发与访问登记.md](../internal/19-对外分发与访问登记.md) · [13-投资人数据室索引.md](../internal/13-投资人数据室索引.md) |

Use this page when recipients are **international** or when the record must be **English-first** for counsel / auditors. The authoritative Chinese checklist remains [19](../internal/19-对外分发与访问登记.md); **duplicate or cross-link rows** as needed (same event, two languages).

## Before each send (phase 1)

1. `bash scripts/gates/ir-preview-send-preflight.sh`（or `ir-outbound-status` + `release-investor-lp-pack`)  
2. Confirm zip matches registry `release` (`IR_PREVIEW_SEND_REBUILD=1` to rebuild)  
3. [IR-PRE-SEND-MANUAL-001](../IR-PRE-SEND-MANUAL-001.md) (preview copy: **§7**)  
4. Attach **only** `dist/TravelTrust-Investor-Materials-v{release}.zip` unless counsel approved a single PDF  
5. Add a row below (real values); cross-link [19](../internal/19-对外分发与访问登记.md) for CN-first records  

**Current bundle (example release 1.3)**: full zip has **no** `demo/*.mp4` until final ~90s capture is shipped — state **no demo** in Notes if applicable.

## Log template (copy row)

| Date | Recipient (firm / name) | Materials (path / bundle / Version) | Channel (email / drive / dataroom) | Sender | NDA in place | Notes |
|------|-------------------------|---------------------------------------|------------------------------------|--------|---------------|-------|
| YYYY-MM-DD |  |  |  |  | Y / N | preview / final · with/without demo mp4 |

## Example rows (fictional — do not treat as sent)

| Date | Recipient | Materials | Channel | Sender | NDA | Notes |
|------|-----------|-----------|---------|--------|-----|-------|
| 2026-05-16 | Example Fund I LP · Zhang (sample) | `TravelTrust-Investor-Materials-v1.3.zip`; no `demo/*.mp4` | Encrypted email | IR A | Y | **preview**; read order Pitch→Memo→FAQ per `00-START-HERE.txt` |
| 2026-05-16 | Example Capital · Li (sample) | `04-PitchDeck-v1.3-EN.pdf` only | WeChat file | IR A | N | **preview**; single-deck forward per handoff template |

## Rules (same as 19)

1. Do not mark **signed / final** until Legal sign-off is recorded in [33 §3.0](../internal/33-投资人Data-Room导出包与IR法务终审清单.md) and [31](../internal/31-法务签核清单.md).
2. Time-bound Data Room links: note **expiry** in Notes.
3. Cap table / raw financials: note **NDA-only** in Materials or Notes.
4. **preview** sends must say so in Notes and email (see IR-PRE-SEND **§7**).
