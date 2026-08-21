// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9ERC1967Proxy
 * @notice Minimal ERC-1967 proxy for V9 Vault / Batch PM (English NatSpec only).
 * @dev Implementation slot = keccak256("eip1967.proxy.implementation") - 1.
 */
contract TtgV9ERC1967Proxy {
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    error ProxyDelegateFailed();
    error InvalidImplementation();

    constructor(address implementation_, bytes memory initData) {
        if (implementation_ == address(0) || implementation_.code.length == 0) {
            revert InvalidImplementation();
        }
        assembly {
            sstore(_IMPLEMENTATION_SLOT, implementation_)
        }
        if (initData.length > 0) {
            (bool ok, bytes memory ret) = implementation_.delegatecall(initData);
            if (!ok) {
                if (ret.length > 0) {
                    assembly {
                        revert(add(ret, 32), mload(ret))
                    }
                }
                revert ProxyDelegateFailed();
            }
        }
    }

    fallback() external payable {
        assembly {
            let impl := sload(_IMPLEMENTATION_SLOT)
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {
        assembly {
            let impl := sload(_IMPLEMENTATION_SLOT)
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}
