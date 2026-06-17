// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title GovernanceVotesToken
/// @notice 轻量投票权重代币：**`getPastVotes` / `getPastTotalSupply`** 与 **Governor 快照块** 对齐（B-089 Completion）。
///      测试网/主网对外符号统一为 **TTG**（与 `.env` **`GOVERNANCE_TOKEN_ADDRESS`**、钱包导入一致）。
contract GovernanceVotesToken {
    string public constant name = "TravelTrust Governance";
    string public constant symbol = "TTG";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    struct Checkpoint {
        uint32 fromBlock;
        uint224 value;
    }

    mapping(address => Checkpoint[]) private _checkpoints;
    Checkpoint[] private _totalSupplyCheckpoints;

    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error FutureLookup();
    error InsufficientAllowance();

    constructor(uint256 initialSupply, address initialHolder) {
        address to = initialHolder == address(0) ? msg.sender : initialHolder;
        _mint(to, initialSupply);
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
            allowance[from][msg.sender] = allowed - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _upperLookup(_checkpoints[account], uint32(blockNumber));
    }

    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _upperLookup(_totalSupplyCheckpoints, uint32(blockNumber));
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        _writeCheckpoint(_checkpoints[to], _latest(_checkpoints[to]) + uint224(amount));
        _writeCheckpoint(_totalSupplyCheckpoints, _latest(_totalSupplyCheckpoints) + uint224(amount));
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        uint224 fromVal = _latest(_checkpoints[from]);
        uint224 toVal = _latest(_checkpoints[to]);
        _writeCheckpoint(_checkpoints[from], fromVal - uint224(amount));
        _writeCheckpoint(_checkpoints[to], toVal + uint224(amount));
        emit Transfer(from, to, amount);
    }

    function _latest(Checkpoint[] storage ck) internal view returns (uint224) {
        uint256 n = ck.length;
        if (n == 0) return 0;
        return ck[n - 1].value;
    }

    function _writeCheckpoint(Checkpoint[] storage ck, uint224 value) internal {
        uint32 blk = uint32(block.number);
        uint256 n = ck.length;
        if (n > 0 && ck[n - 1].fromBlock == blk) {
            ck[n - 1].value = value;
        } else {
            ck.push(Checkpoint(blk, value));
        }
    }

    /// @dev Upper binary search: latest checkpoint with `fromBlock <= blockNumber`.
    function _upperLookup(Checkpoint[] storage ck, uint32 blockNumber) private view returns (uint256) {
        uint256 len = ck.length;
        if (len == 0) return 0;
        uint256 low = 0;
        uint256 high = len;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            if (ck[mid].fromBlock <= blockNumber) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        if (high == 0) return 0;
        return uint256(ck[high - 1].value);
    }
}
