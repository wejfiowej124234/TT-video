// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../script/Phase2SafeExec.sol";
import "../script/DeployPhase2TimelockAdminSafe.s.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/TravelTrustGovernor.sol";

/// @dev 暴露 Phase2SafeExec 供单测
contract Phase2SafeExecHarness is Phase2SafeExec {
    function exposeConfigure(
        address safe,
        address timelock,
        address governor,
        address token,
        uint256 ownerPk
    ) external {
        configureGovernanceTimelockViaSafe(safe, timelock, governor, token, ownerPk);
    }
}

/**
 * @notice Sepolia fork · Safe admin 两阶段治理栈绑定（R-02）
 * @dev 需要 `SEPOLIA_RPC_URL` 或 `CHAIN_RPC_URL` · 无 fork 时 skip
 */
contract GovernanceSafeDeployFlowTest is Test {
    Phase2SafeExecHarness internal harness;

    uint256 internal ownerPk = 0xA11CE;
    address internal owner;
    address internal deployer = 0x104FCb93B5e097F92c93Ee4621C487C6C953D212;

    function setUp() public {
        harness = new Phase2SafeExecHarness();
        owner = vm.addr(ownerPk);
        string memory rpc = vm.envOr("SEPOLIA_RPC_URL", vm.envOr("CHAIN_RPC_URL", string("")));
        if (bytes(rpc).length == 0) {
            return;
        }
        vm.createSelectFork(rpc);
    }

    function test_SafePath_configureTimelock_onlyAdminCalls() public {
        string memory rpc = vm.envOr("SEPOLIA_RPC_URL", vm.envOr("CHAIN_RPC_URL", string("")));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
        }

        vm.deal(deployer, 10 ether);
        vm.deal(owner, 10 ether);

        address[] memory owners = new address[](1);
        owners[0] = owner;
        address factory = 0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2;
        address singleton = 0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552;

        bytes memory init = abi.encodeWithSignature(
            "setup(address[],uint256,address,bytes,address,address,uint256,address)",
            owners,
            uint256(1),
            address(0),
            bytes(""),
            address(0),
            address(0),
            uint256(0),
            payable(address(0))
        );

        vm.prank(deployer);
        address safe = IFactory(factory).createProxyWithNonce(singleton, init, uint256(keccak256("tt-safe-flow-test")));

        GovernanceVotesToken token = new GovernanceVotesToken(1_000_000 ether);
        GovernanceTimelock timelock = new GovernanceTimelock(safe, 120);
        TravelTrustGovernor gov = new TravelTrustGovernor(
            IGovernanceVotes(address(token)),
            IGovernanceTimelockForGov(address(timelock)),
            1,
            5,
            1 ether,
            1000,
            14
        );

        assertEq(timelock.admin(), safe);
        assertEq(timelock.governor(), address(0));

        vm.prank(owner);
        harness.exposeConfigure(safe, address(timelock), address(gov), address(token), ownerPk);

        assertEq(timelock.governor(), address(gov));
        assertTrue(timelock.allowedExecutionTarget(address(gov)));
        assertTrue(timelock.allowedExecutionTarget(address(token)));
    }
}

interface IFactory {
    function createProxyWithNonce(address singleton, bytes memory init, uint256 saltNonce)
        external
        returns (address);
}
