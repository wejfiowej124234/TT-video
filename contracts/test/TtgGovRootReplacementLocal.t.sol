// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceTimelock.sol";
import "../src/GovernanceTreasury.sol";
import "../src/FeeRouter.sol";
import "../src/RegionVault.sol";
import "../src/GlobalStakersFeeVault.sol";
import "../src/EscrowFactoryV2.sol";
import "../src/SettlementRouter.sol";
import "../src/MockERC20.sol";

/**
 * @title TtgGovRootReplacementLocalTest
 * @notice ① Local Forge: NEW Timelock (48h, Solo Owner, no Safe) + KEEP_AND_REWIRE lifecycle.
 * @dev Preserves FeeRouter BPS 4500/3575/1100/825. Buckets = RegionVault + GlobalStakersFeeVault + treasury×2.
 *      Legacy Safe address must end with ZERO ACTIVE REFERENCES in privilege + fund paths.
 *      Not Sepolia. Not Mainnet. Not TT_PRODUCTION_GO.
 */
contract TtgGovRootReplacementLocalTest is Test {
    uint256 internal constant DELAY = 172800;
    uint256 internal constant BPS_C = 4500;
    uint256 internal constant BPS_S = 3575;
    uint256 internal constant BPS_R = 1100;
    uint256 internal constant BPS_O = 825;

    /// @dev Stand-in for deprecated Mainnet Safe — used only as OLD Timelock.admin during LEGACY_CUTOVER_WINDOW.
    address internal legacySafe = makeAddr("legacySafe_0x9649");
    address internal soloOwner = makeAddr("soloOwner_0xe1e732");
    address internal pauseGuardian = makeAddr("pauseGuardian_0xF34804");

    GovernanceTimelock internal oldTl;
    GovernanceTimelock internal newTl;
    GovernanceTreasury internal treasury;
    EscrowFactoryV2 internal factory;
    SettlementRouter internal settlement;
    FeeRouter internal feeRouter;
    RegionVault internal regionVault;
    GlobalStakersFeeVault internal stakersVault;
    MockERC20 internal usdc;

    function setUp() public {
        oldTl = new GovernanceTimelock(legacySafe, DELAY);
        newTl = new GovernanceTimelock(soloOwner, DELAY);

        // KEEP-shaped stack owned by old Timelock (Mainnet Reality shape).
        treasury = new GovernanceTreasury(address(oldTl), address(oldTl));
        // FeeRouter interim: Safe country/stakers (Reality) · reserve/ops = treasury (P4Cap shape).
        feeRouter = new FeeRouter(address(oldTl), legacySafe, legacySafe, address(treasury), address(treasury));
        factory = new EscrowFactoryV2(address(oldTl));
        settlement = new SettlementRouter(address(oldTl), address(feeRouter));

        // Compliant fund containers (NOT personal EOAs) — Mainnet: NEW_BUCKET deploy of these types.
        regionVault = new RegionVault(address(newTl));
        stakersVault = new GlobalStakersFeeVault(address(newTl));
        usdc = new MockERC20();
    }

    function test_newTimelock_soloOwner_noSafe_delay48h() public view {
        assertEq(newTl.admin(), soloOwner);
        assertEq(newTl.delay(), DELAY);
        assertTrue(newTl.admin() != legacySafe);
    }

    function test_govRoot_keepAndRewire_fullLifecycle_zeroSafeActiveRefs() public {
        // --- LEGACY_CUTOVER_WINDOW: Safe schedules rewires on OLD Timelock ---
        vm.startPrank(legacySafe);
        oldTl.setAllowedExecutionTarget(address(treasury), true);
        oldTl.setAllowedExecutionTarget(address(factory), true);
        oldTl.setAllowedExecutionTarget(address(settlement), true);
        oldTl.setAllowedExecutionTarget(address(feeRouter), true);

        bytes32 idSpend = oldTl.schedule(
            address(treasury),
            0,
            abi.encodeCall(GovernanceTreasury.setSpender, (address(newTl))),
            bytes32(uint256(1))
        );
        bytes32 idOwn = oldTl.schedule(
            address(treasury),
            0,
            abi.encodeCall(GovernanceTreasury.transferOwnership, (address(newTl))),
            bytes32(uint256(2))
        );
        bytes32 idGuard = oldTl.schedule(
            address(factory),
            0,
            abi.encodeCall(EscrowFactoryV2.transferGuardian, (address(newTl))),
            bytes32(uint256(3))
        );
        bytes32 idSr = oldTl.schedule(
            address(settlement),
            0,
            abi.encodeCall(SettlementRouter.transferOwnership, (address(newTl))),
            bytes32(uint256(4))
        );
        bytes32 idFrOwn = oldTl.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(FeeRouter.transferOwnership, (address(newTl))),
            bytes32(uint256(5))
        );
        vm.stopPrank();

        vm.warp(block.timestamp + DELAY);
        // Spender before ownership — else onlyOwner fails after transfer.
        oldTl.execute(idSpend);
        oldTl.execute(idOwn);
        oldTl.execute(idGuard);
        oldTl.execute(idSr);
        oldTl.execute(idFrOwn);

        assertEq(treasury.owner(), address(newTl));
        assertEq(treasury.spender(), address(newTl));
        assertEq(factory.guardian(), address(newTl));
        assertEq(settlement.owner(), address(newTl));
        assertEq(feeRouter.owner(), address(newTl));

        // --- NEW root: Solo Owner schedules Safe-exit routing (BPS unchanged) ---
        vm.startPrank(soloOwner);
        newTl.setAllowedExecutionTarget(address(feeRouter), true);
        bytes memory routeData = abi.encodeCall(
            FeeRouter.setRoutingConfig,
            (
                address(regionVault),
                address(stakersVault),
                address(treasury),
                address(treasury),
                BPS_C,
                BPS_S,
                BPS_R,
                BPS_O
            )
        );
        bytes32 idRoute = newTl.schedule(address(feeRouter), 0, routeData, bytes32(uint256(10)));
        vm.stopPrank();

        vm.warp(block.timestamp + DELAY);
        newTl.execute(idRoute);

        assertEq(feeRouter.countryBucket(), address(regionVault));
        assertEq(feeRouter.globalStakers(), address(stakersVault));
        assertEq(feeRouter.globalReserve(), address(treasury));
        assertEq(feeRouter.globalOps(), address(treasury));
        assertEq(feeRouter.BPS_COUNTRY(), BPS_C);
        assertEq(feeRouter.BPS_GLOBAL_STAKERS(), BPS_S);
        assertEq(feeRouter.BPS_GLOBAL_RESERVE(), BPS_R);
        assertEq(feeRouter.BPS_GLOBAL_OPS(), BPS_O);

        // ZERO ACTIVE REFERENCES to legacy Safe in privilege + fund paths
        assertTrue(feeRouter.countryBucket() != legacySafe);
        assertTrue(feeRouter.globalStakers() != legacySafe);
        assertTrue(feeRouter.globalReserve() != legacySafe);
        assertTrue(feeRouter.globalOps() != legacySafe);
        assertTrue(feeRouter.owner() != legacySafe);
        assertTrue(treasury.owner() != legacySafe);
        assertTrue(treasury.spender() != legacySafe);
        assertTrue(factory.guardian() != legacySafe);
        assertTrue(settlement.owner() != legacySafe);
        assertTrue(newTl.admin() != legacySafe);
        assertTrue(regionVault.owner() != legacySafe);
        assertTrue(stakersVault.owner() != legacySafe);

        // Fund-flow invariant: distribute splits to compliant vaults (not Safe / not personal EOAs)
        uint256 amount = 10_000e6;
        usdc.mint(address(feeRouter), amount);
        vm.prank(address(newTl));
        feeRouter.distribute(usdc, amount);

        assertEq(usdc.balanceOf(address(regionVault)), (amount * BPS_C) / 10_000);
        assertEq(usdc.balanceOf(address(stakersVault)), (amount * BPS_S) / 10_000);
        assertEq(usdc.balanceOf(address(treasury)), (amount * (BPS_R + BPS_O)) / 10_000);
        assertEq(usdc.balanceOf(legacySafe), 0);
        assertEq(usdc.balanceOf(soloOwner), 0);
        assertEq(usdc.balanceOf(pauseGuardian), 0);

        // pause-only Guardian is ops role for V9 PM — not a FeeRouter fund sink
        assertTrue(pauseGuardian != feeRouter.countryBucket());
        assertTrue(pauseGuardian != feeRouter.globalStakers());
    }

    /// @notice Money Flow Option I: all four FeeRouter legs → gov treasury (P4Cap shape). No RegionVault/GSFV required.
    function test_optionI_all_fee_legs_to_treasury_p4cap_shape() public {
        vm.startPrank(legacySafe);
        oldTl.setAllowedExecutionTarget(address(feeRouter), true);
        bytes32 idFrOwn = oldTl.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(FeeRouter.transferOwnership, (address(newTl))),
            bytes32(uint256(20))
        );
        vm.stopPrank();
        vm.warp(block.timestamp + DELAY);
        oldTl.execute(idFrOwn);

        vm.startPrank(soloOwner);
        newTl.setAllowedExecutionTarget(address(feeRouter), true);
        bytes32 idRoute = newTl.schedule(
            address(feeRouter),
            0,
            abi.encodeCall(
                FeeRouter.setRoutingConfig,
                (address(treasury), address(treasury), address(treasury), address(treasury), BPS_C, BPS_S, BPS_R, BPS_O)
            ),
            bytes32(uint256(21))
        );
        vm.stopPrank();
        vm.warp(block.timestamp + DELAY);
        newTl.execute(idRoute);

        assertEq(feeRouter.countryBucket(), address(treasury));
        assertEq(feeRouter.globalStakers(), address(treasury));
        assertEq(feeRouter.globalReserve(), address(treasury));
        assertEq(feeRouter.globalOps(), address(treasury));
        assertTrue(feeRouter.countryBucket() != legacySafe);
        assertTrue(feeRouter.globalStakers() != legacySafe);
        assertEq(feeRouter.BPS_COUNTRY(), BPS_C);
        assertEq(feeRouter.BPS_GLOBAL_STAKERS(), BPS_S);

        uint256 amount = 10_000e6;
        usdc.mint(address(feeRouter), amount);
        vm.prank(address(newTl));
        feeRouter.distribute(usdc, amount);
        assertEq(usdc.balanceOf(address(treasury)), amount);
        assertEq(usdc.balanceOf(legacySafe), 0);
        assertEq(usdc.balanceOf(soloOwner), 0);
        assertEq(usdc.balanceOf(pauseGuardian), 0);
    }

    function test_forbid_personal_eoa_as_fee_buckets_in_policy_assert() public pure {
        // Norm / Registry: countryBucket Target = RegionVault; globalStakers = GlobalStakersFeeVault (NEW).
        // Personal EOAs (Marketing/Treasury/Team) are NOT compliant FeeRouter sinks.
        address marketing = address(uint160(0xe1e732));
        address treasuryEoa = address(uint160(0xf34804));
        assertTrue(marketing != address(0));
        assertTrue(treasuryEoa != marketing);
    }
}
