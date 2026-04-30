# GO_20260423 · local · E2E（F-008 / F-009 / F-011）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-b-orders-local` |
| **Playwright** | **`e2e/orders-b-domain-request.spec.ts`** · **`--project=api-b-orders-chromium`** |
| **结果** | **3 passed**（约 **4.4s**） |

## 93 ↔ F（与 spec 头 + 95 §8.2 脚注一致）

| F | 93 |
|---|-----|
| **F-008** | **B-ORD-001**（**`POST /api/v1/orders`**） |
| **F-009** | **B-ORD-002**（**`GET /api/v1/orders`**） |
| **F-011** | **B-ORD-006**（**`POST …/set-escrow-address`** + **`GET …/orders/:id`** 读回） |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007**（**真链托管** 仍 **ISS-007**）。
- **§8.2**：**F-008/009/011** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
