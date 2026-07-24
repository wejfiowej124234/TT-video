# Pre-Mainnet Human UI/UX · Batches 1–6 · Final Truth Baseline Cite

**Stamp:** `20260724T062500Z`  
**Session:** `20260724T065700Z-pre-mainnet-human-uiux`  
**Machine:** `TT_PRE_MAINNET_HUMAN_UIUX_BATCHES_1_6_FINAL_TRUTH_CITE`  
**JSON:** [`TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.json`](./TT-PRE-MAINNET-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-BASELINE-CITE-LATEST.json)  
**PCR:** [`registry/psg-change-records/PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE.json`](../../registry/psg-change-records/PCR-20260724-HUMAN-UIUX-BATCHES-1-6-FINAL-TRUTH-CITE.json)  
**Defect register:** [`TT-PRE-MAINNET-HUMAN-UIUX-DEFECT-REGISTER-LATEST.md`](./TT-PRE-MAINNET-HUMAN-UIUX-DEFECT-REGISTER-LATEST.md)  
**Ledger:** PATCH-STG-008～010 · [`TT-STAGING-PATCH-LEDGER-LATEST.md`](./TT-STAGING-PATCH-LEDGER-LATEST.md)

---

## 0 · 纪律（写死）

| 轨 | 动作 |
|----|------|
| **Track A** · Final Truth tip / Candidate pin / Hard Gate | **cite-only** · **禁止**移动 tip · **禁止**宣称 GO / Cutover PASS |
| **Track B** · Staging Product UI/UX patches | **可更新** Product/Release 活面 + Engineering 工程绑定 cite + Ledger |
| **本 cite** | 证明 Batches 1–6 已按十四锚对齐；**≠** Production GO · **≠** Mainnet Hard Gate 关闭 |

**Living tip（不变）：** `ea71c577ce6f99696df33f9394cf96746edc843b` · Pin `PSG-REL-20260720-WEB3-CAND-V2`  
**Product patch HEAD（本地 Git）：** `359273e5`（cite）· Web bake `1e1908a1`  
**API patch（邮件 Round）：** `12b41d56` / `21ba131e`（≠ tip · Expected Difference）

---

## 1 · TravelTrust Final Truth Baseline · 十四锚对拍（Batches 1–6）

| # | 锚点 | 本批关系 | 是否改字节/身份 |
|---|------|----------|-----------------|
| 1 | **Final Truth Baseline**（唯一真源标准） | 本 cite + Register + tip/pin 引用；禁止平行叙事 | **不改 tip** · 仅 living cite |
| 2 | **Candidate v2** · 最新 Web3 协议基线 | pin `PSG-REL-20260720-WEB3-CAND-V2` · tip `ea71c577` | **cite-only** |
| 3 | **V3.1.1 Final** · 中文 Web3 宪章与规则 | 无协议/资金规则变更；公告/文案不得冲突 | **cite-only** |
| 4 | **PSG-EGM Final** · 经济治理框架 | 无经济规则变更 | **cite-only** |
| 5 | **PSG Governance Anchor** | 治理锚不因 UI 缺陷关闭而移动 | **cite-only** |
| 6 | **Product / Release Baseline** | **主战场**：用户产品 · UI/UX · 业务流程（HU-001～036） | **已更新活面**（Register · FE · locales · CMS 素材） |
| 7 | **Engineering SSOT Anchor** | 代码 · Git · Build · Runtime · Registry · Evidence 同源绑定 | **Track B runtime SHA cite**（tip 仍 `ea71c577`） |
| 8 | **Release Integrity** | Delta → Recertify → Freeze；Staging Patch 临时队列须晋升 | PATCH-STG-008～010 **OPEN（待 Promotion）** |
| 9 | **PSG Delta Recertify（dry-run）** | Batches 1–6 cite 同批：`DRY_RUN_PASS_WITH_EXPECTED_DIFFERENCE`（2026-07-24T06:29:25Z）· ≠ formal / ≠ GO |
| 10 | **Feature Inventory Baseline** | 能力与真实路径一致（选导 OCS-10 · 钱包错链 · 身份三卡 · 社区地理单入口等） | **对拍** · 未扩平行功能域 |
| 11 | **Reality Closure Framework** | Staging 真运行：Web `1e1908a1` · guides=10 · favicon TT | **② 已验** · ≠ ③ Reality Closure GO |
| 12 | **PRR** | 本批不替代生产准入评审签字 | **不触发** |
| 13 | **Mainnet Hard Gate** | UI/出站体验补丁 **≠** 主网安全闸关闭 | **OPEN 不变** |
| 14 | **Mainnet Cutover Hard Gate** | **≠** 资金切闸 PASS | **OPEN 不变** |

---

## 2 · 批次 ↔ 工程落点

| 批 | 范围 | 状态 | Git（代表） | Staging |
|----|------|------|-------------|---------|
| 1 | HU-001～010 | FIXED | `2db694ae` 祖先 | 叠入后续 Web bake |
| 2 | HU-011～017 | FIXED | `1bce380e` | 同左 |
| 3 | HU-018～021 | FIXED | `902262d3` | 同左 |
| 4 | HU-022～025 | FIXED | `3d85df4f` | 同左 · origin 含至 Batch-4 cite |
| 邮件 R5～8 | HU-014 | FIXED（信誉闸 OPEN） | `3b06b54a`…`21ba131e` | API 线 · PATCH-STG-008 |
| 5 | HU-026～031 | FIXED（028 待证 · 027 不修） | `ce1bd9a9` | 含于 Web `1e1908a1` · PATCH-STG-009 |
| 6 | HU-032～036 | FIXED（034 PARTIAL） | `1e1908a1` | Web bake **live** · PATCH-STG-010 |

**残留（诚实）：** HU-028 OPEN·待证 · HU-034 Path B · 邮件 Inbox/Postmaster Owner · **origin 未 push**（本地 ahead 9）· Unsplash PAGE_SURFACE_DRIFT 既有旁证。

---

## 3 · 一致性（本 stamp）

| 层 | 值 | 判定 |
|----|-----|------|
| Final Truth tip | `ea71c577` | ✅ 未移动 |
| 本地 Git HEAD | `359273e5` | ✅ 含 Batches 1–6 |
| Staging Web | `1e1908a1` | ✅ = Batch-6 bake |
| Staging API | `12b41d56`（pin/profile OK） | ✅ Track B ED vs tip |
| origin remote | `d99db8ac`（Batch-4） | ❌ **未 push** · 非 tip 漂移 |
| guides 公众目录 | **10** OCS | ✅（≠ C3；JP×2 · 无 CN） |

---

## 4 · 诚实边界

```text
Batches 1–6 FIXED（② Staging Product UI）
  ≠ tip 移动
  ≠ Candidate / V3.1.1 / EGM / Governance 重写
  ≠ PRR 签字
  ≠ Mainnet Hard Gate / Cutover PASS
  ≠ Production GO
```

**下一步合法出口：** Owner push origin →（可选）Patch Promotion → 新 PSG Version / Release Identity — **另闸**。
