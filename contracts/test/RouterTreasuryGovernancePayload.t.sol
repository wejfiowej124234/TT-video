// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/FeeRouter.sol";
import "../src/GovernanceTreasury.sol";
import "../src/ReserveVault.sol";
import "../src/RouterTreasuryGovernancePayload.sol";

/// **TT-B407-PAYLOAD-SELECTOR-PARITY-001**：**`RouterTreasuryGovernancePayload`** 与 **合约** **`selector`** 同源（回归稳定 **payload**）。
contract RouterTreasuryGovernancePayloadTest is Test {
    function test_B407_payload_selectors_match_contracts() public pure {
        assertEq(
            RouterTreasuryGovernancePayload.FEE_ROUTER_SET_ROUTING_CONFIG,
            FeeRouter.setRoutingConfig.selector
        );
        assertEq(
            RouterTreasuryGovernancePayload.FEE_ROUTER_TRANSFER_OWNERSHIP,
            FeeRouter.transferOwnership.selector
        );
        assertEq(
            RouterTreasuryGovernancePayload.TREASURY_SPEND,
            GovernanceTreasury.spend.selector
        );
        assertEq(
            RouterTreasuryGovernancePayload.RESERVE_VAULT_WITHDRAW,
            ReserveVault.withdraw.selector
        );
    }

    function test_B407_encode_set_routing_config_matches_abi_encode() public pure {
        address c = address(uint160(1));
        address s = address(uint160(2));
        address r = address(uint160(3));
        address o = address(uint160(4));
        bytes memory a = RouterTreasuryGovernancePayload.encodeFeeRouterSetRoutingConfig(c, s, r, o, 1, 2, 3, 9994);
        bytes memory b = abi.encodeWithSelector(FeeRouter.setRoutingConfig.selector, c, s, r, o, 1, 2, 3, 9994);
        assertEq(keccak256(a), keccak256(b));
    }
}
