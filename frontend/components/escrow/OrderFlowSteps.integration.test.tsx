/**
 * 53-S11 / §六附续 §2：集成测试「订单页+API」— 至少 1 例
 * Mock GET order 返回订单数据，断言 orderStateToStep 与 API 响应一致（步骤与 status 对应）
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { getOrder } from "@/lib/apiClient";
import { orderStateToStep } from "./OrderFlowSteps";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => (k: string) => k,
}));
vi.mock("@/lib/apiClient", () => ({
  getOrder: vi.fn(),
}));

/** 模拟从 API 拉取订单后展示步骤的组件，用于集成测试 */
function OrderStepFromApi({ orderId }: { orderId: string }) {
  const [step, setStep] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    getOrder(orderId)
      .then((o) => setStep(orderStateToStep((o ?? {}) as { state?: string; sub_status?: string })))
      .catch(() => setError("fail"));
  }, [orderId]);
  if (error) return <span data-testid="error">{error}</span>;
  if (step === null) return <span data-testid="loading">loading</span>;
  return <span data-testid="step">{step}</span>;
}

describe("OrderFlowSteps integration (mock API)", () => {
  beforeEach(() => {
    vi.mocked(getOrder).mockReset();
  });

  it("maps API order Accepted+sub_status confirmed to step 4", async () => {
    vi.mocked(getOrder).mockResolvedValue({
      state: "Accepted",
      sub_status: "confirmed",
      id: "test-id",
    } as unknown as Awaited<ReturnType<typeof getOrder>>);
    render(<OrderStepFromApi orderId="test-id" />);
    expect(screen.getByTestId("loading")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("step").textContent).toBe("4");
    });
    expect(getOrder).toHaveBeenCalledWith("test-id");
  });

  it("maps API order Completed+rating_confirmed to step 8", async () => {
    vi.mocked(getOrder).mockResolvedValue({
      state: "Completed",
      sub_status: "rating_confirmed",
      id: "oid-2",
    } as unknown as Awaited<ReturnType<typeof getOrder>>);
    render(<OrderStepFromApi orderId="oid-2" />);
    await waitFor(() => {
      expect(screen.getByTestId("step").textContent).toBe("8");
    });
  });
});
