// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9Constants} from "../../src/ttg-v9/TtgV9Constants.sol";
import {TtgPublicSaleVault} from "../../src/ttg-v9/TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "../../src/ttg-v9/TtgBatchPrimaryMarket.sol";
import {TtgV9ERC1967Proxy} from "../../src/ttg-v9/TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "./MockV9Erc20.sol";

contract TtgV9BatchPrimaryMarketTest is Test {
    address internal timelock = makeAddr("timelock");
    address internal guardian = makeAddr("guardian");
    address internal buyer = makeAddr("buyer");
    address internal p4cap = makeAddr("p4cap");

    MockV9Erc20 internal usdc;
    MockV9Erc20 internal ttg;
    TtgPublicSaleVault internal vault;
    TtgBatchPrimaryMarket internal market;

    uint256 internal constant PUBLIC_INVENTORY = 12_500_000_000_000 ether;

    function _deployVault(address ttg_, address admin_) internal returns (TtgPublicSaleVault v) {
        TtgPublicSaleVault impl = new TtgPublicSaleVault();
        bytes memory init = abi.encodeCall(TtgPublicSaleVault.initialize, (ttg_, admin_));
        v = TtgPublicSaleVault(payable(address(new TtgV9ERC1967Proxy(address(impl), init))));
    }

    function _deployMarket(
        address usdc_,
        address ttg_,
        address treasury_,
        address vault_,
        address timelock_,
        address guardian_
    ) internal returns (TtgBatchPrimaryMarket m) {
        TtgBatchPrimaryMarket impl = new TtgBatchPrimaryMarket();
        bytes memory init = abi.encodeCall(
            TtgBatchPrimaryMarket.initialize, (usdc_, ttg_, treasury_, vault_, timelock_, guardian_)
        );
        m = TtgBatchPrimaryMarket(payable(address(new TtgV9ERC1967Proxy(address(impl), init))));
    }

    function setUp() public {
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        ttg = new MockV9Erc20("TravelTrust Governance", "TTG", 18);
        vault = _deployVault(address(ttg), timelock);
        market = _deployMarket(address(usdc), address(ttg), p4cap, address(vault), timelock, guardian);

        vm.prank(timelock);
        vault.bindMarket(address(market));

        ttg.mint(address(vault), PUBLIC_INVENTORY);
        usdc.mint(buyer, 1_000_000e6);

        vm.prank(timelock);
        market.seedBatchesFromNorm();
    }

    function test_norm_pins_caps_and_prices() public view {
        (,, uint256 cap1, uint32 px1,,,,,) = market.batches(1);
        (,, uint256 cap2, uint32 px2,,,,,) = market.batches(2);
        (,, uint256 cap5, uint32 px5,,,,,) = market.batches(5);
        assertEq(cap1, 1_250_000_000 ether);
        assertEq(cap2, 3_750_000_000 ether);
        assertEq(cap5, 2_025_000_000_000 ether);
        assertEq(uint256(px1), 1);
        assertEq(uint256(px2), 3);
        assertEq(uint256(px5), 9);
        assertEq(cap1 + cap2 + 18_750_000_000 ether + 168_750_000_000 ether + cap5, 2_217_500_000_000 ether);
    }

    function test_buy_before_start_reverts() public {
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.expectRevert(TtgBatchPrimaryMarket.BatchNotOpen.selector);
        vm.prank(buyer);
        market.buy(1, 1e6);
    }

    function test_batch1_one_usdc_yields_one_million_ttg() public {
        uint256 start = TtgV9Constants.batchStartTimestamp(1);
        vm.warp(start);
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        market.buy(1, 1e6);
        assertEq(ttg.balanceOf(buyer), 1_000_000 ether);
        assertEq(usdc.balanceOf(p4cap), 1e6);
        (,,,, uint256 sold,,,,) = market.batches(1);
        assertEq(sold, 1_000_000 ether);
        (,,,,,, bool armed, bool closed, bool frozen) = market.batches(1);
        assertTrue(armed);
        assertTrue(frozen);
        assertFalse(closed);
    }

    function test_only_current_batch_buyable() public {
        uint256 start2 = TtgV9Constants.batchStartTimestamp(2);
        vm.warp(start2);
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.expectRevert(TtgBatchPrimaryMarket.BatchNotOpen.selector);
        vm.prank(buyer);
        market.buy(1, 1e6);
        vm.prank(buyer);
        market.buy(2, 1e6);
        assertEq(ttg.balanceOf(buyer), (uint256(1e6) * 1 ether) / 3);
    }

    function test_pause_blocks_buy_and_guardian_can_pause() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(guardian);
        market.pause();
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.expectRevert(TtgBatchPrimaryMarket.Paused.selector);
        vm.prank(buyer);
        market.buy(1, 1e6);
        vm.prank(timelock);
        market.unpause();
        vm.prank(buyer);
        market.buy(1, 1e6);
        assertEq(ttg.balanceOf(buyer), 1_000_000 ether);
    }

    function test_non_timelock_cannot_seed_twice() public {
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.seedBatchesFromNorm();
    }

    function test_close_return_restores_vault_inventory() public {
        uint256 start = TtgV9Constants.batchStartTimestamp(1);
        uint256 end = TtgV9Constants.batchStartTimestamp(2);
        vm.warp(start);
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        market.buy(1, 1e6);
        uint256 vaultAfterArmBuy = vault.inventory();
        assertEq(vaultAfterArmBuy, PUBLIC_INVENTORY - 1_250_000_000 ether);
        vm.warp(end);
        market.closeBatchReturn(1);
        assertEq(vault.inventory(), PUBLIC_INVENTORY - 1_000_000 ether);
        (,,,,,,, bool closed,) = market.batches(1);
        assertTrue(closed);
    }

    function test_no_close_batch_burn_selector() public {
        (bool ok,) = address(market).call(abi.encodeWithSignature("closeBatchBurn(uint256)", 1));
        assertFalse(ok);
    }

    function test_cap_exceeded() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        usdc.mint(buyer, 2_000_000_000e6);
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        market.buy(1, 1250e6);
        vm.expectRevert(TtgBatchPrimaryMarket.CapExceeded.selector);
        vm.prank(buyer);
        market.buy(1, 1e6);
    }

    function test_too_early_permissionless_close() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.expectRevert(TtgBatchPrimaryMarket.TooEarlyToClose.selector);
        market.closeBatchReturn(1);
    }

    function test_vault_only_market_pull() public {
        vm.expectRevert(TtgPublicSaleVault.OnlyMarket.selector);
        vault.pull(1 ether);
    }

    function test_version_and_min() public view {
        assertEq(market.minPurchaseUsdc(), uint256(1e6));
        assertEq(market.version(), string("ttg_batch_primary_market_v9_uups_treasury_governed"));
    }

    function test_seed_batches_rehearsal_short_windows() public {
        TtgPublicSaleVault v2 = _deployVault(address(ttg), timelock);
        TtgBatchPrimaryMarket m2 =
            _deployMarket(address(usdc), address(ttg), p4cap, address(v2), timelock, guardian);
        vm.prank(timelock);
        v2.bindMarket(address(m2));
        ttg.mint(address(v2), PUBLIC_INVENTORY);

        uint64 first = uint64(block.timestamp + 10);
        uint64 window = 60;
        vm.prank(timelock);
        m2.seedBatchesRehearsal(first, window);
        (uint64 s1, uint64 e1, uint256 cap1, uint32 px1,,,,,) = m2.batches(1);
        (uint64 s2, uint64 e2,,,,,,,) = m2.batches(2);
        assertEq(uint256(s1), uint256(first));
        assertEq(uint256(e1), uint256(first + window));
        assertEq(uint256(s2), uint256(first + window));
        assertEq(uint256(e2), uint256(first + 2 * window));
        assertEq(cap1, 1_250_000_000 ether);
        assertEq(uint256(px1), 1);
    }
}
