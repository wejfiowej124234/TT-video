# GO_20260423 · local · E2E（F-018 / F-019 / F-020）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-d-com-018-020-local` |
| **Playwright** | **`e2e/f018-f019-f020-request.spec.ts`** · **`--project=api-d-com-018-020-chromium`** |
| **结果** | **7 passed**（约 **7.6s**） |

## 93 ↔ F（与 spec 头注释一致）

| F | 93（母表口径） | Playwright 覆盖 |
|---|----------------|-----------------|
| **F-018** | **D-COM-010** | 举报 + 无头 **`GET …/posts/:id`** |
| **F-019** | **D-COM-009** | **`me/posts`** + **`me/likes`/`me/collects`** 链 |
| **F-020** | **B-MKT-004** | 订单星标 **`POST|GET|DELETE|GET`** + **双星标 + `listing`→400** |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007** 主干。
- **§8.2**：**F-018/019/020** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
