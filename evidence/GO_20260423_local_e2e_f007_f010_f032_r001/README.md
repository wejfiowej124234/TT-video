# GO_20260423 · local · E2E（F-007 / F-010 / F-032）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-f007-f010-f032-local` |
| **Playwright** | **`e2e/f007-f010-f032-request.spec.ts`** · **`--project=api-f007-f010-f032-chromium`** |
| **结果** | **3 passed**（约 **6.0s**） |

## 93 ↔ F（与 spec 头注释一致）

| 用例 | F | 93 |
|------|---|-----|
| 本机 **`POST …/profile-avatar`** → **`GET /me`** **`avatar_url`** | F-007 | **A-AVA-001** |
| **`accept`→`mock-pay`→`escrowed`** | F-010 | **B-ESC-001** |
| **`GET …/trust-growth/config`** **`pgrow3.storage`**=`postgres` | F-032 | **B-TGR-001** |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007** / **ISS-008**（**S3**）。
- **§8.2**：**F-007/010/032** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
