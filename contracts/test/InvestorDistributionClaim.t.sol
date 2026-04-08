// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/InvestorDistributionClaim.sol";
import "../src/MockERC20.sol";

/// @notice **B-087 / TT-B087-INVESTOR-DISTRIBUTION-CLAIM-FOUNDRY-001**：`registerAccrual` → `claim`/`withdrawDividend`；首提金额与 **`entitled - claimed`** 一致；领尽后 **`NothingToClaim`**（与 **`contracts/abi/InvestorDistributionClaim.json`**、`script/Deploy.s.sol` 同源）。
contract InvestorDistributionClaimTest is Test {
    InvestorDistributionClaim public claimer;
    MockERC20 public token;
    address public admin = makeAddr("admin");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    bytes32 public constant DIST_A = keccak256("distribution-a");

    event DividendWithdrawn(bytes32 indexed distributionId, address indexed holder, uint256 amount);

    function setUp() public {
        vm.prank(admin);
        claimer = new InvestorDistributionClaim(admin);
        token = new MockERC20();
    }

    /// **TT-B087-ABI-SELECTORS-001**：与 **`contracts/abi/InvestorDistributionClaim.json`** 函数入口 **selector** 对齐（防签名漂移）。
    function test_B087_abi_selectors_match_canonical_signatures() public pure {
        assertEq(
            bytes4(keccak256("claim(bytes32,uint256)")),
            InvestorDistributionClaim.claim.selector
        );
        assertEq(
            bytes4(keccak256("withdrawDividend(bytes32,uint256)")),
            InvestorDistributionClaim.withdrawDividend.selector
        );
        assertEq(
            bytes4(keccak256("registerAccrual(bytes32,address,address,uint256)")),
            InvestorDistributionClaim.registerAccrual.selector
        );
    }

    /// **TT-B087-FIRST-CLAIM-THEN-NOTHING-001**：首提 **`claim`** 转出额 = 登记额；再提 **`NothingToClaim`**。
    function test_B087_first_claim_transfers_exact_then_second_reverts() public {
        uint256 entitledAmt = 777_777;
        token.mint(address(claimer), entitledAmt);
        vm.prank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, entitledAmt);

        vm.expectEmit(true, true, true, true);
        emit DividendWithdrawn(DIST_A, alice, entitledAmt);
        vm.prank(alice);
        claimer.claim(DIST_A, type(uint256).max);

        assertEq(token.balanceOf(alice), entitledAmt);
        assertEq(claimer.claimable(DIST_A, alice), 0);

        vm.prank(alice);
        vm.expectRevert(InvestorDistributionClaim.NothingToClaim.selector);
        claimer.claim(DIST_A, 1);
    }

    function test_FullClaim_TransferMatchesExpected() public {
        uint256 entitledAmt = 1_000_000;
        token.mint(address(claimer), entitledAmt);

        vm.startPrank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, entitledAmt);
        vm.stopPrank();

        uint256 balBefore = token.balanceOf(alice);
        vm.prank(alice);
        claimer.withdrawDividend(DIST_A, type(uint256).max);
        uint256 balAfter = token.balanceOf(alice);

        assertEq(balAfter - balBefore, entitledAmt);
        assertEq(claimer.claimable(DIST_A, alice), 0);
    }

    function test_DoubleSpendSecondClaimReverts() public {
        uint256 entitledAmt = 500_000;
        token.mint(address(claimer), entitledAmt);

        vm.prank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, entitledAmt);

        vm.startPrank(alice);
        claimer.withdrawDividend(DIST_A, entitledAmt);
        vm.expectRevert(InvestorDistributionClaim.NothingToClaim.selector);
        claimer.withdrawDividend(DIST_A, 1);
        vm.stopPrank();
    }

    function test_Claim_Alias_SameAsWithdraw() public {
        uint256 amt = 100;
        token.mint(address(claimer), amt);
        vm.prank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, amt);

        vm.prank(alice);
        claimer.claim(DIST_A, amt);
        assertEq(token.balanceOf(alice), amt);
    }

    function test_PartialThenRemainder() public {
        uint256 total = 1_000;
        token.mint(address(claimer), total);
        vm.prank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, total);

        vm.startPrank(alice);
        claimer.withdrawDividend(DIST_A, 300);
        assertEq(token.balanceOf(alice), 300);
        assertEq(claimer.claimable(DIST_A, alice), 700);

        claimer.withdrawDividend(DIST_A, type(uint256).max);
        assertEq(token.balanceOf(alice), total);
        vm.expectRevert(InvestorDistributionClaim.NothingToClaim.selector);
        claimer.withdrawDividend(DIST_A, 1);
        vm.stopPrank();
    }

    function test_TwoHolders_BothClaimExpected() public {
        token.mint(address(claimer), 1_000);
        address[] memory holders = new address[](2);
        holders[0] = alice;
        holders[1] = bob;
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 600;
        amounts[1] = 400;

        vm.prank(admin);
        claimer.registerAccrualsBatch(DIST_A, address(token), holders, amounts);

        vm.prank(alice);
        claimer.withdrawDividend(DIST_A, type(uint256).max);
        vm.prank(bob);
        claimer.withdrawDividend(DIST_A, type(uint256).max);

        assertEq(token.balanceOf(alice), 600);
        assertEq(token.balanceOf(bob), 400);
    }

    function test_RevertUnknownDistribution() public {
        vm.prank(alice);
        vm.expectRevert(InvestorDistributionClaim.UnknownDistribution.selector);
        claimer.withdrawDividend(bytes32(uint256(999)), 1);
    }

    function test_RevertTokenMismatchOnSecondRegister() public {
        MockERC20 token2 = new MockERC20();
        vm.startPrank(admin);
        claimer.registerAccrual(DIST_A, address(token), alice, 100);
        vm.expectRevert(InvestorDistributionClaim.TokenMismatch.selector);
        claimer.registerAccrual(DIST_A, address(token2), bob, 50);
        vm.stopPrank();
    }
}
