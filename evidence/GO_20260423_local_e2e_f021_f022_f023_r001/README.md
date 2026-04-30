# GO_20260423 · local · E2E（F-021 / F-022 / F-023）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-mkt-guides-021-023-local` |
| **Playwright** | **`e2e/f021-f022-f023-request.spec.ts`** · **`--project=api-mkt-guides-021-023-chromium`** |
| **结果** | **3 passed**（约 **2.9s**） |

## 93 ↔ F（与 spec 头注释一致）

| F | 93 |
|---|-----|
| **F-021** | **B-MKT-005** |
| **F-022** | **B-MKT-006** |
| **F-023** | **B-GDE-001**（**`POST …/guides`→`GET …/:id`/`…/availability`**） |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007** 主干。
- **§8.2**：**F-021/022/023** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
