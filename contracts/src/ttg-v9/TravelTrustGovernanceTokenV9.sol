// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TravelTrustGovernanceTokenV9
 * @notice Official V9 TTG. Non-proxy. Genesis MAX_SUPPLY 25T. No further mint. No public burn.
 * @dev TTG V9 Monetary Invariant: Genesis Supply 25T. No additional TTG may ever be minted after
 *      genesis. Business rules may evolve via governance/upgrades provided no upgrade mints beyond
 *      genesis supply. English NatSpec only. solc >= 0.8.36.
 */
contract TravelTrustGovernanceTokenV9 {
    string public constant name = "TravelTrust Governance";
    string public constant symbol = "TTG";
    uint8 public constant decimals = 18;
    string public constant versionTag = "ttg_v9_25t_official";
    uint256 public constant MAX_SUPPLY = 25_000_000_000_000 ether;

    /// @dev Starts at MAX_SUPPLY; decreases only via `protocolBurn`. Never increases.
    uint256 public totalSupply;

    address public immutable publicSaleVault;
    address public immutable daoTimelock;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    struct Checkpoint {
        uint32 fromBlock;
        uint224 votes;
    }

    mapping(address => address) public delegates;
    mapping(address => Checkpoint[]) private _checkpoints;
    Checkpoint[] private _totalSupplyCheckpoints;

    error InvalidAddress();
    error InvalidAmount();
    error InsufficientBalance();
    error InsufficientAllowance();
    error FutureLookup();
    error GenesisSumMismatch();
    error NotProtocolBurner();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);
    event ProtocolBurn(address indexed burner, uint256 amount, uint256 newTotalSupply);

    /**
     * @param publicVault_ PublicSaleVault proxy (50% = 12.5T) — also authorized protocolBurner.
     * @param daoTimelock_ GovernanceTimelock (35% = 8.75T) — also authorized protocolBurner.
     * @param team_ Team wallet 3%.
     * @param marketing_ Marketing wallet 5%.
     * @param treasury_ Treasury wallet 7%.
     */
    constructor(
        address publicVault_,
        address daoTimelock_,
        address team_,
        address marketing_,
        address treasury_
    ) {
        if (
            publicVault_ == address(0) || daoTimelock_ == address(0) || team_ == address(0)
                || marketing_ == address(0) || treasury_ == address(0)
        ) {
            revert InvalidAddress();
        }

        publicSaleVault = publicVault_;
        daoTimelock = daoTimelock_;

        uint256 publicAmt = 12_500_000_000_000 ether;
        uint256 daoAmt = 8_750_000_000_000 ether;
        uint256 teamAmt = 750_000_000_000 ether;
        uint256 marketingAmt = 1_250_000_000_000 ether;
        uint256 treasuryAmt = 1_750_000_000_000 ether;
        uint256 sum = publicAmt + daoAmt + teamAmt + marketingAmt + treasuryAmt;
        if (sum != MAX_SUPPLY) revert GenesisSumMismatch();

        totalSupply = sum;
        _writeTotalSupplyCheckpoint(sum);

        _creditGenesis(publicVault_, publicAmt);
        _creditGenesis(daoTimelock_, daoAmt);
        _creditGenesis(team_, teamAmt);
        _creditGenesis(marketing_, marketingAmt);
        _creditGenesis(treasury_, treasuryAmt);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Destroy caller's balance. Only PublicSaleVault or daoTimelock (protocol custody).
     * @dev No public holder burn. Governance path: Governor → Timelock → Vault.executeGovernanceBurn.
     */
    function protocolBurn(uint256 amount) external {
        if (msg.sender != publicSaleVault && msg.sender != daoTimelock) revert NotProtocolBurner();
        _burn(msg.sender, amount);
        emit ProtocolBurn(msg.sender, amount, totalSupply);
    }

    function delegate(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }

    function getVotes(address account) external view returns (uint256) {
        uint256 n = _checkpoints[account].length;
        return n == 0 ? 0 : uint256(_checkpoints[account][n - 1].votes);
    }

    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _checkpointsUpperLookup(_checkpoints[account], uint32(blockNumber));
    }

    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _checkpointsUpperLookup(_totalSupplyCheckpoints, uint32(blockNumber));
    }

    function numCheckpoints(address account) external view returns (uint256) {
        return _checkpoints[account].length;
    }

    function _creditGenesis(address to, uint256 amount) private {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) private {
        if (amount == 0) revert InvalidAmount();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            totalSupply -= amount;
        }
        _writeTotalSupplyCheckpoint(totalSupply);
        _moveVotes(delegates[from], address(0), amount);
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        if (to == address(0)) revert InvalidAddress();
        uint256 bal = balanceOf[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        _moveVotes(delegates[from], delegates[to], amount);
        emit Transfer(from, to, amount);
    }

    function _delegate(address account, address delegatee) private {
        if (delegatee == address(0)) revert InvalidAddress();
        address current = delegates[account];
        delegates[account] = delegatee;
        emit DelegateChanged(account, current, delegatee);
        _moveVotes(current, delegatee, balanceOf[account]);
    }

    function _moveVotes(address from, address to, uint256 amount) private {
        if (from == to || amount == 0) return;
        if (from != address(0)) {
            (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(_checkpoints[from], _subtract, amount);
            emit DelegateVotesChanged(from, oldWeight, newWeight);
        }
        if (to != address(0)) {
            (uint256 oldWeight, uint256 newWeight) = _writeCheckpoint(_checkpoints[to], _add, amount);
            emit DelegateVotesChanged(to, oldWeight, newWeight);
        }
    }

    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    function _writeCheckpoint(
        Checkpoint[] storage ckpts,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) private returns (uint256 oldWeight, uint256 newWeight) {
        uint256 pos = ckpts.length;
        oldWeight = pos == 0 ? 0 : uint256(ckpts[pos - 1].votes);
        newWeight = op(oldWeight, delta);
        if (pos > 0 && ckpts[pos - 1].fromBlock == uint32(block.number)) {
            ckpts[pos - 1].votes = uint224(newWeight);
        } else {
            ckpts.push(Checkpoint({fromBlock: uint32(block.number), votes: uint224(newWeight)}));
        }
    }

    function _writeTotalSupplyCheckpoint(uint256 value) private {
        uint256 pos = _totalSupplyCheckpoints.length;
        if (pos > 0 && _totalSupplyCheckpoints[pos - 1].fromBlock == uint32(block.number)) {
            _totalSupplyCheckpoints[pos - 1].votes = uint224(value);
        } else {
            _totalSupplyCheckpoints.push(Checkpoint({fromBlock: uint32(block.number), votes: uint224(value)}));
        }
    }

    function _checkpointsUpperLookup(Checkpoint[] storage ckpts, uint32 blockNumber)
        private
        view
        returns (uint256)
    {
        uint256 len = ckpts.length;
        if (len == 0) return 0;
        uint256 low = 0;
        uint256 high = len;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high == 0 ? 0 : uint256(ckpts[high - 1].votes);
    }
}
