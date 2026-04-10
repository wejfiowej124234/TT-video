// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/RegionDistributionClaim.sol";
import "../src/MockERC20.sol";

/// @notice **B-115-2 / TT-B1152-REGION-DISTRIBUTION-CLAIM-FOUNDRY-001**：Region 侧 **`registerAccrual` → `claim`**；与 **B-087 InvestorDistributionClaim** 正交（独立合约 / 事件 / 错误）。
contract RegionDistributionClaimTest is Test {
    RegionDistributionClaim public claimer;
    MockERC20 public token;
    address public admin = makeAddr("admin");
    address public alice = makeAddr("alice");

    bytes32 public constant DIST_R = keccak256("region-distribution-r1");

    event RegionShareWithdrawn(bytes32 indexed distributionId, address indexed holder, uint256 amount);

    function setUp() public {
        vm.prank(admin);
        claimer = new RegionDistributionClaim(admin);
        token = new MockERC20();
    }

    /// **TT-B1152-ABI-SELECTORS-001**：与 **`contracts/abi/RegionDistributionClaim.json`** 入口 **selector** 一致（形状对齐 B-087 / B-115-3）。
    function test_B1152_abi_selectors_match_canonical_signatures() public pure {
        assertEq(
            bytes4(keccak256("claim(bytes32,uint256)")),
            RegionDistributionClaim.claim.selector
        );
        assertEq(
            bytes4(keccak256("withdrawDividend(bytes32,uint256)")),
            RegionDistributionClaim.withdrawDividend.selector
        );
        assertEq(
            bytes4(keccak256("registerAccrual(bytes32,address,address,uint256)")),
            RegionDistributionClaim.registerAccrual.selector
        );
        assertEq(
            bytes4(keccak256("registerAccrualsBatch(bytes32,address,address[],uint256[])")),
            RegionDistributionClaim.registerAccrualsBatch.selector
        );
    }

    function test_B1152_register_then_claim_transfers_and_reverts_empty() public {
        uint256 entitledAmt = 888_888;
        token.mint(address(claimer), entitledAmt);
        vm.prank(admin);
        claimer.registerAccrual(DIST_R, address(token), alice, entitledAmt);

        vm.expectEmit(true, true, true, true);
        emit RegionShareWithdrawn(DIST_R, alice, entitledAmt);
        vm.prank(alice);
        claimer.claim(DIST_R, type(uint256).max);

        assertEq(token.balanceOf(alice), entitledAmt);
        assertEq(claimer.claimable(DIST_R, alice), 0);

        vm.prank(alice);
        vm.expectRevert(RegionDistributionClaim.RegionNothingToClaim.selector);
        claimer.claim(DIST_R, 1);
    }

    function test_B1152_token_mismatch_second_register_reverts() public {
        MockERC20 token2 = new MockERC20();
        vm.prank(admin);
        claimer.registerAccrual(DIST_R, address(token), alice, 100);
        vm.prank(admin);
        vm.expectRevert(RegionDistributionClaim.RegionTokenMismatch.selector);
        claimer.registerAccrual(DIST_R, address(token2), alice, 1);
    }

    function test_B1152_batch_register_two_holders() public {
        address bob = makeAddr("bob");
        uint256 aAmt = 300;
        uint256 bAmt = 700;
        token.mint(address(claimer), aAmt + bAmt);
        address[] memory holders = new address[](2);
        holders[0] = alice;
        holders[1] = bob;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = aAmt;
        amounts[1] = bAmt;
        vm.prank(admin);
        claimer.registerAccrualsBatch(DIST_R, address(token), holders, amounts);

        vm.prank(alice);
        claimer.claim(DIST_R, type(uint256).max);
        vm.prank(bob);
        claimer.claim(DIST_R, type(uint256).max);
        assertEq(token.balanceOf(alice), aAmt);
        assertEq(token.balanceOf(bob), bAmt);
    }
}
