// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";

interface ISafeProxyFactory {
    function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce)
        external
        returns (address proxy);
}

interface ISafe {
    function setup(
        address[] calldata _owners,
        uint256 _threshold,
        address to,
        bytes calldata data,
        address fallbackHandler,
        address paymentToken,
        uint256 payment,
        address payable paymentReceiver
    ) external;
}

/**
 * @title DeployPhase2TimelockAdminSafe
 * @notice Sepolia · 部署 Gnosis Safe 作为 `TIMELOCK_ADMIN_ADDRESS`（R-02 / G-05）
 * @dev Factory/singleton 默认 Sepolia v1.3.0 · 可 env 覆盖
 *
 * Env:
 *   PRIVATE_KEY — deployer（付 gas · ≠ Safe owner）
 *   SAFE_OWNERS — 逗号分隔 owner 地址（0x...）
 *   SAFE_THRESHOLD — 默认 1
 *   SAFE_PROXY_FACTORY / SAFE_SINGLETON / SAFE_FALLBACK_HANDLER — 可选
 */
contract DeployPhase2TimelockAdminSafe is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address[] memory owners = _parseOwners(vm.envString("SAFE_OWNERS"));
        require(owners.length >= 1, "DeployPhase2TimelockAdminSafe: SAFE_OWNERS required");
        uint256 threshold = vm.envOr("SAFE_THRESHOLD", uint256(1));
        require(threshold >= 1 && threshold <= owners.length, "DeployPhase2TimelockAdminSafe: bad threshold");

        for (uint256 i = 0; i < owners.length; i++) {
            require(owners[i] != deployer, "DeployPhase2TimelockAdminSafe: owner must not be deployer");
        }

        address factory = vm.envOr("SAFE_PROXY_FACTORY", address(0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2));
        address singleton = vm.envOr("SAFE_SINGLETON", address(0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552));
        address fallbackHandler = vm.envOr("SAFE_FALLBACK_HANDLER", address(0));

        bytes memory initializer = abi.encodeCall(
            ISafe.setup,
            (owners, threshold, address(0), bytes(""), fallbackHandler, address(0), 0, payable(address(0)))
        );

        vm.startBroadcast(pk);
        address safe = ISafeProxyFactory(factory).createProxyWithNonce(singleton, initializer, 0);
        vm.stopBroadcast();

        console.log("--- DeployPhase2TimelockAdminSafe ---");
        console.log("deployer", deployer);
        console.log("Phase2TimelockAdminSafe:", safe);
        console.log("threshold", threshold);
        console.log("owners_count", owners.length);
    }

    function _parseOwners(string memory csv) internal pure returns (address[] memory out) {
        bytes memory b = bytes(csv);
        uint256 count = 1;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] == ",") count++;
        }
        out = new address[](count);
        uint256 idx;
        uint256 start;
        for (uint256 i = 0; i <= b.length; i++) {
            if (i == b.length || b[i] == ",") {
                bytes memory part = new bytes(i - start);
                for (uint256 j = start; j < i; j++) {
                    part[j - start] = b[j];
                }
                out[idx++] = _parseAddr(string(part));
                start = i + 1;
            }
        }
    }

    function _parseAddr(string memory s) internal pure returns (address) {
        bytes memory b = bytes(s);
        uint256 start;
        while (start < b.length && (b[start] == " " || b[start] == "\t")) start++;
        uint256 end = b.length;
        while (end > start && (b[end - 1] == " " || b[end - 1] == "\t")) end--;
        require(end - start == 42, "DeployPhase2TimelockAdminSafe: bad address");
        bytes memory hexPart = new bytes(40);
        for (uint256 i = 0; i < 40; i++) {
            hexPart[i] = b[start + 2 + i];
        }
        return _hexToAddr(hexPart);
    }

    function _hexToAddr(bytes memory hex40) internal pure returns (address addr) {
        uint160 v;
        for (uint256 i = 0; i < 40; i += 2) {
            v = v * 256 + uint160(_hexVal(hex40[i]) * 16 + _hexVal(hex40[i + 1]));
        }
        addr = address(v);
    }

    function _hexVal(bytes1 c) internal pure returns (uint256) {
        if (c >= "0" && c <= "9") return uint8(c) - uint8(bytes1("0"));
        if (c >= "a" && c <= "f") return 10 + uint8(c) - uint8(bytes1("a"));
        if (c >= "A" && c <= "F") return 10 + uint8(c) - uint8(bytes1("A"));
        revert("DeployPhase2TimelockAdminSafe: bad hex");
    }
}
