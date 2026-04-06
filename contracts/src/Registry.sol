// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * TravelTrust Registry 方案 B（与 01 §4、contracts/README 一致）
 * 链下审核 + 链上发资格；可撤销、可过期
 */
contract Registry {
    address public authority;
    struct Approval {
        bool approved;
        uint8 tier;
        uint256 expiry;
    }
    mapping(address => Approval) public guideApproval;

    event Approved(address indexed guide, uint8 tier, uint256 expiry);
    event Revoked(address indexed guide);

    error OnlyAuthority();

    constructor() {
        authority = msg.sender;
    }

    modifier onlyAuthority() {
        if (msg.sender != authority) revert OnlyAuthority();
        _;
    }

    function approve(address guide, uint8 tier, uint256 expiry) external onlyAuthority {
        guideApproval[guide] = Approval({ approved: true, tier: tier, expiry: expiry });
        emit Approved(guide, tier, expiry);
    }

    function revoke(address guide) external onlyAuthority {
        guideApproval[guide] = Approval({ approved: false, tier: 0, expiry: 0 });
        emit Revoked(guide);
    }

    function isApproved(address guide) external view returns (bool) {
        Approval memory a = guideApproval[guide];
        return a.approved && block.timestamp < a.expiry;
    }
}
