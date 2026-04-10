// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Test.sol";
import "../src/RegionVault.sol";
import "../src/FeeRouter.sol";
import "../src/IERC20.sol";
import "../src/MockERC20.sol";

contract RegionVaultTest is Test {
    /// @dev 须与 `RegionVault.RegionShareSnapshotLine` 与 Rust `REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE` 一致。
    event RegionShareSnapshotLine(
        uint256 indexed snapshotEpoch,
        address indexed recipient,
        string regionId,
        uint256 snapshotBlockNumber,
        uint256 shareBalance
    );

    event RegionVaultForwarded(address indexed token, address indexed to, uint256 amount);
    event PlatformFeeRouted(
        address indexed token,
        uint256 amount,
        uint256 toCountry,
        uint256 toStakers,
        uint256 toReserve,
        uint256 toOps
    );

    RegionVault public vault;
    MockERC20 public token;
    address public admin = makeAddr("admin");
    address public recipient = makeAddr("recipient");

    function setUp() public {
        vault = new RegionVault(admin);
        token = new MockERC20();
    }

    function test_Forward() public {
        token.mint(address(vault), 1000);
        vm.prank(admin);
        vault.forward(token, recipient, 400);
        assertEq(token.balanceOf(recipient), 400);
        assertEq(token.balanceOf(address(vault)), 600);
    }

    function test_Forward_Event() public {
        token.mint(address(vault), 100);
        vm.prank(admin);
        vm.expectEmit(true, true, false, true);
        emit RegionVaultForwarded(address(token), recipient, 100);
        vault.forward(token, recipient, 100);
    }

    function test_RevertNotOwner() public {
        token.mint(address(vault), 10);
        vm.expectRevert(RegionVault.OnlyOwner.selector);
        vault.forward(token, recipient, 10);
    }

    function test_RevertZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, recipient, 0);
    }

    function test_RevertZeroTo() public {
        token.mint(address(vault), 10);
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, address(0), 10);
    }

    function test_RevertInsufficientBalance() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAmount.selector);
        vault.forward(token, recipient, 1);
    }

    function test_RevertZeroToken() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAddress.selector);
        vault.forward(IERC20(address(0)), recipient, 1);
    }

    function test_TransferOwnership_NewOwnerCanForward() public {
        address newOwner = makeAddr("newOwner");
        token.mint(address(vault), 100);
        vm.prank(admin);
        vault.transferOwnership(newOwner);
        vm.expectRevert(RegionVault.OnlyOwner.selector);
        vm.prank(admin);
        vault.forward(token, recipient, 100);
        vm.prank(newOwner);
        vault.forward(token, recipient, 100);
        assertEq(token.balanceOf(recipient), 100);
    }

    function test_Forward_TransferFailed_WhenTokenReturnsFalse() public {
        token.mint(address(vault), 100);
        vm.mockCall(
            address(token),
            abi.encodeWithSelector(IERC20.transfer.selector, recipient, uint256(100)),
            abi.encode(false)
        );
        vm.prank(admin);
        vm.expectRevert(RegionVault.TransferFailed.selector);
        vault.forward(token, recipient, 100);
    }

    /// @dev 与 `cargo test -p traveltrust-api region_share_snapshot_line_topic0_keccak_stable` / `cast keccak` 同一向量。
    function test_RegionShareSnapshotLine_topic0_matches_rust_indexer() public pure {
        bytes32 got = keccak256(bytes("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)"));
        assertEq(got, 0x08e41cbd2f4b7878e7f1c13cfeb430e0d60e2552cc37abe12e37049e034289ac);
    }

    /// @dev `log.data` 须与 `abi.encode(string, uint256, uint256)` 一致，供 `parse_region_share_snapshot_line` 解码（与 `parse_region_share_snapshot_line_fixture_cn` 同值域）。
    function test_RegionShareSnapshotLine_emit_log_matches_abi_encode() public {
        address snapRecipient = 0xDDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd;
        vm.recordLogs();
        vm.prank(admin);
        vault.emitRegionShareSnapshotLine(42, snapRecipient, "CN", 12, 1);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 t0Want =
            keccak256(bytes("RegionShareSnapshotLine(uint256,address,string,uint256,uint256)"));
        bytes memory dataWant = abi.encode(string("CN"), uint256(12), uint256(1));

        bool found;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].emitter == address(vault) && logs[i].topics[0] == t0Want) {
                found = true;
                assertEq(logs[i].topics.length, 3);
                assertEq(logs[i].topics[1], bytes32(uint256(42)));
                assertEq(logs[i].topics[2], bytes32(uint256(uint160(snapRecipient))));
                assertEq(
                    logs[i].data,
                    dataWant,
                    "log data must match ABI encoding expected by parse_region_share_snapshot_line"
                );
                break;
            }
        }
        assertTrue(found, "RegionShareSnapshotLine log not found");
    }

    function test_RegionShareSnapshotLine_expectEmit() public {
        address snapRecipient = 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB;
        vm.prank(admin);
        vm.expectEmit(true, true, false, true, address(vault));
        emit RegionShareSnapshotLine(7, snapRecipient, "JP", 99, 1001);
        vault.emitRegionShareSnapshotLine(7, snapRecipient, "JP", 99, 1001);
    }

    function test_RevertEmitRegionShareSnapshotLine_EmptyRegion() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.EmptyRegionId.selector);
        vault.emitRegionShareSnapshotLine(1, recipient, "", 1, 0);
    }

    function test_RevertEmitRegionShareSnapshotLine_ZeroRecipient() public {
        vm.prank(admin);
        vm.expectRevert(RegionVault.InvalidAddress.selector);
        vault.emitRegionShareSnapshotLine(1, address(0), "CN", 1, 0);
    }

    function test_RevertEmitRegionShareSnapshotLine_NotOwner() public {
        vm.expectRevert(RegionVault.OnlyOwner.selector);
        vault.emitRegionShareSnapshotLine(1, recipient, "CN", 1, 0);
    }

    function test_FeeRouter_CountryBucket_GoesToVault() public {
        address stakers = makeAddr("stakers");
        address reserve = makeAddr("reserve");
        address ops = makeAddr("ops");
        FeeRouter router = new FeeRouter(admin, address(vault), stakers, reserve, ops);

        uint256 amount = 10_000;
        token.mint(address(router), amount);
        vm.prank(admin);
        vm.expectEmit(true, false, false, true, address(router));
        emit PlatformFeeRouted(address(token), amount, 4500, 3575, 1100, 825);
        router.distribute(token, amount);

        assertEq(token.balanceOf(address(vault)), 4500);
        vm.prank(admin);
        vault.forward(token, recipient, 4500);
        assertEq(token.balanceOf(recipient), 4500);
    }
}
