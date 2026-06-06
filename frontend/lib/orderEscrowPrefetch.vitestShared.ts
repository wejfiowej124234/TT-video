import { afterEach, beforeEach, vi } from "vitest";

export const PREFETCH_TEST_OID = "550e8400-e29b-41d4-a716-446655440000";

/** Call once inside each `describe` that touches sessionStorage + timers. */
export function useOrderEscrowPrefetchTestHooks(): void {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
}
