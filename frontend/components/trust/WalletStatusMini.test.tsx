/**
 * 36 单测：34 组件 WalletStatusMini（28 顶栏 Wallet Connected / Wrong network），mock wagmi
 * 54-S17：未连接时下拉、connector、输入地址只读
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const useAccountMock = vi.fn();
const useChainIdMock = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: () => useAccountMock(),
  useChainId: () => useChainIdMock(),
  useConnect: () => ({
    connect: mockConnect,
    connectors: [
      { name: "MockWallet", uid: "mock-wallet-uid" },
      { name: "Second", uid: "second" },
      { name: "Third", uid: "third" },
    ],
    isPending: false,
  }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
}));

describe("WalletStatusMini", () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockDisconnect.mockClear();
  });

  it("shows connect button when not connected", () => {
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    expect(screen.getByRole("button", { name: "连接钱包" })).toBeTruthy();
    expect(screen.queryByText(/已连接|错误网络/)).toBeNull();
  });

  it("shows Connected and address when connected on correct chain", () => {
    useAccountMock.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    expect(
      screen.getByText((_, el) =>
        el?.classList.contains("text-ink-600") === true &&
        (el?.textContent ?? "").includes("已连接")
      )
    ).toBeTruthy();
    expect(screen.getAllByTitle("0x1234567890123456789012345678901234567890").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: "断开" })).toBeTruthy();
  });

  it("shows Wrong network when chainId does not match", () => {
    useAccountMock.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
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

  it("calls disconnect when 断开 is clicked", () => {
    useAccountMock.mockReturnValue({
      address: "0x1234567890123456789012345678901234567890",
      isConnected: true,
    });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    const disconnectBtn = screen.getByRole("button", { name: "断开" });
    fireEvent.click(disconnectBtn);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("54-S17: opens dropdown and lists connectors", () => {
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("选择钱包")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "MockWallet" })).toBeTruthy();
  });

  it("54-S17: clicking connector calls connect and closes menu", () => {
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "MockWallet" }));
    expect(mockConnect).toHaveBeenCalledWith({
      connector: expect.objectContaining({ name: "MockWallet", uid: "mock-wallet-uid" }),
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("54-S17: input wallet address binds view-only mode", () => {
    const addr = "0x0000000000000000000000000000000000000001";
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "输入钱包地址" }));
    const field = screen.getByRole("textbox", { name: "输入钱包地址" });
    fireEvent.change(field, { target: { value: addr } });
    fireEvent.click(screen.getByRole("button", { name: "同意" }));
    const row = screen.getByTitle(addr);
    expect(row.textContent).toMatch(/只读/);
  });

  it("54-S17: invalid address shows error on submit", () => {
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "输入钱包地址" }));
    fireEvent.change(screen.getByRole("textbox", { name: "输入钱包地址" }), { target: { value: "not-an-address" } });
    fireEvent.click(screen.getByRole("button", { name: "同意" }));
    expect(screen.getByText(/无效|地址/i)).toBeTruthy();
  });

  it("54-S17: Escape closes dropdown", () => {
    useAccountMock.mockReturnValue({ address: undefined, isConnected: false });
    useChainIdMock.mockReturnValue(137);
    renderWithLocale(<WalletStatusMini />);
    fireEvent.click(screen.getByRole("button", { name: "连接钱包" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape", bubbles: true });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
