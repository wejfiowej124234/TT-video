import { getMe, getMeStats } from "@/lib/apiClient";
import { fetchMeSettingsPreferencesFromApi } from "@/lib/me/meSettingsPreferencesApi";

/** ① 本地 · 账户数据包导出（JSON 下载 · 无后端打包 API 时） */
export async function buildMeSettingsDataExportPackage(): Promise<Record<string, unknown>> {
  const [me, stats, prefs] = await Promise.all([
    getMe().catch(() => null),
    getMeStats().catch(() => null),
    fetchMeSettingsPreferencesFromApi(),
  ]);
  return {
    exported_at: new Date().toISOString(),
    schema: "traveltrust.me-settings-data-export.v1",
    me,
    stats,
    settings_preferences: prefs,
  };
}

export function downloadMeSettingsDataJson(payload: Record<string, unknown>, filename?: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `traveltrust-me-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
