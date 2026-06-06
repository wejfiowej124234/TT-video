"use client";

import { useEffect, useState } from "react";

/** 防抖字符串；`delayMs` 内无变化才提交 `value`。 */
export function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
