// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

/**
 * @title TtgMemeDenomConstants
 * @notice DESIGN_ONLY V8 economics pin. Do not broadcast until Owner ③ auth.
 * @dev Owner lock:
 *         Supply        = 25_000_000_000_000 TTG (fixed, constructor-only)
 *         Split         = 15 / 35 / 50 (Team / DAO / Public). No 5% community bucket.
 *         Quote         = 1 USDC = 100_000 TTG · FDV sticker $250M
 *         Min purchase  = 1 USDC (Owner ED vs live GOV-04-A1 10 USDC; old $25/TTG floor)
 *         Seat table    = NOT_IN_TTG_PM_GOV_CUTOVER (country bps leftover)
 *         Entity cap    = 400 bps (live GOV-03). 450 was Drift.
 *         Merge         = 1 live 10M TTG = 2_500_000 V8 TTG (absolute qty ED)
 *      Live Official 10M token remains LEGACY. This file does not mutate FTB.
 *
 *      Quote formula (same as live PM): ttgOut = usdcAmount * TTG_PER_USDC_UNIT / 1e6
 */
library TtgMemeDenomConstants {
    /// Live Official share base (LEGACY). Used only for optional goodwill conversion math.
    uint256 internal constant LIVE_SHARE_UNITS = 10_000_000 ether;

    /// 1 live TTG → 2_500_000 V8 TTG. 10M × 2.5M = 25T.
    uint256 internal constant MERGE_RATIO = 2_500_000;

    uint256 internal constant TTG_TOTAL_SUPPLY_UNITS = 25_000_000_000_000 ether;

    uint256 internal constant TEAM_BPS = 1500;
    uint256 internal constant DAO_TREASURY_BPS = 3500;
    uint256 internal constant PUBLIC_SALE_BPS = 5000;

    uint256 internal constant TEAM_TTG = (TTG_TOTAL_SUPPLY_UNITS * TEAM_BPS) / 10_000;
    uint256 internal constant DAO_TREASURY_TTG = (TTG_TOTAL_SUPPLY_UNITS * DAO_TREASURY_BPS) / 10_000;
    uint256 internal constant PUBLIC_SALE_TTG = (TTG_TOTAL_SUPPLY_UNITS * PUBLIC_SALE_BPS) / 10_000;

    /// 1 USDC (1e6) → 100_000 TTG.
    uint256 internal constant TTG_PER_USDC_UNIT = 100_000 ether;
    uint256 internal constant REFERENCE_PURCHASE_USDC = 1e6;
    uint256 internal constant REFERENCE_PURCHASE_TTG = 100_000 ether;

    /// Owner ED vs live GOV-04-A1 10 USDC: new TTG ratio makes 1 USDC a real purchase (100,000 TTG).
    uint256 internal constant PUBLIC_SALE_MIN_PURCHASE_USDC = 1e6;
    uint256 internal constant PUBLIC_SALE_PER_WALLET_CAP_TTG = 0;

    /// Public 12.5T split 16 / 24 / 60 → 2T / 3T / 7.5T.
    uint256 internal constant PUBLIC_ROUND_1_CAP_TTG = 2_000_000_000_000 ether;
    uint256 internal constant PUBLIC_ROUND_2_CAP_TTG = 3_000_000_000_000 ether;
    uint256 internal constant PUBLIC_ROUND_3_CAP_TTG = (PUBLIC_SALE_TTG * 60) / 100;

    uint256 internal constant GOVERNANCE_QUORUM_BPS = 400;
    uint256 internal constant PROPOSAL_TIER_ORDINARY_BPS = 50;
    uint256 internal constant PROPOSAL_TIER_IMPORTANT_BPS = 100;
    uint256 internal constant PROPOSAL_TIER_CORE_BPS = 200;
    /// Live V311 clamps × MERGE_RATIO (absolute TTG qty ED).
    uint256 internal constant PROPOSAL_ORDINARY_MIN_TTG = 5_000 ether * MERGE_RATIO;
    uint256 internal constant PROPOSAL_ORDINARY_MAX_TTG = 50_000 ether * MERGE_RATIO;
    uint256 internal constant PROPOSAL_IMPORTANT_MAX_TTG = 100_000 ether * MERGE_RATIO;
    uint256 internal constant PROPOSAL_CORE_MAX_TTG = 200_000 ether * MERGE_RATIO;
    uint256 internal constant GOVERNANCE_TIMELOCK_DELAY_SECONDS = 48 hours;

    uint256 internal constant MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS = 400;
    uint256 internal constant MAX_ACTIVE_SEATS_PER_CONTROLLING_ENTITY = 1;

    uint256 internal constant STEWARD_STAKE_BPS_CN_US = 400;
    uint256 internal constant STEWARD_STAKE_BPS_FR_ES = 450;
    uint256 internal constant STEWARD_STAKE_BPS_JP_TH = 250;
    uint256 internal constant STEWARD_STAKE_BPS_SG_KR = 200;
    uint256 internal constant STEWARD_STAKE_BPS_AU_AE = 150;

    uint256 internal constant INITIAL_FDV_USDC = 250_000_000e6;
    uint256 internal constant CN_STEWARD_USDC = 10_000_000e6;

    function candidateId() internal pure returns (string memory) {
        return "TTG-25T-BPS-SEAT-FIXED-SUPPLY-CANDIDATE-V8";
    }
}
