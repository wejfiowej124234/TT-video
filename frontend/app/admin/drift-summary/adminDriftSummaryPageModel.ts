export function formatDriftSummaryUnknownJson(value: unknown): string {
  if (value === undefined) return "undefined";
  try {
    const s = JSON.stringify(value, null, 2);
    return s ?? String(value);
  } catch {
    return String(value);
  }
}

export function formatDriftDetected(v: boolean | undefined, notProvidedLabel: string): string {
  if (v === undefined) return notProvidedLabel;
  return v ? "true" : "false";
}
