// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";
import {TtgV9GovernanceParams} from "./TtgV9GovernanceParams.sol";
import {TtgV9SoloTimelock} from "./TtgV9SoloTimelock.sol";
import {TtgV9ProjectPool} from "./TtgV9ProjectPool.sol";
import {TtgV9CountryFeeRouter} from "./TtgV9CountryFeeRouter.sol";
import {TtgV9RoleStakePool} from "./TtgV9RoleStakePool.sol";
import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {TtgV9AtomicDeployerMainnet} from "./TtgV9AtomicDeployerMainnet.sol";
import {TravelTrustGovernanceTokenV9} from "./TravelTrustGovernanceTokenV9.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernorV9} from "./TravelTrustGovernorV9.sol";

/**
 * @title TtgV9DesignLockMainnet
 * @notice ③ Ethereum Mainnet Design Lock DL_R1 deploy (English NatSpec only).
 * @dev Artifact pin: V9_MAINNET_DL_R1_BROADCAST_ARTIFACT_PIN.json
 *      NEW Solo Timelock (48h) · ProjectPool · CountryFeeRouter · RoleStake · AtomicDeployerMainnet.
 *      Norm ops only. Real Circle USDC. No FeeIngress. KEEP SettlementRouter as scheduled FeeRouter caller.
 *      bindMarket + seedBatchesFromNorm + setFeeRouterCaller are SCHEDULED (execute after 48h).
 *      SettlementRouter.setFeeRouter remains KEEP Timelock-owned — schedule off Solo path.
 *      Not TT_PRODUCTION_GO. Not www pin. Not public sale open ceremony.
 */
contract TtgV9DesignLockMainnet is Script {
    address internal constant MAINNET_USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address internal constant KEEP_SETTLEMENT_ROUTER = 0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372;
    address internal constant KEEP_ESCROW_FACTORY = 0xEE0BE3a8a8658E06c44539deD758Fb70A7f3C1C6;
    address internal constant LEGACY_SAFE = 0x96491aa894658ff7946506318c49F3c76b8f40e7;
    address internal constant LEGACY_P4CAP = 0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF;
    address internal constant LEGACY_KEEP_TIMELOCK = 0x50F0B26167EC73e327D97c54C81F1c1B9eFB22f7;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 1, "MAINNET_ONLY");
        require(deployer == TtgV9DesignLockConstants.MARKETING_DEPLOYER, "DEPLOYER_MUST_BE_NORM_MARKETING");

        address team = TtgV9DesignLockConstants.TEAM;
        address marketing = TtgV9DesignLockConstants.MARKETING_DEPLOYER;
        address treasury = TtgV9DesignLockConstants.TREASURY_GUARDIAN;
        address guardian = TtgV9DesignLockConstants.TREASURY_GUARDIAN;
        uint256 delaySec = TtgV9DesignLockConstants.TIMELOCK_DELAY_SECONDS;
        require(delaySec == 172800, "TIMELOCK_DELAY_MUST_BE_48H");

        vm.startBroadcast(pk);

        TtgV9SoloTimelock timelock = new TtgV9SoloTimelock(marketing, delaySec);
        require(timelock.admin() == marketing, "TIMELOCK_ADMIN");
        require(address(timelock.admin()) != LEGACY_SAFE, "NO_SAFE_ADMIN");

        TtgV9ProjectPool pool = new TtgV9ProjectPool(address(timelock), address(timelock), MAINNET_USDC);
        require(address(pool) != LEGACY_P4CAP, "NO_LEGACY_P4CAP");

        TtgV9CountryFeeRouter feeRouter = new TtgV9CountryFeeRouter(address(timelock), address(pool));

        TtgV9AtomicDeployerMainnet atomic = new TtgV9AtomicDeployerMainnet(
            MAINNET_USDC,
            address(pool),
            address(timelock),
            guardian,
            team,
            marketing,
            treasury,
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_MAINNET,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_MAINNET
        );

        TravelTrustGovernanceTokenV9 ttg = TravelTrustGovernanceTokenV9(atomic.token());
        TtgPublicSaleVault vault = TtgPublicSaleVault(payable(atomic.vault()));
        TtgBatchPrimaryMarket market = TtgBatchPrimaryMarket(payable(atomic.market()));
        TravelTrustGovernorV9 governor = TravelTrustGovernorV9(atomic.governor());

        TtgV9RoleStakePool stakeImpl = new TtgV9RoleStakePool();
        bytes memory stakeInit =
            abi.encodeCall(TtgV9RoleStakePool.initialize, (address(timelock), address(ttg), 1 days, 1 days));
        TtgV9RoleStakePool stakePool =
            TtgV9RoleStakePool(address(new TtgV9ERC1967Proxy(address(stakeImpl), stakeInit)));

        timelock.setGovernor(address(governor));
        timelock.setAllowedExecutionTarget(address(vault), true);
        timelock.setAllowedExecutionTarget(address(market), true);
        timelock.setAllowedExecutionTarget(address(feeRouter), true);
        timelock.setAllowedExecutionTarget(address(pool), true);
        timelock.setAllowedExecutionTarget(address(stakePool), true);
        timelock.setAllowedExecutionTarget(address(governor), true);

        bytes32 idBind = timelock.schedule(
            address(vault), 0, abi.encodeCall(TtgPublicSaleVault.bindMarket, (address(market))), bytes32(uint256(1))
        );
        bytes32 idSeed = timelock.schedule(
            address(market), 0, abi.encodeCall(TtgBatchPrimaryMarket.seedBatchesFromNorm, ()), bytes32(uint256(2))
        );
        // KEEP SettlementRouter only — FORBID FeeIngress
        bytes32 idCallerSr = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setFeeRouterCaller, (KEEP_SETTLEMENT_ROUTER, true)),
            bytes32(uint256(3))
        );
        bytes32 idCallerEf = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setFeeRouterCaller, (KEEP_ESCROW_FACTORY, true)),
            bytes32(uint256(4))
        );

        vm.stopBroadcast();

        console2.log("TTG_V9_DESIGN_LOCK_MAINNET_DEPLOY");
        console2.log("deployer", deployer);
        console2.log("timelock", address(timelock));
        console2.log("timelockDelay", delaySec);
        console2.log("usdc", MAINNET_USDC);
        console2.log("projectPool", address(pool));
        console2.log("feeRouter", address(feeRouter));
        console2.log("stakePool", address(stakePool));
        console2.log("ttg", address(ttg));
        console2.log("vault", address(vault));
        console2.log("market", address(market));
        console2.log("governor", address(governor));
        console2.log("vaultImpl", atomic.vaultImpl());
        console2.log("marketImpl", atomic.marketImpl());
        console2.log("keepSettlementRouter", KEEP_SETTLEMENT_ROUTER);
        console2.log("keepEscrowFactory", KEEP_ESCROW_FACTORY);
        console2.log("legacyKeepTimelock", LEGACY_KEEP_TIMELOCK);
        console2.log("legacySafe", LEGACY_SAFE);
        console2.log("legacyP4cap", LEGACY_P4CAP);
        console2.log("idBind", vm.toString(idBind));
        console2.log("idSeed", vm.toString(idSeed));
        console2.log("idCallerSr", vm.toString(idCallerSr));
        console2.log("idCallerEf", vm.toString(idCallerEf));
        console2.log("feeIngress", address(0));
        console2.log("candidateTrack", "V9_AUDIT_CANDIDATE_DESIGN_LOCK_DL_R1");
        console2.log("opsMode", "MAINNET_NORM_PINS");
        console2.log("note", "EXECUTE_AFTER_48H; SR.setFeeRouter REQUIRES_KEEP_TIMELOCK");
    }
}
