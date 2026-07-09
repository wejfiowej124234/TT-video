// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "../IERC20.sol";
import {VacancyTypes} from "./VacancyTypes.sol";
import {VacancyErrors} from "./VacancyErrors.sol";
import {VacancyEvents} from "./VacancyEvents.sol";
import {VacancyGovernance} from "./VacancyGovernance.sol";
import {VacancyLedgerLib} from "./VacancyLedgerLib.sol";
import {ICountryPoolVacancyGate} from "./ICountryPoolVacancyGate.sol";

/**
 * @title UnallocatedStewardPathVault
 * @notice D-4555-B · Q-F01 45% protocol custody + Vacancy Ledger V1 core (S1).
 * @dev Zero compile dependency on CountryPoolNetProfitLedger / Settlement / API.
 */
contract UnallocatedStewardPathVault is VacancyGovernance {
    using VacancyTypes for VacancyTypes.VacancyLedger;
    using VacancyTypes for VacancyTypes.VacancyParams;
    using VacancyTypes for VacancyTypes.SweepPlan;

    bytes2 public immutable jurisdiction;
    IERC20 public immutable token;
    address public immutable ledger;
    address public immutable stewardPathVault;
    address public immutable governanceTreasury;

    address public owner;

    VacancyTypes.VacancyLedger internal _ledger;

    /// @dev Legacy counters — `totalReceived` tracks `principal` for Q-F01 indexer compat.
    uint256 public totalReceived;
    uint256 public totalReleased;

    /// @dev S3c · Governor/Timelock-managed allowlist for Restricted Treasury outflows (G-04).
    mapping(address => bool) public disburseRecipientAllowed;

    modifier onlyOwner() {
        if (msg.sender != owner) revert VacancyErrors.OnlyOwner();
        _;
    }

    modifier onlyVaultOwner() override {
        if (msg.sender != owner) revert VacancyErrors.OnlyOwner();
        _;
    }

    modifier onlyLedger() {
        if (msg.sender != ledger) revert VacancyErrors.OnlyLedger();
        _;
    }

    /// @param initialParams_ Deploy-time governance snapshot — runtime reads `vacancyParams` only (GP-01).
    constructor(
        address owner_,
        bytes2 jurisdiction_,
        address token_,
        address ledger_,
        address stewardPathVault_,
        address governanceTreasury_,
        VacancyTypes.VacancyParams memory initialParams_
    ) {
        if (owner_ == address(0) || token_ == address(0) || ledger_ == address(0)) {
            revert VacancyErrors.InvalidAddress();
        }
        if (stewardPathVault_ == address(0) || governanceTreasury_ == address(0) || uint16(jurisdiction_) == 0) {
            revert VacancyErrors.InvalidAddress();
        }
        owner = owner_;
        jurisdiction = jurisdiction_;
        token = IERC20(token_);
        ledger = ledger_;
        stewardPathVault = stewardPathVault_;
        governanceTreasury = governanceTreasury_;
        _validateParams(initialParams_);
        vacancyParams = initialParams_;
        sweepEnabled = true;
    }

    /// @notice Return on-chain VacancyLedger SSOT.
    /// @dev Spec: VL-01 | PCM: §1.1 VL-01 | Risk: Critical
    function vacancyLedger() external view returns (VacancyTypes.VacancyLedger memory) {
        return _ledger;
    }

    /// @notice Credit vacant-path deposit into Jurisdiction Reserve ledger leg.
    /// @dev Spec: VL-01, U-07 | Accounting: §6.6.2 deposit | PCM: §1.1 VL-01 | Risk: Critical
    function depositToReserve(uint256 amount, uint256 epochId) external {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert VacancyErrors.TransferFailed();
        _creditDeposit(amount, epochId);
    }

    /// @notice Ledger-only deposit wrapper (Q-F01 · no Ledger import).
    /// @dev Spec: U-01 | PCM: §1.2 U-07 | Risk: High
    function depositFromLedger(uint256 amount, uint256 epochId) external onlyLedger {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert VacancyErrors.TransferFailed();
        _creditDeposit(amount, epochId);
    }

    /// @notice Pure sweep evaluation for a quarter epoch — no side effects (TR-01 prep).
    /// @dev Spec: VL-03, VL-04, U-08 | Accounting: §6.6.5 | PCM: §1.4 TR-01 | Risk: Critical
    function evaluateVacancySweep(uint256 /* epochId */ )
        external
        view
        returns (VacancyTypes.SweepPlan memory plan)
    {
        return VacancyLedgerLib.evaluateVacancySweep(_ledgerSnapshot(), vacancyParams, sweepEnabled);
    }

    /// @notice Apply a pre-evaluated sweep plan — transfer, ledger update, events.
    /// @dev Spec: VL-01, U-07, SM-02 | PCM: §1.1 VL-01 · §1.2 U-07 | Risk: Critical
    function executeSweep(uint256 epochId, VacancyTypes.SweepPlan calldata plan) external onlyOwner {
        VacancyTypes.SweepPlan memory expected =
            VacancyLedgerLib.evaluateVacancySweep(_ledgerSnapshot(), vacancyParams, sweepEnabled);
        if (!VacancyLedgerLib.sweepPlansEqual(plan, expected)) revert VacancyErrors.InvalidSweepPlan();
        _applySweepPlan(epochId, plan);
    }

    /// @notice Quarter settlement sweep — only callable from Ledger (TR-01 · S3a).
    /// @dev Spec: TR-01, U-07 | PCM: §1.4 TR-01 | Risk: Critical
    function evaluateAndExecuteVacancySweep(uint256 epochId) external onlyLedger {
        VacancyTypes.SweepPlan memory plan =
            VacancyLedgerLib.evaluateVacancySweep(_ledgerSnapshot(), vacancyParams, sweepEnabled);
        _applySweepPlan(epochId, plan);
    }

    /// @notice DAO disburse from Jurisdiction Reserve (Timelock owner · VL-05 · S3c).
    /// @dev Spec: VL-05, G-04 | Accounting: §6.6.2 DAO disburse | PCM: §1.1 VL-05 · §1.3 G-04 | Risk: Critical
    function disburseJurisdictionReserve(uint256 amount, address recipient, bytes32 proposalRef) external onlyOwner {
        _validateDisburseRecipient(recipient);
        VacancyLedgerLib.disburseJurisdictionReserve(_ledger, amount);
        if (!token.transfer(recipient, amount)) revert VacancyErrors.TransferFailed();
        emit JurisdictionReserveDisbursed(
            VACANCY_EVENT_VERSION,
            jurisdiction,
            amount,
            recipient,
            proposalRef,
            _ledger.principal,
            _ledger.reserve,
            _ledger.swept,
            _ledger.disbursed
        );
    }

    /// @notice Allow or revoke a Restricted Treasury disburse recipient (Timelock · S3c).
    /// @dev Spec: G-04 | PCM: §1.3 G-04 · S3c | Risk: Critical
    function setDisburseRecipientAllowed(address recipient, bool allowed) external onlyOwner {
        if (recipient == address(0)) revert VacancyErrors.InvalidAddress();
        disburseRecipientAllowed[recipient] = allowed;
        emit DisburseRecipientAllowedSet(recipient, allowed);
    }

    /// @notice Timelock release to StewardPathVault when eligibility met (S3b gate · G-02).
    /// @dev Spec: G-02 | PCM: §1.3 G-02 | Risk: Critical
    function releaseToStewardPath(uint256 amount, uint256 releaseEpochId, bytes32 proposalRef) external onlyOwner {
        if (amount == 0) revert VacancyErrors.InvalidAmount();
        if (releaseEpochId <= ICountryPoolVacancyGate(ledger).stewardActivationEpochId()) {
            revert VacancyErrors.ActivationEpochLocked();
        }
        if (token.balanceOf(address(this)) < amount) revert VacancyErrors.InvalidAmount();
        VacancyLedgerLib.applyReleaseToSteward(_ledger, amount);
        if (!token.transfer(stewardPathVault, amount)) revert VacancyErrors.TransferFailed();
        totalReleased += amount;
        emit UnallocatedStewardReleased(jurisdiction, address(token), amount, proposalRef);
    }

    /// @notice Transfer vault ownership (Timelock migration).
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert VacancyErrors.InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @dev Contract version string for ops / ABI manifests.
    function version() external pure returns (string memory) {
        return "unallocated_steward_path_vault_v1";
    }

    function _creditDeposit(uint256 amount, uint256 epochId) internal {
        VacancyLedgerLib.depositToReserve(_ledger, amount);
        totalReceived += amount;
        emit UnallocatedStewardDeposit(jurisdiction, address(token), amount, epochId);
    }

    /// @dev Reserve outflows must target governance-approved Restricted Treasury recipients — not StewardPath/Ledger.
    function _validateDisburseRecipient(address recipient) internal view {
        if (recipient == address(0)) revert VacancyErrors.InvalidAddress();
        if (recipient == stewardPathVault || recipient == ledger) revert VacancyErrors.ProhibitedDisburseRecipient();
        if (!disburseRecipientAllowed[recipient]) revert VacancyErrors.RecipientNotAllowed();
    }

    function _ledgerSnapshot() internal view returns (VacancyTypes.VacancyLedger memory) {
        return VacancyTypes.VacancyLedger({
            principal: _ledger.principal,
            swept: _ledger.swept,
            reserve: _ledger.reserve,
            disbursed: _ledger.disbursed
        });
    }

    function _ledgerSnapshotForParams() internal view override returns (VacancyTypes.VacancyLedger memory) {
        return _ledgerSnapshot();
    }

    function _applySweepPlan(uint256 epochId, VacancyTypes.SweepPlan memory plan) internal {
        if (plan.sweepAmount > 0) {
            VacancyLedgerLib.applySweep(_ledger, plan);
            if (!token.transfer(governanceTreasury, plan.sweepAmount)) revert VacancyErrors.TransferFailed();
            emit SweepExecuted(
                VACANCY_EVENT_VERSION,
                jurisdiction,
                epochId,
                plan.sweepAmount,
                governanceTreasury,
                _ledger.principal,
                _ledger.reserve,
                _ledger.swept,
                _ledger.disbursed
            );
        }

        if (plan.disableSweep) {
            sweepEnabled = false;
            if (plan.reserveReached) {
                emit ReserveReached(
                    VACANCY_EVENT_VERSION,
                    jurisdiction,
                    epochId,
                    _ledger.principal,
                    _ledger.reserve,
                    _ledger.swept,
                    _ledger.disbursed
                );
            }
        }
    }
}
