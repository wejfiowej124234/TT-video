// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/CountryPoolNetProfitLedger.sol";
import "../src/StewardPathVault.sol";
import "../src/vacancy/UnallocatedStewardPathVault.sol";
import "../src/CountryPoolNetProfitGovernancePayload.sol";

/// G23-04 · ABI / event / selector freeze regression (reads manifest topic0 table).
contract CountryPoolNetProfitAbiFreezeTest is Test {
    bytes32 internal constant TOPIC_NET_PROFIT_ACCRUED =
        0xe4a9a6793bc7bc6162d5ed748463ba3e20fd4238d14a54581887be94b48bbb35;
    bytes32 internal constant TOPIC_EPOCH_OPENED =
        0x08e96b9afbb9e663fe91a850d318a39831b93b08dcd53dcbd78c3495f59d9b7c;
    bytes32 internal constant TOPIC_EPOCH_CLOSED =
        0xfd9380a9491aa802d880cd3889e38302aeda837d7a965aa9495a9ef1329597f6;
    bytes32 internal constant TOPIC_LEDGER_FUNDED =
        0xe81c30d7f5d751f7f59a67e9f5fdb15f5eabda96d78fbd9a7fe2f2fe5829cd7e;
    bytes32 internal constant TOPIC_NET_PROFIT_SPLIT =
        0xf4f5eaf93eedea46ff19a08aa2aa34f4c250ebb92ae464b60b3d87338f423f58;
    bytes32 internal constant TOPIC_STEWARD_PATH_DEPOSIT =
        0x61f16bbb55b2478dc20d579db02c916c19141d18b94585d9b430272cf31ababd;
    bytes32 internal constant TOPIC_UNALLOC_DEPOSIT =
        0x29bbe5a5ab12ed324e4bcfb0fce9660525ccb9e237620b798b8602f9124a7289;
    bytes32 internal constant TOPIC_UNALLOC_RELEASED =
        0xefc3acdc5f8e067db4aeff3a5c12447b2da1845c81e64a52cd5aa8f8f99d7aff;

    function test_T_ABI_01_CoreSelectorsMatchManifest() public pure {
        assertEq(CountryPoolNetProfitLedger.openEpoch.selector, bytes4(0xd47859c9));
        assertEq(CountryPoolNetProfitLedger.recordAccrual.selector, bytes4(0xa53eabbe));
        assertEq(CountryPoolNetProfitLedger.recordAccrualBatch.selector, bytes4(0x017dd292));
        assertEq(CountryPoolNetProfitLedger.closeEpoch.selector, bytes4(0xd16d9057));
        assertEq(CountryPoolNetProfitLedger.fundLedgerForSplit.selector, bytes4(0xa5ccc568));
        assertEq(CountryPoolNetProfitLedger.splitNetProfit.selector, bytes4(0xc90d5363));
        assertEq(CountryPoolNetProfitLedger.setActiveStewardConfig.selector, bytes4(0x4c6043ec));
        assertEq(StewardPathVault.depositFromLedger.selector, bytes4(0x4fe38819));
        assertEq(UnallocatedStewardPathVault.releaseToStewardPath.selector, bytes4(0xdfa1aad4));
        assertEq(UnallocatedStewardPathVault.disburseJurisdictionReserve.selector, bytes4(0x0e5d6614));
        assertEq(UnallocatedStewardPathVault.setDisburseRecipientAllowed.selector, bytes4(0xf2522a68));
    }

    function test_T_ABI_02_GovernancePayloadSelectorParity() public pure {
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_OPEN_EPOCH,
            CountryPoolNetProfitLedger.openEpoch.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RECORD_ACCRUAL,
            CountryPoolNetProfitLedger.recordAccrual.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RECORD_ACCRUAL_BATCH,
            CountryPoolNetProfitLedger.recordAccrualBatch.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_CLOSE_EPOCH,
            CountryPoolNetProfitLedger.closeEpoch.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_FUND_LEDGER_FOR_SPLIT,
            CountryPoolNetProfitLedger.fundLedgerForSplit.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_SPLIT_NET_PROFIT,
            CountryPoolNetProfitLedger.splitNetProfit.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_RELEASE_UNALLOCATED,
            UnallocatedStewardPathVault.releaseToStewardPath.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_DISBURSE_JURISDICTION_RESERVE,
            UnallocatedStewardPathVault.disburseJurisdictionReserve.selector
        );
        assertEq(
            CountryPoolNetProfitGovernancePayload.CPNP_SET_DISBURSE_RECIPIENT,
            UnallocatedStewardPathVault.setDisburseRecipientAllowed.selector
        );
    }

    function test_T_ABI_03_P0EventTopic0Frozen() public pure {
        assertEq(
            keccak256(
                "NetProfitAccrued(bytes2,uint256,address,bytes32,int256,bytes32,uint64)"
            ),
            TOPIC_NET_PROFIT_ACCRUED
        );
        assertEq(keccak256("EpochOpened(bytes2,uint256,uint64,uint64)"), TOPIC_EPOCH_OPENED);
        assertEq(
            keccak256(
                "EpochClosed(bytes2,uint256,address,int256,int256,int256,uint256,uint256,int256,uint256,uint8)"
            ),
            TOPIC_EPOCH_CLOSED
        );
        assertEq(
            keccak256("LedgerFundedForSplit(bytes2,uint256,address,uint256,address)"),
            TOPIC_LEDGER_FUNDED
        );
        assertEq(
            keccak256(
                "NetProfitSplit(bytes2,uint256,address,uint256,uint256,uint256,uint256,bool,uint64,address)"
            ),
            TOPIC_NET_PROFIT_SPLIT
        );
        assertEq(
            keccak256("StewardPathDeposit(bytes2,address,uint256,uint256)"),
            TOPIC_STEWARD_PATH_DEPOSIT
        );
        assertEq(
            keccak256("UnallocatedStewardDeposit(bytes2,address,uint256,uint256)"),
            TOPIC_UNALLOC_DEPOSIT
        );
        assertEq(
            keccak256("UnallocatedStewardReleased(bytes2,address,uint256,bytes32)"),
            TOPIC_UNALLOC_RELEASED
        );
    }
}
