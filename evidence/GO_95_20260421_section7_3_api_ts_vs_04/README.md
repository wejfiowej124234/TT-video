# GO_95 · §7.3 · `frontend/lib/api.ts` ↔ **04 §3.4**（机读对拍）· 2026-04-21

## 口径

- **SSOT**：**`docs/spec/04-后端与API.md`** 自 **`### 3.4 API 总览`** 起至 **`## 四、`** 前（含 **§3.5 Admin** 表内 **`| METHOD | path |`** 行及反引号 **`METHOD path`** 行）。
- **客户端真值**：**`frontend/lib/api.ts`** **`export const routes`** 块（至 **`} as const;`**）；块内块注释剔除；**`${…}`** 与表内 **`:id`** 等同构归一为占位后比路径（**方法不参与**匹配，与 **§7.3**「路径对拍」一致）。

## 门禁（仓库根）

```bash
bash scripts/run-check-04-routes.sh
# 含 scripts/gates/check-04-api-ts-routes-vs-doc-34.py（§7.3 api.ts ↔ 04）
```

登记日 **`check-04-api-ts-routes-vs-doc-34`** 输出：**`OK`**（**178** 条路径抽检）。

## 04 补齐（与 **70** / **93** 互指）

- **`GET /api/v1/admin/cross-check`**、**`GET /api/v1/admin/drift-summary`** 已补入 **04** **§3.5** 主表（**Epic C-01**；原 **70** 已写 **04 §3.4** 互指但表行缺失，机读闸无法闭合）。

## 边界

**不**替代 **`check-04-routes-vs-code`**（挂载 vs 表）；**不**扫描 **`apiUrl`** / **`apiClient/*`** 分散字面量；**不**替代 **OpenAPI** 全量终验。
