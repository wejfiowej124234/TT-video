// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {VacancyTypes} from "../../../src/vacancy/VacancyTypes.sol";
import {VacancyLedgerLib} from "../../../src/vacancy/VacancyLedgerLib.sol";
import {UnallocatedStewardPathVault} from "../../../src/vacancy/UnallocatedStewardPathVault.sol";
import {MockERC20} from "../../../src/MockERC20.sol";
import "../VacancyTestParams.sol";

/// @dev Shared deploy + VL check helpers for Sprint 2 invariant suite (G22-D-05).
abstract contract VacancyInvariantFixture {
    uint256 internal constant BPS_DENOM = 10_000;
    uint256 internal constant MAX_DEPOSIT = 1_000_000_000e6;

    bytes2 internal constant J = bytes2("DE");

    MockERC20 internal usdc;
    UnallocatedStewardPathVault internal vault;

    address internal owner;
    address internal treasury;
    address internal ledgerAddr;
    address internal stewardVault;
    address internal depositor;
    address internal recipient;

    function _deployVault(VacancyTypes.VacancyParams memory params_) internal {
        owner = address(0x1001);
        treasury = address(0x1002);
        ledgerAddr = address(0x1003);
        stewardVault = address(0x1004);
        depositor = address(0x1005);
        recipient = address(0x1006);

        usdc = new MockERC20();
        vault = new UnallocatedStewardPathVault(
            owner, J, address(usdc), ledgerAddr, stewardVault, treasury, params_
        );

        usdc.mint(depositor, type(uint128).max);
    }

    function _deployVaultDefaults() internal {
        _deployVault(VacancyTestParams.ssotV1Defaults());
    }

    function _ledger() internal view returns (VacancyTypes.VacancyLedger memory) {
        return vault.vacancyLedger();
    }

    function _params() internal view returns (VacancyTypes.VacancyParams memory p) {
        (
            p.vacancySweepRateBps,
            p.vacancySweepCapBps,
            p.jurisdictionReserveBps,
            p.vacancyGraceDays,
            p.vacancySweepAutoReenable
        ) = vault.vacancyParams();
    }

    function _floorReserve(VacancyTypes.VacancyLedger memory ledger, VacancyTypes.VacancyParams memory params)
        internal
        pure
        returns (uint256)
    {
        return (ledger.principal * params.jurisdictionReserveBps) / BPS_DENOM;
    }

    function _capLimit(VacancyTypes.VacancyLedger memory ledger, VacancyTypes.VacancyParams memory params)
        internal
        pure
        returns (uint256)
    {
        return (ledger.principal * params.vacancySweepCapBps) / BPS_DENOM;
    }
}

/// @dev VL assertion library — callable from invariant contract (Test context).
library VacancyInvariantChecks {
    uint256 internal constant BPS_DENOM = 10_000;

    function checkVL01(VacancyTypes.VacancyLedger memory ledger) internal pure {
        VacancyLedgerLib.assertLedgerIdentity(ledger);
    }

    function checkVL02(VacancyTypes.VacancyLedger memory ledger) internal pure {
        require(ledger.reserve >= 0 && ledger.swept >= 0 && ledger.disbursed >= 0, "VL-02");
    }

    function checkVL03(
        VacancyTypes.VacancyLedger memory ledger,
        VacancyTypes.VacancyParams memory params
    ) internal pure {
        uint256 cap = (ledger.principal * params.vacancySweepCapBps) / BPS_DENOM;
        require(ledger.swept <= cap, "VL-03");
    }

    function checkVL04(
        VacancyTypes.VacancyLedger memory ledger,
        VacancyTypes.VacancyParams memory params,
        bool sweepEnabled
    ) internal pure {
        if (sweepEnabled || ledger.principal == 0) return;
        uint256 floor = (ledger.principal * params.jurisdictionReserveBps) / BPS_DENOM;
        require(ledger.reserve + ledger.disbursed >= floor, "VL-04");
    }

    function checkVL05(VacancyTypes.VacancyLedger memory ledger, uint256 ghostDisbursed) internal pure {
        require(ledger.disbursed == ghostDisbursed, "VL-05");
    }
}
