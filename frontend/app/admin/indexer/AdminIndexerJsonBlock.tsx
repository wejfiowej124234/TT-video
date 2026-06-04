"use client";

export function AdminIndexerJsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-[min(28rem,70vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
