// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomConstants.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomProposalThresholds.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomPrimaryMarket.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomGovernor.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomStewardMinimums.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomSeatConcentrationRegistry.sol";

contract MockUsdc6 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint8 public decimals = 6;

    function credit(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        if (balanceOf[msg.sender] < amount) return false;
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (balanceOf[from] < amount) return false;
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) return false;
            allowance[from][msg.sender] = allowed - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/**
 * @notice Local ① verify for Owner pin V8:
 *         1 USDC = 100_000 TTG · 25T fixed · CN 4% = 1T = 10,000,000 USDC.
 */
contract TtgMemeDenomTokenomicsTest is Test {
    address internal team = address(0x11);
    address internal dao = address(0x33);
    address internal buyer = address(0x44);
    address internal usdcSink = address(0x55);
    address internal france = address(0x66);
    address internal retail = address(0x77);

    MockUsdc6 internal usdc;
    TtgMemeDenomGovernanceToken internal ttg;
    TtgMemeDenomPrimaryMarket internal pm;

    function setUp() public {
        usdc = new MockUsdc6();
        ttg = new TtgMemeDenomGovernanceToken(team, dao, address(this));
        pm = new TtgMemeDenomPrimaryMarket(address(usdc), address(ttg), usdcSink, TtgMemeDenomConstants.TTG_PER_USDC_UNIT);
        ttg.transfer(address(pm), TtgMemeDenomConstants.PUBLIC_SALE_TTG);
        usdc.credit(buyer, 2_000_000_000e6);
        vm.prank(buyer);
        usdc.approve(address(pm), type(uint256).max);
        vm.roll(block.number + 2);
    }

    function test_supply_is_25t_and_compiler_is_0_8_26() public view {
        assertEq(TtgMemeDenomConstants.LIVE_SHARE_UNITS, 10_000_000 ether);
        assertEq(TtgMemeDenomConstants.MERGE_RATIO, 2_500_000);
        assertEq(ttg.totalSupply(), 25_000_000_000_000 ether);
        assertEq(
            ttg.totalSupply(), TtgMemeDenomConstants.LIVE_SHARE_UNITS * TtgMemeDenomConstants.MERGE_RATIO
        );
        assertEq(ttg.decimals(), 18);
        assertEq(ttg.COMPILER_TARGET(), "0.8.26");
        assertEq(ttg.candidateId(), "TTG-25T-BPS-SEAT-FIXED-SUPPLY-CANDIDATE-V8");
    }

    function test_allocation_15_35_50() public view {
        assertEq(ttg.balanceOf(team), TtgMemeDenomConstants.TEAM_TTG);
        assertEq(ttg.balanceOf(dao), TtgMemeDenomConstants.DAO_TREASURY_TTG);
        assertEq(ttg.balanceOf(address(pm)), TtgMemeDenomConstants.PUBLIC_SALE_TTG);
        assertEq(ttg.governanceWeightBps(team), 1500);
        assertEq(ttg.governanceWeightBps(dao), 3500);
        assertEq(ttg.governanceWeightBps(address(pm)), 5000);
    }

    function test_official_quote_is_1_usdc_equals_100000_ttg() public view {
        assertEq(pm.minPurchaseUsdc(), 1e6);
        assertEq(pm.perWalletCapTtg(), 0);
        assertEq(pm.quoteTtg(1e6), 100_000 ether);
        assertEq(pm.quoteTtg(10e6), 1_000_000 ether);
        assertEq(pm.quoteTtg(25e6), 2_500_000 ether);
    }

    function test_initial_fdv_is_250m() public view {
        uint256 fdvUsdc = (ttg.totalSupply() * 1e6) / TtgMemeDenomConstants.TTG_PER_USDC_UNIT;
        assertEq(fdvUsdc, TtgMemeDenomConstants.INITIAL_FDV_USDC);
        assertEq(fdvUsdc, 250_000_000e6);
    }

    function test_cn_4pct_is_1t_equals_10m_usdc() public view {
        uint256 cnTtg = TtgMemeDenomStewardMinimums.minStake(bytes2("CN"));
        assertEq(cnTtg, 1_000_000_000_000 ether);
        uint256 cnUsdc = (cnTtg * 1e6) / TtgMemeDenomConstants.TTG_PER_USDC_UNIT;
        assertEq(cnUsdc, TtgMemeDenomConstants.CN_STEWARD_USDC);
        assertEq(TtgMemeDenomStewardMinimums.minStake(bytes2("FR")), 1_125_000_000_000 ether);
        assertEq(TtgMemeDenomStewardMinimums.minStake(bytes2("ES")), 1_125_000_000_000 ether);
        assertEq(TtgMemeDenomStewardMinimums.minStake(bytes2("JP")), 625_000_000_000 ether);
        assertEq(TtgMemeDenomStewardMinimums.minStake(bytes2("SG")), 500_000_000_000 ether);
        assertEq(TtgMemeDenomStewardMinimums.minStake(bytes2("AU")), 375_000_000_000 ether);
    }

    function test_purchase_1_usdc_gets_100000_ttg() public {
        uint256 supplyBefore = ttg.totalSupply();
        vm.prank(buyer);
        pm.purchase(0, 1e6);
        assertEq(ttg.balanceOf(buyer), 100_000 ether);
        assertEq(usdc.balanceOf(usdcSink), 1e6);
        assertEq(ttg.governanceWeightBps(buyer), 0);
        assertEq(ttg.totalSupply(), supplyBefore);
        assertEq(pm.walletPurchasedTtg(buyer), 100_000 ether);
    }

    function test_purchase_10_usdc_gets_1000000_ttg() public {
        uint256 supplyBefore = ttg.totalSupply();
        vm.prank(buyer);
        pm.purchase(0, 10e6);
        assertEq(ttg.balanceOf(buyer), 1_000_000 ether);
        assertEq(usdc.balanceOf(usdcSink), 10e6);
        assertEq(ttg.governanceWeightBps(buyer), 0);
        assertEq(ttg.totalSupply(), supplyBefore);
        assertEq(pm.walletPurchasedTtg(buyer), 1_000_000 ether);
    }

    function test_no_public_supply_increase_selector() public {
        uint256 supplyBefore = ttg.totalSupply();
        (bool ok,) = address(ttg).call(abi.encodeWithSignature("mint(address,uint256)", buyer, 1 ether));
        assertFalse(ok);
        (bool ok2,) = address(ttg).call(abi.encodeWithSignature("_mint(address,uint256)", buyer, 1 ether));
        assertFalse(ok2);
        assertEq(ttg.totalSupply(), supplyBefore);
    }

    function test_min_purchase_is_1_usdc_owner_ed_vs_live_10() public {
        vm.prank(buyer);
        vm.expectRevert(TtgMemeDenomPrimaryMarket.BelowMinPurchase.selector);
        pm.purchase(0, 1e6 - 1);
        vm.prank(buyer);
        pm.purchase(0, 1e6);
        assertEq(ttg.balanceOf(buyer), 100_000 ether);
        vm.prank(buyer);
        pm.purchase(0, 10e6);
        assertEq(ttg.balanceOf(buyer), 1_100_000 ether);
    }

    function test_round_caps_sum_to_public_sale() public view {
        uint256 sum = pm.roundCapTtg(0) + pm.roundCapTtg(1) + pm.roundCapTtg(2);
        assertEq(sum, TtgMemeDenomConstants.PUBLIC_SALE_TTG);
        assertEq(pm.roundCapTtg(0), 2_000_000_000_000 ether);
        assertEq(pm.roundCapTtg(1), 3_000_000_000_000 ether);
        assertEq(pm.roundCapTtg(2), 7_500_000_000_000 ether);
    }

    function test_proposal_clamps_are_live_v311_times_merge_ratio() public view {
        uint256 supply = TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS;
        uint256 ordinary = TtgMemeDenomProposalThresholds.requiredVotes(0, supply);
        assertEq(ordinary, 125_000_000_000 ether);
        assertEq(ordinary, 50_000 ether * TtgMemeDenomConstants.MERGE_RATIO);
        assertTrue(ordinary != 5_000 ether);
        assertEq(TtgMemeDenomProposalThresholds.requiredVotes(1, supply), 250_000_000_000 ether);
        assertEq(TtgMemeDenomProposalThresholds.requiredVotes(2, supply), 500_000_000_000 ether);
    }

    function test_governor_team_15pct_can_propose_ordinary() public {
        TtgMemeDenomGovernor gov = _newGovernor();

        address[] memory targets = new address[](1);
        targets[0] = address(gov);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(TtgMemeDenomGovernor.setOrderRatingReviewWindowDays.selector, 21);

        vm.prank(buyer);
        vm.expectRevert(TtgMemeDenomGovernor.GovThreshold.selector);
        gov.propose(targets, values, calldatas, "0 TTG cannot clear 0.5% ordinary");

        vm.prank(team);
        uint256 pid = gov.propose(targets, values, calldatas, "team 15% clears 0.5%");
        assertEq(pid, 1);
        assertEq(gov.proposalThresholdForTier(0), 125_000_000_000 ether);
    }

    function test_live_quorum_france_4_5pct_can_open_meeting_alone() public {
        uint256 frMin = TtgMemeDenomStewardMinimums.minStake(bytes2("FR"));
        vm.prank(team);
        ttg.transfer(france, frMin);
        vm.roll(block.number + 2);

        TtgMemeDenomGovernor gov = _newGovernor();
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = _dummyProposal(gov);
        vm.prank(team);
        uint256 pid = gov.propose(targets, values, calldatas, "live quorum");
        (,, uint256 voteStart,,,,,,,) = gov.proposals(pid);
        vm.roll(voteStart);

        vm.prank(france);
        gov.castVote(pid, 1);
        assertTrue(gov.quorumReached(pid));
    }

    function test_no_token_lock_module_selector() public {
        (bool ok,) = address(ttg).call(abi.encodeWithSignature("setLockModule(address)", address(this)));
        assertFalse(ok);
        (bool ok2,) = address(ttg).call(abi.encodeWithSignature("lockedBalance(address)", buyer));
        assertFalse(ok2);
    }

    function test_seat_cap_is_live_400_bps() public {
        TtgMemeDenomSeatConcentrationRegistry v8 =
            new TtgMemeDenomSeatConcentrationRegistry(address(this), address(this));
        assertEq(v8.maxAggregateStakePerEntity(), 1_000_000_000_000 ether);
        assertEq(TtgMemeDenomConstants.MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS, 400);
    }

    function test_no_transfer_tax_and_supply_fixed() public {
        vm.prank(team);
        ttg.transfer(buyer, 1 ether);
        assertEq(ttg.balanceOf(buyer), 1 ether);
        assertEq(ttg.totalSupply(), 25_000_000_000_000 ether);
    }

    function _newGovernor() internal returns (TtgMemeDenomGovernor) {
        return new TtgMemeDenomGovernor(
            ITtgMemeDenomVotes(address(ttg)),
            ITtgMemeDenomTimelock(address(this)),
            1,
            5,
            0,
            TtgMemeDenomConstants.GOVERNANCE_QUORUM_BPS,
            0,
            14
        );
    }

    function _dummyProposal(TtgMemeDenomGovernor gov)
        internal
        pure
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        targets = new address[](1);
        targets[0] = address(gov);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(TtgMemeDenomGovernor.setOrderRatingReviewWindowDays.selector, 21);
    }
}
