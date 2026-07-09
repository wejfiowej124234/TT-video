// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {VacancyTypes} from "./VacancyTypes.sol";
import {VacancyErrors} from "./VacancyErrors.sol";

/**
 * @title VacancyLedgerLib
 * @notice Pure VacancyLedger algorithms + storage helpers (VL-01～VL-05).
 */
library VacancyLedgerLib {
    using VacancyTypes for VacancyTypes.VacancyLedger;
    using VacancyTypes for VacancyTypes.VacancyParams;
    using VacancyTypes for VacancyTypes.SweepPlan;

    uint256 internal constant BPS_DENOM = 10_000;

    /// @notice Credit vacant-path deposit into reserve leg (VL-01).
    /// @dev Spec: VL-01, U-07 | Accounting: §6.6.2 deposit | PCM: §1.1 VL-01 | Risk: Critical
    function depositToReserve(VacancyTypes.VacancyLedger storage ledger, uint256 amount) internal {
        if (amount == 0) revert VacancyErrors.InvalidAmount();
        ledger.principal += amount;
        ledger.reserve += amount;
        _assertLedgerIdentity(ledger);
    }

    /// @notice Pure sweep evaluation — no emit, transfer, or storage (TR-01 prep).
    /// @dev Spec: VL-03, VL-04, U-08 | Accounting: §6.6.5 | PCM: §1.1 VL-03 · §1.4 TR-01 | Risk: Critical
    function evaluateVacancySweep(
        VacancyTypes.VacancyLedger memory ledger,
        VacancyTypes.VacancyParams memory params,
        bool sweepEnabled_
    ) internal pure returns (VacancyTypes.SweepPlan memory plan) {
        if (!sweepEnabled_) {
            return plan;
        }

        if (ledger.principal == 0) {
            plan.disableSweep = true;
            plan.reserveReached = true;
            return plan;
        }

        uint256 nominalSweep = (ledger.principal * params.vacancySweepRateBps) / BPS_DENOM;
        uint256 capLimit = (ledger.principal * params.vacancySweepCapBps) / BPS_DENOM;
        uint256 capRemaining = capLimit > ledger.swept ? capLimit - ledger.swept : 0;
        uint256 floorReserve = (ledger.principal * params.jurisdictionReserveBps) / BPS_DENOM;
        uint256 maxFromReserve = ledger.reserve > floorReserve ? ledger.reserve - floorReserve : 0;

        if (capRemaining == 0 || maxFromReserve == 0) {
            plan.reserveReached = true;
            plan.disableSweep = true;
            return plan;
        }

        uint256 sweepAmount = nominalSweep;
        if (sweepAmount > capRemaining) sweepAmount = capRemaining;
        if (sweepAmount > maxFromReserve) sweepAmount = maxFromReserve;

        if (sweepAmount == 0) {
            plan.reserveReached = true;
            plan.disableSweep = true;
            return plan;
        }

        plan.sweepAmount = sweepAmount;

        uint256 nextSwept = ledger.swept + sweepAmount;
        uint256 nextReserve = ledger.reserve - sweepAmount;
        if (nextSwept >= capLimit || nextReserve <= floorReserve) {
            plan.reserveReached = true;
            plan.disableSweep = true;
        }
    }

    /// @notice Apply an evaluated sweep plan to ledger storage (VL-01 · VL-03).
    /// @dev Spec: VL-01, VL-03 | PCM: §1.1 VL-01 | Risk: Critical
    function applySweep(VacancyTypes.VacancyLedger storage ledger, VacancyTypes.SweepPlan memory plan) internal {
        if (plan.sweepAmount == 0) revert VacancyErrors.InvalidAmount();
        ledger.swept += plan.sweepAmount;
        ledger.reserve -= plan.sweepAmount;
        _assertLedgerIdentity(ledger);
    }

    /// @notice DAO disburse from Jurisdiction Reserve (VL-05 · G-04).
    /// @dev Spec: VL-05, G-04 | Accounting: §6.6.2 DAO disburse | PCM: §1.1 VL-05 · §1.3 G-04 | Risk: Critical
    function disburseJurisdictionReserve(VacancyTypes.VacancyLedger storage ledger, uint256 amount) internal {
        if (amount == 0) revert VacancyErrors.InvalidAmount();
        if (ledger.reserve < amount) revert VacancyErrors.InsufficientReserve();
        ledger.reserve -= amount;
        ledger.disbursed += amount;
        _assertLedgerIdentity(ledger);
    }

    /// @notice Release to StewardPath — reduces principal and reserve equally (VL-01).
    /// @dev S3b gate paths; kept for Ledger compat without importing Ledger.
    function applyReleaseToSteward(VacancyTypes.VacancyLedger storage ledger, uint256 amount) internal {
        if (amount == 0) revert VacancyErrors.InvalidAmount();
        if (ledger.reserve < amount) revert VacancyErrors.InsufficientReserve();
        ledger.principal -= amount;
        ledger.reserve -= amount;
        _assertLedgerIdentity(ledger);
    }

    /// @notice VL-01 identity check (memory).
    /// @dev Spec: VL-01 | PCM: §1.1 VL-01 | Risk: Critical
    function assertLedgerIdentity(VacancyTypes.VacancyLedger memory ledger) internal pure {
        if (ledger.principal != ledger.swept + ledger.reserve + ledger.disbursed) {
            revert VacancyErrors.LedgerIdentityViolation();
        }
    }

    function _assertLedgerIdentity(VacancyTypes.VacancyLedger storage ledger) private view {
        if (ledger.principal != ledger.swept + ledger.reserve + ledger.disbursed) {
            revert VacancyErrors.LedgerIdentityViolation();
        }
    }

    /// @notice Compare evaluated vs submitted sweep plans (anti-tampering).
    function sweepPlansEqual(VacancyTypes.SweepPlan memory a, VacancyTypes.SweepPlan memory b)
        internal
        pure
        returns (bool)
    {
        return a.sweepAmount == b.sweepAmount && a.reserveReached == b.reserveReached && a.disableSweep == b.disableSweep;
    }
}
