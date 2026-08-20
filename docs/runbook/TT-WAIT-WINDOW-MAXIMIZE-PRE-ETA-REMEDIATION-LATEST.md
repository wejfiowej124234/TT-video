# TT · Wait Window · MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN（LATEST）

**STATUS:** `ACTIVE · SUPERSEDES PRE_ETA_READ_ONLY_FOR_PRODUCT`  
**Stamp:** `2026-08-11T04:17:00Z` · **BEFORE_ETA** · ETA `2026-08-11T23:45:35Z`  
**`TT_PRODUCTION_GO`:** `NO_GO` · **Seal ≠ GO** · **本策略 ≠ Reality Seal**  
**Machine:** [`TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.json`](./TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.json)

**FTB:** [`TT-FINAL-TRUTH-BASELINE-LATEST`](./TT-FINAL-TRUTH-BASELINE-LATEST.md) = 全系统唯一真源（本文件 = 作业策略 · ≠ 第二真源）  
**Parent Freeze:** [`TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST`](./TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.md)  
**Cut Queue:** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md)  
**Hygiene RECORD:** [`TT-WAIT-WINDOW-OFFICIAL-CONSOLE-HYGIENE-RECORD-LATEST`](./TT-WAIT-WINDOW-OFFICIAL-CONSOLE-HYGIENE-RECORD-LATEST.md)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Owner 写死（立即生效）

```text
MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN：
ETA 前尽可能把 Inventory / Wave1–3 / 207 路由 / 新发现的非 Track1 债
  走完 CHECK→去重→分批最小 FIX→测试→（可证隔离时）Official Cut→RV→SSOT；
不再「只记录等待」明明可安全解决的问题。

绝对冻结面（唯一）：
  已广播 Mainnet · FTB · Registry · Wired · Timelock · Track1 Money Path
禁止：execute / release / Settlement·Fee / TrustedFactory / Reality Seal / GO
      及任何改变 pinned op · Escrow 10 USDC · Finalize 前置条件的动作。

串行优先：
  R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1
  → R-MKT-UAT-LEAK-1 → R-COMM-TEXT-BAN-1 → R-MEDIA-1
  → Growth / CMS / Legal / Auth / 路由·404 / 权限 / 性能 / 运维 hygiene

每包硬闸：
  blocks_track1_finalize MUST false
  → CHECK → GAP → 最小 FIX → 定向测试
  → Official Deploy（仅确认与 Track1 隔离）→ Runtime Verify → SSOT → CLOSED
禁止：大重构 · 跨包混改 · 造数 · 假绿 · 并发大部署

只做到 LOCAL_READY_AFTER_SEAL（不上 Official）当涉及：
  生产 DB 删除/迁移 · 对象存储批量 · Indexer 回填 · RPC/核心配置
  · 或无法证明与 Track1 隔离

持续：fresh Track1 只读健康检查；
  pinned op / Escrow / 地址 / 余额 / 执行条件漂移 → 立即停止一切整改。

ETA 到点：无条件中止未完成产品批次 → Track1 独占 fresh Preflight
  → ALL PASS 才 Finalize；FAIL/UNKNOWN → STOP。
```

---

## 1 · 两面分离（防混轨）

| 面 | 状态 | 允许 |
|----|------|------|
| **Track1 Money Path** | **FROZEN** | 只读健康检查 · ETA 后 Preflight/Finalize |
| **非 Track1 产品债** | **ACTIVE 整改** | Local FIX · 定向测 · 隔离后 Official Cut |
| **FTB / Registry / Wired / Timelock 地址表** | **IMMUTABLE** | 只读 cite |
| **Reality Seal / Production GO** | **LOCKED** | 禁止提前 |

**CLOSED（产品包）≠ Reality Seal ≠ `TT_PRODUCTION_GO`**

---

## 2 · 串行队列（风险/依赖序）

| # | Pack | 目标态 ETA 前 | Official Cut？ | 注 |
|---|------|---------------|---------------|-----|
| 1 | **R-USDC-1** | **CLOSED**（尽量） | FE only · Track1 隔离 | 已 LOCAL_READY |
| 2 | **R-PAY-IA-1** | CLOSED（尽量） | FE only | 前包 CLOSED 后 |
| 3 | **R-ADMIN-1** | CLOSED（尽量） | FE primary | 前包 CLOSED 后 |
| 4 | **R-MKT-UAT-LEAK-1** | LOCAL_READY 或 CLOSED | 仅过滤/展示层可 Cut；**DB 删除=AFTER_SEAL** | 新包 |
| 5 | **R-COMM-TEXT-BAN-1** | LOCAL_READY 或 CLOSED | FE+API 可 Cut；存量 DB hide=审慎 | 新包 |
| 6 | **R-MEDIA-1** | **LOCAL_READY_AFTER_SEAL** | **默认不上线**（对象存储/卷） | 隔离难证 |
| 7+ | Growth/CMS/Legal/Auth/404/权限/perf/ops | 能关则关 | 逐项隔离证明 | Wave 债 |

---

## 3 · 每包闭环（写死）

```text
1 confirm blocks_track1_finalize=false + Track1 health OK
2 CHECK → GAP 去重（不重开已 COVERED）
3 最小 FIX（单包文件集）
4 定向测试 exit 0
5 若需 Official：证明 FE/API 面与 Money Path 无共享 mutate 面
6 Official Deploy（单包）→ Runtime Verify → SSOT
7 标 CLOSED（产品）· 仍 ≠ Seal ≠ GO
8 下一包；ETA 到点未完 → ABORT_TO_TRACK1
```

---

## 4 · Track1 只读健康（持续）

Pinned（只读复证 · 不得 mutate）：

| 项 | 期望 |
|----|------|
| Timelock | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` |
| opId | `0xe1d51e09…c116` |
| readyAt | `1786491935` |
| done | `false` |
| Escrow | `0x9996FBD5…B8d6` · status Funded · **10 USDC** |
| SR isEscrow | `false` until execute |
| execute eth_call | `TooEarly` until ETA |

**漂移 → STOP_ALL_REMEDIATION → RECORD → 等 ETA Preflight。**

---

## 5 · ETA 硬切

```text
壁钟 ≥ ETA
  → 中止一切未完成产品批次（保留 LOCAL_READY / 半完成证据）
  → Track1 独占 fresh Preflight
  → ALL PASS → execute → isEscrow/event → release → Settlement/Fee → Reality Seal → Hard Gate
  → FAIL/UNKNOWN → STOP
```

---

## 6 · 诚实边界

- 本策略 **解锁产品整改与隔离 Official Cut** · **不**解锁 Money Path / Seal / GO  
- 能安全关多少关多少 · **不以 Freeze 留债为美德**  
- Wave-3 深审 **不再开新波** · 债入本队列执行  

*Sebastian Ward · Solo · MAXIMIZE_PRE_ETA_REMEDIATION*
