// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../src/upgrade/TimelockUpgradeableProxy.sol";

/**
 * @title ProxyDeployLib
 * @notice G24-P-UPGRADE-01 · Governable Shell 统一 Proxy 部署
 */
library ProxyDeployLib {
    function deployTimelockControlledProxy(
        address implementation,
        address timelockAdmin,
        bytes memory initData
    ) internal returns (TimelockUpgradeableProxy proxy) {
        proxy = new TimelockUpgradeableProxy(implementation, timelockAdmin, initData);
    }
}
