# GO_20260423 · local · E2E（F-027 / F-028 / F-033）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-f027-f028-f033-local` |
| **Playwright** | **`e2e/f027-f028-f033-request.spec.ts`** · **`--project=api-f027-f028-f033-chromium`** |
| **结果** | **3 passed**（约 **3.1s**） |

## 93 ↔ F（与 spec 头注释一致）

| Playwright 用例 | F | 93 |
|------------------|---|-----|
| `F-027 · … POST review then GET …` | F-027 | **B-ESC-003** |
| `F-028 · trust-growth ingest duplicate Idempotency-Key …` | F-028 | **B-IDM-001** |
| `F-033 · POST custom … draft POST+GET …` | F-033 | **D-ITN-002** + **D-ITN-003**；**`report.json`** 拆 **两条 `cases[]`** |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007** 主干。
- **§8.2**：**F-027/028/033** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
