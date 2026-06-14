/**
 * 向导档期 GET 去重 · 短缓存 · 限并发（避免市场 bind 时 429 风暴）
 */
import { getGuideAvailability } from "@/lib/apiClient";

export type GuideAvailabilityPayload = Awaited<ReturnType<typeof getGuideAvailability>>;

const CACHE_TTL_MS = 30_000;
const MAX_CONCURRENCY = 4;
const RATE_LIMIT_RETRY_MS = [600, 1200, 2400] as const;

const cache = new Map<string, { at: number; data: GuideAvailabilityPayload }>();
const inflight = new Map<string, Promise<GuideAvailabilityPayload>>();

export function clearGuideAvailabilityClientCache(): void {
  cache.clear();
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return (
    msg === "rate_limit_exceeded" ||
    msg === "critical_write_rate_limit_exceeded" ||
    msg.includes("429")
  );
}

export async function fetchGuideAvailabilityCached(guideId: string): Promise<GuideAvailabilityPayload> {
  const id = guideId.trim();
  if (!id) throw new Error("invalid_guide_id");

  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const pending = inflight.get(id);
  if (pending) return pending;

  const task = (async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_MS.length; attempt++) {
      try {
        const data = await getGuideAvailability(id);
        cache.set(id, { at: Date.now(), data });
        return data;
      } catch (err) {
        lastErr = err;
        if (isRateLimitError(err) && attempt < RATE_LIMIT_RETRY_MS.length) {
          await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_MS[attempt]));
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("rate_limit_exceeded");
  })().finally(() => {
    inflight.delete(id);
  });

  inflight.set(id, task);
  return task;
}

/** 按并发上限拉取多向导档期（市场 bind 过滤用） */
export async function fetchGuideAvailabilityForMany(
  guideIds: readonly string[],
): Promise<Map<string, GuideAvailabilityPayload | null>> {
  const unique = [...new Set(guideIds.map((g) => g.trim()).filter(Boolean))];
  const out = new Map<string, GuideAvailabilityPayload | null>();
  if (unique.length === 0) return out;

  let cursor = 0;
  const worker = async () => {
    while (cursor < unique.length) {
      const idx = cursor++;
      const id = unique[idx]!;
      try {
        out.set(id, await fetchGuideAvailabilityCached(id));
      } catch {
        out.set(id, null);
      }
    }
  };

  const workers = Array.from({ length: Math.min(MAX_CONCURRENCY, unique.length) }, () => worker());
  await Promise.all(workers);
  return out;
}
