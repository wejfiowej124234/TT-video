// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/SettlementRouter.sol";
import "../src/ProjectRevenuePoolV311.sol";
import "../src/FounderBootstrapWalletV311.sol";
import "../src/FeeRouter.sol";

/**
 * @title DeployFcgFullCapabilityV2Sepolia
 * @notice Protocol v2 Clean Deploy script PREP for baseline key `fcg_full_capability_v2_sepolia`
 * @dev HARD REFUSE broadcast unless:
 *        GOVERNANCE_RC_CLOSED=1
 *        TRAVELTRUST_FCG_V2_BROADCAST_OK=1
 *        chainid == 11155111
 *      WAIT_WINDOW / G-RC not closed → dry-run inventory only (no broadcast).
 *      Does NOT flip ACTIVE registry (cutover is a separate Owner script after evidence).
 */
contract DeployFcgFullCapabilityV2Sepolia is Script {
    struct Deployed {
        address settlementRouter;
        address projectRevenuePool;
        address founderBootstrap;
        address feeRouter;
    }

    function run() external returns (Deployed memory d) {
        uint256 chainId = block.chainid;
        bool govClosed = vm.envOr("GOVERNANCE_RC_CLOSED", uint256(0)) == 1;
        bool broadcastOk = vm.envOr("TRAVELTRUST_FCG_V2_BROADCAST_OK", uint256(0)) == 1;
        bool wantBroadcast = vm.envOr("FCG_V2_WANT_BROADCAST", uint256(0)) == 1;

        bool allowLive =
            wantBroadcast && govClosed && broadcastOk && chainId == 11155111;

        if (wantBroadcast) {
            require(govClosed, "FCG-V2: GOVERNANCE_RC_CLOSED!=1 - broadcast forbidden");
            require(broadcastOk, "FCG-V2: TRAVELTRUST_FCG_V2_BROADCAST_OK!=1");
            require(chainId == 11155111, "FCG-V2: Sepolia 11155111 only");
        } else {
            // Prep / dry path: compile+simulate; never open a live broadcast session
            require(chainId == 11155111 || chainId == 31337, "FCG-V2: dry-run only on Sepolia or Anvil");
        }

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");
        address timelockOrOwner = vm.envOr("FCG_V2_OWNER", deployer);

        // Optional LEGACY FeeRouter legs for transitional wiring (not constitution SSOT)
        address countryBucket = vm.envOr("FCG_V2_COUNTRY_BUCKET", timelockOrOwner);
        address globalStakers = vm.envOr("FCG_V2_GLOBAL_STAKERS", timelockOrOwner);
        address globalReserve = vm.envOr("FCG_V2_GLOBAL_RESERVE", timelockOrOwner);
        address globalOps = vm.envOr("FCG_V2_GLOBAL_OPS", timelockOrOwner);

        if (allowLive) {
            vm.startBroadcast(pk);
        }

        ProjectRevenuePoolV311 prp = new ProjectRevenuePoolV311(usdc, timelockOrOwner);
        FounderBootstrapWalletV311 founder = new FounderBootstrapWalletV311(usdc, timelockOrOwner);
        FeeRouter feeRouter = new FeeRouter(
            timelockOrOwner, countryBucket, globalStakers, globalReserve, globalOps
        );
        SettlementRouter settlement = new SettlementRouter(timelockOrOwner, address(feeRouter));

        if (allowLive) {
            vm.stopBroadcast();
        }

        d.settlementRouter = address(settlement);
        d.projectRevenuePool = address(prp);
        d.founderBootstrap = address(founder);
        d.feeRouter = address(feeRouter);

        console2.log("FCG_V2_BASELINE", "fcg_full_capability_v2_sepolia");
        console2.log("settlementRouter", d.settlementRouter);
        console2.log("projectRevenuePool", d.projectRevenuePool);
        console2.log("founderBootstrap", d.founderBootstrap);
        console2.log("feeRouter", d.feeRouter);
        console2.log("broadcast_authorized", allowLive);
        console2.log("ACTIVE_FLIP", "FORBIDDEN_IN_THIS_SCRIPT");
    }
}
