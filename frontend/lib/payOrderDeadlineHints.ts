import { orderStateToStep } from "@/components/escrow/OrderFlowSteps";

/** GET order 切片：用于 /pay 与 Escrow 一致的截止提示（07 §五 5.1、53-S12） */
export type PayDeadlineOrderSlice = {
  chat_confirm_deadline?: string | null;
  payment_deadline?: string | null;
  state?: string;
  sub_status?: string;
  status?: string;
};

function formatDeadlineLocal(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

/** 无内容时返回 null；与 EscrowDetail 步骤门控一致 */
export function computePayDeadlineLines(
  hints: PayDeadlineOrderSlice | null,
  t: (key: string) => string
): { lines: string[]; ariaLabel: string } | null {
  if (!hints) return null;
  const step = orderStateToStep(hints);
  const chatIso =
    typeof hints.chat_confirm_deadline === "string" ? hints.chat_confirm_deadline.trim() : "";
  const payIso = typeof hints.payment_deadline === "string" ? hints.payment_deadline.trim() : "";
  const showChat =
    chatIso.length > 0 && !Number.isNaN(Date.parse(chatIso)) && [2, 3].includes(step);
  const showPay =
    payIso.length > 0 && !Number.isNaN(Date.parse(payIso)) && [4, 5].includes(step);
  const lines: string[] = [];
  if (showChat) {
    lines.push(t("order_chatConfirmDeadlineHint").replace("{{date}}", formatDeadlineLocal(chatIso)));
  }
  if (showPay) {
    lines.push(t("order_paymentDeadlineHint").replace("{{date}}", formatDeadlineLocal(payIso)));
  }
  if (lines.length === 0) return null;
  return { lines, ariaLabel: t("pay_deadlineHintsAria") };
}
