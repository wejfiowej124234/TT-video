# GO_95 · §7.1 域 H（向导）审计证据 · 2026-04-21

## 前端路由 ↔ **04 §3.4** 前端表

| 路径 | 实现要点 |
|------|----------|
| **`/guides`** | **`frontend/app/guides/page.tsx`**：**`getGuides`**（**`frontend/lib/apiClient/guides.ts`** → **`fetch(apiUrl(routes.guides))`** = **`GET /api/v1/guides`**）；**`mapApiReadError`** / **`ApiErrorAlert`**。 |
| **`/guides/[id]`** | **`frontend/app/guides/[id]/page.tsx`**：**`getGuide`**、**`postGuideStake`**（**`routes.guideById`** / **`routes.guideStake`** ↔ **04** **`GET|POST …/guides/:id`**、**`POST …/guides/:id/stake`**）；**`GuideOccupiedScheduleBlock`** 与 **04** **`GET …/guides/:id/availability`**（**B-079**）叙述一致。 |
| **`/guide/register`** | **`frontend/app/guide/register/page.tsx`**：**`postGuide`**、**`postGuideUploadDoc`**（**`routes.guides`**、**`routes.guideUploadDoc`** ↔ **04** **`POST /api/v1/guides`**、**`POST …/guides/upload-doc`**）；与 **04** 注册流「**`POST /auth/register`** 后跳转 **`/guide/register`** 再 **`POST /api/v1/guides`**」互指。 |

**`/guide`**（**`frontend/app/guide/page.tsx`**）：壳/入口页；**主契约面**以 **`/guide/register`** 为准。

## **`api.ts` / `apiClient/guides.ts`**

- **`routes.guides`**、**`guideById`**、**`guideUploadDoc`**、**`guideAvailability`**、**`guideStake`**、**`uploadsGuide`** — **`frontend/lib/api.ts`**。  
- **`guides.test.ts`**：**`getGuides`**/**`getGuide`**/**`postGuide`**/**`postGuideUploadDoc`**/**`postGuideStake`** URL 与 **04** 同源。

## **81（经济 / 身份质押）**

**`POST …/guides/:id/stake`** 与 **81**/**14** 分轨（**`IdentityStakingPool` 系** vs **Escrow** 订单本金）；本域为**读前对读**，**不**替代 **81** 全文或链上终验。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0
```

## 边界

**不**替代 **§8.2** **F-023**/**F-024** 行完成；**不**替代 **93 B** 全量 **PASS**。
