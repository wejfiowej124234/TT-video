# TT-9623 · Vertical Slice 01 — 公开向导目录（全链路）

**Version:** 0.1.0  
**Status:** Runbook — **一条可验收竖切**；**不**改总体架构（见 [TT-9622](TT-9622-bounded-contexts-layering-and-integration-map.md)）。

---

## 1. 用户路径（端到端）

| 层 | 路径 / 行为 |
|----|----------------|
| **Next 页面** | **`/guides`**（列表）→ **`/guides/:id`**（详情） |
| **HTTP（04）** | **`GET /api/v1/guides`**、**`GET /api/v1/guides/:id`** |
| **Axum** | `crates/api/src/routes/guides.rs` → **`chain_off::guides_list_impl` / `guide_get_impl`** |
| **数据** | **`chain_off` 挂载**（`DATABASE_URL` + 启动灌库/内存态；见 README / TT-9618） |

**无 `chain_off` 时：** 列表 handler 历史上返回 **`{ status: ok, items: [] }`**（易误判为「真的没有向导」）。前端现已用 **`GET /meta` → `order_messages.chain_off_mounted`** 显式提示（见 `frontend/lib/readChainOffMountedFromMeta.ts`）。

---

## 2. 本地验收（①）

1. 启动 **traveltrust-api**（须 **`chain_off` 挂载**；本地通常 **`DATABASE_URL` + 迁移** 或文档所述 dev 栈）。  
2. 可选启动 **Next**（`frontend`）并打开 **`/guides`**。  
3. 仓库根执行：

```bash
bash scripts/gates/vertical-slice-01-guides-catalog.sh
```

- **exit 0**：**`/health`** OK，**`meta.order_messages.chain_off_mounted === true`**，**`GET /api/v1/guides`** 返回 **`status: ok`**。  
- **exit 2**：API 可达但 **`chain_off` 未挂载** — 先修环境再谈「空列表是真数据还是假空」。  
- **非 0 其他**：网络/端口/`jq` 缺失等。

---

## 3. 自动化测试（前端）

```bash
cd frontend && pnpm exec vitest run lib/readChainOffMountedFromMeta.test.ts
```

---

## 4. 互指

| 文档 / 代码 |
|-------------|
| [04 §3.4 · GET /api/v1/guides](../spec/04-后端与API.md) |
| [96-20 §5.6](../spec/96-20-前后端页面对齐与UI生产级审计报告.md) |
| [TT-9621 · 执行总序](TT-9621-master-order-96-backend-db-chain-frontend.md) |

---

## 5. 修订记录

| 版本 | 日期 | 摘要 |
|------|------|------|
| 0.1.0 | 2026-04-30 | 首版：路径表 + `vertical-slice-01-guides-catalog.sh` + 与 meta 对齐说明 |

---

**文档结束**
