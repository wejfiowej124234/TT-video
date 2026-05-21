/** 按 page-brief `media.*_env` 机读键名读取 `NEXT_PUBLIC_*`（构建期注入） */
export function readTraveltrustPublicEnv(key: string | undefined): string {
  if (!key?.trim() || typeof process === "undefined") return "";
  const v = process.env[key.trim()];
  return typeof v === "string" ? v.trim() : "";
}
