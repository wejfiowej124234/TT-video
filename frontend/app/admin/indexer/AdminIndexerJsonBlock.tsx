"use client";

import { ADMIN_CONSOLE_JSON_BLOCK_CLASS } from "@/lib/adminUi";

export function AdminIndexerJsonBlock({ value }: { value: unknown }) {
  return (
    <pre className={`mt-1 max-h-[min(28rem,70vh)] overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
