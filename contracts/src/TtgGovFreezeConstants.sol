// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title TtgGovFreezeConstants
 * @notice GOV-01～04 numeric gates + supply units · **allocation SSOT = Genesis V2**
 * @dev L3-03 Seq4 · D-CONST-DOCID:
 *      Allocation authoritative: docs/spec/governance-token/TTG-TOKENOMICS-GENESIS-V2.md
 *      GOV gates prose:          docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md
 *      ACTIVE deploy baseline:   gov_freeze_v2_clean_baseline
 *      YAML mirror:              protocol-ssot.v1.yaml `genesis_v2` + `governance_freeze_v1`
 *      Public round caps:        Registry initial 800k / 1.2M / 3M · sum = 5M (Genesis V2 Public Sale)
 */
library TtgGovFreezeConstants {
    uint256 internal constant TTG_TOTAL_SUPPLY_UNITS = 10_000_000 ether;

    /// GOV-01
    uint256 internal constant TREASURY_P4_DEPLOY_CAP_BPS = 3000;

    /// GOV-02
    uint256 internal constant GOVERNANCE_QUORUM_BPS = 400;
    uint256 internal constant GOVERNANCE_TIMELOCK_DELAY_SECONDS = 48 hours;
    uint256 internal constant P4_ACCOUNTING_PERIOD_SECONDS = 90 days;

    /// GOV-03 · V1.1 — see GOV-03-AMENDMENT-V1.1
    uint256 internal constant MAX_ACTIVE_SEATS_PER_CONTROLLING_ENTITY = 1;
    /// @dev true = unlimited per-address vote weight at Governor (NOT "no vote rights")
    bool internal constant MAX_VOTING_POWER_CAP_DISABLED = true;
    /// @dev Only enforced when MAX_VOTING_POWER_CAP_DISABLED is false
    uint256 internal constant MAX_VOTING_POWER_PER_ADDRESS_BPS = 0;
    uint256 internal constant MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS = 400;

    /// GOV-04 (TTG 18 dec · USDC 6 dec)
    uint256 internal constant PUBLIC_SALE_PER_WALLET_CAP_TTG = 25_000 ether;
    uint256 internal constant PUBLIC_SALE_MIN_PURCHASE_USDC = 100e6;
    /// Registry initial split · sum MUST = 5_000_000 (Public Sale bucket)
    uint256 internal constant PUBLIC_ROUND_1_CAP_TTG = 800_000 ether;
    uint256 internal constant PUBLIC_ROUND_2_CAP_TTG = 1_200_000 ether;
    uint256 internal constant PUBLIC_ROUND_3_CAP_TTG = 3_000_000 ether;

    /// @notice Primary document id for supply / allocation authority (= Genesis V2)
    function freezeDocumentId() internal pure returns (string memory) {
        return "TTG-TOKENOMICS-GENESIS-V2";
    }

    /// @notice GOV-01～04 gates document id (not allocation unique SSOT)
    function govGatesDocumentId() internal pure returns (string memory) {
        return "TTG-TOKENOMICS-FREEZE-V1";
    }

    /// @notice ACTIVE deployment baseline key in protocol-convergence-deployments
    function activeDeployBaselineId() internal pure returns (string memory) {
        return "gov_freeze_v2_clean_baseline";
    }
}
