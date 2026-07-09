// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title TimelockUpgradeableProxy
 * @notice EIP-1967 transparent-style proxy · **admin = GovernanceTimelock** · `upgradeTo` only admin
 * @dev G24-P-UPGRADE-01 · Governable Shell 测试网基线须经本 Proxy 暴露地址 · 禁止裸 Implementation 作正式基线
 */
contract TimelockUpgradeableProxy {
    bytes32 private constant IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;
    bytes32 private constant ADMIN_SLOT = 0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103;

    event Upgraded(address indexed implementation);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

    error ProxyZeroAddress();
    error ProxyInitFailed();
    error ProxyUnauthorized();
    error ProxyNoCode();

    constructor(address implementation_, address admin_, bytes memory initData) payable {
        if (implementation_ == address(0) || admin_ == address(0)) revert ProxyZeroAddress();
        if (implementation_.code.length == 0) revert ProxyNoCode();
        _setImplementation(implementation_);
        _setAdmin(admin_);
        if (initData.length > 0) {
            (bool ok,) = implementation_.delegatecall(initData);
            if (!ok) revert ProxyInitFailed();
        }
    }

    function admin() external view returns (address a) {
        assembly {
            a := sload(ADMIN_SLOT)
        }
    }

    function implementation() external view returns (address impl) {
        assembly {
            impl := sload(IMPLEMENTATION_SLOT)
        }
    }

    function upgradeTo(address newImplementation) external {
        _onlyAdmin();
        if (newImplementation.code.length == 0) revert ProxyNoCode();
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }

    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable {
        _onlyAdmin();
        if (newImplementation.code.length == 0) revert ProxyNoCode();
        _setImplementation(newImplementation);
        (bool ok,) = newImplementation.delegatecall(data);
        if (!ok) revert ProxyInitFailed();
        emit Upgraded(newImplementation);
    }

    function changeAdmin(address newAdmin) external {
        _onlyAdmin();
        if (newAdmin == address(0)) revert ProxyZeroAddress();
        address previous;
        assembly {
            previous := sload(ADMIN_SLOT)
        }
        _setAdmin(newAdmin);
        emit AdminChanged(previous, newAdmin);
    }

    function _onlyAdmin() internal view {
        address a;
        assembly {
            a := sload(ADMIN_SLOT)
        }
        if (msg.sender != a) revert ProxyUnauthorized();
    }

    function _setImplementation(address impl) internal {
        assembly {
            sstore(IMPLEMENTATION_SLOT, impl)
        }
    }

    function _setAdmin(address admin_) internal {
        assembly {
            sstore(ADMIN_SLOT, admin_)
        }
    }

    fallback() external payable {
        address impl;
        assembly {
            impl := sload(IMPLEMENTATION_SLOT)
        }
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {}
}
