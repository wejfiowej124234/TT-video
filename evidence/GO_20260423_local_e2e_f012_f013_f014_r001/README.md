# GO_20260423 · local · E2E（F-012 / F-013 / F-014）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-itin-feed-local` |
| **Playwright** | **`e2e/f012-f013-f014-request.spec.ts`** · **`--project=api-itin-feed-chromium`** |
| **结果** | **4 passed**（约 **5.2s**；**2026-04-23** 本机） |

## 93 ↔ F（与 spec 头注释一致）

| Playwright 用例 | F | 93（母表口径） |
|------------------|---|----------------|
| `F-012 · POST /api/v1/itineraries …` | F-012 | **D-ITN-001** |
| `F-013 · POST …/confirm-final-plan …` | F-013 | **B-ORD-005** |
| `F-014 · POST post then GET feed …` | F-014 | **D-COM-001** |
| `F-014 · HTTP follow … mode=follow …` | F-014 | **D-COM-001**（**`mode=follow`** 扇面；与 **`matrix_93_d_com_001g_f014_*`** API·IT 脚注对读） |

## 诚实边界

- **`report.json`**：本包为 **`environment.name=local`** 的 **E2E 切片**（**`PARTIAL_GO`**），**不**闭合 **§9 · ISS-007** 主干（**staging 全矩阵** / **CI `build.yml`·`e2e` job**）。
- **§8.2**：**F-012/013/014** 行 **「行完成」** 早已 **`[x]`**；本轮**只**追加 **R-002 可机读 E2E 证据链**，**不**改母表勾号。
