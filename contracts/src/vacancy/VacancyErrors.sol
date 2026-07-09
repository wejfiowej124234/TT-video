// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title VacancyErrors
 * @notice Custom errors for Vacancy Ledger V1 (gas + audit clarity).
 */
library VacancyErrors {
    error OnlyOwner();
    error OnlyLedger();
    error InvalidAddress();
    error InvalidAmount();
    error TransferFailed();
    error SweepDisabled();
    error ReserveFloorReached();
    error SweepCapReached();
    error InvalidSweepPlan();
    error InvalidGovernanceParameter();
    error LedgerIdentityViolation();
    error InsufficientReserve();
    error ActivationEpochLocked();
    error RecipientNotAllowed();
    error ProhibitedDisburseRecipient();
}
