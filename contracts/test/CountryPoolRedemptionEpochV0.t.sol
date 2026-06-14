// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/CountryPoolSubVaultsV0.sol";
import "../src/CountryPoolRedemptionEpochV0.sol";
import "../src/MockERC20.sol";

contract CountryPoolRedemptionEpochV0Test is Test {
    CountryPoolSubVaultsV0 public subVaults;
    CountryPoolRedemptionEpochV0 public epoch;
    MockERC20 public usdc;

    address public admin = makeAddr("admin");
    address public investor = makeAddr("investor");

    bytes2 internal constant J_CN = bytes2("CN");

    function setUp() public {
        usdc = new MockERC20();
        vm.prank(admin);
        subVaults = new CountryPoolSubVaultsV0(admin);
        vm.prank(admin);
        epoch = new CountryPoolRedemptionEpochV0(admin, J_CN, address(usdc), 1000, 15 days);
        vm.prank(admin);
        subVaults.configureSubVaults(J_CN, makeAddr("reserve"), makeAddr("ops"), makeAddr("claim"), address(epoch));
    }

    function test_Request_Open_Settle_Claim_ProRata() public {
        vm.prank(investor);
        epoch.requestRedemption(100 ether);
        vm.prank(investor);
        epoch.requestRedemption(100 ether);

        address investor2 = makeAddr("investor2");
        vm.prank(investor2);
        epoch.requestRedemption(200 ether);

        uint256 nav = 1_000_000 ether;
        usdc.mint(admin, nav / 10);
        vm.startPrank(admin);
        usdc.approve(address(epoch), nav / 10);
        epoch.fundRedemptionVault(nav / 10);
        epoch.openEpoch(nav);
        vm.warp(block.timestamp + 15 days);
        epoch.settleEpoch();
        vm.stopPrank();

        (,,,,, uint256 payout0) = epoch.requests(0);
        assertGt(payout0, 0);
        vm.prank(investor);
        epoch.claim(0);
        assertEq(usdc.balanceOf(investor), payout0);
    }

    function test_SubVaultsVersion() public view {
        assertEq(subVaults.version(), "country_pool_sub_vaults_v0");
        assertEq(epoch.version(), "country_pool_redemption_epoch_v0");
    }
}
