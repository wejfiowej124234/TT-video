# TT · Wait Window · R-BUSINESS-STATE-AUTHZ-1（LOCAL PREP）（LATEST）

**STATUS:** `CLOSED` · matrix follow-on wave（review/reviewee + FE finals）  
**Stamp:** `2026-08-11T09:12:00Z`  
**Strategy:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Machine:** [`TT-WAIT-WINDOW-R-BUSINESS-STATE-AUTHZ-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-BUSINESS-STATE-AUTHZ-1-LOCAL-PREP-LATEST.json)

**`TT_PRODUCTION_GO`:** `NO_GO` · **CLOSED ≠ Seal ≠ GO** · **`blocks_track1_finalize`: false**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Official Cuts

| Wave | Image |
|------|-------|
| Primary | `deployment-01KZQZF6VYQP8N4KGRJ5EF2F7F` |
| Follow-on A | `deployment-01KZR0D7PA1ESGD42QWMGT959J` |
| Follow-on B | `deployment-01KZR1GTJAZCJ7P2V92SWBA6FP`（reviewee_id + review/resolve negatives） |

Regression each Cut: `check-official-public-gates-regression.sh`  
Track1 pin: `readyAt=1786491935` · `done=false` · USDC=`10000000` · `isEscrow=false`

---

## 1 · Role × State × Action（API = 产品真相）

| Action | Traveler | Guide | Provider | Arbitrator | Admin | States |
|--------|----------|-------|----------|------------|-------|--------|
| accept | ✗ | assigned guide | ✗ | ✗ | ✗ | Created |
| cancel | party | party | ✗ | ✗ | ✗ | Created\|Accepted |
| set-escrow-address | party* | party* | ✗ | ✗ | ✗ | Created\|Accepted |
| confirm-completion | party bilateral | party bilateral | ✗ | ✗ | ✗ | Escrowed |
| open dispute | party | party | ✗ | ✗ | ✗ | Escrowed |
| resolve dispute | ✗ | ✗ | ✗ | ✓ | ✗ | → Refunded/Partial/Slashed/Completed |
| review POST | party | party | ✗ | ✗ | ✗ | final financial |
| trip refund write | via dispute | via dispute | ✗ | resolve | ✗ Stripe onboarding only | — |

\* set-escrow 另受参与方/实现门禁；状态闸已收。

---

## 2 · Fixes shipped

| Gap | Fix |
|-----|-----|
| Unilateral confirm-completion | → bilateral service completion |
| set-escrow no state gate | created\|accepted only |
| Community delete HTTP | 401/400/404/503/500 |
| FE confirm/dispute on accepted | escrowed\|funded only |
| dispute_resolve half-write | validate before mutate |
| review `reviewee_id` = guide **row** | → guide **user_id**（users FK） |
| FE review UI completed-only | finals = completed\|refunded\|partially_refunded\|slashed |
| `partiallyrefunded` typo gate | accept `partially_refunded` |

---

## 3 · AFTER_SEAL / Backlog

Admin→Public · Indexer · R-MEDIA · Owner delete RV · 金额/费率深表（状态机闸已稳，商业规则一致性下一刀）

ETA `2026-08-11T23:45:35Z` → STOP → Track1 fresh Preflight
