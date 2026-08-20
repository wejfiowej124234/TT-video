# TT · Security / Identity / Access Matrix（Pack 08 · LATEST）

**STATUS:** `PACK08_SECURITY_IDENTITY_DEEPENED`  
**Phase:** **1 AS-IS 取证**（不改账号 / RBAC / Safe / Governor / Timelock / 合约 / Secrets / Official Runtime）  
**Stamp:** `2026-08-15`  
**Machine:** [`registry/security-identity-authority-matrix.v1.yaml`](../../registry/security-identity-authority-matrix.v1.yaml)  
**Overlay:** [TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md](./TT-L7-L8-CONTRACT-RUNTIME-REALITY-RECONCILIATION-LATEST.md)  
**Session 取证:** [TT-AUTH-SESSION-RUNTIME-TRACE-LATEST.md](./TT-AUTH-SESSION-RUNTIME-TRACE-LATEST.md)  
**Gate:** `python scripts/dev/check-security-identity-authority-matrix.py`  
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**
  
**`M8_SHALLOW_SECURITY`:** **0** · **`M8_UNRESOLVED_IDENTITY_PATH`:** **0** · **`M8_AMBIGUOUS_SECURITY_AUTHORITY`:** **0** · **`UNEXPLAINED_TRUST_BOUNDARY`:** **0**  
**本波 STOP：** Pack 08 CLOSED。Pack **09** 是独立后续波（见 [TT-RELEASE-RUNTIME-EVIDENCE-MATRIX-LATEST](./TT-RELEASE-RUNTIME-EVIDENCE-MATRIX-LATEST.md)），本包不拥有发布加深。  
**禁止：** 改 FTB / 账号 / RBAC / Safe / Governor / Timelock / 合约 / Secrets / Official Runtime · deploy / schedule / execute / cutover / 真钱 · 把 **CI-02** / PM $25 并进本包 · 顺手重构防线

Pack **03 / 04 / 05 / 06 / 07** 已闭合，只读引用。FTB `20260812` 是锁表。Solo Owner / 个人独立开发：Safe **1/1** 是现行控制面，不是缺第二 Approver。

**硬分裂（写死）：**

| 分裂 | 含义 |
|------|------|
| **Session identity ≠ Wallet identity** | Bearer / `localStorage` 不是 `msg.sender` |
| **RBAC capability ≠ L7 contract authority** | Admin 能力到 L3/L6，不是 Timelock owner |
| **Safe 1/1 ≠ 团队审批** | Solo Owner threshold 1；不是双人拆线硬闸 |
| **Admin publish ≠ Web3 execute** | CMS/OCS 发布 ≠ `Timelock.execute` |

---

## 0 · 跨 L0–L8 信任边界（AS-IS）

```text
L0  Official www/apex
      localStorage.traveltrust_session_token
      cookies traveltrust_user_id / traveltrust_session_ok  Path=/ SameSite=Lax
      （这些 cookie 不是 HttpOnly API 会话）
  --proxy L2--> Next rewrite / Fly   skip *.example.com  (ME_PROXY_503 CLOSED)
  --L3--> API origin https://api.web3-ttg.com
          OR Next page  POST /auth/login = 历史 405  (INC-LOGIN L3 SUPERSEDED；现 200 HttpOnly)
  --L4--> CORS · Pause(503 api_paused) · RateLimit · Idempotency-Key · STRICT_SESSION_GATE
  --L5--> users.role + console_role 70 RBAC     永不 L7 owner
  --L6--> PostgreSQL row ACL / CMS / disputes
  --L7--> wallet msg.sender / Safe 1/1 / Governor / Timelock owner
  --L8--> Indexer projection + GET /meta        只观察
```

**禁止穿越：** L5 Admin → L7 owner · L6 CMS publish → Timelock execute · L8 Indexer → L7 write · Session token ≡ wallet signature。

---

## 1 · 24 条身份/防线（摘要）

| ID | 身份 | 信任边界 | Runtime Status |
|----|------|----------|----------------|
| SEC-ANON-PUBLIC | 无 | L0 | CURRENT_OFFICIAL_LIVE |
| SEC-TRAVELER-SESSION | `users.role` tourist\|traveler | L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-GUIDE-SESSION | Guide 档案 + session | L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-PROVIDER-SESSION | 申请至 Admin 审 | L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-STEWARD-SESSION | PG steward；L7 Seat **TARGET** | L5/L6 | CURRENT_OFFICIAL_LIVE（session） |
| SEC-MODERATOR-RBAC | Risk/Ops `admin.community.moderate`（无 `users.role=moderator`） | L3/L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-ADMIN-OPS | `users.role=admin` → Ops | L5 | CURRENT_OFFICIAL_LIVE |
| SEC-SUPERADMIN | `super_admin` 发布/审批 | L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-WALLET-EOA | 已连接 EOA（匿名钱包按钮 disabled） | L7 | CURRENT_OFFICIAL_LIVE |
| SEC-SESSION-BEARER | HttpOnly `traveltrust_session` · JSON `token=null` · localStorage 非权威 · Set-Cookie HttpOnly | L0/L4 | CURRENT_OFFICIAL_LIVE |
| SEC-STRICT-SESSION-GATE | 非公开 `/api/v1` 要 Bearer | L4 | CURRENT_OFFICIAL_LIVE |
| SEC-API-MIDDLEWARE | pause / rate / timeout | L4 | CURRENT_OFFICIAL_LIVE |
| SEC-CORS-CSRF | `CORS_ORIGINS`；API 认证是 Bearer 不是 cookie | L1/L4 | CURRENT_OFFICIAL_LIVE |
| SEC-PROXY-TRUST | www 反代 API；不发明 session | L2 | CURRENT_OFFICIAL_LIVE |
| SEC-CMS-OCS | SuperAdmin publish L6 | L6 | CURRENT_OFFICIAL_LIVE |
| SEC-POSTGRES-ROW | `user_id` / 参与方 ACL | L6 | CURRENT_OFFICIAL_LIVE |
| SEC-INDEXER-READONLY | READ L7 / WRITE L8 | L8 | CURRENT_OFFICIAL_LIVE |
| SEC-RUNTIME-SECRETS | Fly/ops env；`/meta` 只报 boolean | L2/L4 | CURRENT_OFFICIAL_LIVE |
| SEC-SAFE-1OF1 | Safe `0x96491` owner `0xe1e732` **1/1** | L7 | CURRENT_OFFICIAL_LIVE |
| SEC-GOVERNOR-VOTE | NEW Governor `0xD5819ac` · LEGACY `0x46Ce671` | L7 | CURRENT_OFFICIAL_LIVE |
| SEC-TIMELOCK-EXECUTE | `0x50F0B261` eta 后 permissionless | L7 | CURRENT_OFFICIAL_LIVE（能力）；剩余 ops **SCHEDULED** |
| SEC-CONTRACT-OWNERSHIP | Timelock owner / EIP-1967 admin | L7 | CURRENT_OFFICIAL_LIVE |
| SEC-CROSS-USER | `order_forbidden_json` / ACL | L5/L6 | CURRENT_OFFICIAL_LIVE |
| SEC-REPLAY-IDEMPOTENCY | `Idempotency-Key` | L4 | CURRENT_OFFICIAL_LIVE |

Steward **session** 是活的；**Seat Claim** 仍是 Pack 07 `AUTH-STEWARD-CLAIM` **TARGET_NOT_LIVE**。不要用 session 行否决 L7 缺口，也不要用 L7 缺口否决 session 行。

---

## 2 · 现行防线 AS-IS（不修）

| 场景 | 现行事实 | Failure Class |
|------|----------|---------------|
| 未登录 | `GET /api/v1/me` 无 Bearer → **401**；quote → **401 `STRICT_SESSION_GATE=1`** | `SESSION_401` |
| www 登录 POST | 历史 Next 页 **405** SUPERSEDED · 现 **200** HttpOnly · GAP-LOGIN CLOSED_REALITY | `200` |
| API 登录 | `POST api.web3-ttg.com/auth/login` + `Idempotency-Key` → **200** JSON token | — |
| 过期 / 缺 session | STRICT_SESSION_GATE 在 L4 挡非公开路由 | `STRICT_SESSION_GATE` |
| 伪造角色 | `provider` / `region_steward` 自注册 **存 traveler** 直至 Admin 审 | `review_pending` |
| 越权 / 跨用户 | `order_forbidden_json`；Ops 无 `admin.approve` / `admin.content.publish` | `403` / `ACL_404` |
| CSRF / CORS | API 认证是 **Bearer**；client cookie 仅 UX 旗；生产须设 `CORS_ORIGINS` | `cors_preflight` |
| Pause | `PAUSE_MODE=1` → **503 `api_paused`**，**不是 418**；Official `pause.enabled=false` | `api_paused` |
| RateLimit | `/meta.rate_limits`；onboarding quote / community 写 429 | `429` |
| 重放 / 幂等 | `Idempotency-Key`；可选 PG `idempotency_keys` | `idempotencyConflict` |
| Proxy trust | www 反代转发 Bearer；`*.example.com` 跳过（ME_PROXY_503 **CLOSED**） | `api_unavailable` |
| Secret exposure | `/meta.internal_api_secret_configured` **只报 boolean**；本波不打印 secret | `secret_exposure` |

匿名钱包按钮 **disabled** 是诚实边界，不是登录 bug。

---

## 3 · Phase 2 backlog（只记录，本波不修）

| ID | 类 | 事实 |
|----|----|------|
| P2-TOKEN-LOCALSTORAGE | OBSERVED_GAP | 历史 token JSON + `localStorage` SUPERSEDED；GAP-SEC CLOSED_REALITY |
| P2-ADMIN-2FA | OBSERVED_GAP | Admin 2FA TOTP **未**生产接线 |
| P2-SAFE-1OF1-SOLO | EXPECTED_SOLO | Safe threshold **1/1**；Solo Owner AS-IS |
| P2-CONSOLE-ROLE-OVERRIDE | OBSERVED_GAP | `TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE` 可本地改 console 角色 |
| P2-CORS-UNSET-PERMISSIVE | OBSERVED_GAP | `CORS_ORIGINS` 未设 → `very_permissive()`（开发态） |
| P2-STEWARD-L7 | TARGET_NOT_LIVE | Seat/Vault **NOT_DEPLOYED** |

**禁止**把上表当本波重构工单。

**2A overlay（2026-08-15）：** `WALLETCONNECT_OFFICIAL_BAKE_FORWARD_FIX` **CLOSED_REALITY** — Official Sheet WalletConnect connector + 真实 QR。Session identity ≠ Wallet identity 仍写死。**禁止**改钱包 Sheet。

---

## 4 · 跨 Pack

| Pack | 关系 |
|------|------|
| **03** | GP-01 / INC-LOGIN / INC-403 / INC-429 · N-L4-MW · N-L5-IDENTITY |
| **04** | `DATA-SESSION` · `DATA-USER-ACCOUNT` · `DATA-CMS-ANNOUNCEMENT` · `DATA-ORDER` |
| **05** | W3-SAFE / GOVERNOR / TIMELOCK / FR-OLD owner |
| **06** | S01 wallet USDC ≠ session；S08 权限活、spend 环未闭 |
| **07** | AUTH-* 回答「谁能改」；本包回答「身份如何被证明与划界」 |

**CI-02** NEW FeeRouter 与 PM **$25** 继续各自独立 ETA/Reality 梯子（recon `SCHEDULED_WAITING_ETA`）。本包不 execute。

---

## 5 · 本波不做

- 改 FTB、账号、RBAC、Safe owners、Governor、Timelock、合约、Secrets、Official Runtime  
- deploy / schedule / execute / cutover / 真钱  
- 执行 **CI-02** 或 PM **$25**  
- 翻转 `TT_PRODUCTION_GO`（保持 **NO_GO**）  
- 开工 **Pack 09**（本包不拥有；见 Pack 09 LATEST）  
- 把 Session 画成 Wallet、把 Safe 1/1 画成团队审批、把 Admin publish 画成 Web3 execute
