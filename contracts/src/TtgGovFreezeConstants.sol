// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title TtgGovFreezeConstants
 * @notice **TTG-TOKENOMICS-FREEZE-V1** 机读常量 · Gate-2.4 / Sepolia GOV-01～04 对齐真源
 * @dev Authoritative doc: docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md
 *      YAML mirror: docs/spec/governance-token/protocol-ssot.v1.yaml `governance_freeze_v1`
 */
library TtgGovFreezeConstants {
    uint256 internal constant TTG_TOTAL_SUPPLY_UNITS = 10_000_000 ether;

    /// GOV-01
    uint256 internal constant TREASURY_P4_DEPLOY_CAP_BPS = 3000;

    /// GOV-02
    uint256 internal constant GOVERNANCE_QUORUM_BPS = 400;
    uint256 internal constant GOVERNANCE_TIMELOCK_DELAY_SECONDS = 48 hours;
    uint256 internal constant P4_ACCOUNTING_PERIOD_SECONDS = 90 days;

    /// GOV-03
    uint256 internal constant MAX_ACTIVE_SEATS_PER_CONTROLLING_ENTITY = 1;
    uint256 internal constant MAX_VOTING_POWER_PER_ADDRESS_BPS = 400;
    uint256 internal constant MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS = 400;

    /// GOV-04 (TTG 18 dec · USDC 6 dec)
    uint256 internal constant PUBLIC_SALE_PER_WALLET_CAP_TTG = 25_000 ether;
    uint256 internal constant PUBLIC_SALE_MIN_PURCHASE_USDC = 100e6;
    uint256 internal constant PUBLIC_ROUND_1_CAP_TTG = 500_000 ether;
    uint256 internal constant PUBLIC_ROUND_2_CAP_TTG = 500_000 ether;
    uint256 internal constant PUBLIC_ROUND_3_CAP_TTG = 1_000_000 ether;

    function freezeDocumentId() internal pure returns (string memory) {
        return "TTG-TOKENOMICS-FREEZE-V1";
    }
}
