// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "forge-std/Test.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomConstants.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomMigrator.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomSeatConcentrationRegistry.sol";
import "../../src/ttg-meme-denom/TtgMemeDenomStewardMinimums.sol";

contract MockLegacyShareToken {
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(uint256 supply, address to) {
        totalSupply = supply;
        balanceOf[to] = supply;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
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

contract TtgMemeDenomMigrationTest is Test {
    address internal team = address(0x11);
    address internal dao = address(0x33);
    address internal retail = address(0x55);

    MockLegacyShareToken internal oldTtg;
    TtgMemeDenomGovernanceToken internal newTtg;
    TtgMemeDenomMigrator internal migrator;

    function setUp() public {
        oldTtg = new MockLegacyShareToken(TtgMemeDenomConstants.LIVE_SHARE_UNITS, address(this));
        oldTtg.transfer(team, 1_500_000 ether);
        oldTtg.transfer(dao, 3_500_000 ether);
        oldTtg.transfer(retail, 1 ether);

        newTtg = new TtgMemeDenomGovernanceToken(address(this), address(this), address(this));
        migrator = new TtgMemeDenomMigrator(address(this), address(oldTtg), address(newTtg));
        newTtg.transfer(address(migrator), 2_500_000 ether);
        vm.roll(block.number + 2);
    }

    function test_merge_ratio_and_conservation() public view {
        assertEq(TtgMemeDenomConstants.MERGE_RATIO, 2_500_000);
        assertEq(oldTtg.totalSupply() * TtgMemeDenomConstants.MERGE_RATIO, newTtg.totalSupply());
        assertEq(migrator.quoteNew(1 ether), 2_500_000 ether);
        assertEq(newTtg.balanceOf(address(migrator)), 2_500_000 ether);
    }

    function test_optimal_path_does_not_prefund_full_25t() public view {
        assertTrue(newTtg.balanceOf(address(migrator)) < TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS);
        assertEq(newTtg.totalSupply(), TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS);
    }

    function test_live_1_ttg_becomes_2_5m_and_still_cannot_clear_seat() public {
        vm.startPrank(retail);
        oldTtg.approve(address(migrator), type(uint256).max);
        migrator.migrateAll();
        vm.stopPrank();

        assertEq(oldTtg.balanceOf(retail), 0);
        assertEq(newTtg.balanceOf(retail), 2_500_000 ether);
        assertEq(newTtg.governanceWeightBps(retail), 0);
        assertEq(oldTtg.balanceOf(address(migrator)), 1 ether);
        assertEq(migrator.oldLocked(), 1 ether);
        assertEq(migrator.coverageBps(), 0);
        assertTrue(newTtg.balanceOf(retail) < TtgMemeDenomStewardMinimums.minStake(bytes2("AU")));
        assertTrue(newTtg.balanceOf(retail) < TtgMemeDenomStewardMinimums.minStake(bytes2("CN")));
    }

    function test_unfunded_full_migrate_reverts() public {
        vm.startPrank(team);
        oldTtg.approve(address(migrator), type(uint256).max);
        vm.expectRevert(TtgMemeDenomMigrator.InsufficientNewInventory.selector);
        migrator.migrateAll();
        vm.stopPrank();
    }

    function test_v8_seat_cap_is_live_400_bps_of_25t() public {
        TtgMemeDenomSeatConcentrationRegistry v8 =
            new TtgMemeDenomSeatConcentrationRegistry(address(this), address(this));
        assertEq(v8.maxAggregateStakePerEntity(), 1_000_000_000_000 ether);
        uint256 live400k = 400_000 ether;
        assertEq(v8.maxAggregateStakePerEntity(), live400k * TtgMemeDenomConstants.MERGE_RATIO);
        assertEq(TtgMemeDenomConstants.MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS, 400);
    }
}
