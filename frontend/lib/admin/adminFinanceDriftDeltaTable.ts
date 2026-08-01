/**
 * HU-278 · Normalize drift `delta` into product table rows (no invented totals).
 */

export type AdminFinanceDriftDeltaRow = {
  key: string;
  count: string;
  amount: string;
  note: string;
};

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : "—";
  }
  try {
    return JSON.stringify(v);
  } catch {
    return "—";
  }
}

/** Build tabular rows from API `delta` (array of objects, plain object, or empty). */
export function adminFinanceDriftDeltaRows(delta: unknown): AdminFinanceDriftDeltaRow[] {
  if (delta === undefined || delta === null) return [];

  if (Array.isArray(delta)) {
    if (delta.length === 0) return [];
    return delta.map((item, i) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        const o = item as Record<string, unknown>;
        const key = String(o.key ?? o.id ?? o.channel ?? o.field ?? o.path ?? `#${i + 1}`);
        const count = cell(o.count ?? o.n ?? o.qty ?? o.items);
        const amount = cell(o.amount ?? o.value ?? o.delta ?? o.diff);
        const note = cell(o.note ?? o.message ?? o.reason ?? o.label ?? "");
        return { key, count, amount, note: note === "—" ? "" : note };
      }
      return { key: `#${i + 1}`, count: "—", amount: "—", note: cell(item) };
    });
  }

  if (typeof delta === "object") {
    const o = delta as Record<string, unknown>;
    const keys = Object.keys(o);
    if (keys.length === 0) return [];
    return keys.map((k) => {
      const v = o[k];
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        const nested = v as Record<string, unknown>;
        return {
          key: k,
          count: cell(nested.count ?? nested.n),
          amount: cell(nested.amount ?? nested.value ?? nested.delta),
          note: cell(nested.note ?? nested.message ?? ""),
        };
      }
      return { key: k, count: "—", amount: cell(v), note: "" };
    });
  }

  return [{ key: "delta", count: "—", amount: cell(delta), note: "" }];
}
