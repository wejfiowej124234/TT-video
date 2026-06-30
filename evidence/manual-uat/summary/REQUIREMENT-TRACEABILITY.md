# Requirement Traceability — UI Manual Cases (②)

**SSOT 走廊：** [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](../../../docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md)

| Requirement | Persona | 检查项 | 路径 |
|-------------|---------|--------|------|
| R-C1-001 | C1 | 登录 | `/auth/login` |
| R-C1-002 | C1 | 多身份 Hub | `/me/identities` |
| R-C1-003 | C1 | Publish | `/me/publish` |
| R-C1-004 | C1 | 主理人工作台 | `/governance?view=region` |
| R-C1-005 | C1 | 收购子站 | `/market/acquisition` |
| R-C1-006 | C1 | 通用 UX | — |
| R-C2-001 | C2 | 登录 | `/auth/login` |
| R-C2-002 | C2 | 首页 | `/` |
| R-C2-003 | C2 | 市场 | `/market` |
| R-C2-004 | C2 | 社区 | `/community` |
| R-C2-005 | C2 | 订单 | `/orders` |
| R-C2-006 | C2 | Admin 入口 | `/admin` |
| R-C2-007 | C2 | 通用 UX | — |
| R-C3-001 | C3 | 登录 | `/auth/login` |
| R-C3-002 | C3 | 向导工作台 | `/guide` |
| R-C3-003 | C3 | 市场选向导 | `/market?view=guides` |
| R-C3-004 | C3 | 通用 UX | — |
| R-C4-001 | C4 | 登录 | `/auth/login` |
| R-C4-002 | C4 | 商家工作台 | `/provider` |
| R-C4-003 | C4 | 商家设置 | `/me/identities/merchant/settings` |
| R-C4-004 | C4 | 通用 UX | — |
| R-E1-001 | E1 | C2 订单入口 | `/orders` |
| R-E1-002 | E1 | E1 向导工作台 | `/guide` |
| R-E1-003 | E1 | 通用 UX | — |
| R-E2-001 | E2 | DID 榜 | `/did-rank` |
| R-E2-002 | E2 | 收购副榜 | `/did-rank?board=acquisition` |
| R-E2-003 | E2 | 通用 UX | — |

## 非 UI 走廊（① / Infra）

| Requirement | 说明 |
|-------------|------|
| R-API-6B5-001 | Step 6b5 六账号登录 |
| R-API-6B5-002 | 杭州向导列表探针 |
| R-INFRA-PW-001 | Playwright 六账号矩阵 spec |
| R-INFRA-E2E-001 | L5 E2E 密码与矩阵一致 |

## Defect ↔ Requirement（当前）

| DEFECT | Requirement |
|--------|-------------|
| DEFECT-001 | R-API-6B5-002 |
| DEFECT-002 | R-INFRA-PW-001 |
| DEFECT-003 | R-INFRA-E2E-001 · R-C3-002 |
