export function adminPolicyResourcesPreview(r: unknown, dash: string): string {
  if (r == null) return dash;
  try {
    const s = typeof r === "string" ? r : JSON.stringify(r);
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  } catch {
    return dash;
  }
}
