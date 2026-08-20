# TT · Wait Window · PRE_ETA_DEEP_REALITY_CHECK（LATEST）

**STATUS:** `WAVE1_RECORDED · WAVE2_STOP · WAVE3_STOP`  
**Stamp:** `2026-08-11T03:43:00Z`（W1）· Wave-2：[`WAVE2-LATEST`](./TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-WAVE2-LATEST.md) @ `2026-08-11T03:52:00Z` · Wave-3：[`WAVE3-LATEST`](./TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-WAVE3-LATEST.md) @ `2026-08-11T04:05:00Z`  
**Hold:** `CUT_QUEUE_HOLD · PRE_ETA_READ_ONLY` · **29-file / 产品代码 / Official Runtime / 链上：零改动 · NO_FIX**  
**Track1 delay:** **否**（W3 无 Finalize/资金 P0）  
**Next:** **HOLD · WAVE3_STOP** · **禁止 Wave-4** · ETA → fresh Track1 Preflight  

**Machine:** [`TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-LATEST.json`](./TT-WAIT-WINDOW-PRE-ETA-DEEP-REALITY-CHECK-LATEST.json)

**Truth:** Official `https://www.web3-ttg.com` · API `https://api.web3-ttg.com` · Web3 = Mainnet FTB/Wired  
**Official build:** `c3eeaf10…` · API `MAINNET-OFFICIAL-LIVE-PARTIAL`

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 本轮边界

| 允许 | 禁止 |
|------|------|
| Official GET/HEAD · 既有样本对拍 · 已登录浏览器只读 | 造数 · 生产写 · 业务 POST/PUT/PATCH/DELETE |
| 发现分类落 SSOT | 代码 FIX · Official Deploy · Indexer 美化 |
| | execute/release/Settlement/Fee/TrustedFactory/Seal/GO/解锁 Cut |

ETA 到点 → **立即中止** → Track1 fresh Preflight。

---

## 1 · Wave-1 计数

| Class | # |
|-------|---|
| PASS | 5 |
| NEW_GAP | 8 |
| COVERAGE_GAP | 2 |
| EXPECTED_DIFFERENCE | 3 |
| POST_SEAL_BLOCKER_CANDIDATE | 2 |

---

## 2 · 优先车道结论

| 车道 | 结论 |
|------|------|
| migration checksum | **PASS**（API up · DB connected）· redeploy = COVERAGE_GAP |
| Community media | **NEW_GAP** · 3× relative `/api/v1/uploads/community-posts/*.jpg` **404**；OCS tigris **200** |
| Admin↔Traveler | **NEW_GAP** · 同单 Admin **USD** vs Traveler **USDC**；Disputes 徽章 **12** vs 过滤 **1** |
| Indexer 0/0 | **EXPECTED_DIFFERENCE**（诚实 fail-closed）· 填充 = POST_SEAL |
| API lineage≠Wired | **POST_SEAL_BLOCKER_CANDIDATE**（H1/H2 复证） |
| Pay/refund/dispute | **PASS** · disputed Pay hub **不可付** |
| /me · Legal · Auth | `/me/payments` **404** NEW_GAP（R-PAY-IA-1）；`/legal/*` 404 vs `/privacy|/terms` 200 EXPECTED；STRICT_SESSION **401** PASS |

---

## 3 · 发现摘要（NO_FIX）

| ID | Class | 严重 | 摘要 | Pack |
|----|-------|------|------|------|
| DRC-W1-001 | POST_SEAL_BLOCKER | P1 | `/meta` factory lineage ≠ Wired | H1/H2 bake |
| DRC-W1-002 | EXPECTED_DIFFERENCE | P2 | Indexer checkpoint 0/0 诚实 | — |
| DRC-W1-003 | POST_SEAL_BLOCKER | P2 | Indexer 空仓待 Seal 后填 | Indexer fill |
| DRC-W1-004 | NEW_GAP | P1 | Official `/me/payments` 404 | **R-PAY-IA-1** |
| DRC-W1-005 | NEW_GAP | P1 | Admin USD vs Traveler USDC 同单 | **R-USDC-1** |
| DRC-W1-006 | NEW_GAP | P2 | Disputes「Can write」+ Read-only 双信号 | **R-ADMIN-1** |
| DRC-W1-007 | NEW_GAP | P2 | Disputes 12 vs 过滤 1 宇宙未解释 | R-ADMIN / 宇宙说明 |
| DRC-W1-008 | NEW_GAP | P2 | Community relative cover 404 | Media SEPARATE |
| DRC-W1-009 | PASS | — | disputed `/pay` 诚实不可付 | — |
| DRC-W1-010 | PASS | — | Traveler disputed 终态诚实 | — |
| DRC-W1-011 | PASS | — | STRICT_SESSION 401 | — |
| DRC-W1-012 | NEW_GAP | P3 | `cms/public/announcements` 401 vs `public/announcements` 200 | CMS route |
| DRC-W1-013 | EXPECTED_DIFFERENCE | P3 | `/legal/*` 404 双路径 | R-LEG-1 |
| DRC-W1-014 | COVERAGE_GAP | P3 | discover `items=[]` | 覆盖债 |
| DRC-W1-015 | NEW_GAP | P3 | pause eth_call_error | Obs |
| DRC-W1-016 | NEW_GAP | P3 | `/meta` 间歇超时 | Perf |
| DRC-W1-017 | PASS | — | Finance FINANCE_WRITE FORBIDDEN | — |
| DRC-W1-018 | PASS | — | migration 非活断 | — |
| DRC-W1-019 | EXPECTED_DIFFERENCE | — | Reality escrow ≠ 产品样本 | — |
| DRC-W1-020 | COVERAGE_GAP | P3 | 缺多状态活样本（禁造数） | Coverage |

---

## 4 · 诚实边界

- Wave-1/2/3 **≠** Seal **≠** `TT_PRODUCTION_GO`  
- Wave-3 **STOP** · **不自动 Wave-4** · 发布级工程深查无 Track1 Finalize P0  
- W3 根因：`pause` error = **1rpc usage limit**（非链上 pause）；`/meta` 慢 = 运维/性能债  
- 已入队三包（R-USDC-1 / R-PAY-IA-1 / R-ADMIN-1）+ **R-MEDIA-1** 仍 **FROZEN** · Seal 后才 Cut  
- 新产品债 **不得**延误 Track1  
- ETA → **Track1 fresh Preflight**
