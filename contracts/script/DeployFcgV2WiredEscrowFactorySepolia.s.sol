// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/SettlementRouter.sol";
import "../src/ProjectRevenuePoolV311.sol";
import "../src/FounderBootstrapWalletV311.sol";
import "../src/FeeRouter.sol";
import "../src/EscrowFactory.sol";

/**
 * @title DeployFcgV2WiredEscrowFactorySepolia
 * @notice L5-A Sepolia Clean Redeploy: FeeRouter + SettlementRouter + PRP + Founder + EscrowFactory
 * @dev Hard gates same as DeployFcgFullCapabilityV2Sepolia. Does NOT flip ACTIVE registry.
 */
contract DeployFcgV2WiredEscrowFactorySepolia is Script {
    struct Deployed {
        address settlementRouter;
        address projectRevenuePool;
        address founderBootstrap;
        address feeRouter;
        address escrowFactory;
    }

    function run() external returns (Deployed memory d) {
        uint256 chainId = block.chainid;
        bool govClosed = vm.envOr("GOVERNANCE_RC_CLOSED", uint256(0)) == 1;
        bool broadcastOk = vm.envOr("TRAVELTRUST_FCG_V2_BROADCAST_OK", uint256(0)) == 1;
        bool wantBroadcast = vm.envOr("FCG_V2_WANT_BROADCAST", uint256(0)) == 1;

        bool allowLive = wantBroadcast && govClosed && broadcastOk && chainId == 11155111;

        if (wantBroadcast) {
            require(govClosed, "FCG-V2-WIRED: GOVERNANCE_RC_CLOSED!=1");
            require(broadcastOk, "FCG-V2-WIRED: TRAVELTRUST_FCG_V2_BROADCAST_OK!=1");
            require(chainId == 11155111, "FCG-V2-WIRED: Sepolia only");
        } else {
            require(chainId == 11155111 || chainId == 31337, "FCG-V2-WIRED: dry-run Sepolia/Anvil");
        }

        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");
        address timelockOrOwner = vm.envOr("FCG_V2_OWNER", deployer);
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
        EscrowFactory factory = new EscrowFactory(timelockOrOwner);

        if (allowLive) {
            vm.stopBroadcast();
        }

        d.settlementRouter = address(settlement);
        d.projectRevenuePool = address(prp);
        d.founderBootstrap = address(founder);
        d.feeRouter = address(feeRouter);
        d.escrowFactory = address(factory);

        console2.log("FCG_V2_WIRED_BASELINE", "fcg_full_capability_v2_sepolia_wired_escrow_factory");
        console2.log("Release_Identity", "REQUIRES_POST_DEPLOY_SHA_BIND");
        console2.log("settlementRouter", d.settlementRouter);
        console2.log("projectRevenuePool", d.projectRevenuePool);
        console2.log("founderBootstrap", d.founderBootstrap);
        console2.log("feeRouter", d.feeRouter);
        console2.log("escrowFactory", d.escrowFactory);
        console2.log("broadcast_authorized", allowLive);
        console2.log("ACTIVE_FLIP", "FORBIDDEN_IN_THIS_SCRIPT");
        console2.log("L3_SECURITY", "PREP_ONLY_NOT_SUBSTITUTE_L5");
    }
}
