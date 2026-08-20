# TT · Wait Window · FREEZE · TRACK1_MONEY_PATH_FROZEN · PRODUCT_REMEDIATION_ACTIVE（LATEST）

**STATUS:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Supersedes (product hold):** `CUT_QUEUE_HOLD · PRE_ETA_READ_ONLY`（产品只记不修）  
**Stamp:** `2026-08-11T04:17:00Z`  
**Wall clock:** `2026-08-11T04:16:39Z` · **BEFORE_ETA** · ~19.5h  
**ETA gate:** `2026-08-11T23:45:35Z` (`readyAt=1786491935`)  
**`TT_PRODUCTION_GO`:** `NO_GO` · **Seal ≠ GO**  

**Strategy SSOT:** [`TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST`](./TT-WAIT-WINDOW-MAXIMIZE-PRE-ETA-REMEDIATION-LATEST.md)  
**Cut Queue:** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md) · **PRE_ETA 可串行 Cut（隔离闸）**  
**Machine:** [`TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.json`](./TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 立即生效

### 绝对冻结（唯一 · Money Path）

| 冻结面 | 规则 |
|--------|------|
| Mainnet / FTB / Registry / Wired / Timelock | **只读** · 禁止 mutate / 重部署 / 改地址表 |
| Track1 Money Path | **禁止** execute / release / Settlement·Fee / TrustedFactory |
| pinned op · Escrow 10 USDC · Finalize 前置 | **禁止**任何改变 |
| Reality Seal / `TT_PRODUCTION_GO` | **禁止**提前 |

### ETA 前允许（产品 · 最大化关债）

| 允许 | 禁止 |
|------|------|
| CHECK→去重→最小 FIX→定向测 | 大重构 · 跨包混改 · 造数 · 假绿 |
| Official Cut（**证 Track1 隔离**）→ RV→SSOT→CLOSED | 并发大部署 · Money Path 触达 |
| 新包 Local Prep（串行队列内） | DB 删除/迁移 · 对象存储批量 · Indexer 回填 · RPC/核心配置上线 |
| Track1 **只读**健康检查 | execute / Seal / GO |

**LOCAL_READY_AFTER_SEAL（不上 Official）：** R-MEDIA-1 默认 · 以及无法证隔离的项。

### Owner 裁决一句

```text
MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN：
能安全关的非 Track1 债 ETA 前尽量 CLOSED；
Money Path / FTB / pinned op / 10 USDC 零扰动；
串行 R-USDC-1→R-PAY-IA-1→R-ADMIN-1→R-MKT-UAT-LEAK-1→R-COMM-TEXT-BAN-1→R-MEDIA-1→…
ETA → 中止产品批次 → fresh Preflight → ALL PASS 才 Finalize；Seal ≠ GO。
```

### ETA 硬切

```text
壁钟 ≥ ETA → 中止未完成产品批次
→ Track1 fresh Preflight（时间·op·10 USDC·done=false·地址/钱包/gas）
→ ALL PASS → execute → isEscrow/event → release → Settlement/Fee → Seal → Hard Gate
→ FAIL/UNKNOWN → STOP
```

---

## 1 · Pinned（只读）

| 项 | 值 |
|----|-----|
| Timelock | `0x50f0b26167ec73e327d97c54c81f1c1b9efb22f7` |
| SettlementRouter | `0xe5C3ED16741Eb195fAE11b0C1449A79DD675B372` |
| FeeRouter | `0x2aF47CB6390d7e51C210920b0A62d4d3abD68A72` |
| Escrow | `0x9996FBD5AdB1CaFC2C34396e547a7BC752f4B8d6` |
| opId | `0xe1d51e09d8c5df11bc83330d5d6c545d3431b3107d6de7652f2c5d840890c116` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| readyAt | `1786491935` · ETA `2026-08-11T23:45:35Z` |

**漂移 → STOP_ALL_REMEDIATION。**

---

*见 Strategy SSOT 全文。*
