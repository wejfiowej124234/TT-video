/**
 * WalletStatusMini · TravelTrust L5 Wallet Connection Center
 * Mocks wagmi; covers connect sheet, connected account menu, view-only observing.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ViewOnlyAddressProvider } from "@/lib/ViewOnlyAddressContext";
import WalletStatusMini from "./WalletStatusMini";

function renderWithLocale(ui: React.ReactElement) {
  return render(
    <LocaleProvider>
      <ViewOnlyAddressProvider>{ui}</ViewOnlyAddressProvider>
    </LocaleProvider>
  );
}

const mockConnectAsync = vi.fn();
const mockDisconnectAsync = vi.fn();
const mockSwitchChainAsync = vi.fn();
const useAccountMock = vi.fn();
const useChainIdMock = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => useAccountMock(),
  useChainId: () => useChainIdMock(),
  useConnect: () => ({
    connect: mockConnectAsync,
    connectAsync: mockConnectAsync,
    connectors: [
      { name: "MetaMask", uid: "metamask", id: "metaMask", type: "injected" },
      { name: "MockWallet", uid: "mock-wallet-uid", id: "mock", type: "injected" },
      { name: "WalletConnect", uid: "walletConnect", id: "walletConnect", type: "walletConnect" },
    ],
    isPending: false,
    error: null,
  }),
  useDisconnect: () => ({ disconnect: mockDisconnectAsync, disconnectAsync: mockDisconnectAsync }),
  useSwitchChain: () => ({
    switchChainAsync: mockSwitchChainAsync,
    isPending: false,
    error: null,
  }),
}));

describe("WalletStatusMini", () => {
  beforeEach(() => {
    mockConnectAsync.mockReset();
    mockDisconnectAsync.mockReset();
    mockSwitchChainAsync.mockReset();
    mockConnectAsync.mockResolvedValue({});
    mockDisconnectAsync.mockResolvedValue(undefined);
  });

  it("shows connect wallet CTA when not connected", () => {
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    expect(screen.getByRole("button", { name: "连接钱包" })).toBeTruthy();
    expect(screen.getByText("连接钱包")).toBeTruthy();
    expect(screen.queryByText(/已连接|错误网络/)).toBeNull();
  });

  it("opens L5 sheet with recommended wallets and security copy", () => {
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("选择你已经拥有的钱包")).toBeTruthy();
    expect(screen.getByText(/不保存私钥或助记词/)).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "MockWallet" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "MetaMask" })).toBeTruthy();
  });

  it("clicking connector calls connectAsync and closes sheet", async () => {
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "MockWallet" }));
    await waitFor(() => {
      expect(mockConnectAsync).toHaveBeenCalledWith({
        connector: expect.objectContaining({ name: "MockWallet", uid: "mock-wallet-uid" }),
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("connected chip opens account menu; disconnect lives in menu", async () => {
    useAccountMock.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
      chainId: 137,
      connector: { name: "MetaMask" },
      status: "connected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    expect(screen.getByText(/已连接/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "断开连接" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /已连接钱包/ }));
    expect(screen.getByRole("menu", { name: "钱包账户" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "断开连接" }));
    await waitFor(() => {
      expect(mockDisconnectAsync).toHaveBeenCalled();
    });
  });

  it("shows Wrong network when chainId does not match", () => {
    useAccountMock.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
      chainId: 1,
      connector: { name: "MetaMask" },
      status: "connected",
    });
    useChainIdMock.mockReturnValue(1);
    renderWithLocale(<WalletStatusMini />);
    expect(
      screen.getByText((_, el) =>
        el?.classList.contains("text-warning") === true &&
        (el?.textContent ?? "").includes("错误网络")
      )
    ).toBeTruthy();
  });

  it("54-S17: view-only address uses observing label (not connected)", async () => {
    const addr = "0x0000000000000000000000000000000000000001";
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "仅查看地址" }));
    const field = screen.getByRole("textbox", { name: "输入钱包地址" });
    fireEvent.change(field, { target: { value: addr } });
    fireEvent.click(screen.getByRole("button", { name: "同意" }));
    await waitFor(() => {
      expect(screen.getByText(/观察中/)).toBeTruthy();
    });
    expect(screen.getByTitle(addr)).toBeTruthy();
    expect(screen.queryByText(/^已连接$/)).toBeNull();
  });

  it("54-S17: invalid address shows error on submit", () => {
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "仅查看地址" }));
    fireEvent.change(screen.getByRole("textbox", { name: "输入钱包地址" }), {
      target: { value: "not-an-address" },
    });
    fireEvent.click(screen.getByRole("button", { name: "同意" }));
    expect(screen.getByText("无效的 EVM 地址")).toBeTruthy();
  });

  it("54-S17: Escape closes sheet", () => {
    useAccountMock.mockReturnValue({
      address: undefined,
      isConnected: false,
      status: "disconnected",
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape", bubbles: true });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
