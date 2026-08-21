# TT · TTG V9 — Owner Decision Checklist（未决 · 冲突）


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `WAITING_OWNER_ANSWERS` · blocks Local Target implement · Sepolia · new Audit Candidate · 3× audits  
**Frozen Target:** [Owner Economic Target FREEZE](TT-TTG-V9-OWNER-ECONOMIC-TARGET-FREEZE-LATEST.md)  
**How to answer:** 每题回 `Q# = A/B/C…` 一行即可；冲突题请显式选边。

---

## A · 必须先确认（P0 · 否则无法实现/三审）

### Q1 — 45%「主理人侧」Exact 落点是什么？
| 选项 | 含义 |
|------|------|
| **A** | Interim：45% 也进 **P4Cap**（总池托管），产品叙事仍写「主理人侧」，链上暂不拆给个人 |
| **B** | 进 **RegionVault / StewardPath** 合约（按国），非 EOA |
| **C** | 直打 **主理人个人钱包**（与现行「FeeRouter 禁个人 sink」冲突 · 须书面例外） |
| **D** | 其它 Exact 地址（请写出 `0x…`） |

**冲突：** Target 写「45%→Steward economic path」vs 历史「FeeRouter 禁止个人 EOA」vs Reality 现仍 Safe interim。

---

### Q2 — 无 Active Steward 时「100%→P4Cap」链上如何判定？
| 选项 | 含义 |
|------|------|
| **A** | **Interim 运营：** 默认始终 `country` 也指向 P4Cap（= 事实上常 100% 进池），有主理人后再治理改 45/55 落点 |
| **B** | 链上 **Active Steward 注册表** 驱动 FeeRouter / 旁路（新逻辑 · 须设计） |
| **C** | 仅用 **Country Pool / Unallocated** 轨表达「无主理人」，FeeRouter 仍固定 45/55 两地址 |
| **D** | 其它（请简述） |

**冲突：** 现网 FeeRouter **不知道**谁是 Active Steward；不能「自动」切换。

---

### Q3 — FeeRouter 怎么收敛到 45/55？
| 选项 | 含义 |
|------|------|
| **A** | **KEEP 合约** + Timelock `setRoutingConfig`：例如 `4500/0/5500/0` 或 `4500/5500/0/0`（两地址：Steward path + P4Cap；废弃腿 BPS=0 或同地址） |
| **B** | **新 FeeRouter**（两腿 API）· KEEP 旧址 LEGACY |
| **C** | 暂不改 BPS，仅改地址（**不满足** Owner Target 45/55 语义）— 不推荐 |

**冲突：** 旧默认 `4500/3575/1100/825` + `globalStakers` 字段仍在 ABI；Owner ACTIVE 已删 35.75%。

---

### Q4 — Role Stake 实现选型
| 选项 | 含义 |
|------|------|
| **A** | **升级/替换** `RegionStewardStakePool`：`minStake = ttg.totalSupply() × bps`；Merchant/Guide 后加 |
| **B** | **新 UUPS RoleStakeSystem**（三角色开关）；旧池 LEGACY |
| **C** | 先 A 主理人，Merchant/Guide 接口空壳后续 B |

**冲突：** 现池 `ttgTotalSupplyUnits` **immutable** ≠ Owner「随 burn 变」；Identity 双池 `minIdentityStake` 亦 immutable。

---

### Q5 — NEW Timelock 根（再确认）
| 选项 | 含义 |
|------|------|
| **A** | 确认：admin = Marketing Solo `0xe1e732…` · delay 48h · **无 Safe** |
| **B** | admin 改其它地址（请写 Exact） |

**已倾向 A**（Root Replacement）；三审前请书面再钉一次。

---

### Q6 — Guardian Exact
| 选项 | 含义 |
|------|------|
| **A** | Treasury `0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736` · pause-only |
| **B** | 其它 `0x…` |
| **C** | 本波不部署需 Guardian 的面（说明范围） |

---

### Q7 — P4Cap 支出 `to` 是否允许 Marketing `0xe1e732…`？
| 选项 | 含义 |
|------|------|
| **A** | **允许**（运营工资等 · 仍须每次提案+Timelock） |
| **B** | 只允许 **公司多签/新 Ops 金库**（请写地址或「待部署」） |
| **C** | 允许 EOA 白名单 = Marketing + Treasury（请列） |

---

### Q8 — LEGACY_CUTOVER_WINDOW
| 选项 | 含义 |
|------|------|
| **A** | 接受：**一次** Safe→旧 Timelock schedule，把 KEEP Money Path owner/spender 迁到 NEW Timelock，然后 Safe/旧 TL = LEGACY |
| **B** | 拒绝任何 Safe 再用 · 另方案（请写） |

---

## B · 有冲突 / 易踩雷（建议一并表态）

### Q9 — 已质押仓位 vs 后来 burn 降供应
新申请门槛下降后，**已锁绝对数量**是否：
| 选项 | |
|------|--|
| **A** | **保持不动**（推荐默认） |
| **B** | 允许按新门槛部分 unlock |
| **C** | 要求补质押维持「当前 %」 |

---

### Q10 — protocol-ssot 十国 `fee_route_bps` 与 FeeRouter 第一层 45/55
| 选项 | |
|------|--|
| **A** | `fee_route_bps` **仅叙事/国别权重** · **不**再驱动 FeeRouter 第一层（第一层 = Owner 45/55） |
| **B** | 仍要把国别 `fee_route_bps` 编进链上路由（与「简单 45/55」冲突 · 须设计） |

**冲突：** 表里 CN `fee_route_bps=400` 曾与 `steward_stake_bps` **数值相同、语义不同**；勿再混读。

---

### Q11 — 83 白皮书 Global 65/20/15
| 选项 | |
|------|--|
| **A** | 标 **TARGET_DEFERRED / 非 Owner ACTIVE**（与本次 Freeze 一致） |
| **B** | 将来仍要恢复为 Fee 二层 · 本波只是 interim |

---

### Q12 — Country Pool「净利润 45/55」vs FeeRouter「平台服务费 45/55」
| 选项 | |
|------|--|
| **A** | **永远正交两套键**（推荐 · 现文档纪律） |
| **B** | 合并成一套（高冲突 · 须大改） |

---

### Q13 — KEEP FeeRouter 地址 vs 新部署
| 选项 | |
|------|--|
| **A** | **KEEP_AND_REWIRE** 现址 `0x2aF4…`（改 owner + routing） |
| **B** | 新 FeeRouter · 旧址停用（Escrow `platformFeeRecipient` 须切流） |

---

### Q14 — 旧 R2_FINAL 范围
| 选项 | |
|------|--|
| **A** | Token/Vault/PM/Governor **字节**可进新 Candidate 对照；**Fee/Root/Stake Target 必须新审**（推荐） |
| **B** | 整包 V9 全部当新代码重审（更重） |

---

### Q15 — Access Fee 收款编排
| 选项 | |
|------|--|
| **A** | Exact 已钉 `0xe1e732…` · **链下/后端收款**本波可继续 OPEN |
| **B** | 本波必须上链收款合约（请定） |

---

## C · 已冻结、无需再选（对照用）

| 项 | 状态 |
|----|------|
| 25T · NO FURTHER MINT | FROZEN |
| Role Stake ⊥ FeeRouter | FROZEN |
| 十国 steward_stake_bps 分级表 | FROZEN（继续用） |
| minStake ∝ **live** `totalSupply()` | FROZEN Target |
| Merchant/Guide TTG RoleStake | **`NOT_REQUIRED` / `DISABLED`** · 非默认待办 | FROZEN |
| Guide per-order USDC Bond | ACTIVE · ≠ 81 Identity · `NEW_ORDER_BOND_MODULE_REQUIRED` | FROZEN |
| Merchant bond inheritance | **不自动继承** Guide · OPEN until Owner confirm | FROZEN boundary |
| 300k → `0xe1e732…` | FROZEN Exact |
| `globalStakers` 35.75% Owner ACTIVE | **EXIT** |
| 有 Steward：45/55 · 无 Steward：100%→P4Cap | FROZEN Target |
| P4Cap 90d 会计窗 + ≤30% | FROZEN 意图 · **语义以合约为准（§2 Freeze 文）** |
| 旧 R2_FINAL 三审 PASS 不继承本 Target | FROZEN process |
| Mainnet / `TT_PRODUCTION_GO` 另闸 | FROZEN |

---

## 回复模板（复制）

```text
Q1=
Q2=
Q3=
Q4=
Q5=
Q6=
Q7=
Q8=
Q9=
Q10=
Q11=
Q12=
Q13=
Q14=
Q15=
```

---

## 中文要点

- **先答 A 区 Q1–Q8**，否则无法开工改 FeeRouter / Stake / 新 Timelock。  
- B 区是**文档/产品冲突**，答了可避免审完再翻案。  
- 答完 → Agent 按 Target 做 Local → Sepolia → **新** Audit Candidate → **新**三审。
