// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {VacancyTypes} from "./VacancyTypes.sol";
import {VacancyErrors} from "./VacancyErrors.sol";
import {VacancyEvents} from "./VacancyEvents.sol";

/**
 * @title VacancyGovernance
 * @notice Governance parameter storage for Vacancy Ledger V1 (GP-01).
 * @dev Runtime math reads `vacancyParams` only — no economic literals in sweep logic.
 */
abstract contract VacancyGovernance is VacancyEvents {
    using VacancyTypes for VacancyTypes.VacancyParams;

    VacancyTypes.VacancyParams public vacancyParams;
    bool public sweepEnabled;

    /// @notice Validate and persist governance parameters.
    /// @dev Spec: GP-01 | PCM: §1.4 GP-01 | Risk: Critical
    function setVacancyParams(VacancyTypes.VacancyParams calldata params_) external onlyVaultOwner {
        _validateParams(params_);
        _validateParamsAgainstLedger(params_);
        vacancyParams = params_;
        emit VacancyParamsUpdated(
            params_.vacancySweepRateBps,
            params_.vacancySweepCapBps,
            params_.jurisdictionReserveBps,
            params_.vacancyGraceDays,
            params_.vacancySweepAutoReenable
        );
    }

    /// @dev Reject param updates that would retroactively violate VL-03 / VL-04 on current ledger.
    function _validateParamsAgainstLedger(VacancyTypes.VacancyParams memory params_) internal view {
        VacancyTypes.VacancyLedger memory ledger = _ledgerSnapshotForParams();
        if (ledger.principal == 0) return;

        uint256 capLimit = (ledger.principal * params_.vacancySweepCapBps) / 10_000;
        if (ledger.swept > capLimit) revert VacancyErrors.InvalidGovernanceParameter();

        if (!sweepEnabled) {
            uint256 floor = (ledger.principal * params_.jurisdictionReserveBps) / 10_000;
            if (ledger.reserve + ledger.disbursed < floor) revert VacancyErrors.InvalidGovernanceParameter();
        }
    }

    /// @dev Override in vault to supply live ledger snapshot for param validation.
    function _ledgerSnapshotForParams() internal view virtual returns (VacancyTypes.VacancyLedger memory);

    /// @notice Re-enable vacancy sweep after ReserveReached (SM-03).
    /// @dev Spec: SM-03 | PCM: §1.4 SM-03 | Risk: High
    function setVacancySweepEnabled(bool enabled) external onlyVaultOwner {
        sweepEnabled = enabled;
        emit VacancySweepEnabledUpdated(enabled);
    }

    function _validateParams(VacancyTypes.VacancyParams memory params_) internal pure {
        if (params_.vacancySweepRateBps == 0 || params_.vacancySweepRateBps > 10_000) {
            revert VacancyErrors.InvalidGovernanceParameter();
        }
        if (params_.vacancySweepCapBps == 0 || params_.vacancySweepCapBps > 10_000) {
            revert VacancyErrors.InvalidGovernanceParameter();
        }
        if (params_.jurisdictionReserveBps == 0 || params_.jurisdictionReserveBps > 10_000) {
            revert VacancyErrors.InvalidGovernanceParameter();
        }
        if (params_.vacancyGraceDays == 0) revert VacancyErrors.InvalidGovernanceParameter();
        if (params_.vacancySweepCapBps + params_.jurisdictionReserveBps > 10_000) {
            revert VacancyErrors.InvalidGovernanceParameter();
        }
    }

    modifier onlyVaultOwner() virtual;
}
