/**
 * Bounded parallel admin queue fetches (HU-459).
 * Caps burst vs full Promise.all while beating strict serial for 5 inbox channels.
 */
export async function runAdminQueueFetchesWithConcurrency<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
  concurrency = 3,
): Promise<T[]> {
  const n = tasks.length;
  if (n === 0) return [];
  const cap = Math.max(1, Math.min(concurrency, n));
  const out: T[] = new Array(n);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < n) {
      const i = next;
      next += 1;
      out[i] = await tasks[i]!();
    }
  }

  await Promise.all(Array.from({ length: cap }, () => worker()));
  return out;
}

/** Inbox home: five channels · audit target concurrency 2–3 */
export const ADMIN_HOME_INBOX_FETCH_CONCURRENCY = 3;
