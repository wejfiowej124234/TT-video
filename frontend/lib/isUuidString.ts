/** 与后端 `Uuid::parse_str` 常见格式一致；用于排除 `post-local-*` 等前端占位 id。 */
export function isUuidString(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}
