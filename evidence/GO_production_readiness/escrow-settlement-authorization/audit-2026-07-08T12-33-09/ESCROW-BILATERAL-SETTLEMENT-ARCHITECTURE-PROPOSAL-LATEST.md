# Escrow Bilateral Settlement — Architecture Fix Proposal (Audit-Only)

**Status:** PRE-IMPLEMENTATION · Owner decision required  
**No contract changes in this audit run**

## 1. Gap summary

| Layer | Current | Target |
|-------|---------|--------|
| **Business** | Single-party `confirm-completion` → DB `Completed` | Both parties confirm **service done** → `ServiceCompleted` |
| **Release gate (FE)** | `Completed` + **rating** bilateral | `ServiceCompleted` (rating optional/separate) |
| **Contract** | `release()` anyone @ `Funded` | `release()` @ `Funded` + **completion attestation** OR off-chain executor with EIP-712 |
| **Keeper** | Could release before any confirm | Keeper = **automation only** after bilateral complete |

## 2. Recommended architecture (3 layers)

### Layer A — Business confirmation (off-chain SSOT)

- New sub_status: `service_completion_pending` → `service_completion_confirmed`
- Fields: `service_tourist_confirmed_at`, `service_guide_confirmed_at`
- `POST confirm-service-completion` (per party, idempotent)
- Transition to `OrderState::Completed` **only when both confirmed** OR timeout rule (01 §5 eleven)
- **Rating bilateral** remains separate (`confirm-rating`) — does not gate settlement

### Layer B — Settlement authorization (chain)

**Option B1 (preferred for immutable Escrow instances):** `SettlementAuthorizationRegistry` (upgradeable proxy)

- Stores `keccak256(orderId, escrow)` → `releaseAllowed`
- Set by multisig/executor after both service confirms verified
- Escrow V2 `release()` checks registry OR embeds flags at init (new factory only)

**Option B2 (minimal change):** Trusted executor + EIP-712 attestation

- No contract change for existing instances
- Keeper bot only submits `release()` when API returns `release_eligible: true`
- **Mainnet risk:** permissionless `release()` still exploitable if address known — **not sufficient alone**

**Option B3 (new Escrow implementation):** `EscrowV2` with `confirmServiceComplete()` ×2

- `release()` requires `serviceComplete` flag
- **New EscrowFactory** routes new orders only

### Layer C — Permissionless keeper (automation)

- Keeper watches `ServiceCompleted` + on-chain attestation
- Calls `release()` — **not** authorized to confirm service
- Document in Design Intent: permissionless release is **intentional** post-authorization

## 3. Upgrade path

| Phase | Action | Affects existing Escrow |
|-------|--------|-------------------------|
| 1 | API + DB bilateral service confirm | No |
| 2 | FE UX mirror BilateralConfirmBlock | No |
| 3 | Design Intent + Protocol Intent D16 PASS | No |
| 4 | Registry/SettlementAuthorization deploy | New orders |
| 5 | EscrowFactory pointer → V2 factory | New orders only |
| 6 | Mainnet: freeze V1 factory after cutover | Old instances immutable |

**Proxy upgrade:** Existing `Escrow` instances are **immutable** — cannot upgrade in place. Migration = **new factory + new orders**; in-flight orders complete on V1 rules or manual governance.

## 4. Migration risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| V1 escrow open `release()` exploited | **CRITICAL** | Do not mainnet until Layer B attestation OR V2 |
| DB `Completed` semantic overload | HIGH | Rename/migrate: `Completed` = financial terminal only after chain release |
| Indexer projection drift | HIGH | G2 replay after state machine change |
| E2E tests assume guide-only confirm | MEDIUM | Update F010 corridor tests |
| Rating gate removed — premature release UX | MEDIUM | Explicit “funds pending release” state |

## 5. Mainnet deployment decision (Owner)

**BLOCK mainnet Web3 payment rail** until one of:

1. **EscrowV2 + Factory V2** deployed with bilateral on-chain or registry gate, OR  
2. **Written Design Intent PASS** (D16) that permissionless V1 release is accepted **with** operational executor-only policy **and** escrow addresses not public — **not recommended for protocol-grade**, OR  
3. **Hybrid:** service bilateral off-chain + SettlementAuthorizationRegistry on-chain before any mainnet order

## 6. Refund / Dispute / Cancel / Timeout

| Scenario | Target handling |
|----------|-----------------|
| **Cancel pre-deposit** | `Cancelled` — no funds |
| **Refund (traveler)** | `refund()` traveler-only @ Funded — unchanged |
| **Dispute** | `openDispute` → `Disputed` → arbitrator `executeResolution` — fix ASM arbitrator |
| **Reject confirm** | Stay `Escrowed` + `service_completion_pending`; other party may dispute |
| **Timeout (01 §5)** | Auto `ServiceCompleted` if guide confirmed + K days silence — **not implemented** |
| **Locked funds** | Stay in Escrow until release/refund/resolution |

## 7. Evidence to produce after implementation

- [ ] Bilateral service confirm E2E (tourist + guide)
- [ ] Keeper release only after attestation (negative test: early release fails or blocked)
- [ ] G3-02 PAY-W07 updated for new state machine
- [ ] D16 Protocol Intent PASS for Escrow.release permissionless **post** authorization

