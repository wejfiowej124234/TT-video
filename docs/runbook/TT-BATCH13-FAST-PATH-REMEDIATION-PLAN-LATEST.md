# Batch-13 · 最快修复路径（方案优化 · 执行序重排）

**Machine:** `TT_ADMIN_BATCH13_FAST_PATH_REMEDIATION_PLAN`  
**Stamp:** `20260726T093000Z` · **Exec:** `20260726T081000Z`  
**Status:** **FIX_IN_PROGRESS · FP-E_STAGING_BLOCKED_DEPLOY** · tip/HG/Cutover/GO LOCKED  
**FP-A 证据：** [`FP-A-CONTRAST`](./TT-BATCH13-FP-A-CONTRAST-CROSSCUT-LATEST.md)  
**FP-B 证据：** [`FP-B-CAPABILITY`](./TT-BATCH13-FP-B-CAPABILITY-BLOCKERS-LATEST.md)  
**FP-C 证据：** [`FP-C-HARD-PAGES`](./TT-BATCH13-FP-C-OWNER-HARD-PAGES-LATEST.md)  
**取代：** 逐 HU 线性扫页（慢）→ **横切共享修复 + 优先级叶页**  
**全局细节仍 cite：** [`NOT-FULL-SCORE`](./TT-BATCH13-NOT-FULL-SCORE-BACKLOG-AND-UPGRADE-LATEST.md)（清单/闸号不删）  
**本包 = 施工速度 SSOT**（开修后按本包波次改码）  
**真源对齐：** [`BATCH13-FINAL-TRUTH-CITE`](./TT-BATCH13-FINAL-TRUTH-BASELINE-CITE-LATEST.md)  
**JSON：** [`TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.json`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.json)  
**Patch：** `PATCH-STG-017`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO**

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · 为什么旧序慢、新序快

| 旧序（BACKLOG §4.1 线性） | 问题 | 最快路径 |
|--------------------------|------|----------|
| 能力全做完 → 再逐页用户→…→平台设置 | 对比度 P0 **重复 9 次**改同类 token | **一次横切**闭 496/504/512/520/528/536/544/552/560 |
| 每页完整八维再下一页 | 上下文切换多 · 复测碎 | **先全站可读** → **再 Owner 硬页功能** → 其余 IA |
| 总闸放最后才验 | 正确 · 保留 | 保留：495→487→490 |
| 90 HU 单会话 | OVERSCOPED | **5 个 bake 波**（FP-A～E）· 每波可 Staging |

```text
速度原则（写死）
1. 共享 token / 组件一处改 · 多 HU 同闭
2. Owner 硬目标先做：订单满分 · 财务只读合并 · 平台设置 CF
3. 能力裂脑（491·493）与横切对比度可同日并行文件不冲突则交错
4. 禁扩范围：禁 FINANCE_WRITE · 禁 HG 解锁 · 禁 tip 动
5. 每波结束：vitest/相关绿集 + 复截 · 再进下一波
```

---

## 1 · 最快施工波（开修后唯一执行序）

### FP-A · 全站对比度 P0（半天级目标） · **CODE_LANDED（①）**

**闭（代码）：** HU-**496·504·512·520·528·536·544·552·560**（对比度 P0 · 功能 HU 另波）  
**动作：** `globals.css` zone/warm remap → slate-300 + `!important` · `ADMIN_TEXT_SECONDARY/MUTED` · hub 副文跟用  
**验收：** `adminContrastL5` **11/11 PASS（①）** · **② Staging 复截待**（见 [`FP-A-CONTRAST`](./TT-BATCH13-FP-A-CONTRAST-CROSSCUT-LATEST.md)）  
**不碰：** 业务写路径 · 资金写 · tip / HG / Cutover

### FP-B · 能力挡板 · **CODE_LANDED（①）**

**闭（代码）：** HU-**491**（向导审详 PG SSOT）· **493**（概况真数/签收空；含 481 total 路径）  
**随后（未闭）：** 492 · 494 · 480 · 478 · Staging Q1-G / Q6-F  
**验收：** `cargo check` PASS（①）· **② Staging 向导批准 1 条 + 概况 source 截图待**  
**证据：** [`FP-B-CAPABILITY`](./TT-BATCH13-FP-B-CAPABILITY-BLOCKERS-LATEST.md)  
**闸贡献：** 495 起势（仍须 ②）

### FP-C · Owner 硬页功能 · **CODE_LANDED（①）**

| 序 | 页 | HU 段 | ① 已落 | ② 仍开 |
|----|-----|-------|--------|--------|
| C1 | **订单** | 504～511 | FO1/3/5/6/7/8/10 主路径 | **510·511** + R-O 截图 |
| C2 | **财务** | 552～559 | FN2/5/6/7/10/12 导航合并+只读 | **558·559** |
| C3 | **平台设置** | 560～567 | CF6/10/11 pending N + truth footer | **566·567** |

**证据：** [`FP-C-HARD-PAGES`](./TT-BATCH13-FP-C-OWNER-HARD-PAGES-LATEST.md)  
**禁：** FINANCE_WRITE · HG 解锁 · tip 动

### FP-D · 其余叶页 IA/功能（批量）

争议 512～519 → 入驻 520～527 → 内容 528～535 → 官方 536～543 → 增长 544～551  
**策略：** 每页只做 **升级清单未勾项**（FD/OH/CC/OO/GH）· 不再重做对比度  
**工作台 Chrome：** 479·485·486·483·482·484·489·488（可与 D 末并行）

### FP-E · 总闸 + Staging 矩阵 + 签收材料

1. 叶闸复验勾（§复验 · 不重改码）  
2. **495** 能力 30/30 · **487** 工作台 40/40  
3. 全叶 B13-06′～14′ 复截  
4. **490** 发布级签收材料（②）· **另口令**签收  
5. **Delta Recertify dry-run**（见 §3）· Final Truth **cite 包**更新（**不动 tip**）

```text
FP-A（对比度横切）
→ FP-B（491·493 能力）交错
→ FP-C（订单 → 财务 → 平台设置）
→ FP-D（其余叶 + Chrome）
→ FP-E（495·487·490 + Delta dry-run + cite）
```

**禁止回退到「按页从用户线性扫到平台设置且每页重做对比度」。**

---

## 2 · 内容检查结论（修什么 / 不修什么）

| 类 | 修（②） | 不修（本批） |
|----|---------|--------------|
| UI 对比度/IA/文案诚实 | ✅ 全叶 | — |
| 订单/争议只读作业加厚 | ✅ | 列表上写资金/裁决假写 |
| 财务导航合并 | ✅ 只读满分 | `FINANCE_WRITE` / Escrow 写 |
| 平台设置待办 N + CF | ✅ | Hard Gate / Cutover 解锁钮 |
| 向导裂脑 / 概况假绿 | ✅ | 主网部署 |
| tip / Candidate 合同字节 | ❌ cite | **禁止移动 tip `ea71c577`** |
| Mainnet Hard Gate / Cutover | ❌ OBSERVE | **LOCKED** |
| Production GO | ❌ | **NO_GO** |

---

## 3 · 真源锚点 · 本批「更新」边界（写死）

| 锚点 | 本批动作 | 禁止 |
|------|----------|------|
| **TravelTrust Final Truth Baseline** | 出 [`BATCH13-FINAL-TRUTH-CITE`](./TT-BATCH13-FINAL-TRUTH-BASELINE-CITE-LATEST.md) · cite tip `ea71c577…` · pin `PSG-REL-20260720-WEB3-CAND-V2` | 改 tip / 平行真源 |
| **Candidate v2** | cite-only · 不改合同 profile | 推进 FG/广播冒充本批 |
| **V3.1.1 Final** | cite 宪章 · Admin 文案不冒充协议变更 | 改宪章正文凑 UI |
| **PSG-EGM Final** | cite · 财务只读对齐经济叙事 | 改 EGM 规则 |
| **PSG Governance Anchor** | 双控=配置审批 · 脚注 ≠ 治理锚解锁 | 把审批改名成 PSG Anchor |
| **Product / Release Baseline** | **本批主战场** · Admin UI/UX/流程满分 | 用文档冒充已签收 |
| **Engineering SSOT** | 代码+证据+Registry 同批一致 · bake 入册 | 无证据宣称绿 |
| **Release Integrity** | 每 FP 波 Delta 笔记 · 禁平行版本 | 跳 Freeze 口述 GO |
| **PSG Delta Recertify（dry-run）** | FP-E 跑 dry-run · 记录 PASS/缺口 | 当 Production Cert |
| **Feature Inventory** | 叶清单 F/FO/…/CF 对真实能力 | 假写凑清单 |
| **Reality Closure** | Staging 复截 + 能力 C 包 | 本地绿冒充 ② |
| **PRR** | HU-490 材料预置 · **≠ PRR PASS** | 宣称生产准入完成 |
| **Mainnet Hard Gate / Cutover** | 脚注 LOCKED · OBSERVE | **任何解锁** |

---

## 4 · 与旧 BACKLOG §4 的关系

| 包 | 角色 |
|----|------|
| **本包 FAST-PATH** | **开修后施工序 SSOT**（快） |
| BACKLOG §4.1 | 全 HU 清单保留 · **执行时映射进 FP-A～E** |
| BACKLOG §4.2 / §5 | 复验勾 · 不改码 |
| 各页 `*-FULL-SCORE-UPGRADE` | 功能细则真源 · 波次服从本包 |

开修口令后 Agent **必须**按 FP-A→E，不得自行改回慢序。

---

## 5 · 成功定义（仍 ≠ GO）

```text
Batch-13 最快路径成功（②）=
  FP-A～E 完成
  + OPEN HU → 0（不许 DEFER）
  + 工作台 40/40 · 能力 30/30 · 叶页各 40/40
  + 订单 FO · 财务 FN 只读 · 平台设置 CF 全 PASS
  + Staging 复截齐 · Delta Recertify dry-run 有证据
  + Final Truth cite 包已出（tip 未动）
  + Owner「发布级签收（②）」另口令
仍 ≠ Hard Gate PASS ≠ Cutover ≠ Production GO
```

---

## 6 · Owner 口令

| 步 | 口令 |
|----|------|
| 现 | **FP-D 已落码（①）** · 续 **FP-E**（闸/Staging/490）· 证据 [`FP-D`](./TT-BATCH13-FP-D-LEAVES-CHROME-LATEST.md) |
| 开修 | **「开始第 13 批集体改」** → 按 **FP-A→E**（已开） |
| 验订单 | 「验订单管理功能满分」→ 511 |
| 验整批 | 「验 Batch-13 发布级满分」 |
| 签收 | 「Batch-13 发布级签收（②）」 |
| 禁止 | tip 移动 · HG/Cutover 解锁 · FINANCE_WRITE · 慢序回流 |

```text
TT_ADMIN_BATCH13_FAST_PATH: ACTIVE
TT_ADMIN_BATCH13_EXECUTION_SSOT: FAST_PATH_FP_A_TO_E
TT_ADMIN_BATCH13_LEGACY_LINEAR_ORDER: SUPERSEDED_AS_EXECUTION
TT_ADMIN_BATCH13_FIX: IN_PROGRESS
TT_ADMIN_BATCH13_FP_A: CODE_LANDED
TT_ADMIN_BATCH13_FP_B: CODE_LANDED
TT_ADMIN_BATCH13_FP_C: CODE_LANDED
TT_ADMIN_BATCH13_NEXT: FP_D
TT_ADMIN_BATCH13_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
```
