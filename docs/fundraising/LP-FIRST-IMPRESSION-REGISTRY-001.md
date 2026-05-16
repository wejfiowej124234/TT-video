# LP 首印台账 · 001（PitchDeck v1.3 candidate 冻结）

## 0. Git 唯一回滚锚（本轮 PitchDeck v1.3 candidate）

| 字段 | 值 |
|------|-----|
| **Tag** | `ir-pitch-v1.3-candidate` |
| **Commit** | `88034ac9fee5a0268ee7b602e0c0f0a45aa75014` |

**回滚（本轮唯一）**：`git checkout ir-pitch-v1.3-candidate`（或 `git reset --hard ir-pitch-v1.3-candidate`，**慎用**；执行前确认工作区已保存）。

**校验**：`git merge-base --is-ancestor 88034ac9fee5a0268ee7b602e0c0f0a45aa75014 ir-pitch-v1.3-candidate` 退出码为 `0`；且 `git show ir-pitch-v1.3-candidate:docs/fundraising/LP-FIRST-IMPRESSION-REGISTRY-001.md` 含上表 **Commit** 字段。

---

| **文档控制** | |
|------|------|
| **Owner** | IR |
| **ID** | LP-FIRST-IMPRESSION-REGISTRY-001 |
| **Version** | 1.0.0-ir |
| **Status** | **candidate_frozen**（PitchDeck **v1.3** 首印候选；**不再**基于内部「猜 LP」迭代） |
| **Classification** | internal |
| **Last Updated** | 2026-05-15 |
| **SSOT** | 对外交付物：`docs/fundraising/external/export-ready/`；叙事与页序：`docs/fundraising/external/04-PitchDeck-Storyboard.md`；机读生成：`scripts/tools/build-investor-pitch-deck.py` + `scripts/tools/ir_brand_vector_charts.py` |

---

## 1. Candidate 冻结锚（只读）

**冻结对象**：**Release 1.3** 主路演 Deck（15p），**不**再因内部冷读结论单独改版式/主叙事；**后续变更**仅允许来自 **真实 LP 反馈**（见 §6 登记），并须保留可追溯记录。

**对外二进制（candidate）**：

- `docs/fundraising/external/export-ready/04-PitchDeck-v1.3-CN.pptx`
- `docs/fundraising/external/export-ready/04-PitchDeck-v1.3-CN.pdf`
- `docs/fundraising/external/export-ready/04-PitchDeck-v1.3-EN.pptx`
- `docs/fundraising/external/export-ready/04-PitchDeck-v1.3-EN.pdf`

**同批附录（非首印主链，但与 Deck 同源导出）**：`04-IC-Memo-v1.3-*`（可选分发）。

**本地重生成（不改变「candidate」语义，除非发起新版本）**：

```bash
python scripts/tools/build-investor-pitch-deck.py
```

---

## 2. 本轮「内部冷读」性质声明（≠ LP 真反馈）

以下 **冷读前后** 描述均为 **团队/AI 在 ① 本地材料上的 15s 级缩略图/首屏启发式**，**不是** LP 访谈、**不是** ② 测试网/③ 生产侧真实路演记录。

**冻结后纪律**：**禁止**再以「内部猜 LP」为唯一理由改 PitchDeck 首印结构；**允许**的触发条件仅为：**§6 表中已登记的 LP 原话 + 可执行改动范围**（或明确的新 **Release** 立项）。

---

## 3. 冷读前后变化摘要（叙事与误导词/视觉权重）

### 3.1 误分类链（内部登记，非验收）

| 维度 | 冷读前（典型首因） | 冷读后（内部再扫，缩略图/首屏） |
|------|-------------------|----------------------------------|
| **支付 / 托管 / Escrow** | 「钱/锁/托管/Escrow」上屏与讲稿触发链偏重 | 上屏与主矢量逐步改为 **披露 / 订单资金状态 / 治理信号** 等货架词；**仍**存在「服务费/100/45/55」等 **弱支付联想**（见判据 §4） |
| **OTA / 消费端** | 「市场·看订单」等强 C 端货架 | 系统性优势首段改为 **履约侧·订单对齐**；GTM 「内容+社区」改为 **披露口径+渠道试点**；**仍**可见 **Find/Book** 动线字（已 **压暗字重**） |
| **清分 / 路由** | Hub **FeeRouter** + 大字 **45/55** | Hub 主字 **披露/Disclosure**，**协议经济** 降为副标题；**45%/55%** 降为 **副标签（小、灰、非粗）**；**100%** 仍显眼 |
| **证券 / 治理币** | **TTG** 上屏首因 | 三句话等处 **TTG** 改为 **治理信号** 等；**链上** 等词仍可能触发链叙事联想（弱） |
| **封面货架** | 仅品牌名、无定类句 | 封面增加 **旅行订单金融科技 / Trip-order fintech** 单行货架 |
| **概念片** | 「怎么走（图）」类标题 | 第 4 页标题改为 **单笔订单对齐交付与争议** 等，弱「示意图故事片」语感 |

### 3.2 矢量视觉层级（仅 `ir_brand_vector_charts.py`）

- **协议经济页**：**Disclosure/披露** 为主标题；**Protocol economics/协议经济** 为副标题；**100%（白皮书）** 次之；左右 **45% / 55%** 为副标签（小、灰）。
- **旅行环 / 协议栈**：**找到/下单 · Find/Book** 仅 **降字号 + muted**（**不改**节点文案与拓扑）。

---

## 4. PASS / PARTIAL 判据（内部启发式，仅用于登记一致性）

> **PASS**：15s 缩略图或首屏下，**该联想桶**无「一眼即中」的强触发（无大字根词、无并列双货架抢第一解释）。  
> **PARTIAL**：仍能 **合理** 被口头收成该桶，但 **弱于** 主货架或已被 **披露/履约/订单** 等主锚压住。

| 联想桶 | **PASS** | **PARTIAL** |
|--------|-----------|-------------|
| **支付** | 首屏无 **cash/money/锁钱/托管/Escrow** 大字根；费项仅与 **白皮书/披露** 同框 | 仍见 **服务费、100/45/55、fee** 等 **弱触发** |
| **OTA** | 首屏无 **市场·看订单 / content+community** 类 C 端增长主锚 | 仍见 **Find/Book/下单** 等 **弱动线**（即使已压暗） |
| **清分** | Hub **不以 Router/Fee+Router 为最大字**；分桶数字 **非**全屏唯一主锚 | **45/55** 仍为大号侧盒或缩略图仍抢眼 |
| **证券** | 首屏无 **TTG** 大字根作第一解释 | **链上 / 治理** 等仍可能触发 **弱证券/链项目** 联想 |

**本轮内部收口登记（v1.3 candidate 冻结时）**：

- **支付**：**PARTIAL（弱）**
- **OTA**：**PARTIAL（弱）**
- **清分**：**PARTIAL（弱）**
- **证券**：**PASS（就 TTG 字面首因）** / **PARTIAL 边缘（若把「链上」也计入证券首因）**

---

## 5. 与对外 zip / Data Room 的关系

- 对外 zip 与目录规范仍以 **`internal/33`**、**`external/export-ready/README.md`** 为操作真源。
- 本台账 **不**替代法务/披露审签；**不**改变 **84/83/06** 数字 SSOT。
- **preview 外发（①）**：`bash scripts/gates/ir-outbound-status.sh` → `release-investor-lp-pack.sh`；当前 **v1.3** zip **可无** demo mp4（邮件须说明）；登记 [internal/19](internal/19-对外分发与访问登记.md)。

---

## 6. 真实 LP 反馈登记（唯一允许驱动「首印」改动的入口）

| 日期 | LP 类型（可匿名） | 材料版本 | 场景（现场/邮件/15s 缩略图） | 原话摘录（尽量逐字） | 支付 | OTA | 清分 | 证券 | 是否采纳改动 | 备注 / PR 链接 |
|------|-------------------|---------|------------------------------|----------------------|------|-----|------|------|----------------|---------------|
|  |  |  |  |  |  |  |  |  |  |  |

**填写规则**：

1. **必须有**「原话摘录」或等效书面纪要（否则视为内部猜测，**不**驱动改稿）。  
2. 「是否采纳」须写 **是/否 + 一句理由**；采纳则 **新开 Release** 或 **单文件勘误 PR**，并回链本行。

---

## 7. 变更历史

| 日期 | 说明 |
|------|------|
| 2026-05-15 | 初版：冻结 **PitchDeck v1.3** 为 **candidate**；登记内部冷读前后与 **PASS/PARTIAL** 口径；声明后续仅接受 **真实 LP 反馈** 驱动首印相关改动。 |
