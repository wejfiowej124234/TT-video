/**
 * /escrow/[id]/rate：53-S8 评分页 a11y / 37 §3.5（上传区、状态区、主按钮）
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/LocaleProvider";
import EscrowRatePage from "./page";

const { getOrderMock } = vi.hoisted(() => ({
  getOrderMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "11111111-1111-1111-1111-111111111111" }),
}));

vi.mock("@/lib/apiClient", () => ({
  getOrder: (...args: unknown[]) => getOrderMock(...args),
  orderConfirmRating: vi.fn(() => Promise.resolve()),
  getIdempotencyKey: () => "test-idempotency-key",
  getOrderReviews: vi.fn(() => Promise.resolve({ items: [] as unknown[] })),
  postReview: vi.fn(() => Promise.resolve({ status: "ok" })),
}));

function renderRate() {
  return render(
    <LocaleProvider>
      <EscrowRatePage />
    </LocaleProvider>
  );
}

describe("EscrowRatePage", () => {
  beforeEach(() => {
    getOrderMock.mockResolvedValue({ state: "Escrowed", sub_status: "" });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("after load: upload file input has aria-label; status region is polite live", async () => {
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    expect(screen.getByLabelText("选择要上传的行程评分照片或视频")).toBeTruthy();
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(within(status).getByText("我方状态")).toBeTruthy();
  });

  it("submit upload is disabled without files; describedby hints when disabled", async () => {
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    const submit = screen.getByRole("button", { name: "提交审核" });
    expect(submit.hasAttribute("disabled")).toBe(true);
    const hintId = submit.getAttribute("aria-describedby");
    expect(hintId).toBeTruthy();
    const hint = document.getElementById(hintId!);
    expect(hint?.textContent).toContain("请先选择至少一个文件");
  });

  it("after selecting a file: submit enabled; refresh shows confirm rating CTA", async () => {
    getOrderMock
      .mockResolvedValueOnce({ state: "Escrowed", sub_status: "" })
      .mockResolvedValue({ state: "completed", sub_status: "rating_pending" });
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    const fileInput = screen.getByLabelText("选择要上传的行程评分照片或视频");
    const file = new File(["x"], "trip.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    const submit = screen.getByRole("button", { name: "提交审核" });
    expect(submit.hasAttribute("disabled")).toBe(false);
    fireEvent.click(submit);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "确认评分与材料" })).toBeTruthy();
    });
  });

  it("53-S10: completed + rating_confirmed shows escrow release CTA (API snake_case state)", async () => {
    getOrderMock.mockResolvedValue({
      state: "completed",
      sub_status: "rating_confirmed",
    });
    renderRate();
    await screen.findByRole("heading", { level: 2, name: "链上释放" });
    const cta = screen.getByRole("link", { name: "打开托管详情并发起释放" });
    expect(cta.getAttribute("href")).toBe("/escrow/11111111-1111-1111-1111-111111111111");
  });

  it("53-S10: GET /orders/:id envelope { order } same phase + release CTA as flat body", async () => {
    getOrderMock.mockResolvedValue({
      status: "ok",
      order: { state: "completed", sub_status: "rating_confirmed" },
      itinerary: null,
    });
    renderRate();
    await screen.findByRole("heading", { level: 2, name: "链上释放" });
    expect(
      screen.getByRole("link", { name: "打开托管详情并发起释放" }).getAttribute("href"),
    ).toBe("/escrow/11111111-1111-1111-1111-111111111111");
  });

  it("53-S12: shows rating deadline from GET order when in rating phase", async () => {
    getOrderMock.mockResolvedValue({
      state: "completed",
      sub_status: "rating_pending",
      rating_deadline: "2030-06-15T12:00:00.000Z",
    });
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    expect(screen.getByText(/须于.*前完成评分确认/)).toBeTruthy();
  });

  it("shows text review block when order is completed (same ReviewBlock as escrow detail)", async () => {
    getOrderMock.mockResolvedValue({
      state: "completed",
      sub_status: "rating_pending",
    });
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    expect(screen.getByText(/链下文字评价与托管详情页同源/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "评价（P23）" })).toBeTruthy();
  });

  it("does not mount text review block when order is not in a reviewable final state", async () => {
    getOrderMock.mockResolvedValue({ state: "Escrowed", sub_status: "" });
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    expect(screen.queryByText(/链下文字评价与托管详情页同源/)).toBeNull();
    expect(screen.queryByRole("heading", { level: 3, name: "评价（P23）" })).toBeNull();
  });

  it("refunded: ReviewBlock + review_only note; no upload or confirm-rating (Completed-only API)", async () => {
    getOrderMock.mockResolvedValue({ state: "refunded", sub_status: "" });
    renderRate();
    await screen.findByRole("heading", { level: 1, name: "行程评分" });
    expect(screen.getByRole("heading", { level: 2, name: "资金终态（非已完成）" })).toBeTruthy();
    expect(screen.getByText(/链下文字评价与托管详情页同源/)).toBeTruthy();
    expect(screen.queryByLabelText("选择要上传的行程评分照片或视频")).toBeNull();
    expect(screen.queryByRole("button", { name: "确认评分与材料" })).toBeNull();
  });
});
