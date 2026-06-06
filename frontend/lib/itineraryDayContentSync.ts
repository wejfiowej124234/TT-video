import type { UnifiedDayRow } from "@/lib/itineraryUnified";

function extractPrefsFromContent(content: string): { hotel: string; transport: string; food: string } {
  let hotel = "标准";
  let transport = "当地交通";
  let food = "当地特色";
  for (const seg of content.split(/[；;]/)) {
    const s = seg.trim();
    if (s.includes("住宿")) {
      const v = s.split("住宿")[1]?.split("·")[0]?.trim();
      if (v) hotel = v;
    }
    if (s.includes("交通")) {
      const v = s.split("交通")[1]?.split("·")[0]?.trim();
      if (v) transport = v;
    }
    if (s.includes("餐饮")) {
      const v = s.split("餐饮")[1]?.split("·")[0]?.trim();
      if (v) food = v;
    }
  }
  return { hotel, transport, food };
}

/** 与 chain_off `rebuild_day_content_line` 同形（Landing mock / PATCH sync） */
export function rebuildDayContentLine(
  destination: string,
  dayIndex: number,
  city: string,
  hotel: string,
  transport: string,
  food: string,
  notes?: string,
): string {
  const parts = [
    `${destination.trim()} 第${dayIndex}天 · ${city.trim()}`,
    `住宿${hotel} · 交通${transport} · 餐饮${food}`,
  ];
  const note = notes?.trim();
  if (note) parts.push(note);
  return parts.join("；");
}

/** Escrow 改城：同步 `content_text`（用户已写 narrative 时不改文案） */
export function applyDayCityChange(
  row: UnifiedDayRow,
  newCity: string | undefined,
  destination: string,
): UnifiedDayRow {
  const city = newCity?.trim() || undefined;
  if (row.description?.trim()) {
    return { ...row, city };
  }
  const sample = row.content_text ?? "";
  const { hotel, transport, food } = extractPrefsFromContent(sample);
  const notes = row.notes?.trim() || undefined;
  const dayIndex = row.day_index ?? 1;
  const content_text = rebuildDayContentLine(
    destination,
    dayIndex,
    city ?? "",
    hotel,
    transport,
    food,
    notes,
  );
  return { ...row, city, content_text };
}

export function patchDraftDayCity(
  base: UnifiedDayRow[],
  idx: number,
  newCity: string | undefined,
  destination: string,
): UnifiedDayRow[] {
  return base.map((r, i) => (i === idx ? applyDayCityChange(r, newCity, destination) : r));
}
