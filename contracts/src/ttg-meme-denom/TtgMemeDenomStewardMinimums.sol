// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomConstants.sol";

/**
 * @title TtgMemeDenomStewardMinimums
 * @notice DESIGN_ONLY V8 · same country bps as registry/v311-stake-minimum-by-country.v1.yaml.
 * @dev Seat size = bps × 25T. CN 4% = 1T TTG = 10,000,000 USDC at genesis quote.
 *      FR/ES stay 4.5% (1.125T). Do not lower them to 4%.
 */
library TtgMemeDenomStewardMinimums {
    function minStake(bytes2 jurisdiction) internal pure returns (uint256) {
        uint256 bps = stakeBps(jurisdiction);
        return (TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS * bps) / 10_000;
    }

    function stakeBps(bytes2 jurisdiction) internal pure returns (uint256) {
        if (jurisdiction == bytes2("CN") || jurisdiction == bytes2("US")) {
            return TtgMemeDenomConstants.STEWARD_STAKE_BPS_CN_US;
        }
        if (jurisdiction == bytes2("FR") || jurisdiction == bytes2("ES")) {
            return TtgMemeDenomConstants.STEWARD_STAKE_BPS_FR_ES;
        }
        if (jurisdiction == bytes2("JP") || jurisdiction == bytes2("TH")) {
            return TtgMemeDenomConstants.STEWARD_STAKE_BPS_JP_TH;
        }
        if (jurisdiction == bytes2("SG") || jurisdiction == bytes2("KR")) {
            return TtgMemeDenomConstants.STEWARD_STAKE_BPS_SG_KR;
        }
        if (jurisdiction == bytes2("AU") || jurisdiction == bytes2("AE")) {
            return TtgMemeDenomConstants.STEWARD_STAKE_BPS_AU_AE;
        }
        return 0;
    }
}
