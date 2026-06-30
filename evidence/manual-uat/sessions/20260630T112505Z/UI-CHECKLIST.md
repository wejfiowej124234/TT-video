# UI Checklist — S001 · 20260630T112505Z

**Requirement SSOT:** [../../summary/REQUIREMENT-TRACEABILITY.md](../../summary/REQUIREMENT-TRACEABILITY.md)  
**登录:** http://localhost:3012/auth/login · `Test123!`  
**勾选:** □ · ☑ · ❌ → [DEFECT-NNN](../../defects/)

## C1 · multi-demo@test.com

| Req | # | 检查项 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|--------|
| R-C1-001 | 1 | 登录 | `/auth/login` | □ | |
| R-C1-002 | 2 | 多身份 Hub | `/me/identities` | □ | |
| R-C1-003 | 3 | Publish | `/me/publish` | □ | |
| R-C1-004 | 4 | 主理人工作台 | `/governance?view=region` | □ | |
| R-C1-005 | 5 | 收购子站 | `/market/acquisition` | □ | |
| R-C1-006 | 6 | 通用 UX | — | □ | |

## C2 · tourist@test.com

| Req | # | 检查项 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|--------|
| R-C2-001 | 1 | 登录 | `/auth/login` | □ | |
| R-C2-002 | 2 | 首页 | `/` | □ | |
| R-C2-003 | 3 | 市场 | `/market` | □ | |
| R-C2-004 | 4 | 社区 | `/community` | □ | |
| R-C2-005 | 5 | 订单 | `/orders` | □ | |
| R-C2-006 | 6 | Admin 入口 | `/admin` | □ | |
| R-C2-007 | 7 | 通用 UX | — | □ | |

## C3 · guide@test.com

| Req | # | 检查项 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|--------|
| R-C3-001 | 1 | 登录 | `/auth/login` | □ | |
| R-C3-002 | 2 | 向导工作台 | `/guide` | □ | |
| R-C3-003 | 3 | 市场选向导 | `/market?view=guides` | □ | |
| R-C3-004 | 4 | 通用 UX | — | □ | |

## C4 · merchant@test.com

| Req | # | 检查项 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|--------|
| R-C4-001 | 1 | 登录 | `/auth/login` | □ | |
| R-C4-002 | 2 | 商家工作台 | `/provider` | □ | |
| R-C4-003 | 3 | 商家设置 | `/me/identities/merchant/settings` | □ | |
| R-C4-004 | 4 | 通用 UX | — | □ | |

## E1 · 链 A

| Req | # | 检查项 | 账号 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|------|--------|
| R-E1-001 | 1 | 订单入口 | C2 | `/orders` | □ | |
| R-E1-002 | 2 | 向导工作台 | E1 | `/guide` | □ | |
| R-E1-003 | 3 | 通用 UX | — | — | □ | |

## E2 · DID 榜

| Req | # | 检查项 | 路径 | 勾选 | Defect |
|-----|---|--------|------|------|--------|
| R-E2-001 | 1 | DID 榜 | `/did-rank` | □ | |
| R-E2-002 | 2 | 收购副榜 | `/did-rank?board=acquisition` | □ | |
| R-E2-003 | 3 | 通用 UX | — | □ | |
