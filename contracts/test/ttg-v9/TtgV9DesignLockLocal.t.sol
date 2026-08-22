// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9Constants} from "../../src/ttg-v9/TtgV9Constants.sol";
import {TtgV9DesignLockConstants} from "../../src/ttg-v9/TtgV9DesignLockConstants.sol";
import {TtgV9SoloTimelock} from "../../src/ttg-v9/TtgV9SoloTimelock.sol";
import {TtgV9ProjectPool} from "../../src/ttg-v9/TtgV9ProjectPool.sol";
import {TtgV9CountryFeeRouter} from "../../src/ttg-v9/TtgV9CountryFeeRouter.sol";
import {TtgV9RoleStakePool} from "../../src/ttg-v9/TtgV9RoleStakePool.sol";
import {TtgV9ERC1967Proxy} from "../../src/ttg-v9/TtgV9ERC1967Proxy.sol";
import {TtgV9DeployTopology} from "../../src/ttg-v9/TtgV9DeployTopology.sol";
import {TravelTrustGovernanceTokenV9} from "../../src/ttg-v9/TravelTrustGovernanceTokenV9.sol";
import {TtgPublicSaleVault} from "../../src/ttg-v9/TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "../../src/ttg-v9/TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernorV9} from "../../src/ttg-v9/TravelTrustGovernorV9.sol";
import {MockV9Erc20} from "../../src/ttg-v9/mocks/MockV9Erc20.sol";

/**
 * @title TtgV9DesignLockLocalTest
 * @notice ① LOCAL_PASS for Owner Design LOCK topology. Not Sepolia. Not Mainnet. Not TT_PRODUCTION_GO.
 * @dev NEW Solo Timelock · NEW Project Pool · Country Fee Router · Role Stake · V9 wire.
 *      Old Safe / KEEP P4Cap / legacy FeeRouter = ZERO ACTIVE REFERENCES in this suite.
 */
contract TtgV9DesignLockLocalTest is Test {
    address internal constant LEGACY_SAFE = address(0x96491aa894658ff7946506318c49F3c76b8f40e7);
    address internal constant LEGACY_P4CAP = address(0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF);

    address internal marketing = TtgV9DesignLockConstants.MARKETING_DEPLOYER;
    address internal team = TtgV9DesignLockConstants.TEAM;
    address internal treasuryGuardian = TtgV9DesignLockConstants.TREASURY_GUARDIAN;

    TtgV9SoloTimelock internal timelock;
    TtgV9ProjectPool internal pool;
    TtgV9CountryFeeRouter internal feeRouter;
    TtgV9RoleStakePool internal stakePool;
    MockV9Erc20 internal usdc;
    TravelTrustGovernanceTokenV9 internal ttg;
    TtgPublicSaleVault internal vault;
    TtgBatchPrimaryMarket internal market;
    TravelTrustGovernorV9 internal governor;

    address internal stewardCn = makeAddr("stewardCnPayout");
    address internal buyer = makeAddr("buyer");
    address internal applicant = makeAddr("applicant");

    uint256 internal constant DELAY = TtgV9DesignLockConstants.TIMELOCK_DELAY_SECONDS;

    function setUp() public {
        vm.deal(marketing, 100 ether);

        usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        // NEW Solo Timelock (no Safe).
        timelock = new TtgV9SoloTimelock(marketing, DELAY);

        // NEW Project Pool — owner/spender = Timelock.
        pool = new TtgV9ProjectPool(address(timelock), address(timelock), address(usdc));

        // Country-aware Fee Router — owner = Timelock.
        feeRouter = new TtgV9CountryFeeRouter(address(timelock), address(pool));

        // V9 stack wired to NEW Timelock + NEW Pool + Norm ops + Guardian.
        TtgV9DeployTopology.Bundle memory bundle = TtgV9DeployTopology.deploy(
            address(usdc),
            address(pool),
            address(timelock),
            treasuryGuardian,
            team,
            marketing,
            treasuryGuardian
        );
        ttg = bundle.token;
        vault = bundle.vault;
        market = bundle.market;
        governor = bundle.governor;

        // Role Stake proxy (UUPS) · owner = Timelock.
        TtgV9RoleStakePool stakeImpl = new TtgV9RoleStakePool();
        bytes memory stakeInit = abi.encodeCall(
            TtgV9RoleStakePool.initialize, (address(timelock), address(ttg), 180 days, 180 days)
        );
        stakePool = TtgV9RoleStakePool(address(new TtgV9ERC1967Proxy(address(stakeImpl), stakeInit)));

        // Timelock allow-list + bind + seed (admin schedules with delay).
        vm.startPrank(marketing);
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
        bytes32 idCaller = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setFeeRouterCaller, (address(this), true)),
            bytes32(uint256(3))
        );
        vm.stopPrank();

        vm.warp(block.timestamp + DELAY);
        timelock.execute(idBind);
        timelock.execute(idSeed);
        timelock.execute(idCaller);

        usdc.mint(buyer, 10_000_000e6);
        usdc.mint(address(this), 1_000_000e6);
    }

    function test_ops_pins_and_no_legacy_active_refs() public view {
        assertEq(timelock.admin(), marketing);
        assertEq(timelock.delay(), DELAY);
        assertTrue(timelock.admin() != LEGACY_SAFE);
        assertTrue(address(pool) != LEGACY_P4CAP);
        assertEq(market.guardian(), treasuryGuardian);
        assertEq(market.usdcTreasury(), address(pool));
        assertEq(ttg.balanceOf(marketing), 1_250_000_000_000 ether);
        assertEq(ttg.balanceOf(team), 750_000_000_000 ether);
        assertEq(ttg.balanceOf(treasuryGuardian), 1_750_000_000_000 ether);
        assertEq(feeRouter.platformFeeBps(), 500);
        assertEq(feeRouter.projectPool(), address(pool));
    }

    function test_fee_with_active_steward_45_55() public {
        vm.prank(marketing);
        bytes32 idPay = timelock.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(TtgV9CountryFeeRouter.setStewardPayout, (bytes2("CN"), stewardCn)),
            bytes32(uint256(10))
        );
        vm.warp(block.timestamp + DELAY);
        timelock.execute(idPay);

        uint256 feeAmt = 100_000e6; // already-collected 5% platform fee slice
        usdc.transfer(address(feeRouter), feeAmt);
        feeRouter.routePlatformFee(address(usdc), feeAmt, bytes2("CN"));

        assertEq(usdc.balanceOf(stewardCn), 45_000e6);
        assertEq(usdc.balanceOf(address(pool)), 55_000e6);
    }

    function test_fee_without_steward_100_to_pool() public {
        uint256 feeAmt = 80_000e6;
        usdc.transfer(address(feeRouter), feeAmt);
        feeRouter.routePlatformFee(address(usdc), feeAmt, bytes2("JP"));
        assertEq(usdc.balanceOf(address(pool)), 80_000e6);
    }

    function test_no_globalStakers_active_semantics() public {
        (bool ok,) = address(feeRouter).call(abi.encodeWithSignature("globalStakers()"));
        assertFalse(ok);
        (bool ok2,) = address(feeRouter).call(abi.encodeWithSignature("BPS_GLOBAL_STAKERS()"));
        assertFalse(ok2);
    }

    function test_sale_usdc_to_new_pool() public {
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        uint256 usdcIn = 1e6; // 1 USDC — within batch1 amountCap
        uint256 poolBefore = usdc.balanceOf(address(pool));
        vm.prank(buyer);
        market.buy(1, usdcIn, 0, type(uint256).max);
        assertEq(usdc.balanceOf(address(pool)), poolBefore + usdcIn);
        assertEq(usdc.balanceOf(LEGACY_P4CAP), 0);
    }

    function test_p4_spend_to_treasury_ops_wallet_under_cap() public {
        usdc.mint(address(pool), 1_000_000e6);
        uint256 spendAmt = 100_000e6;
        vm.prank(address(timelock));
        pool.spendP4Reserve(address(usdc), treasuryGuardian, spendAmt);
        assertEq(usdc.balanceOf(treasuryGuardian), spendAmt);
    }

    function test_p4_cap_rejects_over_30pct() public {
        usdc.mint(address(pool), 1_000_000e6);
        vm.prank(address(timelock));
        vm.expectRevert(TtgV9ProjectPool.P4CapExceeded.selector);
        pool.spendP4Reserve(address(usdc), treasuryGuardian, 400_000e6);
    }

    function test_p4_spend_rejects_non_reserve_token() public {
        MockV9Erc20 junk = new MockV9Erc20("Junk", "JUNK", 18);
        junk.mint(address(pool), 1 ether);
        usdc.mint(address(pool), 1_000_000e6);
        vm.prank(address(timelock));
        vm.expectRevert(TtgV9ProjectPool.InvalidAddress.selector);
        pool.spendP4Reserve(address(junk), treasuryGuardian, 1);
    }

    function test_guardian_pause_only_not_seed() public {
        vm.prank(treasuryGuardian);
        market.pause();
        assertTrue(market.paused());
        vm.prank(treasuryGuardian);
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.seedBatchesFromNorm();
        vm.prank(marketing);
        bytes32 idUnpause = timelock.schedule(
            address(market), 0, abi.encodeCall(TtgBatchPrimaryMarket.unpause, ()), bytes32(uint256(30))
        );
        vm.warp(block.timestamp + DELAY);
        timelock.execute(idUnpause);
        assertFalse(market.paused());
    }

    function test_role_stake_live_supply_and_merchant_disabled() public {
        assertTrue(stakePool.roleEnabled(TtgV9RoleStakePool.RoleId.RegionSteward));
        assertFalse(stakePool.roleEnabled(TtgV9RoleStakePool.RoleId.Merchant));
        assertFalse(stakePool.roleEnabled(TtgV9RoleStakePool.RoleId.Guide));

        uint256 supply = ttg.totalSupply();
        uint256 minCn = stakePool.minStakeAmount(bytes2("CN"));
        assertEq(minCn, (supply * 400) / 10_000);

        // Fund applicant from marketing genesis (test only).
        vm.prank(marketing);
        ttg.transfer(applicant, minCn);
        vm.prank(applicant);
        ttg.approve(address(stakePool), minCn);
        vm.prank(applicant);
        stakePool.stakeAsRegionSteward(bytes2("CN"), minCn, bytes32("app1"));
        assertTrue(stakePool.hasJurisdictionStake(applicant, bytes2("CN")));

        vm.prank(applicant);
        vm.expectRevert(TtgV9RoleStakePool.RoleDisabled.selector);
        stakePool.stakeAsMerchant(1);

        // After burn, min stake drops (sticky absolute on existing position).
        uint256 burnAmt = 1_000_000_000_000 ether; // 1T
        vm.prank(address(timelock));
        ttg.protocolBurn(burnAmt);
        uint256 minAfter = stakePool.minStakeAmount(bytes2("CN"));
        assertEq(minAfter, (ttg.totalSupply() * 400) / 10_000);
        assertLt(minAfter, minCn);
    }

    function test_access_fee_destination_constant() public pure {
        assertEq(TtgV9DesignLockConstants.ACCESS_FEE_USDC, 300_000e6);
        assertEq(TtgV9DesignLockConstants.TREASURY_GUARDIAN, 0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736);
    }
}
