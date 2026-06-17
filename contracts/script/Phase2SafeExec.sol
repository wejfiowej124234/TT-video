// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "../src/GovernanceTimelock.sol";

enum Phase2SafeOperation {
    Call,
    DelegateCall
}

interface IGnosisSafe {
    function nonce() external view returns (uint256);

    function getTransactionHash(
        address to,
        uint256 value,
        bytes calldata data,
        Phase2SafeOperation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address refundReceiver,
        uint256 _nonce
    ) external view returns (bytes32);

    function execTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        Phase2SafeOperation operation,
        uint256 safeTxGas,
        uint256 baseGas,
        uint256 gasPrice,
        address gasToken,
        address payable refundReceiver,
        bytes calldata signatures
    ) external payable returns (bool success);
}

/**
 * @title Phase2SafeExec
 * @notice Gnosis Safe 1.x · 单 owner eth_sign 路径 · `execTransaction` 封装（Phase ② Sepolia）
 * @dev Singleton 默认 Sepolia v1.3.0 · `getTransactionHash` / `execTransaction` ABI 对齐
 */
abstract contract Phase2SafeExec is Script {

    /// @notice Safe → Timelock：`setAllowedExecutionTarget` ×4（FundStack · B-407）
    function configureFundStackTimelockViaSafe(
        address safe,
        address timelock,
        address feeRouter,
        address treasury,
        address reserveVault,
        address regionVault,
        uint256 safeOwnerPrivateKey
    ) internal {
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (feeRouter, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (treasury, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (reserveVault, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (regionVault, true)),
            safeOwnerPrivateKey
        );
    }

    /// @notice Safe → Timelock：`setGovernor` + `setAllowedExecutionTarget` ×2
    function configureGovernanceTimelockViaSafe(
        address safe,
        address timelock,
        address governor,
        address governanceToken,
        uint256 safeOwnerPrivateKey
    ) internal {
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setGovernor, (governor)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (governor, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (governanceToken, true)),
            safeOwnerPrivateKey
        );
    }

    /// @notice GovFreeze V2 Clean Baseline · Safe → Timelock · 五类 Shell + TTG allow（一次批次）
    function configureGovFreezeV2CleanBaselineViaSafe(
        address safe,
        address timelock,
        address governor,
        address governanceToken,
        address treasuryP4,
        address primaryMarket,
        address seatRegistry,
        address stakePool,
        uint256 safeOwnerPrivateKey
    ) internal {
        configureGovernanceTimelockViaSafe(safe, timelock, governor, governanceToken, safeOwnerPrivateKey);
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (treasuryP4, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (primaryMarket, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (seatRegistry, true)),
            safeOwnerPrivateKey
        );
        safeExecCall(
            safe,
            timelock,
            abi.encodeCall(GovernanceTimelock.setAllowedExecutionTarget, (stakePool, true)),
            safeOwnerPrivateKey
        );
    }

    function safeExecCall(address safe, address to, bytes memory data, uint256 ownerPrivateKey) internal {
        IGnosisSafe safeContract = IGnosisSafe(safe);
        uint256 nonce = safeContract.nonce();
        bytes32 txHash = safeContract.getTransactionHash(
            to,
            0,
            data,
            Phase2SafeOperation.Call,
            0,
            0,
            0,
            address(0),
            payable(address(0)),
            nonce
        );
        bytes memory signatures = _signSafeTxAsOwner(txHash, ownerPrivateKey);
        require(
            safeContract.execTransaction(
                to,
                0,
                data,
                Phase2SafeOperation.Call,
                0,
                0,
                0,
                address(0),
                payable(address(0)),
                signatures
            ),
            "Phase2SafeExec: execTransaction failed"
        );
    }

    function resolveSafeOwnerPrivateKey() internal view returns (uint256 pk) {
        string memory single = vm.envOr("TIMELOCK_SAFE_OWNER_KEY", string(""));
        if (bytes(single).length > 0) {
            return _parsePrivateKeyHex(single);
        }
        return _parseFirstPrivateKeyFromCsv(vm.envString("TIMELOCK_SAFE_OWNER_KEYS"));
    }

    function _signSafeTxAsOwner(bytes32 txHash, uint256 ownerPrivateKey)
        private
        returns (bytes memory signatures)
    {
        // Gnosis Safe 1.3 · EOA 标准路径：ecrecover(dataHash, v, r, s) · v ∈ {27,28}
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, txHash);
        return abi.encodePacked(r, s, v);
    }

    function _parseFirstPrivateKeyFromCsv(string memory csv) internal pure returns (uint256) {
        bytes memory b = bytes(csv);
        uint256 end;
        for (uint256 i = 0; i <= b.length; i++) {
            if (i == b.length || b[i] == ",") {
                bytes memory part = new bytes(i);
                for (uint256 j = 0; j < i; j++) {
                    part[j] = b[j];
                }
                return _parsePrivateKeyHex(string(part));
            }
        }
        revert("Phase2SafeExec: empty TIMELOCK_SAFE_OWNER_KEYS");
    }

    function _parsePrivateKeyHex(string memory s) internal pure returns (uint256 pk) {
        bytes memory b = bytes(s);
        uint256 start;
        while (start < b.length && (b[start] == " " || b[start] == "\t")) start++;
        if (start + 2 <= b.length && b[start] == "0" && (b[start + 1] == "x" || b[start + 1] == "X")) {
            start += 2;
        }
        require(b.length - start == 64, "Phase2SafeExec: bad private key hex length");
        for (uint256 i = 0; i < 64; i += 2) {
            pk = pk * 256 + _hexPair(b[start + i], b[start + i + 1]);
        }
    }

    function _hexPair(bytes1 hi, bytes1 lo) internal pure returns (uint256) {
        return _hexVal(hi) * 16 + _hexVal(lo);
    }

    function _hexVal(bytes1 c) internal pure returns (uint256) {
        if (c >= "0" && c <= "9") return uint8(c) - uint8(bytes1("0"));
        if (c >= "a" && c <= "f") return 10 + uint8(c) - uint8(bytes1("a"));
        if (c >= "A" && c <= "F") return 10 + uint8(c) - uint8(bytes1("A"));
        revert("Phase2SafeExec: bad hex");
    }
}
