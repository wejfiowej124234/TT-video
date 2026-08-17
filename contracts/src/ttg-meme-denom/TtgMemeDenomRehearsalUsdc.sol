// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/**
 * @title TtgMemeDenomRehearsalUsdc
 * @notice ② Sepolia rehearsal USD only. Not Official USDC. Not for Ethereum Mainnet.
 * @dev FR 4.5% Seat costs 11,250,000 units at V8 quote. Faucet USDC cannot fund that.
 */
contract TtgMemeDenomRehearsalUsdc {
    string public constant name = "TTG V8 Rehearsal USD";
    string public constant symbol = "USDC";
    uint8 public constant decimals = 6;

    address public immutable issuer;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    error OnlyIssuer();
    error TransferFailed();

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(address issuer_) {
        issuer = issuer_;
    }

    function issue(address to, uint256 amount) external {
        if (msg.sender != issuer) revert OnlyIssuer();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _move(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert TransferFailed();
            allowance[from][msg.sender] = allowed - amount;
        }
        return _move(from, to, amount);
    }

    function _move(address from, address to, uint256 amount) internal returns (bool) {
        if (balanceOf[from] < amount) revert TransferFailed();
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
