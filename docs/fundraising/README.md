# 融资与对外披露

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR |
| **Version** | 1.0.3-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-16 |
| **SSOT** | `docs/fundraising/internal/00-融资文档地图.md` · `docs/spec/00-文档索引.md` · [34-融资分层冻结与单向流转](internal/34-融资分层冻结与单向流转.md) · **[LP 首印台账 001](LP-FIRST-IMPRESSION-REGISTRY-001.md)**（PitchDeck **v1.3 candidate** 冻结与真实 LP 反馈入口） |


## 分层冻结（当前结构）

| 目录 | 用途 |
|------|------|
| **`internal/`** | **唯一**团队内部融资工作仓 |
| **`external/`** | **唯一**投资人对外交付正文源 |

**纪律**：新增内容按受众**分层落位**；**禁止**两层重复贴全文、禁止外稿回流内仓或内稿整段进对外（详见 [internal/34-融资分层冻结与单向流转.md](internal/34-融资分层冻结与单向流转.md)）。

## 仓库级口径（定稿）

**`docs/fundraising/`** 已是融资与对外叙事的**唯一正文仓**；**`docs/spec/`** 保留协议、参数与工程 **SSOT**；**`docs/product-manager/`** 仅保留产品执行工具与跳转指针。

**地图**：[internal/00-融资文档地图.md](internal/00-融资文档地图.md) · **LP 已完成/未完成填表（真源）**：[data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md](data-room/evidence/LP-HUMAN-BLOCKERS-STATUS.v1.md) · **IR 操作索引**：[IR-OPERATOR-INDEX-001.md](IR-OPERATOR-INDEX-001.md) · **① LP 审计收口（合伙人）**：[IR-LP-AUDIT-CLOSURE-001.md](IR-LP-AUDIT-CLOSURE-001.md) · **决策**：[internal/01-融资决策入口.md](internal/01-融资决策入口.md) · **对外**：[external/00-README.md](external/00-README.md) · **对外默认读序（叙事真源）**：[external/00-START-HERE.md](external/00-START-HERE.md) · **包内 txt 与双入口纪律**：[START-HERE-SSOT-001.md](START-HERE-SSOT-001.md)（生成脚本 `scripts/tools/investor_handoff_layout.py`） · **分层冻结**：[internal/34-融资分层冻结与单向流转.md](internal/34-融资分层冻结与单向流转.md)

**快捷命令（①）**：`bash scripts/gates/ir-preview-send-preflight.sh`（preview 外发）· `bash scripts/gates/ir-outbound-status.sh` · `bash scripts/gates/release-investor-lp-pack.sh` · 维护冻结 [IR-MAINTENANCE-FREEZE-001.md](IR-MAINTENANCE-FREEZE-001.md)

**GitHub 镜像（离库）**：`bash scripts/sync-fundraising-to-github-org.sh` → 默认 [yinhang744-dev/fundraising](https://github.com/yinhang744-dev/fundraising)（须 `gh auth login` **为该账号**；机读闸仍在 monorepo）。含 internal 材料时建议仓库 **Private**。

## 投资决策优先（硬闸）

**禁止**任何「换名保留本质」的扩张。凡新增内容，若本质是在增加：**流程、抽象层、管理结构、分类体系、审计体系、命名体系、执行框架、元规则**——即使名称不同，也**一律视为**新增 **Framework**，**直接拒绝**。

**判断标准不是名字**，而是：**投资人是否因此更容易投。** 若不能直接提高 **理解速度**、**信任强度**、**DD 转化率**、**Invest 概率**，则 **删除、合并或不做**。

**规则**：Reality > Narrative · Evidence > Documentation · Investor Understanding > Architecture · Conversion > Process · Empty > Guess。

### 默认动作优先级（AI 与编辑默认）

遇问题或缺口时，**按序**尝试；**不得**默认跳到最后一步：

1. **删**  
2. **合并**  
3. **压缩**  
4. **重排**（信息顺序与入口，不加新概念）  
5. **补真实证据**（Demo、录像、可核 ID、DR 实件、签核等——**非**再写一篇说明）  
6. **最后**才允许 **新增内容**（且仍须通过上文硬闸）

**风险认知**：TravelTrust 当前最大风险**不是**「材料太少」，而是 **融资材料长成融资操作系统**。默认 **减法优先**。

## 目录树（企业级编号）

```
fundraising/
├── README.md
├── internal/          # 团队内部融资工作仓（唯一；见 internal/34）
├── external/          # 投资人对外交付正文（唯一；仅导出此树）
├── data-room/         # 签核 PDF / 尽调原件
├── legal/             # 法律意见 / 签核归档
└── board/             # 分发登记、Investor Update、Financing history 模板
```

## internal 编号段

| 段 | 用途 |
|----|------|
| **00–09** | 地图、决策、工作包、会议与任务台账 |
| **10–19** | 资料室、Data Room 索引、KPI、路线图、竞品、DD、**文档治理（18）**、**分发登记（19）** |
| **20–29** | BD / 一级市场 |
| **30–39** | 对外制作、法务、**导出终审（33）**、**分层冻结（34）** |
| **90–99** | 任务卡与管理 README |

## 机读验收

```bash
bash scripts/gates/check-governance-doc-linkage.sh
```

**LP 包重建 + 发前（①）**：

```bash
bash scripts/gates/release-investor-lp-pack.sh
```

（= 构建 PDF/Deck → 导出 zip → pre-send 机读；分步见 [PACK-RELEASE-CHECKLIST-001.md](PACK-RELEASE-CHECKLIST-001.md) **§2.0 / §2.9**。仅机读：`bash scripts/gates/check-fundraising-lp-pack-pre-send.sh`。）

机读通过后须人工勾选 [IR-PRE-SEND-MANUAL-001.md](IR-PRE-SEND-MANUAL-001.md) 与 [internal/33](internal/33-投资人Data-Room导出包与IR法务终审清单.md) 法务栏。**②** 可重复闭环 Runbook（不进 zip）：[data-room/evidence/RUNBOOK-III-PACK-A.v1.md](data-room/evidence/RUNBOOK-III-PACK-A.v1.md) · [internal/50](internal/50-企业级投资杠杆审计.md) **§5.4.7**。

投资人交付包（仅 `external/` 导出，不含仓库）：`bash scripts/export-investor-dataroom.sh --zip --omit-markdown` 或 `python scripts/tools/export-investor-dataroom.py --zip --omit-markdown`（操作清单见 [internal/33](internal/33-投资人Data-Room导出包与IR法务终审清单.md)）。

## 后续口径（基础设施收盘）

**① 文档 / 机读线已收口**（见 [IR-LP-AUDIT-CLOSURE-001](IR-LP-AUDIT-CLOSURE-001.md)「基础设施线」）；**人工作业**仍须 Legal / Demo / 登记 / **②** 证据。

融资文档体系已达 **内部融资与机构沟通可用基线**；**不再扩展**文档基础设施（新目录范式、新机读闸、新导出链路、新 registry 维度等）。**对外**统一仅使用 **上述导出包**。后续改进仅通过 **真实法务签核、投资人反馈与实际分发流程** 迭代；日常以修订 **`external/`** 叙事为主，触达矩阵见 **[IR-MAINTENANCE-FREEZE-001](IR-MAINTENANCE-FREEZE-001.md)**；登记见 [19](internal/19-对外分发与访问登记.md) / [board](board/README.md)（分层见 [internal/34](internal/34-融资分层冻结与单向流转.md) §6）。

**仅改 `external/*.md`**：`bash scripts/gates/fundraising-external-touch.sh`（**不**重建 PDF；发 zip 前仍须 `release-investor-lp-pack.sh`）。

**未完成项一览（①② 人工作业）**：

```bash
bash scripts/gates/ir-outbound-status.sh
# 或: python scripts/tools/print_ir_outbound_pending.py
```

收口摘要：[IR-LP-AUDIT-CLOSURE-001.md](IR-LP-AUDIT-CLOSURE-001.md) · 操作索引：[IR-OPERATOR-INDEX-001.md](IR-OPERATOR-INDEX-001.md)

---

**声明**：草案不构成投资或发售要约。
