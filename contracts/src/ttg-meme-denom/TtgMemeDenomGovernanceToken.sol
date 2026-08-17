// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./TtgMemeDenomConstants.sol";

/**
 * @title TtgMemeDenomGovernanceToken
 * @notice DESIGN_ONLY V8 TTG. Fixed 25T supply. Not a proxy. Not an upgrade of live 10M TTG.
 * @dev Scanner / explorer pins this wave must satisfy:
 *         1. Verify on Etherscan + Sourcify immediately after deploy (wallet "not open source").
 *         2. Constructor-only genesis credit. No post-deploy supply-increase function.
 *         3. Compile with Solidity 0.8.26 so Etherscan does not attach the 0.8.19 CVE banner.
 *      Genesis balances are credited in the constructor only. Total supply cannot increase
 *      afterwards. Votes track balances. Weight = balance / totalSupply (bps).
 */
contract TtgMemeDenomGovernanceToken {
    string public constant name = "TravelTrust Governance";
    string public constant symbol = "TTG";
    uint8 public constant decimals = 18;
    string public constant COMPILER_TARGET = "0.8.26";

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    struct Checkpoint {
        uint32 fromBlock;
        uint224 value;
    }

    mapping(address => Checkpoint[]) private _checkpoints;
    Checkpoint[] private _totalSupplyCheckpoints;
    mapping(address => mapping(address => uint256)) public allowance;

    address public immutable team;
    address public immutable daoTreasury;
    address public immutable publicSaleHolder;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error FutureLookup();
    error InsufficientAllowance();
    error InvalidAddress();
    error AllocationSum();

    constructor(address team_, address daoTreasury_, address publicSaleHolder_) {
        if (team_ == address(0) || daoTreasury_ == address(0) || publicSaleHolder_ == address(0)) {
            revert InvalidAddress();
        }
        if (
            TtgMemeDenomConstants.TEAM_TTG + TtgMemeDenomConstants.DAO_TREASURY_TTG
                + TtgMemeDenomConstants.PUBLIC_SALE_TTG != TtgMemeDenomConstants.TTG_TOTAL_SUPPLY_UNITS
        ) revert AllocationSum();

        team = team_;
        daoTreasury = daoTreasury_;
        publicSaleHolder = publicSaleHolder_;

        _creditGenesis(team_, TtgMemeDenomConstants.TEAM_TTG);
        _creditGenesis(daoTreasury_, TtgMemeDenomConstants.DAO_TREASURY_TTG);
        _creditGenesis(publicSaleHolder_, TtgMemeDenomConstants.PUBLIC_SALE_TTG);
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

    function getVotes(address account) external view returns (uint256) {
        return balanceOf[account];
    }

    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _upperLookup(_checkpoints[account], uint32(blockNumber));
    }

    function getPastTotalSupply(uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        return _upperLookup(_totalSupplyCheckpoints, uint32(blockNumber));
    }

    /// @notice Holding proportion in bps of live totalSupply. 1500 = 15%.
    function governanceWeightBps(address account) external view returns (uint256) {
        if (totalSupply == 0) return 0;
        return (balanceOf[account] * 10_000) / totalSupply;
    }

    function governanceWeightBpsAt(address account, uint256 blockNumber) external view returns (uint256) {
        if (blockNumber >= block.number) revert FutureLookup();
        uint256 supply = _upperLookup(_totalSupplyCheckpoints, uint32(blockNumber));
        if (supply == 0) return 0;
        return (_upperLookup(_checkpoints[account], uint32(blockNumber)) * 10_000) / supply;
    }

    function candidateId() external pure returns (string memory) {
        return TtgMemeDenomConstants.candidateId();
    }

    /// @dev Constructor-only genesis credit. Not exposed after deploy.
    function _creditGenesis(address to, uint256 amount) private {
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
