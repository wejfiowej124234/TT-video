# TT · Extended Issue · Batch Remediation Ladder（LATEST）

**STATUS:** `CUT_QUEUE_HOLD · PRE_ETA_READ_ONLY · MANIFEST_FROZEN · R-USDC-1/R-PAY-IA-1/R-ADMIN-1=LOCAL_READY_NOT_DEPLOYED_FROZEN`  
**Stamp:** `2026-08-11T03:07:27Z`  
**Hold lock:** [`TT-WAIT-WINDOW-CUT-QUEUE-HOLD-PRE-ETA-READ-ONLY-LATEST`](./TT-WAIT-WINDOW-CUT-QUEUE-HOLD-PRE-ETA-READ-ONLY-LATEST.md)  
**Preflight:** [`TT-WAIT-WINDOW-TRACK1-PRE-ETA-READONLY-PREFLIGHT-LATEST`](./TT-WAIT-WINDOW-TRACK1-PRE-ETA-READONLY-PREFLIGHT-LATEST.md) · **`PRE_ETA_HOLD_NOT_EXECUTE`**  
**Cut Queue:** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md) · **未解锁** · **前包 CLOSED 才开后包**  
**Stamp:** `2026-08-11T03:03:43Z`  
**Seal-after Cut Queue:** [`TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md) · **QUEUE_READY** · 序 **R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1**  
**R-USDC-1:** [`TT-WAIT-WINDOW-R-USDC-1-LOCAL-PREP-LATEST`](./TT-WAIT-WINDOW-R-USDC-1-LOCAL-PREP-LATEST.md)  
**R-PAY-IA-1:** [`TT-WAIT-WINDOW-R-PAY-IA-1-LOCAL-PREP-LATEST`](./TT-WAIT-WINDOW-R-PAY-IA-1-LOCAL-PREP-LATEST.md)  
**R-ADMIN-1:** [`TT-WAIT-WINDOW-R-ADMIN-1-LOCAL-PREP-LATEST`](./TT-WAIT-WINDOW-R-ADMIN-1-LOCAL-PREP-LATEST.md)  
**Inventory:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-INVENTORY-LATEST.md) **v2-deep**  
**Freeze:** [`TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST`](./TT-WAIT-WINDOW-FREEZE-UNTIL-ETA-LATEST.md) · **新 Local Prep 已关**  
**FTB:** [`TT-FINAL-TRUTH-BASELINE-LATEST`](./TT-FINAL-TRUTH-BASELINE-LATEST.md) · **已部署 Web3 地址 = 唯一真源 · 禁止乱改**  
**Machine:** [`TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST.json`](./TT-WAIT-WINDOW-EXTENDED-ISSUE-REMEDIATION-LADDER-LATEST.json)

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Owner 写死（防跑偏）

```text
1. OFFICIAL_AND_TRACK1_FREEZE · LOCAL_PREP_ALLOWED · 新 Local Prep 批次 CLOSED
2. 三包已 LOCAL_READY_NOT_DEPLOYED → 入 Seal 后 Official Cut 队列（文件互不重叠）
3. ETA 前：只读 Preflight + Cut 队列检查 · 禁止扩产品 FIX · 禁止 Official Deploy
4. ETA → Track1 独占 → Seal → 再 R-USDC-1→R-PAY-IA-1→R-ADMIN-1 逐包 Cut→RV→SSOT
5. Web3 已部署地址禁止乱改 · USDC_ONLY · Batch ≠ Seal ≠ GO
```

| 硬闸 | 规则 |
|------|------|
| **USDC_ONLY** | Traveler / Guide / Pay / Escrow 双边 / Admin 资金相关投影 · 一律 **USDC** |
| **WEB3_DEPLOYED_SSOT** | FTB §1 地址 · Reality Escrow · opId · **只读** |
| **NO_OFFICIAL_UNTIL_SEAL** | ETA 前禁止 Official Deploy；Seal 前禁止标 CLOSED/RV |
| **NO_NEW_LOCAL_PREP** | ETA 前不再开 R-LEG-1 等新批 |
| **NO_QUEUE_JUMP** | Cut 队列 / OPEN_OPS_HYGIENE **不得**插队 Track1 Finalize |
| **NO_FAKE_GO** | `LOCAL_READY_NOT_DEPLOYED` ≠ CLOSED ≠ `TT_PRODUCTION_GO=GO` |

---

## 1 · 与既有流程的关系（对拍）

| 既有轨 | 本 Ladder 怎么用 |
|--------|------------------|
| **OFFICIAL_AND_TRACK1_FREEZE · LOCAL_PREP_ALLOWED** | Phase-0 · **Local Prep 开工** · Official/Track1 仍冻 |
| **Track1 Finalize 串行** | Phase-1 · ETA 后独占 · **停产品** |
| **V65 Batch Repair（BRANCHLESS）** | Phase-0 = Local 半闭环；Phase-2 = Seal 后 Official 全闭环 |
| **Dual-track / Staging Patch** | Phase-3：Official RV 后再 Staging/Local 语义对齐 |
| **FTB** | 地址表 **immutable**；Seal 后才更新状态机字段 |
| **正式 Release 全链 + W5** | 仅翻 Production GO 时另开 |

---

## 2 · 分期（严格串行总序）

### Phase-0 · Local Prep（**CLOSED · 三包已备**）

- R-USDC-1 · R-PAY-IA-1 · R-ADMIN-1 = `LOCAL_READY_NOT_DEPLOYED`  
- **禁止** 新开 Local Prep（含 R-LEG-1）  
- ETA 前仅：只读 Preflight + [`Cut Queue`](./TT-WAIT-WINDOW-SEAL-AFTER-OFFICIAL-CUT-QUEUE-LATEST.md) 检查  

### Phase-1 · ETA 后 · Track1 Reality（资金主线 · 独占）

```text
fail-closed Preflight
  → Timelock.execute(opId)
  → isEscrow / Event 验证
  → Escrow.release()
  → Settlement/Fee 实际余额与事件对账
  → Reality Evidence Seal
```

- 任一步 FAIL/UNKNOWN → STOP  
- **仍不**自动 `TT_PRODUCTION_GO=GO`  
- **仍不**插队 Official Cut  

### Phase-2 · Seal 完成后 · Official Cut 队列（写死序）

```text
R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1
每包：Official Cut → Runtime Verify → SSOT → Staging/Local 语义对齐
```

- 文件互不重叠 · 可独立回滚  
- 完整文件/RV 清单见 Cut Queue SSOT  

### Phase-3 · Hard Gate / GO 队列（人闸）

- 仅 Owner 在 Reality Seal + Hard Gate 后重评 `TT_PRODUCTION_GO`  
- Batch CLOSED ≠ Production GO  

---

## 2b · 当前裁决一句（Owner）

```text
CUT_QUEUE_HOLD · PRE_ETA_READ_ONLY：
29-file manifest 已冻结 · 禁止产品代码/Official Runtime；
ETA 前仅只读 Preflight（异常只记不修）；
ETA + Preflight ALL PASS → Track1 独占 Finalize；
Seal 后解锁 Cut · 串行 CLOSED 闸 R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1；
Seal ≠ GO · 前包未 CLOSED 禁止后包。

三包 LOCAL_READY_NOT_DEPLOYED 已入 Seal 后 Official Cut 队列（文件互不重叠）；
ETA 前只读 Preflight + 队列检查 · 不再开新 Local Prep；
ETA → Track1 独占 Finalize → Seal → R-USDC-1→R-PAY-IA-1→R-ADMIN-1 逐包 Official Cut→RV→SSOT→Staging/Local。
```

---

## 3 · 批量分包（建议 · 不插队 Track1）

| Batch | 范围（Inventory IDs） | ETA 前 | Seal 后 |
|-------|----------------------|--------|---------|
| **R-USDC-1** | C-05 · A-03 · H3 · 支付/双边/Admin USD→USDC | **`LOCAL_READY_NOT_DEPLOYED_FROZEN`** · 证据 [`R-USDC-1-LOCAL-PREP`](./TT-WAIT-WINDOW-R-USDC-1-LOCAL-PREP-LATEST.md) | Seal 后 Cut-1 → CLOSED 才开后包 |
| **R-PAY-IA-1** | U-03 · F-03 · `/me/payments` → `/orders` 诚实重定向 | **`LOCAL_READY_NOT_DEPLOYED_FROZEN`** · 证据 [`R-PAY-IA-1-LOCAL-PREP`](./TT-WAIT-WINDOW-R-PAY-IA-1-LOCAL-PREP-LATEST.md) | 仅 R-USDC-1 CLOSED 后 |
| **R-ADMIN-1** | A-01/02/04 · B5-G-007 双信号 · Orders id/q | **`LOCAL_READY_NOT_DEPLOYED_FROZEN`** · 证据 [`R-ADMIN-1-LOCAL-PREP`](./TT-WAIT-WINDOW-R-ADMIN-1-LOCAL-PREP-LATEST.md) | 仅 R-PAY-IA-1 CLOSED 后 |
| **R-LEG-1** | LEG-* · `/legal` vs `/privacy` · 文档诚实 | **未开**（R-ADMIN-1 后停） | Official Cut→RV |
| **R-META-1** | C-04 · H1/H2 · `/meta`→Wired | **仅本地草案** · 禁 Official 配置改 | Seal 后 ops |
| **R-IDX-1** | W-04 · Indexer 诚实进度 | **禁美化** · 只记债 | Seal 后 |
| **R-MEDIA-1** | M-02/05/08 | SEPARATE · 默认不插队 | SEPARATE |
| **R-SEC-1** | SEC-* | 默认 POST_GO · 除非 Owner 另令 | POST_GO |
| **R-PFA-1** | PFA-* · WC · Trust | 默认 POST_GO | 挡 GO |

**ETA 前半闭环：**

```text
Gap pin → 最小 FIX → 本地定向测试 → LOCAL_READY_NOT_DEPLOYED
```

**Seal 后全闭环：**

```text
Official Deploy → Runtime Verify → SSOT 回写 → CLOSED
  → Staging/Local 语义对齐（独立地址 · 不拷主网）
```

`LOCAL_READY_NOT_DEPLOYED ≠ RUNTIME_VERIFIED ≠ OWNER_VALIDATED ≠ CLOSED ≠ Production GO`

---

## 4 · Final Truth Baseline 更新规则（防乱改 Web3）

| 可更新（Seal / 证据后 · Owner） | **禁止** |
|--------------------------------|----------|
| `money_path` / Reality Wave **状态机** | 改 Wired / SR / Fee / Timelock / USDC **地址** |
| `USER_FUNDS` / Hard Gate 轴（仅 Owner 重评后） | 把 lineage 标成 Official create |
| 币种政策声明 **USDC_ONLY** | 为「清单绿」重写主网 Reality Escrow / opId |
| cite 新 Evidence / Seal / Alignment PASS 包 | Sepolia 地址写入 Official 表 |
| Engineering SSOT Anchor 指向新 living 证据 | 无 Official RV 就改 FTB |

**产品 Batch（R-USDC 等）默认：****不改 FTB 地址表**。  
**Track1 Seal 后：** 才允许 FTB **状态字段** + Evidence cite 更新。

---

## 5 · 三环境一致性（最终态目标）

| 环境 | Web3 | 产品行为 |
|------|------|----------|
| **Official** | FTB 主网地址 · 已部署为准 | USDC_ONLY · Batch Official RV 后 |
| **Staging** | 测试网独立地址 · 同 ABI/流程 | **同语义** UI/API |
| **Local** | Anvil/本地或 mock · 同流程 | ETA 前可先绿 · Seal 后与 Official 语义对齐 |

```text
一致性 = 行为与政策对齐（USDC · 门闸 · 工厂身份叙事）
       ≠ 三环境同一合约地址
```

---

## 6 · USDC_ONLY 验收清单（Local + 日后 Official 各勾一次）

- [ ] Traveler 订单列表 / 详情金额后缀 **USDC**
- [ ] Guide hat 订单金额 **USDC**
- [ ] `/pay` · Escrow 双边金额 **USDC**
- [ ] Admin Orders / Finance 资金相关投影 **USDC**（禁止裸 `USD` 误导结算币）
- [ ] 无「多稳定币可选结算」产品叙事（Owner：仅 USDC）
- [ ] 本地单测含 `formatEscrowStablecoinCurrency` / 展示契约（若动到）

---

## 7 · 当前裁决

| 问 | 答 |
|----|----|
| 现在开始批量修？ | **否** · 三包已备 · **CUT_QUEUE_HOLD** · 不再开新 Local Prep |
| 能 Official Deploy 吗？ | **否** · Seal 后按 Cut Queue |
| Cut 序？ | **R-USDC-1 → R-PAY-IA-1 → R-ADMIN-1** |
| 文件冲突？ | **无** · 29 文件 disjoint · 可独立回滚 |
| ETA 到点？ | **立即停产品** · Track1 独占 |
| Web3 会不会被清单改地址？ | **不会** · WEB3_DEPLOYED_SSOT |

**下一动作：** 只读 Preflight / Cut 队列检查 → ETA Track1 → Seal → 开 Cut-1 R-USDC-1。
