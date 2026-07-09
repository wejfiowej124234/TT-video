// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./Escrow.sol";

/**
 * @title EscrowV2
 * @notice Bilateral Confirmation Settlement Model — Layer B (mainnet path)
 * @dev release() permissionless AFTER travelerServiceConfirmed && guideServiceConfirmed.
 *      Caller has zero financial benefit (immutable destinations). Keeper automation OK.
 */
contract EscrowV2 is Escrow {
    bool public travelerServiceConfirmed;
    bool public guideServiceConfirmed;

    error ServiceNotComplete();
    error AlreadyConfirmedService();

    event ServiceCompleteConfirmed(bytes32 indexed orderId, address indexed confirmer, bool traveler, bool guide);

    constructor(address _factory) Escrow(_factory) {}

    function confirmServiceComplete() external {
        if (status != Status.Funded) revert InvalidState();
        if (msg.sender == traveler) {
            if (travelerServiceConfirmed) revert AlreadyConfirmedService();
            travelerServiceConfirmed = true;
        } else if (msg.sender == guide) {
            if (guideServiceConfirmed) revert AlreadyConfirmedService();
            guideServiceConfirmed = true;
        } else {
            revert InvalidState();
        }
        emit ServiceCompleteConfirmed(orderId, msg.sender, travelerServiceConfirmed, guideServiceConfirmed);
    }

    function release() external override {
        if (status != Status.Funded) revert InvalidState();
        if (!travelerServiceConfirmed || !guideServiceConfirmed) revert ServiceNotComplete();
        uint256 guideAmount = (totalAmount * (uint256(10000) - uint256(platformFeeBps))) / 10000;
        uint256 fee = totalAmount - guideAmount;
        if (!IERC20(token).transfer(guide, guideAmount)) revert TransferFailed();
        if (fee > 0 && !IERC20(token).transfer(platformFeeRecipient, fee)) revert TransferFailed();
        status = Status.Completed;
        emit Released(orderId, address(this), guideAmount, fee);
    }
}
