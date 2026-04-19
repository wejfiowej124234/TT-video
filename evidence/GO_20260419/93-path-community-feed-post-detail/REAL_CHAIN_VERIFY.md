# 93 矩阵 · 第二条用户路径验证记录（社区 Feed → 发帖 → 详情）

**矩阵 SSOT**：[`docs/spec/93-全站功能验证矩阵-域别回归清单.md`](../../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) **§4.1**  
**选定路径（产品叙事）**：**已登录 → 社区 Feed → 文本发帖 → 帖子 GET 再读 → Feed 深链 `?post=` 呈现同一正文**  
**对应 93 用例 ID**：**A-LOG-001**（会话）· **D-COM-001**（Feed 首屏）· **D-COM-002**（发帖 + 帖子详情可读）  
**前端路由（§5.4）**：`/community` · `/community?post=<uuid>`（与 **`/community/post/[id]`** 重定向至 `?post=` 等价）

**边界**：本地 **`environment=local`**、`database=enabled`、**不部署**、**非主网交易**；本路径**不**依赖 **`P3_CHAIN_OFF`** / mock-pay。  
**兄弟路径（同批 93 拆分 · 不同域）**：[DID 排行榜 **`D-DID-001/002`**](../93-path-did-rank-boards-period/REAL_CHAIN_VERIFY.md)。

---

## §0.9 环境真值

| 字段 | 本轮填写 |
|------|-----------|
| **`environment`** | `local` |
| **`database`** | `enabled`（与 API `DATABASE_URL` 一致） |
| **`chain_mode`** | 与 API `GET /meta` 一致（本路径不验链上写） |
| **`auth_mode`** | `bearer`（`tts_…`） |

---

## 1) 依赖

| 依赖 | 说明 |
|------|------|
| **API + Postgres** | `traveltrust-api` 可 `GET /health` **200**；社区写依赖 **DB**。 |
| **`SEED_TEST_ACCOUNTS=1`** | 用例对 **`tourist@test.com` / `Test123!`** 登录（`seedTestAccounts` 预检）。 |
| **Playwright** | `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`（本地 meta 链字段可放宽，与首条路径一致）。 |

---

## 2) 分步结果

| 顺序 | 93 ID | 动作 | 期望 | 本轮结果 | 证据 |
|------|--------|------|------|----------|------|
| 0 | A-ENV-001 | `GET /health` | **200** | **PASS** | Playwright `request` 预检 |
| 1 | A-LOG-001 | `POST /auth/login`（种子游客） | **200** + `token` | **PASS** | `apiLoginReturnCredentials` |
| 2 | D-COM-001 | `GET /api/v1/community/feed` + Bearer | **200** | **PASS** | 同左 |
| 3 | D-COM-002 | `POST /api/v1/community/posts` `{ post_type:"text", body }` | **200** + `id` | **PASS** | `Idempotency-Key` 防重 |
| 4 | D-COM-002 | `GET /api/v1/community/posts/:id` + Bearer | **200**，体含 `body` | **PASS** | `detailRes.text` 含正文 |
| 5 | — | 浏览器 **`/community`**（Bearer 注入） | Feed **main** 可见 | **PASS** | `gotoWithBearerSession` |
| 6 | — | 浏览器 **`/community?post=:id`** | URL 含 `post=`；**main.innerText** 含正文 | **PASS** | 折叠卡导致 `toBeVisible` 不可靠，用 **`innerText` poll**（见 spec 注释） |

---

## 3) 可复现命令

**Playwright（推荐）**：

```bash
cd frontend
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012
export PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080
export NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
npm run e2e -- e2e/93-matrix-path-community-feed-post.spec.ts --project=chromium
```

**机读结果（本轮）**：**2 passed，1 skipped**（`setup-meta-chain` 中 Next-only 用例 skip，与首条路径相同）。

**实现**：[`frontend/e2e/93-matrix-path-community-feed-post.spec.ts`](../../../frontend/e2e/93-matrix-path-community-feed-post.spec.ts)

---

## 4) 结论

- **API D-COM-001 / D-COM-002**：**PASS**。  
- **浏览器 Feed + 深链**：**PASS**（正文以 **main.innerText** 收敛，避免折叠子树 **hidden** 误判）。  

**执行人 / 日期**：Agent · **2026-04-19**
