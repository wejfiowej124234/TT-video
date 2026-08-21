// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Script, console2} from "forge-std/Script.sol";
import {TtgV9DesignLockConstants} from "./TtgV9DesignLockConstants.sol";
import {TtgV9SoloTimelock} from "./TtgV9SoloTimelock.sol";
import {TtgV9ProjectPool} from "./TtgV9ProjectPool.sol";
import {TtgV9CountryFeeRouter} from "./TtgV9CountryFeeRouter.sol";
import {TtgV9RoleStakePool} from "./TtgV9RoleStakePool.sol";
import {TtgV9ERC1967Proxy} from "./TtgV9ERC1967Proxy.sol";
import {TtgV9AtomicDeployer} from "./TtgV9AtomicDeployer.sol";
import {TravelTrustGovernanceTokenV9} from "./TravelTrustGovernanceTokenV9.sol";
import {TtgPublicSaleVault} from "./TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "./TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernorV9} from "./TravelTrustGovernorV9.sol";
import {MockV9Erc20} from "./mocks/MockV9Erc20.sol";

/**
 * @title TtgV9DesignLockSepoliaRehearsal
 * @notice ② Sepolia Design Lock full topology deploy (English NatSpec only).
 * @dev NEW Solo Timelock · ProjectPool · CountryFeeRouter · RoleStake · V9 stack.
 *      Sepolia ops wallets = deployer alias (voting/seed drills). Mainnet Norm pins remain separate.
 *      Compressed Timelock delay via TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS (default 90).
 *      Short batch WINDOW so post-sale governance burn fits same session.
 *      Not Mainnet. Not TT_PRODUCTION_GO. Does not inherit R2_FINAL audit PASS.
 */
contract TtgV9DesignLockSepoliaRehearsal is Script {
    address internal constant LEGACY_SAFE = 0x96491aa894658ff7946506318c49F3c76b8f40e7;
    address internal constant LEGACY_P4CAP = 0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF;
    /// @dev Sepolia regression window: long enough for delay+EF/SR+sale; short enough for same-session burn.
    uint64 internal constant WINDOW = 180;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        require(block.chainid == 11155111, "SEPOLIA_ONLY");

        uint256 delaySec = 90;
        try vm.envUint("TTG_V9_SEPOLIA_TIMELOCK_DELAY_SECONDS") returns (uint256 d) {
            if (d > 0) delaySec = d;
        } catch {}

        // Sepolia alias: deployer holds genesis ops so drills work without Norm private keys.
        address team = deployer;
        address marketing = deployer;
        address treasury = deployer;
        address guardian = deployer;

        vm.startBroadcast(pk);

        TtgV9SoloTimelock timelock = new TtgV9SoloTimelock(deployer, delaySec);
        MockV9Erc20 usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        TtgV9ProjectPool pool = new TtgV9ProjectPool(address(timelock), address(timelock), address(usdc));
        TtgV9CountryFeeRouter feeRouter = new TtgV9CountryFeeRouter(address(timelock), address(pool));

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

        // Fee ingress stand-in for KEEP Escrow → FeeRouter cutover (authorized caller).
        TtgV9SepoliaFeeIngress ingress = new TtgV9SepoliaFeeIngress(address(feeRouter), address(usdc));

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
        uint64 start = uint64(block.timestamp + 120);
        bytes32 idSeed = timelock.schedule(
            address(market),
            0,
            abi.encodeCall(TtgBatchPrimaryMarket.seedBatchesRehearsal, (start, WINDOW)),
            bytes32(uint256(2))
        );
        bytes32 idCaller = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setFeeRouterCaller, (address(ingress), true)),
            bytes32(uint256(3))
        );

        usdc.mint(deployer, 100_000e6);

        vm.stopBroadcast();

        console2.log("TTG_V9_DESIGN_LOCK_SEPOLIA_DEPLOY");
        console2.log("deployer", deployer);
        console2.log("timelock", address(timelock));
        console2.log("timelockDelay", delaySec);
        console2.log("usdc", address(usdc));
        console2.log("projectPool", address(pool));
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
        console2.log("legacySafe", LEGACY_SAFE);
        console2.log("legacyP4cap", LEGACY_P4CAP);
        console2.log("normMarketing", TtgV9DesignLockConstants.MARKETING_DEPLOYER);
        console2.log("normTeam", TtgV9DesignLockConstants.TEAM);
        console2.log("normTreasury", TtgV9DesignLockConstants.TREASURY_GUARDIAN);
        console2.log("opsMode", "SEPOLIA_DEPLOYER_ALIAS");
        console2.log("candidateTrack", "V9_DESIGN_LOCK_NOT_R2_FINAL");
    }
}

/**
 * @title TtgV9SepoliaFeeIngress
 * @notice Sepolia stand-in for KEEP Escrow/Settlement fee cutover into CountryFeeRouter.
 * @dev Pulls USDC from payer and calls routePlatformFee. English NatSpec only.
 */
contract TtgV9SepoliaFeeIngress {
    TtgV9CountryFeeRouter public immutable feeRouter;
    MockV9Erc20 public immutable usdc;

    error TransferFailed();

    constructor(address feeRouter_, address usdc_) {
        feeRouter = TtgV9CountryFeeRouter(feeRouter_);
        usdc = MockV9Erc20(usdc_);
    }

    function ingestAndRoute(uint256 amount, bytes2 jurisdiction) external {
        if (!usdc.transferFrom(msg.sender, address(feeRouter), amount)) revert TransferFailed();
        feeRouter.routePlatformFee(address(usdc), amount, jurisdiction);
    }
}
