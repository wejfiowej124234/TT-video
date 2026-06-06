/** Run admin queue list fetches one-at-a-time to avoid burst 429 on `/admin` home load. */
export async function runAdminQueueFetchesInSeries<T>(
  tasks: ReadonlyArray<() => Promise<T>>,
): Promise<T[]> {
  const out: T[] = [];
  for (const task of tasks) {
    out.push(await task());
  }
  return out;
}
