// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";
import "./StewardPathVault.sol";
import "./UnallocatedStewardPathVault.sol";

interface IRegionStewardStakePool {
    function hasJurisdictionStake(address user, bytes2 jurisdiction) external view returns (bool);

    function minStakeAmount(bytes2 jurisdiction) external view returns (uint256);

    function stakes(address user, bytes2 jurisdiction)
        external
        view
        returns (
            uint256 amount,
            bytes32 applicationId,
            uint64 stakedAt,
            uint64 releaseRequestedAt,
            uint256 releasedAmount,
            bool active
        );
}

/**
 * @title CountryPoolNetProfitLedger
 * @notice D-4555-B · per-jurisdiction Country Pool net profit settlement (Gate-2.2).
 * @dev Timelock-owned · book accrual / fund / close / split · orthogonal to FeeRouter & P5 Ledger.
 */
contract CountryPoolNetProfitLedger {
    enum EpochStatus {
        NONE,
        OPEN,
        NO_SPLIT,
        SPLIT_PENDING,
        SPLIT_COMPLETED
    }

    struct ActiveStewardConfig {
        address steward;
        bool suspended;
        bool tenureSatisfied;
        bool tenureWaived;
        uint64 updatedAtBlock;
        bytes32 proposalRef;
    }

    struct EpochRecord {
        uint64 epochStart;
        uint64 epochEnd;
        int256 grossRevenue;
        int256 allowableExpense;
        int256 netProfit;
        uint256 carriedLossBefore;
        uint256 carriedLossApplied;
        int256 netProfitPrime;
        uint256 carriedLossAfter;
        EpochStatus status;
        uint64 closedAt;
        uint64 qualificationSnapshotBlock;
        address qualifiedSteward;
        bool stewardPathEligible;
        uint256 stewardAmount;
        uint256 unallocatedAmount;
        uint256 globalAmount;
        uint64 splitAt;
    }

    struct AccrualLine {
        bytes32 accountCode;
        int256 amountSigned;
        bytes32 ref;
    }

    uint256 internal constant MAX_ACCRUAL_BATCH_LINES = 32;

    bytes32 internal constant ACCT_R100 = bytes32("R-100");
    bytes32 internal constant ACCT_R110 = bytes32("R-110");
    bytes32 internal constant ACCT_R120 = bytes32("R-120");
    bytes32 internal constant ACCT_R199 = bytes32("R-199");
    bytes32 internal constant ACCT_E100 = bytes32("E-100");
    bytes32 internal constant ACCT_E110 = bytes32("E-110");
    bytes32 internal constant ACCT_E120 = bytes32("E-120");
    bytes32 internal constant ACCT_E130 = bytes32("E-130");
    bytes32 internal constant ACCT_E199 = bytes32("E-199");

    address public owner;
    bytes2 public immutable jurisdiction;
    IERC20 public immutable settlementToken;
    uint64 public closeDelaySeconds;
    uint16 public bpsStewardPath;
    uint16 public bpsGlobalTreasury;

    StewardPathVault public immutable stewardPathVault;
    UnallocatedStewardPathVault public immutable unallocatedStewardPathVault;
    address public globalTreasury;
    IRegionStewardStakePool public stewardStakePool;
    address public fundingSource;

    uint256 public carriedLoss;
    uint256 public latestEpochId;
    bool public settlementPaused;

    ActiveStewardConfig public activeSteward;

    mapping(uint256 => EpochRecord) public epochs;
    mapping(bytes32 => bool) public accrualRefs;
    mapping(uint256 => bool) public epochFunded;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event EpochOpened(bytes2 indexed jurisdiction, uint256 indexed epochId, uint64 epochStart, uint64 epochEnd);
    event NetProfitAccrued(
        bytes2 indexed jurisdiction,
        uint256 indexed epochId,
        address indexed token,
        bytes32 accountCode,
        int256 amountSigned,
        bytes32 ref,
        uint64 recordedAt
    );
    event EpochClosed(
        bytes2 indexed jurisdiction,
        uint256 indexed epochId,
        address indexed token,
        int256 grossRevenue,
        int256 allowableExpense,
        int256 netProfit,
        uint256 carriedLossBefore,
        uint256 carriedLossApplied,
        int256 netProfitPrime,
        uint256 carriedLossAfter,
        EpochStatus epochStatus
    );
    event LedgerFundedForSplit(
        bytes2 indexed jurisdiction,
        uint256 indexed epochId,
        address indexed token,
        uint256 amount,
        address fundingSource
    );
    event NetProfitSplit(
        bytes2 indexed jurisdiction,
        uint256 indexed epochId,
        address indexed token,
        uint256 netProfitPrime,
        uint256 stewardAmount,
        uint256 unallocatedAmount,
        uint256 globalAmount,
        bool stewardPathEligible,
        uint64 qualificationSnapshotBlock,
        address qualifiedSteward
    );
    event ActiveStewardConfigSet(
        bytes2 indexed jurisdiction,
        address indexed steward,
        bool suspended,
        bool tenureSatisfied,
        bool tenureWaived,
        bytes32 proposalRef
    );
    event SettlementParamsUpdated(
        uint64 closeDelaySeconds,
        uint16 bpsStewardPath,
        uint16 bpsGlobalTreasury,
        address globalTreasury,
        address fundingSource
    );
    event SettlementPausedSet(bool paused);

    error OnlyOwner();
    error InvalidJurisdiction();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidEpoch();
    error InvalidAccountCode();
    error DuplicateAccrualRef();
    error EpochNotOpen();
    error EpochNotSplitPending();
    error EpochAlreadyClosed();
    error CloseTooEarly();
    error SplitNotFunded();
    error InsufficientLedgerBalance();
    error TransferFailed();
    error SettlementPausedErr();
    error InvalidBps();
    error StewardConfigStale();
    error InvalidBatchSize();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier whenNotPaused() {
        if (settlementPaused) revert SettlementPausedErr();
        _;
    }

    constructor(
        address owner_,
        bytes2 jurisdiction_,
        address settlementToken_,
        address stewardPathVault_,
        address unallocatedStewardPathVault_,
        address globalTreasury_,
        address stewardStakePool_,
        uint64 closeDelaySeconds_,
        uint16 bpsStewardPath_,
        uint16 bpsGlobalTreasury_
    ) {
        if (owner_ == address(0) || settlementToken_ == address(0)) revert InvalidAddress();
        if (stewardPathVault_ == address(0) || unallocatedStewardPathVault_ == address(0)) {
            revert InvalidAddress();
        }
        if (globalTreasury_ == address(0) || stewardStakePool_ == address(0)) revert InvalidAddress();
        if (uint16(jurisdiction_) == 0) revert InvalidJurisdiction();
        if (bpsStewardPath_ + bpsGlobalTreasury_ > 10_000) revert InvalidBps();

        owner = owner_;
        jurisdiction = jurisdiction_;
        settlementToken = IERC20(settlementToken_);
        stewardPathVault = StewardPathVault(stewardPathVault_);
        unallocatedStewardPathVault = UnallocatedStewardPathVault(unallocatedStewardPathVault_);
        globalTreasury = globalTreasury_;
        stewardStakePool = IRegionStewardStakePool(stewardStakePool_);
        closeDelaySeconds = closeDelaySeconds_;
        bpsStewardPath = bpsStewardPath_;
        bpsGlobalTreasury = bpsGlobalTreasury_;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setSettlementParams(
        uint64 closeDelaySeconds_,
        uint16 bpsStewardPath_,
        uint16 bpsGlobalTreasury_,
        address globalTreasury_,
        address fundingSource_
    ) external onlyOwner {
        if (globalTreasury_ == address(0)) revert InvalidAddress();
        if (bpsStewardPath_ + bpsGlobalTreasury_ > 10_000) revert InvalidBps();
        closeDelaySeconds = closeDelaySeconds_;
        bpsStewardPath = bpsStewardPath_;
        bpsGlobalTreasury = bpsGlobalTreasury_;
        globalTreasury = globalTreasury_;
        fundingSource = fundingSource_;
        emit SettlementParamsUpdated(
            closeDelaySeconds_, bpsStewardPath_, bpsGlobalTreasury_, globalTreasury_, fundingSource_
        );
    }

    function setFundingSource(address fundingSource_) external onlyOwner {
        fundingSource = fundingSource_;
        emit SettlementParamsUpdated(
            closeDelaySeconds, bpsStewardPath, bpsGlobalTreasury, globalTreasury, fundingSource_
        );
    }

    function setSettlementPaused(bool paused) external onlyOwner {
        settlementPaused = paused;
        emit SettlementPausedSet(paused);
    }

    function setActiveStewardConfig(
        address steward,
        bool suspended,
        bool tenureSatisfied,
        bool tenureWaived,
        bytes32 proposalRef
    ) external onlyOwner {
        activeSteward = ActiveStewardConfig({
            steward: steward,
            suspended: suspended,
            tenureSatisfied: tenureSatisfied,
            tenureWaived: tenureWaived,
            updatedAtBlock: uint64(block.number),
            proposalRef: proposalRef
        });
        emit ActiveStewardConfigSet(
            jurisdiction, steward, suspended, tenureSatisfied, tenureWaived, proposalRef
        );
    }

    function openEpoch(uint256 epochId, uint64 epochStart, uint64 epochEnd) external onlyOwner whenNotPaused {
        if (epochId != latestEpochId + 1) revert InvalidEpoch();
        if (epochEnd <= epochStart) revert InvalidAmount();
        EpochRecord storage e = epochs[epochId];
        e.epochStart = epochStart;
        e.epochEnd = epochEnd;
        e.status = EpochStatus.OPEN;
        latestEpochId = epochId;
        emit EpochOpened(jurisdiction, epochId, epochStart, epochEnd);
    }

    function recordAccrual(uint256 epochId, bytes32 accountCode, int256 amountSigned, bytes32 ref)
        external
        onlyOwner
        whenNotPaused
    {
        EpochRecord storage e = epochs[epochId];
        if (e.status != EpochStatus.OPEN) revert EpochNotOpen();
        _validateAccrualLine(accountCode, amountSigned, ref);
        _applyAccrualLine(e, epochId, accountCode, amountSigned, ref);
    }

    function recordAccrualBatch(uint256 epochId, AccrualLine[] calldata lines)
        external
        onlyOwner
        whenNotPaused
    {
        uint256 len = lines.length;
        if (len == 0 || len > MAX_ACCRUAL_BATCH_LINES) revert InvalidBatchSize();

        EpochRecord storage e = epochs[epochId];
        if (e.status != EpochStatus.OPEN) revert EpochNotOpen();

        for (uint256 i = 0; i < len; ++i) {
            for (uint256 j = i + 1; j < len; ++j) {
                if (lines[i].ref == lines[j].ref) revert DuplicateAccrualRef();
            }
        }
        for (uint256 i = 0; i < len; ++i) {
            AccrualLine calldata line = lines[i];
            _validateAccrualLine(line.accountCode, line.amountSigned, line.ref);
        }
        for (uint256 i = 0; i < len; ++i) {
            AccrualLine calldata line = lines[i];
            _applyAccrualLine(e, epochId, line.accountCode, line.amountSigned, line.ref);
        }
    }

    function _validateAccrualLine(bytes32 accountCode, int256 amountSigned, bytes32 ref) internal view {
        if (!_isAllowedAccountCode(accountCode)) revert InvalidAccountCode();
        if (amountSigned == 0) revert InvalidAmount();
        if (accrualRefs[ref]) revert DuplicateAccrualRef();
    }

    function _applyAccrualLine(
        EpochRecord storage e,
        uint256 epochId,
        bytes32 accountCode,
        int256 amountSigned,
        bytes32 ref
    ) internal {
        accrualRefs[ref] = true;

        if (amountSigned > 0) {
            e.grossRevenue += amountSigned;
        } else {
            e.allowableExpense += -amountSigned;
        }

        emit NetProfitAccrued(
            jurisdiction,
            epochId,
            address(settlementToken),
            accountCode,
            amountSigned,
            ref,
            uint64(block.timestamp)
        );
    }

    function closeEpoch(uint256 epochId) external onlyOwner whenNotPaused {
        EpochRecord storage e = epochs[epochId];
        if (e.status != EpochStatus.OPEN) revert EpochNotOpen();
        if (block.timestamp < uint256(e.epochEnd) + uint256(closeDelaySeconds)) revert CloseTooEarly();

        int256 netProfit = e.grossRevenue - e.allowableExpense;
        uint256 carriedLossBefore = carriedLoss;
        uint256 carriedLossApplied = _carriedLossApplied(netProfit, carriedLossBefore);
        int256 netProfitPrime = netProfit - int256(carriedLossApplied);

        _applyCarriedLossClose(netProfit, carriedLossBefore, carriedLossApplied);

        e.netProfit = netProfit;
        e.carriedLossBefore = carriedLossBefore;
        e.carriedLossApplied = carriedLossApplied;
        e.netProfitPrime = netProfitPrime;
        e.carriedLossAfter = carriedLoss;
        e.closedAt = uint64(block.timestamp);
        e.status = netProfitPrime <= 0 ? EpochStatus.NO_SPLIT : EpochStatus.SPLIT_PENDING;

        emit EpochClosed(
            jurisdiction,
            epochId,
            address(settlementToken),
            e.grossRevenue,
            e.allowableExpense,
            netProfit,
            carriedLossBefore,
            carriedLossApplied,
            netProfitPrime,
            carriedLoss,
            e.status
        );
    }

    function _carriedLossApplied(int256 netProfit, uint256 carriedLossBefore) internal pure returns (uint256) {
        if (netProfit <= 0) return 0;
        uint256 np = uint256(netProfit);
        return carriedLossBefore < np ? carriedLossBefore : np;
    }

    function _applyCarriedLossClose(int256 netProfit, uint256, uint256 carriedLossApplied) internal {
        if (carriedLossApplied > 0) {
            carriedLoss -= carriedLossApplied;
        }
        if (netProfit < 0) {
            carriedLoss += uint256(-netProfit);
        }
    }

    function fundLedgerForSplit(uint256 epochId) external onlyOwner whenNotPaused {
        EpochRecord storage e = epochs[epochId];
        if (e.status != EpochStatus.SPLIT_PENDING) revert EpochNotSplitPending();
        if (fundingSource == address(0)) revert InvalidAddress();

        uint256 need = uint256(e.netProfitPrime);
        uint256 bal = settlementToken.balanceOf(address(this));
        if (bal >= need) {
            epochFunded[epochId] = true;
            emit LedgerFundedForSplit(jurisdiction, epochId, address(settlementToken), 0, fundingSource);
            return;
        }

        uint256 pull = need - bal;
        if (!settlementToken.transferFrom(fundingSource, address(this), pull)) revert TransferFailed();
        epochFunded[epochId] = true;
        emit LedgerFundedForSplit(jurisdiction, epochId, address(settlementToken), pull, fundingSource);
    }

    function splitNetProfit(uint256 epochId) external onlyOwner whenNotPaused {
        EpochRecord storage e = epochs[epochId];
        if (e.status != EpochStatus.SPLIT_PENDING) revert EpochNotSplitPending();
        if (!epochFunded[epochId]) revert SplitNotFunded();
        _splitNetProfit(e, epochId);
    }

    function _splitNetProfit(EpochRecord storage e, uint256 epochId) internal {
        uint256 np = uint256(e.netProfitPrime);
        if (settlementToken.balanceOf(address(this)) < np) revert InsufficientLedgerBalance();
        if (activeSteward.updatedAtBlock > block.number) revert StewardConfigStale();

        bool eligible = _stewardPathEligible();
        (uint256 stewardLeg, uint256 globalLeg) = _splitLegs(np);
        uint256 unallocatedLeg = _routeStewardLeg(eligible, stewardLeg, epochId);
        if (globalLeg > 0 && !settlementToken.transfer(globalTreasury, globalLeg)) revert TransferFailed();

        e.stewardPathEligible = eligible;
        e.qualifiedSteward = activeSteward.steward;
        e.qualificationSnapshotBlock = uint64(block.number);
        e.stewardAmount = eligible ? stewardLeg : 0;
        e.unallocatedAmount = unallocatedLeg;
        e.globalAmount = globalLeg;
        e.splitAt = uint64(block.timestamp);
        e.status = EpochStatus.SPLIT_COMPLETED;

        emit NetProfitSplit(
            jurisdiction,
            epochId,
            address(settlementToken),
            np,
            e.stewardAmount,
            e.unallocatedAmount,
            e.globalAmount,
            eligible,
            e.qualificationSnapshotBlock,
            e.qualifiedSteward
        );
    }

    function _splitLegs(uint256 np) internal view returns (uint256 stewardLeg, uint256 globalLeg) {
        stewardLeg = (np * bpsStewardPath) / 10_000;
        uint256 globalBase = (np * bpsGlobalTreasury) / 10_000;
        globalLeg = globalBase + (np - stewardLeg - globalBase);
    }

    function _routeStewardLeg(bool eligible, uint256 stewardLeg, uint256 epochId)
        internal
        returns (uint256 unallocatedLeg)
    {
        if (stewardLeg == 0) return 0;
        if (eligible) {
            if (!settlementToken.approve(address(stewardPathVault), stewardLeg)) revert TransferFailed();
            stewardPathVault.depositFromLedger(stewardLeg, epochId);
            return 0;
        }
        if (!settlementToken.approve(address(unallocatedStewardPathVault), stewardLeg)) revert TransferFailed();
        unallocatedStewardPathVault.depositFromLedger(stewardLeg, epochId);
        return stewardLeg;
    }

    function _stewardPathEligible() internal view returns (bool) {
        ActiveStewardConfig memory cfg = activeSteward;
        if (cfg.steward == address(0)) return false;
        if (cfg.suspended) return false;
        if (!cfg.tenureSatisfied && !cfg.tenureWaived) return false;
        if (!stewardStakePool.hasJurisdictionStake(cfg.steward, jurisdiction)) return false;

        (uint256 amount,,,,, bool active) = stewardStakePool.stakes(cfg.steward, jurisdiction);
        if (!active) return false;
        return amount >= stewardStakePool.minStakeAmount(jurisdiction);
    }

    function _isAllowedAccountCode(bytes32 code) internal pure returns (bool) {
        return code == ACCT_R100 || code == ACCT_R110 || code == ACCT_R120 || code == ACCT_R199
            || code == ACCT_E100 || code == ACCT_E110 || code == ACCT_E120 || code == ACCT_E130
            || code == ACCT_E199;
    }

    function epochGrossRevenue(uint256 epochId) external view returns (int256) {
        return epochs[epochId].grossRevenue;
    }

    function epochAllowableExpense(uint256 epochId) external view returns (int256) {
        return epochs[epochId].allowableExpense;
    }

    function epochNetProfitPrime(uint256 epochId) external view returns (int256) {
        return epochs[epochId].netProfitPrime;
    }

    function epochStatus(uint256 epochId) external view returns (EpochStatus) {
        return epochs[epochId].status;
    }

    function epochCarriedLossApplied(uint256 epochId) external view returns (uint256) {
        return epochs[epochId].carriedLossApplied;
    }

    function epochSplitAmounts(uint256 epochId)
        external
        view
        returns (uint256 stewardAmount, uint256 unallocatedAmount, uint256 globalAmount)
    {
        EpochRecord storage e = epochs[epochId];
        return (e.stewardAmount, e.unallocatedAmount, e.globalAmount);
    }

    function version() external pure returns (string memory) {
        return "country_pool_net_profit_ledger_v1";
    }
}
