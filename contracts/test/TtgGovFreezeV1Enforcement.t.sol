// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/GovernanceTimelock.sol";
import "../src/TravelTrustGovernor.sol";
import "../src/GovernanceTreasuryP4Cap.sol";
import "../src/TtgPrimaryMarketV1.sol";
import "../src/TtgSeatConcentrationRegistry.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/MockERC20.sol";
import "../src/TtgGovFreezeConstants.sol";

/**
 * @title TtgGovFreezeV1EnforcementTest
 * @notice Gate-2.4 · **TTG-TOKENOMICS-FREEZE-V1** 链上 GOV-01～04 HAT（① local · ≠ Sepolia broadcast）
 */
contract TtgGovFreezeV1EnforcementTest is Test {
    address internal admin = address(this);
    address internal whale = makeAddr("whale");
    address internal voterA = makeAddr("voterA");
    address internal voterB = makeAddr("voterB");
    address internal buyer = makeAddr("buyer");

    GovernanceVotesToken internal ttg;
    MockERC20 internal usdc;
    GovernanceTimelock internal timelock;
    TravelTrustGovernor internal gov;
    GovernanceTreasuryP4Cap internal treasury;
    TtgPrimaryMarketV1 internal market;
    TtgSeatConcentrationRegistry internal seatReg;
    RegionStewardStakePool internal stakePool;

    function setUp() public {
        ttg = new GovernanceVotesToken(TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS, address(0));
        usdc = new MockERC20();

        timelock = new GovernanceTimelock(admin, TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);
        gov = new TravelTrustGovernor(
            IGovernanceVotes(address(ttg)),
            IGovernanceTimelockForGov(address(timelock)),
            1,
            20,
            1 ether,
            TtgGovFreezeConstants.GOVERNANCE_QUORUM_BPS,
            TtgGovFreezeConstants.MAX_VOTING_POWER_PER_ADDRESS_BPS,
            14
        );
        timelock.setGovernor(address(gov));
        timelock.setAllowedExecutionTarget(address(gov), true);

        treasury = new GovernanceTreasuryP4Cap(admin, address(timelock), address(usdc));
        timelock.setAllowedExecutionTarget(address(treasury), true);
        treasury.transferOwnership(address(timelock));

        market = new TtgPrimaryMarketV1(address(usdc), address(ttg), address(treasury), 1 ether);
        ttg.transfer(address(market), 2_000_000 ether);

        seatReg = new TtgSeatConcentrationRegistry(admin, address(0));
        stakePool = new RegionStewardStakePool(
            admin,
            address(ttg),
            TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
            180 days,
            30 days
        );
        seatReg.setStakePool(address(stakePool));
        stakePool.setSeatConcentrationRegistry(address(seatReg));

        ttg.transfer(whale, 5_000_000 ether);
        ttg.transfer(voterA, 500_000 ether);
        ttg.transfer(voterB, 500_000 ether);
        ttg.transfer(buyer, 100_000 ether);

        usdc.mint(buyer, 1_000_000e6);
        usdc.mint(address(treasury), 1_000_000e6);

        vm.roll(block.number + 3);
    }

    function test_GOV01_p4DeployCap_enforced_at_30_percent() public {
        assertEq(treasury.treasuryP4DeployCapBps(), 3000);
        uint256 cap = treasury.p4DeployCap();
        assertEq(cap, 300_000e6);

        vm.prank(address(timelock));
        treasury.spendP4Reserve(address(usdc), buyer, 300_000e6);
        assertEq(treasury.p4RemainingInPeriod(), 0);

        vm.prank(address(timelock));
        vm.expectRevert(GovernanceTreasuryP4Cap.P4CapExceeded.selector);
        treasury.spendP4Reserve(address(usdc), buyer, 1);
    }

    function test_GOV01_earmarked_p1p3_reduces_reserve() public {
        vm.prank(address(timelock));
        treasury.setEarmarkedP1P3(200_000e6);
        assertEq(treasury.p4DeployCap(), 240_000e6);
    }

    function test_GOV02_governor_quorum_400_bps_and_timelock_48h() public {
        assertEq(gov.quorumNumeratorBps(), 400);
        assertEq(timelock.delay(), TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);

        address[] memory targets = new address[](1);
        targets[0] = address(treasury);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(
            GovernanceTreasuryP4Cap.setEarmarkedP1P3.selector,
            uint256(0)
        );

        vm.prank(whale);
        uint256 pid = gov.propose(targets, values, calldatas, "GOV-02 quorum test");

        vm.roll(block.number + 1);
        vm.prank(whale);
        gov.castVote(pid, 1);

        vm.roll(block.number + 21);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Succeeded));

        gov.queue(pid);
        vm.warp(block.timestamp + TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS);
        gov.execute(pid);
        assertEq(treasury.earmarkedP1P3(), 0);
    }

    function test_GOV02_quorum_not_reached_when_under_4_percent() public {
        address smallVoter = makeAddr("smallVoter");
        ttg.transfer(smallVoter, 300_000 ether);
        vm.roll(block.number + 1);

        address[] memory targets = new address[](1);
        targets[0] = address(treasury);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(GovernanceTreasuryP4Cap.setEarmarkedP1P3.selector, uint256(1));

        vm.prank(smallVoter);
        uint256 pid = gov.propose(targets, values, calldatas, "low turnout");

        vm.roll(block.number + 1);
        vm.prank(smallVoter);
        gov.castVote(pid, 1);

        vm.roll(block.number + 21);
        assertEq(uint256(gov.state(pid)), uint256(ProposalState.Defeated));
    }

    function test_GOV03_max_voting_power_per_address_capped_at_4_percent() public {
        address[] memory targets = new address[](1);
        targets[0] = address(treasury);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(GovernanceTreasuryP4Cap.setEarmarkedP1P3.selector, uint256(2));

        vm.prank(whale);
        uint256 pid = gov.propose(targets, values, calldatas, "vote cap");

        vm.roll(block.number + 1);
        vm.prank(whale);
        gov.castVote(pid, 1);

        (uint256 forVotes,,) = _proposalVotes(pid);
        uint256 expectedCap = (TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS * 400) / 10_000;
        assertEq(forVotes, expectedCap);
    }

    function test_GOV03_seat_concentration_one_active_seat_per_entity() public {
        bytes32 entity = keccak256("entity-alpha");
        seatReg.bindControllingEntity(voterA, entity);
        seatReg.bindControllingEntity(voterB, entity);

        uint256 cnStake = stakePool.minStakeAmount(bytes2("CN"));
        ttg.transfer(voterA, cnStake);
        ttg.transfer(voterB, stakePool.minStakeAmount(bytes2("US")));

        vm.startPrank(voterA);
        ttg.approve(address(stakePool), cnStake);
        stakePool.stake(bytes2("CN"), cnStake, bytes32("app-cn-a"));
        vm.stopPrank();

        vm.startPrank(voterB);
        ttg.approve(address(stakePool), cnStake);
        vm.expectRevert(TtgSeatConcentrationRegistry.EntitySeatLimitExceeded.selector);
        stakePool.stake(bytes2("US"), cnStake, bytes32("app-us-b"));
        vm.stopPrank();
    }

    function test_GOV04_primary_market_per_wallet_and_round_caps() public {
        assertEq(market.perWalletCapTtg(), 25_000 ether);
        assertEq(market.minPurchaseUsdc(), 100e6);

        vm.startPrank(buyer);
        usdc.approve(address(market), type(uint256).max);

        market.purchase(0, 100e6);
        assertEq(market.walletPurchasedTtg(buyer), 100 ether);

        vm.expectRevert(TtgPrimaryMarketV1.BelowMinPurchase.selector);
        market.purchase(0, 50e6);

        market.purchase(0, 24_900e6);
        assertEq(market.walletPurchasedTtg(buyer), 24_900 ether + 100 ether);

        vm.expectRevert(TtgPrimaryMarketV1.PerWalletCapExceeded.selector);
        market.purchase(0, 200e6);
        vm.stopPrank();
    }

    function test_GOV04_round_hard_cap_enforced() public {
        for (uint256 i = 0; i < 20; i++) {
            address b = address(uint160(0x1000 + i));
            usdc.mint(b, 25_000e6);
            vm.startPrank(b);
            usdc.approve(address(market), type(uint256).max);
            market.purchase(0, 25_000e6);
            vm.stopPrank();
        }
        assertEq(market.roundSoldTtg(0), 500_000 ether);

        address extra = makeAddr("extraRound");
        usdc.mint(extra, 100e6);
        vm.startPrank(extra);
        usdc.approve(address(market), type(uint256).max);
        vm.expectRevert(TtgPrimaryMarketV1.RoundCapExceeded.selector);
        market.purchase(0, 100e6);
        vm.stopPrank();
    }

    function test_freeze_constants_match_ssot_yaml() public pure {
        assertEq(TtgGovFreezeConstants.TREASURY_P4_DEPLOY_CAP_BPS, 3000);
        assertEq(TtgGovFreezeConstants.GOVERNANCE_QUORUM_BPS, 400);
        assertEq(TtgGovFreezeConstants.GOVERNANCE_TIMELOCK_DELAY_SECONDS, 48 hours);
        assertEq(TtgGovFreezeConstants.PUBLIC_SALE_PER_WALLET_CAP_TTG, 25_000 ether);
        assertEq(TtgGovFreezeConstants.PUBLIC_SALE_MIN_PURCHASE_USDC, 100e6);
    }

    function _proposalVotes(uint256 pid) internal view returns (uint256, uint256, uint256) {
        (,,,,,,, uint256 fv, uint256 av, uint256 ab) = gov.proposals(pid);
        return (fv, av, ab);
    }
}
