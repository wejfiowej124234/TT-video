// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/GovernanceVotesToken.sol";
import "../src/RegionStewardStakePool.sol";
import "../src/TtgGovFreezeConstants.sol";

/**
 * @title S01StakeMinimumV311Test
 * @notice Phase A · Gap S-01 · Local Verify（①）
 */
contract S01StakeMinimumV311Test is Test {
    RegionStewardStakePool internal pool;
    GovernanceVotesToken internal ttg;

    function setUp() public {
        ttg = new GovernanceVotesToken(TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS, address(0));
        pool = new RegionStewardStakePool(
            address(this),
            address(ttg),
            TtgGovFreezeConstants.TTG_TOTAL_SUPPLY_UNITS,
            180 days,
            30 days
        );
        // constructor already bootstraps protocol-ssot jurisdictions
    }

    function test_S01_stakeMinimumTtg_matches_v311_registry_examples() public view {
        // registry/v311-stake-minimum-by-country.v1.yaml
        assertEq(pool.stakeMinimumTtg(bytes2("CN")), 400_000 ether);
        assertEq(pool.stakeMinimumTtg(bytes2("US")), 400_000 ether);
        assertEq(pool.stakeMinimumTtg(bytes2("JP")), 250_000 ether);
        assertEq(pool.stakeMinimumTtg(bytes2("FR")), 450_000 ether);
        assertEq(pool.minStakeAmount(bytes2("CN")), pool.stakeMinimumTtg(bytes2("CN")));
    }
}
