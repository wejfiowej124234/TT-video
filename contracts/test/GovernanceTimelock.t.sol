// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceTimelock.sol";
import "../src/FeeRouter.sol";
import "../src/RegionVault.sol";

/// **TT-B089-TIMELOCK-FeeRouter-001**：**`schedule` → delay → `execute`**；**`FeeRouter.owner` 须为 Timelock** 方可用 **`onlyOwner`** payload（与生产 **`call`** 语义一致）。
contract GovernanceTimelockTest is Test {
    address internal deployer = address(this);
    address internal multisig = address(0xBEEF);

    function test_b089_full_cycle_fee_router_transfer_ownership() public {
        RegionVault v = new RegionVault(deployer);
        FeeRouter router = new FeeRouter(deployer, address(v), deployer, deployer, deployer);
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 100);
        router.transferOwnership(address(tl));
        tl.setAllowedExecutionTarget(address(router), true);

        bytes memory data = abi.encodeWithSelector(FeeRouter.transferOwnership.selector, multisig);
        bytes32 salt = bytes32(uint256(1));
        bytes32 id = tl.schedule(address(router), 0, data, salt);

        assertEq(tl.hashOperation(address(router), 0, data, salt), id);
        assertEq(router.owner(), address(tl));

        vm.expectRevert(GovernanceTimelock.TooEarly.selector);
        tl.execute(id);

        vm.warp(block.timestamp + 100);
        vm.prank(address(0xAAAA));
        tl.execute(id);

        assertEq(router.owner(), multisig);
    }

    /// **TT-B089-TIMELOCK-SET-ROUTING-CONFIG-PAYLOAD-001**：**`execute`** 后 **`get*`**（四方地址 + BPS）与 **payload** 一致。
    function test_COMP_B089_timelock_execute_set_routing_config() public {
        address c0 = makeAddr("bucket0");
        address s0 = makeAddr("stakers0");
        address r0 = makeAddr("reserve0");
        address o0 = makeAddr("ops0");
        FeeRouter router = new FeeRouter(deployer, c0, s0, r0, o0);
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 50);
        router.transferOwnership(address(tl));
        tl.setAllowedExecutionTarget(address(router), true);

        address c1 = makeAddr("bucket1");
        address s1 = makeAddr("stakers1");
        address r1 = makeAddr("reserve1");
        address o1 = makeAddr("ops1");
        uint256 b0 = 4000;
        uint256 b1 = 3000;
        uint256 b2 = 2000;
        uint256 b3 = 1000;

        bytes memory data = abi.encodeWithSelector(
            FeeRouter.setRoutingConfig.selector, c1, s1, r1, o1, b0, b1, b2, b3
        );
        bytes32 salt = bytes32(uint256(42));
        bytes32 id = tl.schedule(address(router), 0, data, salt);

        vm.warp(block.timestamp + 50);
        tl.execute(id);

        assertEq(router.countryBucket(), c1);
        assertEq(router.globalStakers(), s1);
        assertEq(router.globalReserve(), r1);
        assertEq(router.globalOps(), o1);
        assertEq(router.BPS_COUNTRY(), b0);
        assertEq(router.BPS_GLOBAL_STAKERS(), b1);
        assertEq(router.BPS_GLOBAL_RESERVE(), b2);
        assertEq(router.BPS_GLOBAL_OPS(), b3);
    }

    function test_schedule_only_admin() public {
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 1);
        vm.prank(address(0xB0B));
        vm.expectRevert(GovernanceTimelock.OnlyAdmin.selector);
        tl.schedule(address(0x1), 0, hex"", bytes32(0));
    }

    function test_B407_schedule_reverts_when_target_not_allowed() public {
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 1);
        vm.expectRevert(GovernanceTimelock.TargetNotAllowed.selector);
        tl.schedule(address(0x1), 0, hex"", bytes32(0));
    }

    function test_double_schedule_same_id_reverts() public {
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 1);
        tl.setAllowedExecutionTarget(address(0x1), true);
        tl.schedule(address(0x1), 0, hex"", bytes32(0));
        vm.expectRevert(GovernanceTimelock.OperationExists.selector);
        tl.schedule(address(0x1), 0, hex"", bytes32(0));
    }

    function test_execute_unknown_reverts() public {
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 1);
        vm.expectRevert(GovernanceTimelock.UnknownOperation.selector);
        tl.execute(bytes32(uint256(999)));
    }

    function test_double_execute_reverts() public {
        RegionVault v = new RegionVault(deployer);
        FeeRouter router = new FeeRouter(deployer, address(v), deployer, deployer, deployer);
        GovernanceTimelock tl = new GovernanceTimelock(deployer, 1);
        router.transferOwnership(address(tl));
        tl.setAllowedExecutionTarget(address(router), true);
        bytes memory data = abi.encodeWithSelector(FeeRouter.transferOwnership.selector, multisig);
        bytes32 id = tl.schedule(address(router), 0, data, bytes32(uint256(2)));

        vm.warp(block.timestamp + 1);
        tl.execute(id);
        vm.expectRevert(GovernanceTimelock.AlreadyExecuted.selector);
        tl.execute(id);
    }
}
