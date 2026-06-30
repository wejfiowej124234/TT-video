# UI Manual UAT Checklist — Session 20260630T112505Z

**SSOT 走廊：** [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](../../docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) v1.0.1  
**登录：** http://localhost:3012/auth/login · 密码 `Test123!`  
**勾选：** □ 未验 · ☑ 通过 · ❌ 失败（须在 [DEFECTS.md](./DEFECTS.md) 登记）

**人工须看（每项）：** 无白屏 · 文案 · 权限提示 · 动线 · 视觉/状态

---

## C1 · `multi-demo@test.com`

| # | 检查项 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|---------|------|
| 1 | 登录成功 | `/auth/login` | □ | | |
| 2 | 多身份 Hub | `/me/identities` | □ | | |
| 3 | Publish Hub | `/me/publish` | □ | | |
| 4 | 主理人工作台 | `/governance?view=region` | □ | | |
| 5 | 收购子站 | `/market/acquisition` | □ | | |
| 6 | 本账号通用 | — | □ | | |

## C2 · `tourist@test.com`

| # | 检查项 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|---------|------|
| 1 | 登录成功 | `/auth/login` | □ | | |
| 2 | 首页 Landing | `/` | □ | | |
| 3 | 市场主站 | `/market` | □ | | |
| 4 | 社区 Feed | `/community` | □ | | |
| 5 | 订单列表 | `/orders` | □ | | |
| 6 | Admin SuperAdmin 入口 | `/admin` | □ | | ≠ 六角色 RBAC |
| 7 | 本账号通用 | — | □ | | |

## C3 · `guide@test.com`

| # | 检查项 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|---------|------|
| 1 | 登录成功 | `/auth/login` | □ | | |
| 2 | 向导工作台 | `/guide` | □ | | |
| 3 | 市场选向导 | `/market?view=guides` | □ | | |
| 4 | 本账号通用 | — | □ | | |

## C4 · `merchant@test.com`

| # | 检查项 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|---------|------|
| 1 | 登录成功 | `/auth/login` | □ | | |
| 2 | 商家工作台 | `/provider` | □ | | |
| 3 | 商家身份设置 | `/me/identities/merchant/settings` | □ | | |
| 4 | 本账号通用 | — | □ | | |

## E1 · Escrow 链 A

| # | 检查项 | 账号 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|------|---------|------|
| 1 | 旅行者订单入口 | C2 | `/orders` | □ | | |
| 2 | 链 A 向导工作台 | E1 | `/guide` | □ | | 6b4 种子 |
| 3 | 本走廊通用 | — | — | □ | | |

## E2 · DID 榜

| # | 检查项 | 路径 | 勾选 | 缺陷 ID | 备注 |
|---|--------|------|------|---------|------|
| 1 | DID 榜主页 | `/did-rank` | □ | | |
| 2 | 收购副榜 | `/did-rank?board=acquisition` | □ | | |
| 3 | 本账号通用 | — | □ | | |

---

## 汇总

| Persona | 通过 | 失败 | 未测 |
|---------|------|------|------|
| C1 | 0/6 | 0 | 6 |
| C2 | 0/7 | 0 | 7 |
| C3 | 0/4 | 0 | 4 |
| C4 | 0/4 | 0 | 4 |
| E1 | 0/3 | 0 | 3 |
| E2 | 0/3 | 0 | 3 |
