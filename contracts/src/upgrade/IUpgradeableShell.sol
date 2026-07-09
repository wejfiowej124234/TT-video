// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @notice G24-P-UPGRADE-01 · Governable Shell 标记 · 实现须经 TimelockUpgradeableProxy 部署
 */
interface IUpgradeableShell {
    function shellVersion() external pure returns (string memory);

    function shellUpgradeLabel() external pure returns (string memory);
}
