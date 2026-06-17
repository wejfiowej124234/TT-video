# PPT 与白皮书 — 制作指南（对内）

| **文档控制（IR）** | |
|------|------|
| **Owner** | IR / PM |
| **Version** | 1.0.0-ir |
| **Status** | active |
| **Classification** | internal |
| **Last Updated** | 2026-05-15 |
| **SSOT** | `docs/fundraising/internal/00-融资文档地图.md` · 相关 `docs/spec/` 篇见正文互链 |


**用途**：团队制作融资 PPT、白皮书 PDF、官网数据块时的**章节骨架与禁止项**；定稿前须完成 [31-法务签核清单.md](31-法务签核清单.md)。**机构级 Deck 视觉母版（颜色 / 网格 / 组件 / 暗色）** 以 [36-IR-Pitch-Deck-Design-System.md](36-IR-Pitch-Deck-Design-System.md) 与 `scripts/tools/ir_deck_design_system.py` 为准。

**15 页路演主 Deck（机读屏字）**：页序与上屏字符串以仓库 `scripts/tools/build-investor-pitch-deck.py` 之 **`SLIDES_CN` / `SLIDES_EN`** 为准；人类分镜与附录分镜见 [../external/04-PitchDeck-Storyboard.md](../external/04-PitchDeck-Storyboard.md)。

**版本**：1.1.0  
**最后更新**：2026-05-15  
**状态**：对内工作文档

---

## 1. 建议幻灯片 / 章节骨架

| 建议页题 / 章节 | 内容要点 | 备注 |
|-----------------|----------|------|
| 封面 + 合规脚注 | 草案声明、非法务定稿不得募资印刷 | 与执行摘要、白皮书文首一致 |
| 问题与机会 | 跨境旅行信任与结算摩擦 | 用 [../external/02-Investor-Executive-Summary.md](../external/02-Investor-Executive-Summary.md) 第一节语气 |
| 解决方案 | Escrow + 状态机 + 信誉 + 可选区域治理 | 强调托管本金与费路由分域 |
| 产品主路径 | 注册 → 市场 → 创单 → 托管详情 | 可配产品截图，勿写未实现为主网已闭 |
| 协议分层图 | 链上资金 vs 链下业务 | 一页图即可，勿堆内部路径 |
| FeeRouter 收益流 | **45% / 55%** 第一层 + Global 内 **65 / 20 / 15** | 图示须与法务定稿附录一致；脚注：**gas / 仲裁 / slash 不在同一分母** |
| 可分配费用分母 | 仅指进入费路由器的可分配手续费 | PPT **勿**把仲裁费、罚没画进 45/55 同一分子 |
| 区域治理机制 | Region / Seat / Vault / DAO 定义压缩版 | 须含风险披露；非股权表述 |
| Phase 1 十国 | 国家池与承销表 | **数字以 [country-pool-fundraise-governance-v1](../../spec/governance-token/country-pool-fundraise-governance-v1.md) 为准**（合计 **53,500 万 / 5.35 亿 · 无硬顶**；84 §四 镜像）；法务签核前 **勿** 即兴改表 |
| TTG 供应分解 | 占总量百分比叙事 | 须法务定稿；**禁止**与费用百分点同页误加总 |
| 治理代币边界 | 非支付币、非股权、可能永不发行 | 摘自 [../external/06-Whitepaper.md](../external/06-Whitepaper.md) |
| 路线图与实现状态 | Partial / Target 诚实表述 | 不得优于工程实际 |
| 风险与合规 | 监管、合约、波动、路线图变更 | 完整风险以白皮书 §6 为准 |
| 附录（数据室） | 参数表、图示 PDF | 二轮以后 |

---

## 2. 对外正文来源（本仓库）

| 材料 | 路径 |
|------|------|
| 执行摘要 | `docs/fundraising/external/02-Investor-Executive-Summary.md` |
| 白皮书（中文） | `docs/fundraising/external/06-Whitepaper.md` |
| Litepaper（英文） | `docs/fundraising/external/en/05-Litepaper.md` |

---

## 3. 禁止项（制作时自检）

- **不得**在幻灯片中即兴改百分比或 **十国募资表（53,500 万）**。  
- **不得**使用已废止叙事：**硬顶**、**3.85 亿**、**Option C**、**Seat×参考价→募资**（历史见 governance-token/archive）。
- **不得**将 TTG / 区域份额表述为「保本」「固定收益」「股权分红」。  
- **不得**暗示「页面展示数字 = 链上已执行真值」。  
- **不得**将本地或测试网验收写成主网生产已闭。

---

## 4. 定稿流程

1. 按本指南组稿 → 2. 完成 [31-法务签核清单.md](31-法务签核清单.md) → 3. 导出 PDF 至 `../external/export-ready/YYYY-MM-DD_包名/`。

---

### 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.0 | 2026-05-15 | 自 `governance-token/03` 迁入 `docs/fundraising/internal/`；对外正文改指 fundraising/external。 |
| 1.0.x | 2026-03-26 | 原 spec 树摘抄索引版本。 |
