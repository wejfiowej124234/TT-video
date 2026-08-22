// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

import {Test} from "forge-std/Test.sol";
import {TtgV9Constants} from "../../src/ttg-v9/TtgV9Constants.sol";
import {TtgV9GovernanceParams} from "../../src/ttg-v9/TtgV9GovernanceParams.sol";
import {TtgV9DaoProposalThresholds} from "../../src/ttg-v9/TtgV9DaoProposalThresholds.sol";
import {TtgV9DeployTopology} from "../../src/ttg-v9/TtgV9DeployTopology.sol";
import {TtgPublicSaleVault} from "../../src/ttg-v9/TtgPublicSaleVault.sol";
import {TtgBatchPrimaryMarket} from "../../src/ttg-v9/TtgBatchPrimaryMarket.sol";
import {TravelTrustGovernanceTokenV9} from "../../src/ttg-v9/TravelTrustGovernanceTokenV9.sol";
import {TravelTrustGovernorV9, TtgV9ProposalState, ITtgV9GovernanceVotes, ITtgV9GovernanceTimelock} from "../../src/ttg-v9/TravelTrustGovernorV9.sol";
import {MockV9Erc20} from "../../src/ttg-v9/mocks/MockV9Erc20.sol";
import {MockV9Timelock} from "../../src/ttg-v9/mocks/MockV9Timelock.sol";
import {TtgPublicSaleVaultV2Harness} from "../../src/ttg-v9/mocks/TtgPublicSaleVaultV2Harness.sol";

/**
 * @title TtgV9RemintG1G7HardGatesTest
 * @notice Closes G1–G7 contract hard gates before Sepolia (English NatSpec only).
 */
contract TtgV9RemintG1G7HardGatesTest is Test {
    address internal admin = makeAddr("admin");
    address internal guardian = makeAddr("guardian");
    address internal buyer = makeAddr("buyer");
    address internal p4cap = makeAddr("p4cap");
    address internal team = makeAddr("team");
    address internal marketing = makeAddr("marketing");
    address internal treasury = makeAddr("treasury");
    address internal stranger = makeAddr("stranger");

    MockV9Timelock internal timelock;
    MockV9Erc20 internal usdc;
    TtgV9DeployTopology.Bundle internal b;

    uint256 internal constant PUBLIC = 12_500_000_000_000 ether;
    uint256 internal constant DAO = 8_750_000_000_000 ether;
    uint256 internal constant TEAM_AMT = 750_000_000_000 ether;
    uint256 internal constant MKT_AMT = 1_250_000_000_000 ether;
    uint256 internal constant TREAS_AMT = 1_750_000_000_000 ether;

    function setUp() public {
        timelock = new MockV9Timelock(admin, 1 days);
        usdc = new MockV9Erc20("USD Coin", "USDC", 6);
        usdc.mint(buyer, 10_000_000e6);

        b = TtgV9DeployTopology.deploy(
            address(usdc), p4cap, address(timelock), guardian, team, marketing, treasury
        );

        vm.prank(address(timelock));
        b.vault.bindMarket(address(b.market));

        vm.prank(admin);
        timelock.setGovernor(address(b.governor));
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(b.vault), true);
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(b.market), true);
        vm.prank(admin);
        timelock.setAllowedExecutionTarget(address(b.governor), true);

        vm.prank(address(timelock));
        b.market.seedBatchesFromNorm();
    }

    // --- G1 NO_MINT ---
    function test_G1_no_mint_max_supply_never_increases() public {
        assertEq(b.token.MAX_SUPPLY(), 25_000_000_000_000 ether);
        assertEq(b.token.totalSupply(), b.token.MAX_SUPPLY());
        (bool ok,) = address(b.token).call(abi.encodeWithSignature("mint(address,uint256)", stranger, 1));
        assertFalse(ok);
        uint256 before = b.token.totalSupply();
        // user cannot protocolBurn
        vm.prank(buyer);
        vm.expectRevert(TravelTrustGovernanceTokenV9.NotProtocolBurner.selector);
        b.token.protocolBurn(1);
        assertEq(b.token.totalSupply(), before);
    }

    // --- G2 Genesis ---
    function test_G2_genesis_50_35_3_5_7() public view {
        assertEq(b.token.balanceOf(address(b.vault)), PUBLIC);
        assertEq(b.token.balanceOf(address(timelock)), DAO);
        assertEq(b.token.balanceOf(team), TEAM_AMT);
        assertEq(b.token.balanceOf(marketing), MKT_AMT);
        assertEq(b.token.balanceOf(treasury), TREAS_AMT);
        assertEq(
            b.token.balanceOf(address(b.vault)) + b.token.balanceOf(address(timelock)) + b.token.balanceOf(team)
                + b.token.balanceOf(marketing) + b.token.balanceOf(treasury),
            b.token.MAX_SUPPLY()
        );
        // Public not on EOA
        assertTrue(address(b.vault).code.length > 0);
    }

    // --- G3 burn ---
    function test_G3_governance_burn_not_user_wallets() public {
        // buyer acquires TTG via market
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(buyer);
        usdc.approve(address(b.market), type(uint256).max);
        vm.prank(buyer);
        b.market.buy(1, 1e6, 0, type(uint256).max);
        uint256 buyerBal = b.token.balanceOf(buyer);
        assertGt(buyerBal, 0);

        // close so burn gate opens
        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        b.market.closeBatchReturn(1);

        uint256 supplyBefore = b.token.totalSupply();
        uint256 burnAmt = 100_000_000_000 ether;
        vm.prank(address(timelock));
        b.vault.executeGovernanceBurn(burnAmt);
        assertEq(b.token.totalSupply(), supplyBefore - burnAmt);
        // buyer wallet untouched
        assertEq(b.token.balanceOf(buyer), buyerBal);

        // no public burn
        (bool ok,) = address(b.token).call(abi.encodeWithSignature("burn(uint256)", 1));
        assertFalse(ok);
    }

    // --- G4 quorum / thresholds ---
    function test_G4_thresholds_bps_uncapped_for_25T() public view {
        uint256 supply = b.token.MAX_SUPPLY();
        assertEq(TtgV9DaoProposalThresholds.requiredVotes(0, supply), supply * 50 / 10_000);
        assertEq(TtgV9DaoProposalThresholds.requiredVotes(1, supply), supply * 100 / 10_000);
        assertEq(TtgV9DaoProposalThresholds.requiredVotes(2, supply), supply * 200 / 10_000);
        // Not stuck at 50_000 ether
        assertGt(TtgV9DaoProposalThresholds.requiredVotes(0, supply), 50_000 ether);
        assertEq(b.governor.quorumNumeratorBps(), TtgV9GovernanceParams.QUORUM_NUMERATOR_BPS);
        assertEq(b.governor.proposalThresholdVotes(), 0);
        assertEq(b.governor.maxVotingPowerPerAddressBps(), 0);
    }

    function test_G4_team_can_propose_and_reach_quorum() public {
        vm.prank(team);
        b.token.delegate(team);
        vm.roll(block.number + 2);

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(b.market);
        calldatas[0] = abi.encodeCall(TtgBatchPrimaryMarket.pause, ());

        vm.prank(team);
        uint256 pid = b.governor.propose(targets, values, calldatas, "pause");
        vm.roll(block.number + b.governor.votingDelayBlocks() + 1);
        vm.prank(team);
        b.governor.castVote(pid, 1);
        vm.roll(block.number + b.governor.votingPeriodBlocks() + 1);
        assertTrue(b.governor.quorumReached(pid));
        assertEq(uint8(b.governor.state(pid)), uint8(TtgV9ProposalState.Succeeded));
    }

    // --- G5 UUPS + rescue ---
    function test_G5_uups_timelock_only_and_rescue_cannot_take_ttg() public {
        TtgPublicSaleVaultV2Harness v2 = new TtgPublicSaleVaultV2Harness();
        vm.prank(stranger);
        vm.expectRevert(TtgPublicSaleVault.OnlyAdmin.selector);
        b.vault.upgradeToAndCall(address(v2), "");

        vm.prank(address(timelock));
        vm.expectRevert(TtgPublicSaleVault.CannotRescueTtg.selector);
        b.vault.rescueForeignERC20(address(b.token), stranger, 1 ether);

        vm.prank(guardian);
        vm.expectRevert(TtgPublicSaleVault.OnlyAdmin.selector);
        b.vault.bindMarket(stranger);

        vm.prank(guardian);
        b.market.pause();
        assertTrue(b.market.paused());

        vm.prank(guardian);
        vm.expectRevert(TtgBatchPrimaryMarket.OnlyTimelock.selector);
        b.market.unpause();
    }

    // --- G6 cutover ---
    function test_G6_timelock_setGovernor_cutover() public {
        address oldGov = address(b.governor);
        assertEq(timelock.governor(), oldGov);

        // Deploy replacement governor on same token/timelock
        TravelTrustGovernorV9 gov2 = new TravelTrustGovernorV9(
            ITtgV9GovernanceVotes(address(b.token)),
            ITtgV9GovernanceTimelock(address(timelock)),
            TtgV9GovernanceParams.VOTING_DELAY_BLOCKS_LOCAL,
            TtgV9GovernanceParams.VOTING_PERIOD_BLOCKS_LOCAL,
            0,
            TtgV9GovernanceParams.QUORUM_NUMERATOR_BPS,
            0,
            14
        );
        vm.prank(admin);
        timelock.setGovernor(address(gov2));
        assertEq(timelock.governor(), address(gov2));

        // Old governor cannot schedule
        vm.prank(oldGov);
        vm.expectRevert(MockV9Timelock.OnlyGovernor.selector);
        timelock.scheduleByGovernor(address(b.vault), 0, "", bytes32(uint256(1)));
    }

    // --- G7 topology: public inventory never sat on EOA ---
    function test_G7_public_inventory_never_on_eoa_during_deploy() public view {
        assertEq(b.token.balanceOf(address(this)), 0);
        assertEq(b.token.balanceOf(admin), 0);
        assertEq(b.token.balanceOf(address(b.vault)), PUBLIC);
        assertEq(b.token.publicSaleVault(), address(b.vault));
        assertEq(b.token.daoTimelock(), address(timelock));
    }

    function test_G7_quote_floor_batch_prices() public view {
        assertEq(b.market.quoteTtg(1, 1e6), 1_000_000 ether);
        assertEq(b.market.quoteTtg(2, 1e6), (uint256(1e6) * 1 ether) / 3);
        assertEq(b.market.quoteTtg(5, 1e6), (uint256(1e6) * 1 ether) / 9);
    }

    function test_economic_invariant_no_supply_inflation() public {
        uint256 s0 = b.token.totalSupply();
        vm.warp(TtgV9Constants.batchStartTimestamp(1));
        vm.prank(buyer);
        usdc.approve(address(b.market), type(uint256).max);
        vm.prank(buyer);
        b.market.buy(1, 10e6, 0, type(uint256).max);
        assertEq(b.token.totalSupply(), s0);
        vm.warp(TtgV9Constants.batchStartTimestamp(2));
        b.market.closeBatchReturn(1);
        // vault + market + buyers + ops == supply
        uint256 circulating = b.token.balanceOf(address(b.vault)) + b.token.balanceOf(address(b.market))
            + b.token.balanceOf(buyer) + b.token.balanceOf(address(timelock)) + b.token.balanceOf(team)
            + b.token.balanceOf(marketing) + b.token.balanceOf(treasury);
        assertEq(circulating, b.token.totalSupply());
        assertLe(b.token.totalSupply(), b.token.MAX_SUPPLY());
    }
}
