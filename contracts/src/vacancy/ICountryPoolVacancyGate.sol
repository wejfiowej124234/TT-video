// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @notice Minimal Ledger surface for Vacancy release gate (G-02 · S3b).
interface ICountryPoolVacancyGate {
    function stewardActivationEpochId() external view returns (uint256);
}
