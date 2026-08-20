> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

# TT · PSG FG-Web3 Audit Matrix

**Machine:** `TT_PSG_FG_WEB3_AUDIT_MATRIX`  
**Status:** **STAGED_WAIT_G_RC_CLOSED** · `2026-07-19T09:33:40Z`  
**机读：** [`registry/psg-fg-web3-audit-matrix.v1.yaml`](../../registry/psg-fg-web3-audit-matrix.v1.yaml)  
**Cases：** [Coverage Cases](./TT-PSG-FG-WEB3-COVERAGE-CASES-LATEST.md) · **Schema：** [Evidence Schema](./TT-PSG-FG-WEB3-EVIDENCE-SCHEMA-LATEST.md)

```text
WAIT_WINDOW · 审计矩阵已 staged · 0/15 PASS · 禁止广播 / ACTIVE
```

| ID | Surface | Full Cap Domain | Status |
|----|---------|-----------------|--------|
| FG-01 | Money-Path | E | NOT_READY |
| FG-02 | Escrow_State_Machine | D | NOT_READY |
| FG-03 | SettlementRouter | E | NOT_READY |
| FG-04 | FeeRouter | E | NOT_READY |
| FG-05 | Distributable | E | NOT_READY |
| FG-06 | Steward_Revenue | F | NOT_READY |
| FG-07 | Treasury | C/E/I | NOT_READY |
| FG-08 | TTG_Governance | C/G | NOT_READY |
| FG-09 | Timelock_Execute | G | NOT_READY |
| FG-10 | Wallet_Security | B/K | NOT_READY |
| FG-11 | RBAC | K | NOT_READY |
| FG-12 | Indexer | K/L | NOT_READY |
| FG-13 | Chain_DB_API_UI_Consistency | E/I | NOT_READY |
| FG-14 | Audit_Evidence | L | NOT_READY |
| FG-15 | Observation_48H | K | NOT_READY |

**Rollup：** 0/15 · NEED_FIX · ≠ PSG 完成
