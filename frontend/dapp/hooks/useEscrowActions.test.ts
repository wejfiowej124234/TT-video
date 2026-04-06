/**
 * P10-1 单测：钱包与链交互逻辑（01 §7、06 txMachine）
 * 对 useEscrowActions 的 release/deposit/openDispute 写合约参数与 no-op 条件做单测，mock wagmi。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useEscrowRelease,
  useEscrowDeposit,
  useEscrowRefund,
  useEscrowOpenDispute,
} from "./useEscrowActions";

const writeContractMock = vi.fn();
vi.mock("wagmi", () => ({
  useWriteContract: () => ({
    writeContract: writeContractMock,
    data: undefined,
    isPending: false,
    error: null,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}));

describe("useEscrowActions (P10 钱包与链交互)", () => {
  beforeEach(() => {
    writeContractMock.mockClear();
  });

  describe("useEscrowRelease", () => {
    it("calls writeContract with release when escrowAddress is set", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const { result } = renderHook(() => useEscrowRelease(address));
      act(() => {
        result.current.release();
      });
      expect(writeContractMock).toHaveBeenCalledTimes(1);
      expect(writeContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address,
          functionName: "release",
        })
      );
    });

    it("does not call writeContract when escrowAddress is undefined", () => {
      const { result } = renderHook(() => useEscrowRelease(undefined));
      act(() => {
        result.current.release();
      });
      expect(writeContractMock).not.toHaveBeenCalled();
    });
  });

  describe("useEscrowDeposit", () => {
    it("calls writeContract with deposit and amount when address and amount are set", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const amount = BigInt(1e18);
      const { result } = renderHook(() =>
        useEscrowDeposit(address, amount)
      );
      act(() => {
        result.current.deposit();
      });
      expect(writeContractMock).toHaveBeenCalledTimes(1);
      expect(writeContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address,
          functionName: "deposit",
          args: [amount],
        })
      );
    });

    it("does not call writeContract when escrowAddress is undefined", () => {
      const { result } = renderHook(() =>
        useEscrowDeposit(undefined, BigInt(1e18))
      );
      act(() => {
        result.current.deposit();
      });
      expect(writeContractMock).not.toHaveBeenCalled();
    });

    it("does not call writeContract when amount is undefined", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const { result } = renderHook(() => useEscrowDeposit(address, undefined));
      act(() => {
        result.current.deposit();
      });
      expect(writeContractMock).not.toHaveBeenCalled();
    });
  });

  describe("useEscrowRefund (P18)", () => {
    it("calls writeContract with refund when escrowAddress is set", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const { result } = renderHook(() => useEscrowRefund(address));
      act(() => {
        result.current.refund();
      });
      expect(writeContractMock).toHaveBeenCalledTimes(1);
      expect(writeContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address,
          functionName: "refund",
        })
      );
    });
    it("does not call writeContract when escrowAddress is undefined", () => {
      const { result } = renderHook(() => useEscrowRefund(undefined));
      act(() => {
        result.current.refund();
      });
      expect(writeContractMock).not.toHaveBeenCalled();
    });
  });

  describe("useEscrowOpenDispute", () => {
    it("calls writeContract with openDispute and reasonHash when address is set", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const reasonHash =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      const { result } = renderHook(() => useEscrowOpenDispute(address));
      act(() => {
        result.current.openDispute(reasonHash);
      });
      expect(writeContractMock).toHaveBeenCalledTimes(1);
      expect(writeContractMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address,
          functionName: "openDispute",
          args: [reasonHash],
        })
      );
    });

    it("does not call writeContract when escrowAddress is undefined", () => {
      const reasonHash =
        "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;
      const { result } = renderHook(() => useEscrowOpenDispute(undefined));
      act(() => {
        result.current.openDispute(reasonHash);
      });
      expect(writeContractMock).not.toHaveBeenCalled();
    });
  });

  describe("tx 状态（txMachine 最小，P17 门禁 1）", () => {
    it("useEscrowRelease returns isPending and isSuccess from wagmi", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const { result } = renderHook(() => useEscrowRelease(address));
      expect(typeof result.current.isPending).toBe("boolean");
      expect(typeof result.current.isSuccess).toBe("boolean");
      expect(typeof result.current.release).toBe("function");
    });
    it("useEscrowOpenDispute returns isPending and isSuccess for tx state machine", () => {
      const address = "0x1234567890123456789012345678901234567890" as `0x${string}`;
      const { result } = renderHook(() => useEscrowOpenDispute(address));
      expect(typeof result.current.isPending).toBe("boolean");
      expect(typeof result.current.isSuccess).toBe("boolean");
      expect(typeof result.current.openDispute).toBe("function");
    });
  });
});
