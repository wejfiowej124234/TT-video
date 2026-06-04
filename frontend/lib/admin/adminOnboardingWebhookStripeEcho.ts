/** ① 从 webhook job payload 提取 Stripe 回显字段（本地 DB · 非 ② 仪表盘真值）。 */
export type WebhookStripeEcho = {
  providerEventId: string | null;
  eventType: string | null;
  stripeObjectId: string | null;
};

function readString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function extractWebhookStripeEcho(row: Record<string, unknown>): WebhookStripeEcho {
  const payload = row.payload;
  let providerEventId: string | null = readString(row, "provider_event_id");
  let eventType: string | null = readString(row, "event_type");
  let stripeObjectId: string | null = null;

  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    providerEventId =
      providerEventId ??
      readString(p, "provider_event_id") ??
      readString(p, "id") ??
      readString(p, "stripe_event_id");
    eventType =
      eventType ??
      readString(p, "type") ??
      readString(p, "event_type") ??
      readString(p, "stripe_event_type");
    const data = p.data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const obj = d.object;
      if (obj && typeof obj === "object") {
        stripeObjectId = readString(obj as Record<string, unknown>, "id");
      }
    }
    stripeObjectId = stripeObjectId ?? readString(p, "object_id");
  }

  return { providerEventId, eventType, stripeObjectId };
}
