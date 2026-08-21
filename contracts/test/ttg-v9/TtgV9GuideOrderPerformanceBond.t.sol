// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9GuideOrderPerformanceBond} from "../../src/ttg-v9/TtgV9GuideOrderPerformanceBond.sol";
import {TtgV9ERC1967Proxy} from "../../src/ttg-v9/TtgV9ERC1967Proxy.sol";
import {MockV9Erc20} from "../../src/ttg-v9/mocks/MockV9Erc20.sol";
import {MockGuideOrderBondLifecycle} from "../../src/ttg-v9/mocks/MockGuideOrderBondLifecycle.sol";

/**
 * @title TtgV9GuideOrderPerformanceBondTest
 * @notice ① Local Candidate for NEW_ORDER_BOND_MODULE_REQUIRED.
 * @dev Not Phase1 mutate · not Mainnet · not Staging · not TT_PRODUCTION_GO.
 *      Invariants: orderId bind · dual-confirm lock · refund · slash ACL · pause · rescue · replay.
 */
contract TtgV9GuideOrderPerformanceBondTest is Test {
    address internal timelock = makeAddr("timelock");
    address internal slashTreasury = makeAddr("slashTreasury");
    address internal disputeResolver = makeAddr("disputeResolver");
    address internal randomEoa = makeAddr("randomEoa");
    address internal guide = makeAddr("guide");
    address internal otherGuide = makeAddr("otherGuide");
    address internal tourist = makeAddr("tourist");

    MockV9Erc20 internal usdc;
    MockV9Erc20 internal junkToken;
    MockGuideOrderBondLifecycle internal life;
    TtgV9GuideOrderPerformanceBond internal bond;

    bytes32 internal constant ORDER_1 = keccak256("order-1");
    bytes32 internal constant ORDER_2 = keccak256("order-2");
    uint256 internal constant BOND_AMT = 500e6;

    function setUp() public {
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        junkToken = new MockV9Erc20("Junk", "JUNK", 18);
        life = new MockGuideOrderBondLifecycle();

        TtgV9GuideOrderPerformanceBond impl = new TtgV9GuideOrderPerformanceBond();
        bytes memory initData = abi.encodeCall(
            TtgV9GuideOrderPerformanceBond.initialize,
            (timelock, address(usdc), address(life), slashTreasury)
        );
        TtgV9ERC1967Proxy proxy = new TtgV9ERC1967Proxy(address(impl), initData);
        bond = TtgV9GuideOrderPerformanceBond(address(proxy));

        vm.prank(timelock);
        bond.setSlashOperator(disputeResolver, true);

        usdc.mint(guide, 10_000e6);
        usdc.mint(otherGuide, 10_000e6);
        vm.prank(guide);
        usdc.approve(address(bond), type(uint256).max);
        vm.prank(otherGuide);
        usdc.approve(address(bond), type(uint256).max);
    }

    function _confirm(bytes32 orderId, address g) internal {
        life.setConfirmed(orderId, g);
    }

    function test_lock_afterConfirm_beforeFulfill() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        (address g, uint128 amt, uint128 sl, TtgV9GuideOrderPerformanceBond.Status st,) = bond.bonds(ORDER_1);
        assertEq(g, guide);
        assertEq(amt, BOND_AMT);
        assertEq(sl, 0);
        assertTrue(st == TtgV9GuideOrderPerformanceBond.Status.Locked);
        assertEq(usdc.balanceOf(address(bond)), BOND_AMT);
    }

    function test_lock_reverts_wrongGuide() public {
        _confirm(ORDER_1, guide);
        vm.prank(otherGuide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.LockNotAllowed.selector);
        bond.lockBond(ORDER_1, BOND_AMT);
    }

    function test_lock_reverts_fulfillmentStarted() public {
        _confirm(ORDER_1, guide);
        life.setFulfillmentStarted(ORDER_1, true);
        vm.prank(guide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.LockNotAllowed.selector);
        bond.lockBond(ORDER_1, BOND_AMT);
    }

    function test_lock_reverts_duplicateOrderId() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(guide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.BondExists.selector);
        bond.lockBond(ORDER_1, BOND_AMT);
    }

    function test_lock_reverts_zeroOrderId() public {
        _confirm(bytes32(0), guide);
        vm.prank(guide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.InvalidOrderId.selector);
        bond.lockBond(bytes32(0), BOND_AMT);
    }

    function test_complete_refundsOnlyOriginalGuide() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        uint256 before = usdc.balanceOf(guide);
        vm.prank(address(life));
        bond.completeAndRefund(ORDER_1);
        assertEq(usdc.balanceOf(guide), before + BOND_AMT);
        assertEq(usdc.balanceOf(address(bond)), 0);
        (, , , TtgV9GuideOrderPerformanceBond.Status st,) = bond.bonds(ORDER_1);
        assertTrue(st == TtgV9GuideOrderPerformanceBond.Status.Completed);
    }

    function test_complete_reverts_fromEoa() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.OnlyLifecycle.selector);
        bond.completeAndRefund(ORDER_1);
    }

    function test_complete_reverts_whenDisputed() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        bond.markDisputed(ORDER_1);
        vm.prank(address(life));
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.BadStatus.selector);
        bond.completeAndRefund(ORDER_1);
    }

    function test_cancel_refunds() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        uint256 before = usdc.balanceOf(guide);
        vm.prank(address(life));
        bond.cancelAndRefund(ORDER_1);
        assertEq(usdc.balanceOf(guide), before + BOND_AMT);
    }

    function test_slash_partial_then_complete() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(disputeResolver);
        bond.slash(ORDER_1, 100e6);
        assertEq(usdc.balanceOf(slashTreasury), 100e6);
        uint256 before = usdc.balanceOf(guide);
        vm.prank(address(life));
        bond.completeAndRefund(ORDER_1);
        assertEq(usdc.balanceOf(guide), before + 400e6);
    }

    function test_slash_reverts_randomEoa() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.OnlySlashOperator.selector);
        bond.slash(ORDER_1, 1);
    }

    function test_slash_full_inDispute_then_settle() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        bond.markDisputed(ORDER_1);
        vm.prank(disputeResolver);
        bond.slash(ORDER_1, BOND_AMT);
        assertEq(usdc.balanceOf(slashTreasury), BOND_AMT);
        vm.prank(address(life));
        bond.settleAfterDispute(ORDER_1);
        (, , , TtgV9GuideOrderPerformanceBond.Status st,) = bond.bonds(ORDER_1);
        assertTrue(st == TtgV9GuideOrderPerformanceBond.Status.Closed);
    }

    function test_slash_partial_dispute_settle_refundsRemainder() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        bond.markDisputed(ORDER_1);
        vm.prank(timelock);
        bond.slash(ORDER_1, 200e6);
        uint256 before = usdc.balanceOf(guide);
        vm.prank(address(life));
        bond.settleAfterDispute(ORDER_1);
        assertEq(usdc.balanceOf(guide), before + 300e6);
    }

    function test_slash_exceedsRemaining_reverts() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(disputeResolver);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.SlashExceedsRemaining.selector);
        bond.slash(ORDER_1, BOND_AMT + 1);
    }

    function test_refund_duringDispute_viaComplete_reverts() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        bond.markDisputed(ORDER_1);
        vm.prank(address(life));
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.BadStatus.selector);
        bond.cancelAndRefund(ORDER_1);
    }

    function test_pause_blocksLock_allowsSlash() public {
        _confirm(ORDER_1, guide);
        vm.prank(timelock);
        bond.setPaused(true);
        vm.prank(guide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.Paused.selector);
        bond.lockBond(ORDER_1, BOND_AMT);

        vm.prank(timelock);
        bond.setPaused(false);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(timelock);
        bond.setPaused(true);
        vm.prank(disputeResolver);
        bond.slash(ORDER_1, 50e6);
        assertEq(usdc.balanceOf(slashTreasury), 50e6);
    }

    function test_rescue_rejectsUsdc_allowsJunk() public {
        junkToken.mint(address(bond), 1e18);
        vm.prank(timelock);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.CannotRescueUsdc.selector);
        bond.rescueERC20(address(usdc), timelock, 1);

        vm.prank(timelock);
        bond.rescueERC20(address(junkToken), timelock, 1e18);
        assertEq(junkToken.balanceOf(timelock), 1e18);
    }

    function test_upgrade_onlyTimelock() public {
        TtgV9GuideOrderPerformanceBond newImpl = new TtgV9GuideOrderPerformanceBond();
        vm.prank(randomEoa);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.OnlyOwner.selector);
        bond.upgradeToAndCall(address(newImpl), "");

        vm.prank(timelock);
        bond.upgradeToAndCall(address(newImpl), "");
    }

    function test_independentOrders_noCrossTalk() public {
        _confirm(ORDER_1, guide);
        _confirm(ORDER_2, otherGuide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(otherGuide);
        bond.lockBond(ORDER_2, 300e6);
        vm.prank(address(life));
        bond.completeAndRefund(ORDER_1);
        assertEq(bond.remainingBond(ORDER_2), 300e6);
        assertEq(usdc.balanceOf(address(bond)), 300e6);
    }

    function test_merchant_notInModule_noMerchantApi() public view {
        // Compile-time / surface: no stakeAsMerchant / merchant role on this module.
        assertEq(keccak256(bytes(bond.version())), keccak256("ttg_v9_guide_order_performance_bond_v1"));
    }

    function test_doubleComplete_reverts() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        bond.completeAndRefund(ORDER_1);
        vm.prank(address(life));
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.BadStatus.selector);
        bond.completeAndRefund(ORDER_1);
    }

    function test_wrongOrderId_complete_reverts() public {
        _confirm(ORDER_1, guide);
        vm.prank(guide);
        bond.lockBond(ORDER_1, BOND_AMT);
        vm.prank(address(life));
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.BadStatus.selector);
        bond.completeAndRefund(ORDER_2);
    }
}

/// @dev Malicious token attempting reentrancy on transferFrom during lock.
contract ReentrantUsdc {
    string public name = "rUSDC";
    string public symbol = "rUSDC";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    TtgV9GuideOrderPerformanceBond public target;
    bytes32 public orderId;
    bool public attack;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "bal");
        unchecked {
            balanceOf[msg.sender] -= amount;
            balanceOf[to] += amount;
        }
        return true;
    }

    function setAttack(TtgV9GuideOrderPerformanceBond t, bytes32 id) external {
        target = t;
        orderId = id;
        attack = true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "allow");
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
        }
        uint256 bal = balanceOf[from];
        require(bal >= amount, "bal");
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        if (attack && address(target) != address(0)) {
            attack = false;
            target.lockBond(orderId, 1);
        }
        return true;
    }
}

contract TtgV9GuideOrderBondReentrancyTest is Test {
    function test_reentrancy_onLock_reverts() public {
        address timelock = makeAddr("tl");
        address treasury = makeAddr("tr");
        address guide = makeAddr("g");
        ReentrantUsdc token = new ReentrantUsdc();
        MockGuideOrderBondLifecycle life = new MockGuideOrderBondLifecycle();
        TtgV9GuideOrderPerformanceBond impl = new TtgV9GuideOrderPerformanceBond();
        bytes memory initData = abi.encodeCall(
            TtgV9GuideOrderPerformanceBond.initialize, (timelock, address(token), address(life), treasury)
        );
        TtgV9GuideOrderPerformanceBond bond =
            TtgV9GuideOrderPerformanceBond(address(new TtgV9ERC1967Proxy(address(impl), initData)));

        bytes32 oid = keccak256("reenter");
        life.setConfirmed(oid, guide);
        token.mint(guide, 1000e6);
        vm.prank(guide);
        token.approve(address(bond), type(uint256).max);
        token.setAttack(bond, oid);

        vm.prank(guide);
        vm.expectRevert(TtgV9GuideOrderPerformanceBond.Reentrancy.selector);
        bond.lockBond(oid, 100e6);
    }
}
