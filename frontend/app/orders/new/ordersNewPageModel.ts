export type OrdersNewGuideRow = {
  id: string;
  city?: string;
  avatar_url?: string | null;
  rating?: number | null;
  languages?: string[] | null;
  service_types?: string[] | null;
  bio?: string | null;
};

export function dedupeGuidesById(rows: OrdersNewGuideRow[]): OrdersNewGuideRow[] {
  const m = new Map<string, OrdersNewGuideRow>();
  for (const r of rows) {
    const id = String(r.id ?? "").trim();
    if (!id) continue;
    const next = (r.city ?? "").trim();
    const prev = m.get(id);
    if (!prev) {
      m.set(id, { id, city: next || undefined });
      continue;
    }
    const pc = (prev.city ?? "").trim();
    const merged = next.length > pc.length ? next : pc;
    m.set(id, { id, city: merged || undefined });
  }
  return Array.from(m.values());
}

export function sortPreferredGuideFirst(
  rows: OrdersNewGuideRow[],
  preferredId: string,
): OrdersNewGuideRow[] {
  const q = preferredId.trim();
  if (!q) return rows;
  const i = rows.findIndex((g) => g.id === q);
  if (i <= 0) return rows;
  const copy = [...rows];
  const [picked] = copy.splice(i, 1);
  return [picked, ...copy];
}

export function ordersNewGuideOptionLabel(g: OrdersNewGuideRow): string {
  const city = (g.city ?? "").trim();
  const idShort = g.id.length > 14 ? `${g.id.slice(0, 10)}…` : g.id;
  if (city) return `${city} · ${idShort}`;
  return idShort;
}
