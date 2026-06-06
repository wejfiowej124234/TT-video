import type { SecurityNotificationItem } from "./meSecurityPageTypes";

export function isRiskNotification(n: SecurityNotificationItem): boolean {
  const eventType = (n.event_type ?? "").toLowerCase();
  const status = (n.delivery_status ?? "").toLowerCase();
  return (
    status === "failed" ||
    (n.attempts ?? 0) > 0 ||
    eventType.includes("reset") ||
    eventType.includes("forgot") ||
    eventType.includes("password")
  );
}

export function isPasswordRelated(n: SecurityNotificationItem): boolean {
  const eventType = (n.event_type ?? "").toLowerCase();
  return (
    eventType.includes("reset") || eventType.includes("forgot") || eventType.includes("password")
  );
}

export function notificationKey(n: SecurityNotificationItem): string {
  return n.id ?? `${n.event_type ?? "evt"}-${n.created_at ?? "na"}`;
}
