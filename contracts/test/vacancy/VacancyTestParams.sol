// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../../src/vacancy/VacancyTypes.sol";

/// @dev SSOT defaults for tests/deploy only — never referenced by VacancyLedgerLib math (GP-01).
library VacancyTestParams {
    function ssotV1Defaults() internal pure returns (VacancyTypes.VacancyParams memory) {
        return VacancyTypes.VacancyParams({
            vacancySweepRateBps: 2500,
            vacancySweepCapBps: 7500,
            jurisdictionReserveBps: 2500,
            vacancyGraceDays: 180,
            vacancySweepAutoReenable: false
        });
    }
}
