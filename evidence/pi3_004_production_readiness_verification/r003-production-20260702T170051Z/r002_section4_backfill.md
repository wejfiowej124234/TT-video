# R-003 → R-002 §4 机读回填（自动生成）

- **run_id**：`GO_20260702_R003_STAGING`
- **release_gate**：`PARTIAL_GO`
- **同源**：本仓库 `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/report.json` 的 `cases[]`

## 用例行（粘贴进 [R-002 §4](docs/spec/R-002-回归执行闭环与发布准入.md) 主表或作指针）

| 93 用例 ID | 覆盖类型 | 仓库锚点（本轮证据） |
|------------|----------|----------------------|
| **A-ENV-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/phase0` · 阶段0：GET /health 200；GET /meta 200 且含 build/chain 等键 |
| **A-NEG-002** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-NEG-002` · 无会话 GET /api/v1/me → 401 |
| **A-NEG-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-NEG-001` · 错误密码 → 401 invalid_credentials |
| **A-LOG-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-LOG-001` · 登录成功且 GET /api/v1/me 200 |
| **A-ME-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-ME-001` · GET /api/v1/me 字段与账号一致 |
| **A-LOG-002** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-LOG-002` · 连续 GET /api/v1/me 200 |
| **A-LOG-003** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/A-LOG-003` · 登出后原 token GET /me → 401（依赖服务端 delete_session） |
| **B-MKT-001** | **prod HTTP** `PASS` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/B-MKT-001` · GET /api/v1/discover/orders 200 |
| **B-GDE-001** | **prod HTTP** `BLOCKED` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/B-GDE-001` · GET guides 列表取 id + GET guides/:id 200（无 active 向导时 BLOCKED：需 SEED 或数据） |
| **B-ORD-001** | **prod HTTP** `BLOCKED` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/B-ORD-001` · POST /orders 200 且返回 order.id |
| **B-ORD-003** | **prod HTTP** `BLOCKED` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/B-ORD-003` · GET /orders/:id 200 |
| **B-MSG-002** | **prod HTTP** `BLOCKED` | `evidence/pi3_004_production_readiness_verification/r003-production-20260702T170051Z/B-MSG-002` · POST+GET 订单消息；501→BLOCKED（可走 PARTIAL_GO） |

