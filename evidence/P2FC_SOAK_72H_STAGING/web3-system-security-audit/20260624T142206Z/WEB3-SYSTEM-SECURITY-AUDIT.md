# Web3 System Security Audit (4 domains + convergence)

- **verdict:** WARN · SPOF=8 · **P0 RBAC bypass isolated:** CONFIRMED · **ADM-U01 live prep:** READY

## P0 RBAC bypass isolation

- status=CONFIRMED · before COMPLETED.json=True
- static_pass=True · live meta reachable=False

## Attack surface convergence (D1+D2+D3)

- **BP-P0-RBAC-01** [P0] N-CONSOLE-DIRECT: staging deploy path must not set TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT
- **BP-D1-01** [P1] N-PROXY-ADMIN: production baseline = TimelockUpgradeableProxy only
- **BP-D2-01** [P1] N-TIMLOCK: GOVERNANCE_TIMELOCK_DELAY_SECONDS frozen at 48h

## Domains

### 智能合约可升级性与漏洞分析 — **WARN**
- [info] D1-F01: Proxy upgrade gated by admin slot (expected = Timelock)
- [medium] D1-F02: Deploy scripts may expose bare implementation paths — formal baseline must use Proxy
- [info] D1-F03: Proxy architecture tests present
- [high] D1-F04: delegatecall/upgradeToAndCall surfaces — timelock delay is primary mitigation

### 治理币治理逻辑与攻击面分析 — **WARN**
- [info] D2-F01: Timelock delay frozen: 48 hours
- [info] D2-F02: Per-address voting cap in TtgGovFreezeConstants (400 bps)
- [medium] D2-F03: Review Governor privileged modifiers — manual follow-up

### 管理员系统 RBAC 权限链路验证 — **FAIL**
- [info] D3-F01: Rust/YAML/TS permission IDs aligned
- [high] D3-F02: Direct console-role write bypass path exists when env enabled
- [high] D3-F04: Phase ② staging RBAC matrix GO not started — ADM-U01 deferred

### UI/API/链上三层权限一致性校验 — **WARN**
- [medium] D4-F01: Admin RBAC (CeFi ops) ≠ on-chain governance roles — intentional split
- [info] D4-F02: Governance UI routes exist — chain wallet is authority for vote/stake
- [medium] D4-F03: 16 UI permission checks — must mirror API deny matrix

## MR12 isolation
- lock=FROZEN · bypass_via_one_shot=False

## Minimal permission paths
- D1: timelock schedule → 48h → upgradeTo
- D2: TTG vote → queue → timelock execute
- D3: approval + 2FA (PUT direct blocked when env off)
