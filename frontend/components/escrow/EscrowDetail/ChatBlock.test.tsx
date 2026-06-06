/**
 * 37 §3：协议区聊天 — 输入与标题关联、发送中 aria-busy 与文案
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatBlock from "./ChatBlock";
import type { OrderRow } from "./types";

const { getOrderForContextMock } = vi.hoisted(() => ({
  getOrderForContextMock: vi.fn(),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/apiClient/orders", () => ({
  getOrder: (id: string) => getOrderForContextMock(id),
}));

const getOrderMessagesMock = vi.fn(async (_orderId: string) => []);
const postOrderMessageMock = vi.fn(
  async (_orderId: string, _body: unknown, _key: string) => undefined
);

vi.mock("@/lib/apiClient", () => ({
  getOrderMessages: (orderId: string) => getOrderMessagesMock(orderId),
  postOrderMessage: (orderId: string, body: unknown, key: string) =>
    postOrderMessageMock(orderId, body, key),
  getIdempotencyKey: () => "idem",
  isComplianceError: () => false,
}));

describe("ChatBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrderForContextMock.mockResolvedValue({
      order: { id: "order-1", destination: "Testland", amount: "1", currency: "USD" },
      itinerary: null,
    });
    getOrderMessagesMock.mockResolvedValue([]);
    postOrderMessageMock.mockImplementation(
      (_orderId: string, _body: unknown, _key: string) => new Promise(() => {})
    );
  });

  it("binds message input to chat heading via aria-labelledby", async () => {
    render(<ChatBlock orderId="order-1" />);
    expect(await screen.findByRole("heading", { name: "escrow_chatTitle" })).toBeTruthy();
    const input = screen.getByRole("textbox");
    const hid = input.getAttribute("aria-labelledby");
    expect(hid).toBeTruthy();
    const heading = document.getElementById(hid!);
    expect(heading?.textContent).toContain("escrow_chatTitle");
  });

  it("send button shows aria-busy and submitting label while post is in flight", async () => {
    render(<ChatBlock orderId="order-1" />);
    await screen.findByRole("heading", { name: "escrow_chatTitle" });
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "escrow_send" }));
    const busy = screen.getByRole("button", { name: "common_submitting" });
    expect(busy.getAttribute("aria-busy")).toBe("true");
    expect(busy.hasAttribute("disabled")).toBe(true);
    const field = screen.getByRole("textbox");
    expect(field.getAttribute("aria-busy")).toBe("true");
    expect(field.hasAttribute("disabled")).toBe(true);
  });

  it("54-S3: did variant message input uses protocol warm field tokens", async () => {
    render(
      <ChatBlock
        orderId="order-1"
        variant="did"
        orderContextInline={{
          order: { id: "order-1", destination: "Testland", amount: "1", currency: "USD" } as OrderRow,
          itinerary: null,
        }}
      />,
    );
    await screen.findByRole("heading", { name: "escrow_chatTitle" });
    const field = screen.getByRole("textbox");
    expect(field.className).toMatch(/text-slate-100/);
    expect(field.className).toMatch(/border-ref-sun/);
    expect(field.className).not.toMatch(/cyan/);
  });

  it("shows load error and disables compose when getOrderMessages rejects with not_implemented", async () => {
    // Strict Mode 会重复触发 effect；mockRejectedValueOnce 第二次会走成功路径，须稳定 reject
    getOrderMessagesMock.mockImplementation(() => Promise.reject(new Error("not_implemented")));
    render(<ChatBlock orderId="order-1" />);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent ?? "").toContain("common_apiNotImplemented");
    const input = screen.getByRole("textbox");
    expect(input.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "escrow_send" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "common_retry" })).toBeTruthy();
    getOrderMessagesMock.mockImplementation(async () => []);
  });

  it("53-S7 optional: micro itinerary ribbon under chat title when inline has destination and days", async () => {
    render(
      <ChatBlock
        orderId="order-1"
        variant="did"
        orderContextInline={{
          order: {
            id: "order-1",
            destination: "日本",
            city: "东京",
            amount: "1",
            currency: "USD",
          } as OrderRow,
          itinerary: {
            daily_itinerary: [
              { day_index: 1, city: "东京", description: "浅草" },
              { day_index: 2, city: "镰仓", description: "江之岛" },
            ],
          },
        }}
      />,
    );
    expect(await screen.findByRole("note", { name: "escrow_chat_microItinerary_aria" })).toBeTruthy();
    expect(screen.getByText("escrow_chat_microItinerary_label")).toBeTruthy();
    const ribbon = screen.getByRole("note", { name: "escrow_chat_microItinerary_aria" });
    expect(ribbon.textContent).toContain("日本");
    expect(ribbon.textContent).toContain("东京");
  });

  it("POST failure shows ApiErrorAlert, common_retry re-sends, common_closeAlert clears (B-041)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      getOrderMessagesMock.mockResolvedValue([]);
      postOrderMessageMock.mockReset();
      postOrderMessageMock
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce(undefined);

      render(<ChatBlock orderId="order-1" />);
      await screen.findByRole("heading", { name: "escrow_chatTitle" });
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
      fireEvent.click(screen.getByRole("button", { name: "escrow_send" }));

      await waitFor(() => {
        expect(screen.getByText("escrow_chatSendFailed")).toBeTruthy();
      });

      fireEvent.click(screen.getByRole("button", { name: "common_retry" }));
      await waitFor(() => {
        expect(postOrderMessageMock).toHaveBeenCalledTimes(2);
      });

      postOrderMessageMock.mockReset();
      postOrderMessageMock.mockRejectedValueOnce(new Error("network"));
      fireEvent.change(screen.getByRole("textbox"), { target: { value: "again" } });
      fireEvent.click(screen.getByRole("button", { name: "escrow_send" }));
      await waitFor(() => {
        expect(screen.getByText("escrow_chatSendFailed")).toBeTruthy();
      });
      fireEvent.click(screen.getByRole("button", { name: "common_closeAlert" }));
      expect(screen.queryByText("escrow_chatSendFailed")).toBeNull();
    } finally {
      errSpy.mockRestore();
    }
  });

  it("53-S7: did variant embeds order context above chat title without getOrder when inline passed", async () => {
    getOrderForContextMock.mockClear();
    render(
      <ChatBlock
        orderId="order-1"
        variant="did"
        orderContextInline={{
          order: { id: "order-1", destination: "Testland", amount: "1", currency: "USD" } as OrderRow,
          itinerary: null,
        }}
      />,
    );
    expect(getOrderForContextMock).not.toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "community_orderContext_title" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "escrow_chatTitle" })).toBeTruthy();
    const toCommunity = screen.getByRole("link", { name: /order_messageLinkCta/ });
    expect(toCommunity.getAttribute("href")).toContain("orderId=order-1");
    expect(screen.queryByRole("link", { name: /community_viewOrder/ })).toBeNull();
  });
});
