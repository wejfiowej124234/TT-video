import type { WalletConnectErrorKind } from "@/lib/wallet/connection/types";

/** Pure classifier — shared by Web controller and future App glue. */
export function classifyConnectError(err: unknown): WalletConnectErrorKind {
  const msg = String(
    (err as { shortMessage?: string; message?: string })?.shortMessage ??
      (err as { message?: string })?.message ??
      err ??
      ""
  ).toLowerCase();
  if (!msg) return "generic";
  if (
    msg.includes("reject") ||
    msg.includes("denied") ||
    msg.includes("user closed") ||
    msg.includes("user rejected") ||
    msg.includes("4001")
  ) {
    return "rejected";
  }
  if (msg.includes("unlock") || msg.includes("locked")) return "locked";
  if (
    msg.includes("expired") ||
    msg.includes("session topic") ||
    msg.includes("session expired") ||
    msg.includes("proposal expired")
  ) {
    return "expired";
  }
  if (
    msg.includes("provider not found") ||
    msg.includes("no ethereum") ||
    msg.includes("connector not found") ||
    msg.includes("does not exist")
  ) {
    return "unavailable";
  }
  return "generic";
}
