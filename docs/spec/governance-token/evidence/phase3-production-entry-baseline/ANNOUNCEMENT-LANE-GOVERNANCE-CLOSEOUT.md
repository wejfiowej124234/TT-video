# ANNOUNCEMENT-LANE-GOVERNANCE-CLOSEOUT

**Item:** Announcement lane governance review (pre P3-05 · production entry surface)  
**Phase:** ① local — **not** ② staging GO · **not** ③ mainnet / Production GO  
**Verdict:** `ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN`  
**Registry:** `registry/traveltrust-announcement-lane-governance.v1.yaml`  
**TS mirror:** `frontend/lib/traveltrustAnnouncementLaneGovernance.ts`  
**Gate:** `bash scripts/gates/check-announcement-lane-governance-gate.sh`  
**Effective UTC:** 2026-07-09

## Architecture verdict

Four-layer announcement split is **accepted** for production entry:

| User goal | Lane | Audience (immutable) | Consumer |
|-----------|------|----------------------|----------|
| Use the product | `product` | `public_user` | `TRAVELTRUST_PRODUCT_ANNOUNCEMENTS` |
| Participate in governance | `governance` | `token_holder` | `TRAVELTRUST_GOVERNANCE_ANNOUNCEMENTS` |
| Protocol / runtime status | `protocol_status` | `technical_public` | `TRAVELTRUST_PROTOCOL_STATUS_ANNOUNCEMENTS` |
| TTG public rounds | `ttg_round` | `participant` | `TRAVELTRUST_TTG_PUBLIC_ROUNDS` |
| Future planning | `roadmap` | `public_user` | `TRAVELTRUST_ROADMAP_2026` |

Home Pulse reads **product lane only** — no protocol_status / indexer / hardening in marketing ticker.

## Governance review — three optimizations (closed)

### ① Immutable lane + audience

- Registry + TS frozen map; `immutable: true` on all lanes.
- Future CMS / Admin must bind edit permissions to `audience`, not merge lanes.

### ② TTG round status machine

States: `upcoming` · `active` · `paused` · `closed` · `cancelled` · `governance_approval_required`

- Round 1: `upcoming` → (ops) `active` → `closed`
- Rounds 2–3: `governance_approval_required` until governance vote enables `active`
- Transitions documented in registry `ttg_round_transitions` + TS `TRAVELTRUST_TTG_ROUND_TRANSITIONS`

### ③ Protocol status technical reader disclaimer

Fixed copy inside collapsed protocol section (`traveltrust_announcements_protocol_section_disclaimer`):

- EN: protocol runtime status only; not mainnet live or issuance complete
- ZH: 此区域展示协议运行状态，不代表主网已启用或资产发行完成

## Confirmed correct (no change)

1. **7/15 wording** — “计划上线目标” / “Planned launch target · subject to Production GO” — not “正式上线”.
2. **TTG Round ≠ Web3 Phase** — separate `ttg_round` lane; avoids Phase 2 = Round 2 confusion.
3. **No further announcement feature expansion** before P3-05.

## Honest boundary

① lane governance frozen + public copy aligned **≠** ② testnet matrix GO **≠** ③ Production GO / mainnet broadcast.

## Verification

```bash
bash scripts/gates/check-announcement-lane-governance-gate.sh
bash scripts/gates/check-home-public-disclosure-alignment-gate.sh
bash scripts/gates/check-public-surface-audit-gate.sh
# expect: all PASS
```

## Next

- **P3-05 Security Review** — recommended next step after Owner acknowledges this closeout.
- Do not expand announcement CMS / matrix until security review completes.
