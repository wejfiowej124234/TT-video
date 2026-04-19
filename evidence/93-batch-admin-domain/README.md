# 93 矩阵 · Admin 独立业务域（企业级壳验证）

**批次 ID**：`93-ADMIN-DOMAIN`  
**Playwright**：`frontend/e2e/93-matrix-admin-domain-batch.spec.ts`  
**盘点表**：[`inventory.md`](./inventory.md)

## 与 `smoke-admin.spec.ts` 的关系

| 维度 | smoke-admin | 本批次 |
|------|----------------|--------|
| Cookie | `traveltrust_user_id=e2e-smoke-admin` | 相同 |
| 导航 | `gotoSmoke`（`load`） | 相同 |
| 断言 | 多数页仅 `body` 可见 | **每页 `main` + `h1`**（生产级壳） |
| 覆盖 | 列表 + 占位详情 + 合规子路径 | **全 57 个 `page.tsx` 路由**（静态 45 + 详情/写壳 12） |
| TT-L4 | 部分用例在 sepolia 工程内 | 本文件 **`@e2e-sepolia-deferred`**，**不**进入 `chromium-sepolia` |

## 复跑命令

```bash
cd frontend && npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium
```

**分块**（调试）：

```bash
npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium -g "static hub"
npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium -g "detail"
npx playwright test e2e/93-matrix-admin-domain-batch.spec.ts --project=chromium -g "permission|invalid"
```

## 证据子目录

每次执行创建 `evidence/93-batch-admin-domain/<run_id>/`（截图、trace、`notes.md`）；勿覆盖 `GO_*` 冻结目录。
