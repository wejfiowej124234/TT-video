# GO_20260423 · local · E2E（F-029 / F-030 / F-031）→ R-001

## 本轮执行

| 项 | 值 |
|----|-----|
| **commit** | `48acbd10c6fbcf1aca4c84e867264fbbe1c1e3d5` |
| **命令** | `cd frontend && DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust SEED_TEST_ACCOUNTS=1 PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:api-f029-f030-f031-local` |
| **Playwright** | **`e2e/f029-f030-f031-request.spec.ts`** · **`--project=api-f029-f030-f031-chromium`** |
| **结果** | **4 passed**（约 **6.1s**） |

## 93 ↔ F（与 spec 头注释一致）

| Playwright 用例 | F | 93 |
|------------------|---|-----|
| `F-029 · GET internal indexer-status …` | F-029 | **D-IDX-001** |
| `F-030 · tourist Bearer cannot GET admin schema migrations (403)` | F-030 | **D-ADM-003**（**负向门禁**：断言 **403 `admin_required`**） |
| `F-031 · acquisition listing then … showcase` | F-031 | **D-COM-011** |
| `F-031 · acquisition post then HTTP follow …` | F-031 | **D-COM-011**（**`mode=follow`**；与 **`matrix_93_d_com_011f_f031_*`** API·IT 脚注对读） |

## 诚实边界

- **`report.json`**：**`local`** · **`PARTIAL_GO`**；**不**闭 **§9 · ISS-007** 主干。
- **§8.2**：**F-029/030/031** 行已为 **`[x]`**；本轮**只**追加 **E2E→R-001** 机读链。
