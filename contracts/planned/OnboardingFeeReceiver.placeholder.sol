// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title OnboardingFeeReceiver — documentation placeholder (NOT in Foundry `src/`)
/// @notice This file lives under `contracts/planned/` and is **not** compiled by default (`foundry.toml` uses `src = "src"`).
///         **Canonical MVP implementation + ABI:** **`contracts/src/OnboardingFeeReceiver.sol`**（**`forge build`/`forge test`**）+
///         **`contracts/abi/OnboardingFeeReceiver.json`**（**`sync-abi-from-forge.sh`**）— keep this file for **IOnboardingFeeReceiver**
///         narrative cross-checks vs **96-18 §5.2 path B / §6**, **14 §1.1.0c**, **96-07**, **go-live §1**, **110** (DB projection still Target).
/// @dev Design anchors (finalize in implementation PR):
///       - **Funds isolation**: onboarding fees MUST NOT share Escrow per-order custody; link to **`onboarding_entitlements`**
///         via **`idempotency_key` / `chain_tx_hash`** (04-附录-DDL §10.7 narrative).
///       - **Controls**: `pause` semantics, per-token caps, **owner/Timelock** per **83 / 89 / 96-07**.
///       - **Events**: indexed fields for indexer replay + reorg tail-delete parity with **110** (Target until wired).

/// @dev **Narrative-only** surface for ABI design reviews. **Do not** treat as shipped bytecode or **`contracts/abi`** truth.
interface IOnboardingFeeReceiver {
    /// @notice Emitted after a successful M1 onboarding fee collection on-chain.
    /// @param idempotencyKey MUST align with HTTP **`Idempotency-Key`** / DB **`onboarding_entitlements.idempotency_key`**.
    /// @param payer Address that paid (EOA or contract wallet).
    /// @param roleTarget Encoded target role (**`provider` / `region_steward`** mapping is product-owned; use small enum in impl).
    /// @param token ERC-20 under **`pay`**; address(0) reserved for native-coin path if ever added.
    /// @param amount Token smallest units (no float).
    /// @param feeScheduleVersion Human or hash tag mirrored from **`onboarding_entitlements.fee_schedule_version`**.
    event OnboardingFeePaid(
        bytes32 indexed idempotencyKey,
        address indexed payer,
        uint8 indexed roleTarget,
        address token,
        uint256 amount,
        bytes32 feeScheduleVersion
    );

    /// @notice Pay onboarding fee on-chain; off-chain API must persist **`paid`** only after indexer / receipt reconciliation.
    /// @dev Reentrancy, pull vs push, and fee-on-transfer tokens are **implementation** concerns — cover in **`forge test`**.
    function pay(
        address token,
        uint256 amount,
        bytes32 idempotencyKey,
        uint8 roleTarget,
        bytes32 feeScheduleVersion
    ) external payable;

    /// @notice Emergency stop for treasury risk; semantics per **96-07** / Timelock wiring.
    function pause() external;

    /// @notice Read-only guard for DApp / router integrations.
    function paused() external view returns (bool);
}

/// @title Placeholder contract name for search / audits (no runtime deployment from `planned/`).
contract OnboardingFeeReceiverPlaceholder {
    // Intentionally empty: no bytecode shipped from this path; narrative-only stub for repo navigation + audits.
}
