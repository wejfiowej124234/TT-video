// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title VacancyTypes
 * @notice Shared structs for Vacancy Ledger V1 (accounting-spec §6.6.2).
 */
library VacancyTypes {
    /// @dev On-chain VacancyLedger SSOT per jurisdiction (VL-01～VL-05).
    struct VacancyLedger {
        uint256 principal;
        uint256 swept;
        uint256 reserve;
        uint256 disbursed;
    }

    /// @dev Governance-readable sweep parameters (GP-01 · protocol-ssot §3b).
    struct VacancyParams {
        uint16 vacancySweepRateBps;
        uint16 vacancySweepCapBps;
        uint16 jurisdictionReserveBps;
        uint32 vacancyGraceDays;
        bool vacancySweepAutoReenable;
    }

    /// @dev Pure output of evaluateVacancySweep — consumed by executeSweep.
    struct SweepPlan {
        uint256 sweepAmount;
        bool reserveReached;
        bool disableSweep;
    }
}
