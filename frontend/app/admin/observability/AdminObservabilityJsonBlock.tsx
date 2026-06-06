"use client";

import { ADMIN_CONSOLE_JSON_BLOCK_CLASS } from "@/lib/adminUi";

export function AdminObservabilityJsonBlock({ value }: { value: unknown }) {
  return (
    <pre className={`mt-1 max-h-64 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
