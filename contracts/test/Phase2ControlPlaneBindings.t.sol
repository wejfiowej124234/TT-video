// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../script/Phase2ControlPlane.sol";
import "../src/EscrowFactory.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/GovernanceTimelock.sol";
import "../src/MockERC20.sol";

/// @dev 暴露 internal 解析供 R-02 机读验收（纯函数槽，不依赖 vm.setEnv 进程串扰）。
contract Phase2ControlPlaneHarness is Phase2ControlPlane {
    function exposeTimelockAdminFrom(address deployer, address adminEnv, uint256 chainId)
        external
        pure
        returns (address)
    {
        return resolveTimelockAdminFrom(deployer, adminEnv, chainId);
    }

    function exposeChainOwnerFrom(address deployer, address ownerEnv, address timelockEnv, uint256 chainId)
        external
        pure
        returns (address)
    {
        return resolveChainOwnerFrom(deployer, ownerEnv, timelockEnv, chainId);
    }

    function exposeEscrowFactoryGuardianFrom(
        address deployer,
        address guardianEnv,
        address timelockAddr,
        uint256 chainId
    ) external pure returns (address) {
        return resolveEscrowFactoryGuardianFrom(deployer, guardianEnv, timelockAddr, chainId);
    }
}

contract Phase2ControlPlaneBindingsTest is Test {
    Phase2ControlPlaneHarness internal h;
    address internal constant DEPLOYER = 0x1111111111111111111111111111111111111111;
    address internal constant MULTISIG = 0x2222222222222222222222222222222222222222;
    address internal constant TIMELOCK_ADDR = 0x3333333333333333333333333333333333333333;
    uint256 internal constant ANVIL = 31337;
    uint256 internal constant SEPOLIA = 11155111;

    function setUp() public {
        h = new Phase2ControlPlaneHarness();
    }

    function test_Anvil_allowsDeployerFallback() public view {
        assertEq(h.exposeTimelockAdminFrom(DEPLOYER, address(0), ANVIL), DEPLOYER);
        assertEq(h.exposeChainOwnerFrom(DEPLOYER, address(0), address(0), ANVIL), DEPLOYER);
        assertEq(h.exposeEscrowFactoryGuardianFrom(DEPLOYER, address(0), address(0), ANVIL), DEPLOYER);
    }

    function test_Sepolia_requiresTimelockAdmin_notDeployer() public {
        assertEq(h.exposeTimelockAdminFrom(DEPLOYER, MULTISIG, SEPOLIA), MULTISIG);

        vm.expectRevert(Phase2ControlPlane.Phase2DeployerEoaForbidden.selector);
        h.exposeTimelockAdminFrom(DEPLOYER, DEPLOYER, SEPOLIA);
    }

    function test_Sepolia_chainOwner_defaultsToTimelock() public view {
        assertEq(h.exposeChainOwnerFrom(DEPLOYER, address(0), TIMELOCK_ADDR, SEPOLIA), TIMELOCK_ADDR);
    }

    function test_Sepolia_factoryGuardian_defaultsToTimelock() public view {
        assertEq(h.exposeEscrowFactoryGuardianFrom(DEPLOYER, address(0), TIMELOCK_ADDR, SEPOLIA), TIMELOCK_ADDR);
    }

    function test_Sepolia_forbidsDeployerAsChainOwner() public {
        vm.expectRevert(Phase2ControlPlane.Phase2DeployerEoaForbidden.selector);
        h.exposeChainOwnerFrom(DEPLOYER, DEPLOYER, address(0), SEPOLIA);
    }

    function test_Sepolia_requiresTimelockWhenUnset() public {
        vm.expectRevert(Phase2ControlPlane.Phase2TimelockRequired.selector);
        h.exposeTimelockAdminFrom(DEPLOYER, address(0), SEPOLIA);

        vm.expectRevert(Phase2ControlPlane.Phase2TimelockRequired.selector);
        h.exposeChainOwnerFrom(DEPLOYER, address(0), address(0), SEPOLIA);

        vm.expectRevert(Phase2ControlPlane.Phase2TimelockRequired.selector);
        h.exposeEscrowFactoryGuardianFrom(DEPLOYER, address(0), address(0), SEPOLIA);
    }

    function test_deployBindings_timelockAdmin_multisig_guardian_and_owner() public {
        GovernanceTimelock tl = new GovernanceTimelock(MULTISIG, 120);
        address tlAddr = address(tl);
        EscrowFactory factory = new EscrowFactory(tlAddr);
        MockERC20 ttg = new MockERC20();
        RegionStewardStakePool pool = new RegionStewardStakePool(tlAddr, address(ttg), 10_000_000 ether, 90 days, 365 days);

        assertEq(tl.admin(), MULTISIG);
        assertEq(factory.guardian(), tlAddr);
        assertEq(pool.owner(), tlAddr);
        assertTrue(tl.admin() != DEPLOYER);
        assertTrue(factory.guardian() != DEPLOYER);
        assertTrue(pool.owner() != DEPLOYER);
    }
}
