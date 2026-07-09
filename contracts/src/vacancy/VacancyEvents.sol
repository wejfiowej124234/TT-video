// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title VacancyEvents
 * @notice Versioned Vacancy Ledger events (EV-01 · accounting-spec §6.6.7).
 * @dev `version` defaults to 1 for Vacancy Ledger V1; Indexer may branch on version for V2+.
 */
abstract contract VacancyEvents {
    uint16 internal constant VACANCY_EVENT_VERSION = 1;

    /// @dev Ledger-side lifecycle — signature frozen; emit deferred to S3a.
    event VacancyEntered(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 epochId,
        uint256 principal,
        uint256 reserve,
        uint256 swept,
        uint256 disbursed
    );

    /// @dev Ledger-side lifecycle — signature frozen; emit deferred to S3a.
    event GraceStarted(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 epochId,
        uint32 graceDays
    );

    /// @dev Vault emit in S1 — each quarter sweep (U-07).
    event SweepExecuted(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 indexed epochId,
        uint256 sweepAmount,
        address indexed to,
        uint256 principal,
        uint256 reserve,
        uint256 swept,
        uint256 disbursed
    );

    /// @dev Vault emit in S1 — sweep disabled; state remains SWEEP (SM-02).
    event ReserveReached(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 epochId,
        uint256 principal,
        uint256 reserve,
        uint256 swept,
        uint256 disbursed
    );

    /// @dev Ledger-side lifecycle — signature frozen; emit deferred to S3b.
    event StewardActivated(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 stewardActivationEpochId,
        address indexed steward
    );

    /// @dev Vault emit in S1 — DAO disburse from Jurisdiction Reserve (G-04 · VL-05).
    event JurisdictionReserveDisbursed(
        uint16 version,
        bytes2 indexed jurisdiction,
        uint256 amount,
        address indexed recipient,
        bytes32 proposalRef,
        uint256 principal,
        uint256 reserve,
        uint256 swept,
        uint256 disbursed
    );

    /// @dev Legacy Q-F01 deposit (Ledger integration · retained for indexer compat).
    event UnallocatedStewardDeposit(bytes2 indexed jurisdiction, address indexed token, uint256 amount, uint256 epochId);

    /// @dev Legacy Timelock release to StewardPath (S3b gate paths).
    event UnallocatedStewardReleased(
        bytes2 indexed jurisdiction, address indexed token, uint256 amount, bytes32 proposalRef
    );

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event VacancyParamsUpdated(uint16 vacancySweepRateBps, uint16 vacancySweepCapBps, uint16 jurisdictionReserveBps, uint32 vacancyGraceDays, bool vacancySweepAutoReenable);
    event VacancySweepEnabledUpdated(bool enabled);

    /// @dev S3c · governance allowlist for Restricted Treasury disburse recipients.
    event DisburseRecipientAllowedSet(address indexed recipient, bool allowed);
}
