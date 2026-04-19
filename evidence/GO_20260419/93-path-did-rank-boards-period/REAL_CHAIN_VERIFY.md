# 93 矩阵 · DID 排行榜路径（独立证据）

**矩阵 SSOT**：[`docs/spec/93-全站功能验证矩阵-域别回归清单.md`](../../../docs/spec/93-全站功能验证矩阵-域别回归清单.md) **§4.3**  
**选定路径**：**三榜 HTTP（旅行者 / 向导 weighted / 行程）+ 浏览器 `/did-rank` 竖脊三签切换（含 `period`）**  
**对应 93 用例 ID**：**D-DID-001** · **D-DID-002**

**正交说明**：与 **[`../93-path-register-order-mockpay-governance-read/`](../93-path-register-order-mockpay-governance-read/REAL_CHAIN_VERIFY.md)**（**FROZEN**）及 **[`../93-path-community-feed-post-detail/`](../93-path-community-feed-post-detail/REAL_CHAIN_VERIFY.md)** 独立；**不**依赖 **`P3_CHAIN_OFF`**。

---

## §0.9 环境真值

| 字段 | 目标 |
|------|------|
| **`environment`** | `local` |
| **`database`** | `enabled`（DID 榜 DB 路径与 `GET …/did-rank/*` 一致） |
| **`auth_mode`** | 本路径 API 段 **匿名可读**；浏览器段为页面公开路由 |

---

## 1) 分步结果

| 顺序 | 93 ID | 动作 | 期望 | 本轮结果 |
|------|--------|------|------|----------|
| 0 | A-ENV-001 | `GET /health` | **200** | **见 Playwright 预检** |
| 1 | D-DID-001 | `GET /api/v1/did-rank/travelers?period=all` | **200**，`travelers` 为数组 | **PASS** |
| 2 | D-DID-001 | `GET /api/v1/did-rank/guides?period=all&sort=weighted` | **200**，`guides` 为数组（与页内默认 **weighted** 对齐） | **PASS** |
| 3 | D-DID-001 | `GET /api/v1/did-rank/itineraries?period=all` | **200**，`itineraries` 为数组 | **PASS** |
| 4 | D-DID-002 | 浏览器 **`/did-rank?period=all`** | **`main`「排行榜 / Ranking」** 可见 | **PASS** |
| 5 | D-DID-002 | 依次激活 **旅行者 / 向导 / 商家** `role=tab` | 对应 **`#did-rank-board-panel-*`** 可见；URL 含 **`board=guide`** / **`board=provider`**；回到旅行者 | **PASS** |
| 6 | D-DID-002 | 切换全程 **`pageerror`** | **0 条** | **PASS** |

---

## 2) 可复现命令

**Playwright（推荐）**：

```bash
cd frontend
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012
export PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:8080
export NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
npm run e2e -- e2e/93-matrix-path-did-rank-boards.spec.ts --project=chromium
```

**纯 curl（API 段 · D-DID-001）**：

```bash
API=http://127.0.0.1:8080
curl -sS -o /dev/null -w "travelers %{http_code}\n" "$API/api/v1/did-rank/travelers?period=all"
curl -sS -o /dev/null -w "guides %{http_code}\n" "$API/api/v1/did-rank/guides?period=all&sort=weighted"
curl -sS -o /dev/null -w "itineraries %{http_code}\n" "$API/api/v1/did-rank/itineraries?period=all"
```

**实现**：[`frontend/e2e/93-matrix-path-did-rank-boards.spec.ts`](../../../frontend/e2e/93-matrix-path-did-rank-boards.spec.ts)

---

## 3) 机读结果

**`npm run e2e -- e2e/93-matrix-path-did-rank-boards.spec.ts --project=chromium`**：**2 passed，1 skipped**（`setup-meta-chain` 中 Next-only 用例 **skip**，与其它 93 路径一致）。

**执行人 / 日期**：Agent · **2026-04-19**
