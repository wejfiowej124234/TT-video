// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9Constants} from "../../src/ttg-v9/TtgV9Constants.sol";
import {TtgPublicSaleVault} from "../../src/ttg-v9/TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "../../src/ttg-v9/TtgBatchPrimaryMarket.sol";
import {TtgBatchPrimaryMarketPreTreasury} from "../../src/ttg-v9/legacy/TtgBatchPrimaryMarketPreTreasury.sol";
import {TtgV9ProjectPoolV2} from "../../src/ttg-v9/TtgV9ProjectPoolV2.sol";
import {TtgV9ERC1967Proxy} from "../../src/ttg-v9/TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "./MockV9Erc20.sol";

/**
 * @title TtgV9BatchPrimaryMarketTreasuryGovernedTest
 * @notice Local Candidate: PreTreasury → UUPS upgrade → setUsdcTreasury → buy to ProjectPoolV2.
 */
contract TtgV9BatchPrimaryMarketTreasuryGovernedTest is Test {
    address internal timelock = makeAddr("timelock");
    address internal guardian = makeAddr("guardian");
    address internal buyer = makeAddr("buyer");
    address internal legacyPool = makeAddr("legacyPool");

    MockV9Erc20 internal usdc;
    MockV9Erc20 internal ttg;
    TtgPublicSaleVault internal vault;
    TtgBatchPrimaryMarket internal market;
    TtgV9ProjectPoolV2 internal poolV2;

    uint256 internal constant PUBLIC_INVENTORY = 12_500_000_000_000 ether;

    function _deployVault(address ttg_, address admin_) internal returns (TtgPublicSaleVault v) {
        TtgPublicSaleVault impl = new TtgPublicSaleVault();
        bytes memory init = abi.encodeCall(TtgPublicSaleVault.initialize, (ttg_, admin_));
        v = TtgPublicSaleVault(payable(address(new TtgV9ERC1967Proxy(address(impl), init))));
    }

    function _deployPreTreasuryMarket(
        address usdc_,
        address ttg_,
        address treasury_,
        address vault_,
        address timelock_,
        address guardian_
    ) internal returns (TtgBatchPrimaryMarket m) {
        TtgBatchPrimaryMarketPreTreasury impl = new TtgBatchPrimaryMarketPreTreasury();
        bytes memory init = abi.encodeCall(
            TtgBatchPrimaryMarketPreTreasury.initialize, (usdc_, ttg_, treasury_, vault_, timelock_, guardian_)
        );
        m = TtgBatchPrimaryMarket(payable(address(new TtgV9ERC1967Proxy(address(impl), init))));
    }

    function _deployPoolV2(address owner_, address usdc_) internal returns (TtgV9ProjectPoolV2 p) {
        TtgV9ProjectPoolV2 impl = new TtgV9ProjectPoolV2();
        bytes memory init =
            abi.encodeCall(TtgV9ProjectPoolV2.initialize, (owner_, owner_, usdc_, 3_000));
        p = TtgV9ProjectPoolV2(address(new TtgV9ERC1967Proxy(address(impl), init)));
    }

    function setUp() public {
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        ttg = new MockV9Erc20("TravelTrust Governance", "TTG", 18);
        vault = _deployVault(address(ttg), timelock);
        market = _deployPreTreasuryMarket(address(usdc), address(ttg), legacyPool, address(vault), timelock, guardian);
        poolV2 = _deployPoolV2(timelock, address(usdc));

        vm.prank(timelock);
        vault.bindMarket(address(market));
        ttg.mint(address(vault), PUBLIC_INVENTORY);
        usdc.mint(buyer, 1_000_000e6);

        vm.prank(timelock);
        market.seedBatchesFromNorm();
    }

    function _snapBatches()
        internal
        view
        returns (
            uint256[5] memory caps,
            uint32[5] memory prices,
            uint256[5] memory sold,
            uint64[5] memory starts,
            uint64[5] memory ends,
            bool[5] memory armed,
            bool[5] memory closed,
            bool[5] memory frozen
        )
    {
        for (uint256 i = 1; i <= 5; i++) {
            (uint64 s, uint64 e, uint256 cap, uint32 px, uint256 so,, bool a, bool c, bool f) = market.batches(i);
            starts[i - 1] = s;
            ends[i - 1] = e;
            caps[i - 1] = cap;
            prices[i - 1] = px;
            sold[i - 1] = so;
            armed[i - 1] = a;
            closed[i - 1] = c;
            frozen[i - 1] = f;
        }
    }

    function test_upgrade_zero_drift_then_setTreasury_and_buy_to_poolV2() public {
        // Pre-upgrade purchase to legacy pool (proves PreTreasury 2-arg buy path)
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        TtgBatchPrimaryMarketPreTreasury(address(market)).buy(1, 1e6);
        assertEq(usdc.balanceOf(legacyPool), 1e6);
        assertEq(usdc.balanceOf(address(poolV2)), 0);

        (
            uint256[5] memory caps0,
            uint32[5] memory prices0,
            uint256[5] memory sold0,
            uint64[5] memory starts0,
            uint64[5] memory ends0,
            bool[5] memory armed0,
            bool[5] memory closed0,
            bool[5] memory frozen0
        ) = _snapBatches();
        uint256 seeded0 = market.seededBatchCount();
        address usdc0 = address(market.usdc());
        address ttg0 = address(market.ttg());
        address vault0 = address(market.vault());
        address tl0 = market.timelock();
        address g0 = market.guardian();
        bool paused0 = market.paused();
        uint256 wallet0 = market.walletPurchasedTtg(buyer);
        uint256 inv0 = vault.inventory();

        // UUPS upgrade Timelock-only
        TtgBatchPrimaryMarket newImpl = new TtgBatchPrimaryMarket();
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.upgradeToAndCall(address(newImpl), "");

        vm.prank(guardian);
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.upgradeToAndCall(address(newImpl), "");

        vm.prank(timelock);
        market.upgradeToAndCall(address(newImpl), "");

        assertEq(market.version(), string("ttg_batch_primary_market_v9_uups_treasury_governed"));

        (
            uint256[5] memory caps1,
            uint32[5] memory prices1,
            uint256[5] memory sold1,
            uint64[5] memory starts1,
            uint64[5] memory ends1,
            bool[5] memory armed1,
            bool[5] memory closed1,
            bool[5] memory frozen1
        ) = _snapBatches();
        for (uint256 i = 0; i < 5; i++) {
            assertEq(caps1[i], caps0[i]);
            assertEq(uint256(prices1[i]), uint256(prices0[i]));
            assertEq(sold1[i], sold0[i]);
            assertEq(uint256(starts1[i]), uint256(starts0[i]));
            assertEq(uint256(ends1[i]), uint256(ends0[i]));
            assertEq(armed1[i], armed0[i]);
            assertEq(closed1[i], closed0[i]);
            assertEq(frozen1[i], frozen0[i]);
        }
        assertEq(market.seededBatchCount(), seeded0);
        assertEq(address(market.usdc()), usdc0);
        assertEq(address(market.ttg()), ttg0);
        assertEq(address(market.vault()), vault0);
        assertEq(market.timelock(), tl0);
        assertEq(market.guardian(), g0);
        assertEq(market.paused(), paused0);
        assertEq(market.usdcTreasury(), legacyPool);
        assertEq(market.walletPurchasedTtg(buyer), wallet0);
        assertEq(vault.inventory(), inv0);

        // ACL: EOA / guardian / zero denied
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.setUsdcTreasury(address(poolV2));
        vm.prank(guardian);
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.setUsdcTreasury(address(poolV2));
        vm.prank(timelock);
        vm.expectRevert(TtgBatchPrimaryMarket.InvalidAddress.selector);
        market.setUsdcTreasury(address(0));

        vm.prank(timelock);
        market.setUsdcTreasury(address(poolV2));
        assertEq(market.usdcTreasury(), address(poolV2));

        // Post-cutover buy → ProjectPoolV2 only
        uint256 legacyBefore = usdc.balanceOf(legacyPool);
        uint256 v2Before = usdc.balanceOf(address(poolV2));
        vm.prank(buyer);
        market.buy(1, 1e6, 0, type(uint256).max);
        assertEq(usdc.balanceOf(legacyPool), legacyBefore);
        assertEq(usdc.balanceOf(address(poolV2)), v2Before + 1e6);
    }

    function test_fresh_deploy_has_setUsdcTreasury() public {
        TtgBatchPrimaryMarket impl = new TtgBatchPrimaryMarket();
        bytes memory init = abi.encodeCall(
            TtgBatchPrimaryMarket.initialize,
            (address(usdc), address(ttg), legacyPool, address(vault), timelock, guardian)
        );
        TtgBatchPrimaryMarket m =
            TtgBatchPrimaryMarket(payable(address(new TtgV9ERC1967Proxy(address(impl), init))));
        assertEq(m.version(), string("ttg_batch_primary_market_v9_uups_treasury_governed"));
        vm.prank(timelock);
        m.setUsdcTreasury(address(poolV2));
        assertEq(m.usdcTreasury(), address(poolV2));
    }
}
