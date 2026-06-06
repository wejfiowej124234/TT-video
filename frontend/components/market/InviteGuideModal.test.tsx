/**
 * InviteGuideModal：缺 order id 时展示说明并禁用底部链接
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GuideCardItem } from "@/lib/marketTypes";
import InviteGuideModal from "./InviteGuideModal";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("InviteGuideModal", () => {
  it("shows missing order id when orderId is blank", () => {
    render(
      <InviteGuideModal
        orderId="   "
        guides={
          [
            {
              id: "g1",
              city: "Tokyo",
              languages: ["ja"],
              service_types: ["walk"],
              bio: "",
              hourly_rate: "1",
              hourly_currency: "USDC",
            },
          ] satisfies GuideCardItem[]
        }
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("invite_guide_missing_order_id")).toBeTruthy();
    expect(screen.getByRole("link", { name: "orders_viewDetail" }).getAttribute("aria-disabled")).toBe("true");
  });
});
