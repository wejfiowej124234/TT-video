# R-003 → R-002 §4 机读回填（自动生成）

- **run_id**：`GO_20260702_R003_STAGING`
- **release_gate**：`NO_GO`
- **同源**：本仓库 `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/report.json` 的 `cases[]`

## 用例行（粘贴进 [R-002 §4](docs/spec/R-002-回归执行闭环与发布准入.md) 主表或作指针）

| 93 用例 ID | 覆盖类型 | 仓库锚点（本轮证据） |
|------------|----------|----------------------|
| **A-ENV-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/phase0` · 阶段0：GET /health 200；GET /meta 200 且含 build/chain 等键 |
| **A-NEG-002** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-NEG-002` · 无会话 GET /api/v1/me → 401 |
| **A-NEG-001** | **prod HTTP** `FAIL` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-NEG-001` · 错误密码 → 401 invalid_credentials |
| **A-LOG-001** | **prod HTTP** `FAIL` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-LOG-001` · 登录成功且 GET /api/v1/me 200 |
| **A-ME-001** | **prod HTTP** `FAIL` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-ME-001` · GET /api/v1/me 字段与账号一致 |
| **A-LOG-002** | **prod HTTP** `FAIL` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-LOG-002` · 连续 GET /api/v1/me 200 |
| **A-LOG-003** | **prod HTTP** `FAIL` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T165557Z/A-LOG-003` · 登出后原 token GET /me → 401（依赖服务端 delete_session） — FAIL：POST /auth/logout HTTP 400（预期 200）。 |

