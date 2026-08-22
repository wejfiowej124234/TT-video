// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9DesignLockConstants
 * @notice Owner Design LOCK ops pins + fee BPS (English NatSpec only).
 * @dev ① Local / Design Lock SSOT. Not Mainnet broadcast. Not TT_PRODUCTION_GO.
 *
 *      Pre-deploy: use FOUNDRY_PROFILE=ttg_v9 (solc 0.8.36 · via_IR · optimizer 200 · paris).
 *      Do not downgrade solc to silence explorer banners. Known solc bugs listed by explorers are
 *      either fixed in 0.8.36+ or not applicable to Design Lock sources (see runbook
 *      TT-TTG-V9-PRE-DEPLOY-COMPILER-AND-WALLET-SCAN-LATEST.md).
 *
 *      Access Fee Exact = TREASURY_GUARDIAN. Platform fee rate = 500 bps (governance-only change).
 *      No globalStakers ACTIVE economics in Design Lock Fee Router.
 */
library TtgV9DesignLockConstants {
    /// @dev Deploy + NEW Timelock admin + genesis TTG 5%.
    address internal constant MARKETING_DEPLOYER = 0xe1e732EfBf9B010a9204054467256d3d93f3CdD4;
    /// @dev Genesis TTG 3%.
    address internal constant TEAM = 0x010365F0835323826569D61D0E13E6F8d25F6828;
    /// @dev Genesis TTG 7% · pause Guardian · Access Fee 300k · P4 ops payout.
    address internal constant TREASURY_GUARDIAN = 0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736;

    /// @dev Historical Phase1 SoloTimelock pin (48h). NEW periphery root uses TIMELOCK_DELAY_SECONDS_NEW_ROOT.
    uint256 internal constant TIMELOCK_DELAY_SECONDS = 48 hours;
    /// @dev Owner-approved NEW governance root default delay (periphery governance upgrade freeze).
    uint256 internal constant TIMELOCK_DELAY_SECONDS_NEW_ROOT = 12 hours;
    uint256 internal constant TIMELOCK_MIN_DELAY_SECONDS = 12 hours;
    uint256 internal constant TIMELOCK_MAX_DELAY_SECONDS = 7 days;
    uint256 internal constant PLATFORM_FEE_BPS = 500; // 5% default — Escrow rate; governance may retarget via FeeRouter V2
    uint256 internal constant STEWARD_SHARE_BPS = 4500; // default Active Steward share of platform-fee bucket
    uint256 internal constant PROJECT_SHARE_BPS = 5500;
    uint256 internal constant P4_DEPLOY_CAP_BPS = 3000; // 30%
    uint256 internal constant P4_PERIOD_SECONDS = 90 days;
    uint256 internal constant ACCESS_FEE_USDC = 300_000e6;
}
