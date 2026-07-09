# Web3 Permission Matrix

**Recorded:** 2026-07-08T12:34:10.471Z

## On-chain + off-chain tree

- **Protocol Owner / Safe** (`PERM-ROOT-OWNER`) — deploy-time + Timelock proposer
  - **Timelock (via ERC1967 admin slot)** (`PERM-PROXY-ADMIN`) — upgradeTo / upgradeToAndCall
    - *Denies:* EOA direct upgrade
  - **Timelock Executor** (`PERM-TIMELOCK-EXEC`) — execute queued ops
    - **TravelTrustGovernor** (`PERM-GOVERNOR`) — propose · vote · queue · execute via timelock
    - **Treasury spender (Timelock)** (`PERM-TREASURY-SPEND`) — spendP4Reserve · spend ETH
    - **FeeRouter.owner** (`PERM-FEEROUTER-OWNER`) — distribute · setRoutingConfig · pause
    - **CountryPoolNetProfitLedger.owner** (`PERM-LEDGER-OWNER`) — accrue · fund · close · split
  - **On-chain registry (TARGET)** (`PERM-REGISTRY`) — address book updates via governance
  - **EscrowFactory** (`PERM-ESCROW-FACTORY`) — createEscrow instances
    - *Denies:* upgrade existing Escrow
  - **Admin Console RBAC** (`PERM-API-RBAC`) — off-chain reads/approvals only
    - *Denies:* direct_timelock · spend · upgrade

## API RBAC

Separate tree: `registry/admin-rbac-permissions.v1.yaml` — **must not** grant Timelock execute or treasury spend.
