// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";
import {TtgV9SoloTimelock} from "./TtgV9SoloTimelock.sol";
import {TtgV9ProjectPoolV2} from "./TtgV9ProjectPoolV2.sol";
import {TtgV9CountryFeeRouterV2} from "./TtgV9CountryFeeRouterV2.sol";
import {TtgV9RoleStakePool} from "./TtgV9RoleStakePool.sol";
import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {TtgV9AtomicDeployer} from "./TtgV9AtomicDeployer.sol";
import {TravelTrustGovernanceTokenV9} from "./TravelTrustGovernanceTokenV9.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernorV9} from "./TravelTrustGovernorV9.sol";
import {MockV9Erc20} from "./mocks/MockV9Erc20.sol";

/**
 * @title TtgV9PeripheryGovernanceSepoliaRehearsal
 * @notice ② Sepolia Reality for Periphery Governance Upgrade Candidate (Audit #1 SHA-bound).
 * @dev NEW SoloTimelock at TIMELOCK_DELAY_SECONDS_NEW_ROOT (12h, bounds [12h,7d]),
 *      NEW Governor via AtomicDeployer, ProjectPoolV2, FeeRouterV2, PM treasury=PoolV2.
 *      Compressed delay <12h is REJECTED by Timelock (InvalidDelay) — intentional.
 *      Not Mainnet. Not Exact-Match. Not TT_PRODUCTION_GO. English NatSpec only.
 */
contract TtgV9PeripheryGovernanceSepoliaRehearsal is Script {
    /// @dev Short batch window so post-delay sale/governance drills fit one session after ETA.
    uint64 internal constant WINDOW = 900;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 11155111, "SEPOLIA_ONLY");

        uint256 delaySec = TtgV9DesignLockConstants.TIMELOCK_DELAY_SECONDS_NEW_ROOT;
        try vm.envUint("TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS") returns (uint256 d) {
            // Only allow values inside frozen [12h, 7d] — do not reopen compressed-delay carve-out.
            if (
                d >= TtgV9DesignLockConstants.TIMELOCK_MIN_DELAY_SECONDS
                    && d <= TtgV9DesignLockConstants.TIMELOCK_MAX_DELAY_SECONDS
            ) {
                delaySec = d;
            }
        } catch {}

        address team = deployer;
        address marketing = deployer;
        address treasury = deployer;
        address guardian = deployer;

        vm.startBroadcast(pk);

        TtgV9SoloTimelock timelock = new TtgV9SoloTimelock(deployer, delaySec);
        MockV9Erc20 usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        TtgV9ProjectPoolV2 poolImpl = new TtgV9ProjectPoolV2();
        bytes memory poolInit = abi.encodeCall(
            TtgV9ProjectPoolV2.initialize, (address(timelock), address(timelock), address(usdc), 3_000)
        );
        TtgV9ProjectPoolV2 pool =
            TtgV9ProjectPoolV2(address(new TtgV9ERC1967Proxy(address(poolImpl), poolInit)));

        TtgV9CountryFeeRouterV2 feeRouter = new TtgV9CountryFeeRouterV2(address(timelock), address(pool));

        TtgV9AtomicDeployer atomic =
            new TtgV9AtomicDeployer(address(usdc), address(pool), address(timelock), guardian, team, marketing, treasury);
        TravelTrustGovernanceTokenV9 ttg = TravelTrustGovernanceTokenV9(atomic.token());
        TtgPublicSaleVault vault = TtgPublicSaleVault(payable(atomic.vault()));
        TtgBatchPrimaryMarket market = TtgBatchPrimaryMarket(payable(atomic.market()));
        TravelTrustGovernorV9 governor = TravelTrustGovernorV9(atomic.governor());

        TtgV9RoleStakePool stakeImpl = new TtgV9RoleStakePool();
        bytes memory stakeInit =
            abi.encodeCall(TtgV9RoleStakePool.initialize, (address(timelock), address(ttg), 1 days, 1 days));
        TtgV9RoleStakePool stakePool =
            TtgV9RoleStakePool(address(new TtgV9ERC1967Proxy(address(stakeImpl), stakeInit)));

        TtgV9SepoliaFeeIngressV2 ingress = new TtgV9SepoliaFeeIngressV2(address(feeRouter), address(usdc));

        timelock.setGovernor(address(governor));
        timelock.setAllowedExecutionTarget(address(vault), true);
        timelock.setAllowedExecutionTarget(address(market), true);
        timelock.setAllowedExecutionTarget(address(feeRouter), true);
        timelock.setAllowedExecutionTarget(address(pool), true);
        timelock.setAllowedExecutionTarget(address(stakePool), true);
        timelock.setAllowedExecutionTarget(address(governor), true);
        timelock.setAllowedExecutionTarget(address(timelock), true);

        bytes32 idBind = timelock.schedule(
            address(vault), 0, abi.encodeCall(TtgPublicSaleVault.bindMarket, (address(market))), bytes32(uint256(1))
        );
        // Batch1 opens after Timelock delay + 120s buffer so execute→seed→wait→buy fits post-ETA session.
        uint64 start = uint64(block.timestamp + delaySec + 120);
        bytes32 idSeed = timelock.schedule(
            address(market),
            0,
            abi.encodeCall(TtgBatchPrimaryMarket.seedBatchesRehearsal, (start, WINDOW)),
            bytes32(uint256(2))
        );
        bytes32 idCaller = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouterV2.setFeeRouterCaller, (address(ingress), true)),
            bytes32(uint256(3))
        );
        // Parallel governance Reality ops (same ETA) — executed AFTER default 45/55 fee drill in runner order.
        bytes32 idSteward = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouterV2.setStewardPayout, (bytes2("CN"), deployer)),
            bytes32(uint256(4))
        );
        bytes32 idFeeBps = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouterV2.setPlatformFeeBps, (600)),
            bytes32(uint256(5))
        );
        bytes32 idSplit = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouterV2.setFeeSplit, (6000, 4000)),
            bytes32(uint256(6))
        );
        bytes32 idCap = timelock.schedule(
            address(pool), 0, abi.encodeCall(TtgV9ProjectPoolV2.setCapBps, (7_500)), bytes32(uint256(7))
        );
        bytes32 idUnpause = timelock.schedule(
            address(market), 0, abi.encodeCall(TtgBatchPrimaryMarket.unpause, ()), bytes32(uint256(8))
        );
        // Fund pool for P4 spend drill; schedule 10% of 500k under default 30% cap.
        usdc.mint(address(pool), 500_000e6);
        bytes32 idP4 = timelock.schedule(
            address(pool),
            0,
            abi.encodeCall(TtgV9ProjectPoolV2.spendP4Reserve, (address(usdc), deployer, 50_000e6)),
            bytes32(uint256(9))
        );
        // Invalid split (sum != 10000) — execute must revert CallFailed (bounds Reality).
        bytes32 idBadSplit = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouterV2.setFeeSplit, (6000, 5000)),
            bytes32(uint256(10))
        );

        usdc.mint(deployer, 100_000e6);

        vm.stopBroadcast();

        console2.log("TTG_V9_PERIPHERY_GOVERNANCE_SEPOLIA_DEPLOY");
        console2.log("candidateTrack", "V9_PERIPHERY_GOVERNANCE_UPGRADE");
        console2.log("deployer", deployer);
        console2.log("timelock", address(timelock));
        console2.log("timelockDelay", delaySec);
        console2.log("usdc", address(usdc));
        console2.log("projectPool", address(pool));
        console2.log("poolImpl", address(poolImpl));
        console2.log("feeRouter", address(feeRouter));
        console2.log("feeIngress", address(ingress));
        console2.log("stakePool", address(stakePool));
        console2.log("ttg", address(ttg));
        console2.log("vault", address(vault));
        console2.log("market", address(market));
        console2.log("governor", address(governor));
        console2.log("vaultImpl", atomic.vaultImpl());
        console2.log("marketImpl", atomic.marketImpl());
        console2.log("batch1Start", start);
        console2.log("idBind", vm.toString(idBind));
        console2.log("idSeed", vm.toString(idSeed));
        console2.log("idCaller", vm.toString(idCaller));
        console2.log("idSteward", vm.toString(idSteward));
        console2.log("idFeeBps", vm.toString(idFeeBps));
        console2.log("idSplit", vm.toString(idSplit));
        console2.log("idCap", vm.toString(idCap));
        console2.log("idUnpause", vm.toString(idUnpause));
        console2.log("idP4", vm.toString(idP4));
        console2.log("idBadSplit", vm.toString(idBadSplit));
        console2.log("platformFeeBps", feeRouter.platformFeeBps());
        console2.log("stewardShareBps", feeRouter.stewardShareBps());
        console2.log("projectShareBps", feeRouter.projectShareBps());
        console2.log("poolCapBps", pool.capBps());
        console2.log("ttgMaxSupply", ttg.MAX_SUPPLY());
        console2.log("ttgTotalSupply", ttg.totalSupply());
        console2.log("opsMode", "SEPOLIA_DEPLOYER_ALIAS");
        console2.log("exactMatch", "NOT_ISSUED");
        console2.log("mainnetBroadcast", "FORBIDDEN");
        console2.log("ttProductionGo", "NO_GO");
    }
}

/**
 * @title TtgV9SepoliaFeeIngressV2
 * @notice Sepolia stand-in for KEEP Escrow → FeeRouterV2 platform-fee ingress.
 */
contract TtgV9SepoliaFeeIngressV2 {
    TtgV9CountryFeeRouterV2 public immutable feeRouter;
    MockV9Erc20 public immutable usdc;

    error TransferFailed();

    constructor(address feeRouter_, address usdc_) {
        feeRouter = TtgV9CountryFeeRouterV2(feeRouter_);
        usdc = MockV9Erc20(usdc_);
    }

    function ingestAndRoute(uint256 amount, bytes2 jurisdiction) external {
        if (!usdc.transferFrom(msg.sender, address(feeRouter), amount)) revert TransferFailed();
        feeRouter.routePlatformFee(address(usdc), amount, jurisdiction);
    }
}
