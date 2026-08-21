// SPDX-License-Identifier: MIT
pragma solidity 0.8.36;

/**
 * @title TtgV9UUPSUpgradeable
 * @notice Minimal UUPS base. Upgrade authority is enforced by `_authorizeUpgrade` (Timelock-only).
 * @dev English NatSpec only. Not for the governance token (token remains non-proxy).
 */
abstract contract TtgV9UUPSUpgradeable {
    bytes32 private constant _IMPLEMENTATION_SLOT =
        0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    address private immutable __self = address(this);

    bool internal _initialized;
    uint256[49] private __gapUUPS;

    error InvalidImplementation();
    error AlreadyInitialized();
    error NotInitializing();
    error UUPSUnauthorizedCallContext();
    error UpgradeFailed();

    event Upgraded(address indexed implementation);

    modifier initializer() {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;
        _;
    }

    function proxiableUUID() external view returns (bytes32) {
        if (address(this) != __self) revert UUPSUnauthorizedCallContext();
        return _IMPLEMENTATION_SLOT;
    }

    function upgradeToAndCall(address newImplementation, bytes memory data) public payable virtual {
        // Only callable through the proxy — never on the implementation contract itself.
        if (address(this) == __self) revert UUPSUnauthorizedCallContext();
        _authorizeUpgrade(newImplementation);
        _upgradeToAndCallUUPS(newImplementation, data);
    }

    function _authorizeUpgrade(address newImplementation) internal virtual;

    function _upgradeToAndCallUUPS(address newImplementation, bytes memory data) private {
        if (newImplementation == address(0) || newImplementation.code.length == 0) {
            revert InvalidImplementation();
        }
        try TtgV9UUPSUpgradeable(newImplementation).proxiableUUID() returns (bytes32 slot) {
            if (slot != _IMPLEMENTATION_SLOT) revert InvalidImplementation();
        } catch {
            revert InvalidImplementation();
        }
        assembly {
            sstore(_IMPLEMENTATION_SLOT, newImplementation)
        }
        emit Upgraded(newImplementation);
        if (data.length > 0) {
            (bool ok, bytes memory ret) = newImplementation.delegatecall(data);
            if (!ok) {
                if (ret.length > 0) {
                    assembly {
                        revert(add(ret, 32), mload(ret))
                    }
                }
                revert UpgradeFailed();
            }
        }
    }

    function _disableInitializers() internal {
        _initialized = true;
    }

    function _getImplementation() internal view returns (address impl) {
        assembly {
            impl := sload(_IMPLEMENTATION_SLOT)
        }
    }
}
