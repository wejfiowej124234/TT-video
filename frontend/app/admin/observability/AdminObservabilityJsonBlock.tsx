"use client";

export function AdminObservabilityJsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
