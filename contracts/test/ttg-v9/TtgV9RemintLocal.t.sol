// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9Constants} from "../../src/ttg-v9/TtgV9Constants.sol";
import {TtgPublicSaleVault} from "../../src/ttg-v9/TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "../../src/ttg-v9/TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernanceTokenV9} from "../../src/ttg-v9/TravelTrustGovernanceTokenV9.sol";
import {
    TravelTrustGovernorV9,
    TtgV9ProposalState,
    ITtgV9GovernanceVotes,
    ITtgV9GovernanceTimelock
} from "../../src/ttg-v9/TravelTrustGovernorV9.sol";
import {TtgV9GovernanceParams} from "../../src/ttg-v9/TtgV9GovernanceParams.sol";
import {MockV9Erc20} from "../../src/ttg-v9/mocks/MockV9Erc20.sol";
import {MockV9Timelock} from "../../src/ttg-v9/mocks/MockV9Timelock.sol";
import {TtgPublicSaleVaultV2Harness} from "../../src/ttg-v9/mocks/TtgPublicSaleVaultV2Harness.sol";
import {TtgBatchPrimaryMarketV2Harness} from "../../src/ttg-v9/mocks/TtgBatchPrimaryMarketV2Harness.sol";
import {TtgV9DeployTopology} from "../../src/ttg-v9/TtgV9DeployTopology.sol";
import {TtgV9AtomicDeployer} from "../../src/ttg-v9/TtgV9AtomicDeployer.sol";
import {TtgV9AtomicDeployerMainnet} from "../../src/ttg-v9/TtgV9AtomicDeployerMainnet.sol";
import {TtgV9GovernanceParams} from "../../src/ttg-v9/TtgV9GovernanceParams.sol";

contract TtgV9RemintLocalTest is Test {
    event BatchCancelledUnarmed(uint256 indexed batchId, address closer);

    address internal admin = makeAddr("admin");
    address internal guardian = makeAddr("guardian");
    address internal buyer = makeAddr("buyer");
    address internal p4cap = makeAddr("p4cap");
    address internal team = makeAddr("team");
    address internal marketing = makeAddr("marketing");
    address internal treasury = makeAddr("treasury");

    MockV9Timelock internal timelock;
    MockV9Erc20 internal usdc;
    TravelTrustGovernanceTokenV9 internal ttg;
    TtgPublicSaleVault internal vault;
    TtgBatchPrimaryMarket internal market;
    TravelTrustGovernorV9 internal governor;

    uint256 internal constant PUBLIC = 12_500_000_000_000 ether;
    uint256 internal constant DAO = 8_750_000_000_000 ether;
    uint256 internal constant TEAM_AMT = 750_000_000_000 ether;
    uint256 internal constant MKT_AMT = 1_250_000_000_000 ether;
    uint256 internal constant TREAS_AMT = 1_750_000_000_000 ether;
    uint256 internal constant TOTAL = 25_000_000_000_000 ether;

    function setUp() public {
        timelock = new MockV9Timelock(admin, 1 days);
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);

        TtgV9DeployTopology.Bundle memory bundle = TtgV9DeployTopology.deploy(
            address(usdc), p4cap, address(timelock), guardian, team, marketing, treasury
        );
        ttg = bundle.token;
        vault = bundle.vault;
        market = bundle.market;
        governor = bundle.governor;

        vm.prank(address(timelock));
        vault.bindMarket(address(market));

        vm.prank(admin);
        timelock.setGovernor(address(governor));
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(market), true);
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(vault), true);
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(governor), true);

        usdc.mint(buyer, 2_000_000_000e6);

        vm.prank(address(timelock));
        market.seedBatchesFromNorm();
    }

    function test_genesis_allocation_50_35_3_5_7() public view {
        assertEq(ttg.totalSupply(), TOTAL);
        assertEq(ttg.balanceOf(address(vault)), PUBLIC);
        assertEq(ttg.balanceOf(address(timelock)), DAO);
        assertEq(ttg.balanceOf(team), TEAM_AMT);
        assertEq(ttg.balanceOf(marketing), MKT_AMT);
        assertEq(ttg.balanceOf(treasury), TREAS_AMT);
        assertEq(
            ttg.balanceOf(address(vault)) + ttg.balanceOf(address(timelock)) + ttg.balanceOf(team)
                + ttg.balanceOf(marketing) + ttg.balanceOf(treasury),
            TOTAL
        );
    }

    function test_no_mint_or_public_burn_selector() public {
        (bool ok,) = address(ttg).call(abi.encodeWithSignature("mint(address,uint256)", buyer, 1));
        assertFalse(ok);
        (bool ok2,) = address(ttg).call(abi.encodeWithSignature("burn(uint256)", 1));
        assertFalse(ok2);
        vm.prank(buyer);
        vm.expectRevert(TravelTrustGovernanceTokenV9.NotProtocolBurner.selector);
        ttg.protocolBurn(1);
    }

    function test_governance_burn_blocked_while_batch_armed() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        market.buy(1, 1e6, 0, type(uint256).max);
        // Armed unclosed → burn blocked.
        vm.expectRevert(TtgPublicSaleVault.BurnWhileBatchActiveOrArmed.selector);
        vm.prank(address(timelock));
        vault.executeGovernanceBurn(1 ether);

        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        market.closeBatchReturn(1);
        uint256 supplyBefore = ttg.totalSupply();
        vm.prank(address(timelock));
        vault.executeGovernanceBurn(500_000_000_000 ether);
        assertEq(ttg.totalSupply(), supplyBefore - 500_000_000_000 ether);
    }

    function test_batch_cancelled_unarmed_event() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        vm.expectEmit(true, false, false, true, address(market));
        emit BatchCancelledUnarmed(1, address(this));
        market.closeBatchReturn(1);
        (,,,,,,, bool closed,) = market.batches(1);
        assertTrue(closed);
    }

    function test_governor_delegate_propose_queue_execute_burn() public {
        // Ensure no open/armed batch (seeded but none armed).
        assertFalse(market.hasOpenOrArmedUnclosedBatch());

        vm.prank(team);
        ttg.delegate(team);
        vm.roll(block.number + 2);

        uint256 burnAmt = 1_000_000_000 ether;
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(vault);
        values[0] = 0;
        calldatas[0] = abi.encodeCall(TtgPublicSaleVault.executeGovernanceBurn, (burnAmt));

        uint256 supplyBefore = ttg.totalSupply();
        vm.prank(team);
        uint256 pid = governor.propose(targets, values, calldatas, "governance burn 1B");
        vm.roll(block.number + governor.votingDelayBlocks() + 1);
        vm.prank(team);
        governor.castVote(pid, 1);
        vm.roll(block.number + governor.votingPeriodBlocks() + 1);

        assertTrue(governor.quorumReached(pid));
        assertEq(uint8(governor.state(pid)), uint8(TtgV9ProposalState.Succeeded));
        governor.queue(pid);
        vm.warp(block.timestamp + 1 days + 1);
        governor.execute(pid);
        assertEq(ttg.totalSupply(), supplyBefore - burnAmt);
    }

    function test_uups_unauthorized_upgrade_reverts() public {
        TtgPublicSaleVaultV2Harness v2 = new TtgPublicSaleVaultV2Harness();
        vm.expectRevert(TtgPublicSaleVault.OnlyAdmin.selector);
        vault.upgradeToAndCall(address(v2), "");

        TtgBatchPrimaryMarketV2Harness m2 = new TtgBatchPrimaryMarketV2Harness();
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        market.upgradeToAndCall(address(m2), "");
    }

    function test_uups_timelock_upgrade_preserves_inventory_and_batches() public {
        uint256 inv = vault.inventory();
        (,, uint256 cap1, uint32 px1,,,,,) = market.batches(1);

        TtgPublicSaleVaultV2Harness v2 = new TtgPublicSaleVaultV2Harness();
        vm.prank(address(timelock));
        vault.upgradeToAndCall(address(v2), "");
        assertEq(vault.inventory(), inv);
        assertEq(vault.admin(), address(timelock));
        assertEq(vault.market(), address(market));
        assertEq(
            keccak256(bytes(TtgPublicSaleVaultV2Harness(address(vault)).version())),
            keccak256(bytes("ttg_public_sale_vault_v9_uups_v2"))
        );
        vm.prank(address(timelock));
        TtgPublicSaleVaultV2Harness(address(vault)).setUpgradeMarker(42);
        assertEq(TtgPublicSaleVaultV2Harness(address(vault)).upgradeMarker(), 42);

        TtgBatchPrimaryMarketV2Harness m2 = new TtgBatchPrimaryMarketV2Harness();
        vm.prank(address(timelock));
        market.upgradeToAndCall(address(m2), "");
        (,, uint256 cap1b, uint32 px1b,,,,,) = market.batches(1);
        assertEq(cap1b, cap1);
        assertEq(px1b, px1);
        assertEq(market.seededBatchCount(), 5);
        vm.prank(address(timelock));
        TtgBatchPrimaryMarketV2Harness(address(market)).setUpgradeMarker(7);
        assertEq(TtgBatchPrimaryMarketV2Harness(address(market)).upgradeMarker(), 7);
    }

    function test_vault_only_bound_market_pull_and_rescue_cannot_move_ttg() public {
        vm.expectRevert(TtgPublicSaleVault.OnlyMarket.selector);
        vault.pull(1 ether);

        vm.expectRevert(TtgPublicSaleVault.CannotRescueTtg.selector);
        vm.prank(address(timelock));
        vault.rescueForeignERC20(address(ttg), admin, 1 ether);

        MockV9Erc20 junk = new MockV9Erc20("JUNK", "JUNK", 18);
        junk.mint(address(vault), 100 ether);
        vm.prank(address(timelock));
        vault.rescueForeignERC20(address(junk), admin, 100 ether);
        assertEq(junk.balanceOf(admin), 100 ether);
    }

    function test_batch1_buy_return_pause() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.prank(buyer);
        market.buy(1, 1e6, 0, type(uint256).max);
        assertEq(ttg.balanceOf(buyer), 1_000_000 ether);
        assertEq(usdc.balanceOf(p4cap), 1e6);

        vm.prank(guardian);
        market.pause();
        vm.expectRevert(TtgBatchPrimaryMarket.Paused.selector);
        vm.prank(buyer);
        market.buy(1, 1e6, 0, type(uint256).max);
        // Close must work while paused (cannot trap RETURN inventory).
        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        market.closeBatchReturn(1);
        assertEq(vault.inventory(), PUBLIC - 1_000_000 ether);
        vm.prank(address(timelock));
        market.unpause();
    }

    function test_set_unopened_batch_params_timelock() public {
        uint64 newStart = uint64(TtgV9Constants.batchStartTimestamp(1) + 100);
        uint64 newEnd = uint64(TtgV9Constants.batchStartTimestamp(2));
        vm.prank(address(timelock));
        market.setUnopenedBatchParams(1, newStart, newEnd, 1_250_000_000 ether, 1);
        (uint64 s, uint64 e,,,,,,,) = market.batches(1);
        assertEq(uint256(s), uint256(newStart));
        assertEq(uint256(e), uint256(newEnd));
    }

    function test_only_current_batch_and_rounding() public {
        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        vm.prank(buyer);
        usdc.approve(address(market), type(uint256).max);
        vm.expectRevert(TtgBatchPrimaryMarket.BatchNotOpen.selector);
        vm.prank(buyer);
        market.buy(1, 1e6, 0, type(uint256).max);
        vm.prank(buyer);
        market.buy(2, 1e6, 0, type(uint256).max);
        assertEq(ttg.balanceOf(buyer), (uint256(1e6) * 1 ether) / 3);
    }

    /// @dev RT2-OPEN-01 close: AtomicDeployer leaves Vault admin=Timelock in the same constructor tx.
    function test_atomicDeployer_vaultAdminIsTimelock() public {
        MockV9Timelock tl2 = new MockV9Timelock(admin, 1 days);
        MockV9Erc20 usdc2 = new MockV9Erc20("USD Coin", "USDC", 6);
        TtgV9AtomicDeployer atomic =
            new TtgV9AtomicDeployer(address(usdc2), p4cap, address(tl2), guardian, team, marketing, treasury);
        TtgPublicSaleVault v = TtgPublicSaleVault(payable(atomic.vault()));
        assertEq(v.admin(), address(tl2));
        assertEq(address(v.ttg()), atomic.token());
        assertEq(TravelTrustGovernanceTokenV9(atomic.token()).balanceOf(atomic.vault()), PUBLIC);
    }

    /// @dev A3-OPEN-01: Mainnet factory rejects LOCAL windows; accepts MAINNET floors.
    function test_atomicDeployerMainnet_rejectsLocalWindows() public {
        MockV9Timelock tl2 = new MockV9Timelock(admin, 1 days);
        MockV9Erc20 usdc2 = new MockV9Erc20("USD Coin", "USDC", 6);
        vm.expectRevert(TtgV9AtomicDeployerMainnet.GovernorParamsBelowMainnetFloor.selector);
        new TtgV9AtomicDeployerMainnet(
            address(usdc2),
            p4cap,
            address(tl2),
            guardian,
            team,
            marketing,
            treasury,
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_LOCAL,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_LOCAL
        );
    }

    function test_atomicDeployerMainnet_productionWindows() public {
        MockV9Timelock tl2 = new MockV9Timelock(admin, 1 days);
        MockV9Erc20 usdc2 = new MockV9Erc20("USD Coin", "USDC", 6);
        TtgV9AtomicDeployerMainnet atomic = new TtgV9AtomicDeployerMainnet(
            address(usdc2),
            p4cap,
            address(tl2),
            guardian,
            team,
            marketing,
            treasury,
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_MAINNET,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_MAINNET
        );
        TravelTrustGovernorV9 g = TravelTrustGovernorV9(atomic.governor());
        assertEq(g.votingDelayBlocks(), TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_MAINNET);
        assertEq(g.votingPeriodBlocks(), TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_MAINNET);
        assertEq(TtgPublicSaleVault(payable(atomic.vault())).admin(), address(tl2));
    }
}
