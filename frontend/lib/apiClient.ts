/**
 * API 客户端统一入口（实现位于 lib/apiClient/index.ts）
 *
 * 部分工具链会优先解析 `apiClient.ts` 而非 `apiClient/index.ts`；此处全量再导出，
 * 与 index 保持单源一致，避免遗漏符号（见 04 §三、49 CR 门禁「apiClient 与 routes 一致」）。
 */
export * from "./apiClient/index";
