# Governance → Business 叙事一致性审计（2026-06-15）

**阶段口径：** ① 本地工程默认 · **≠** ② 测试网 GO · **≠** ③ 印刷/对外 GO（仍须 **LEGAL-SIGNOFF**）

**治理真源（募资）：** [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) — 十国合计 **53,500 万元（5.35 亿）** · **单目标 · 无硬顶**

**Companion 工程审计：** [THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md](THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md)（Document / API / UI / Test）

---

## 1. 扫描范围

| 域 | 路径 | 角色 |
|----|------|------|
| 融资对内 | `docs/fundraising/internal/` | IR / PM 工作包、决策总表、会议模板、Pitch 制作指南 |
| 融资对外 | `docs/fundraising/external/` | Pitch Storyboard、Whitepaper、Executive Summary |
| 产品经理 | `docs/product-manager/` | 资料包、决策总表、Pitch 初稿、术语表 |
| 机读 Deck | `scripts/tools/build-investor-pitch-deck.py` | 屏字/Notes（**不**新增经济数字） |
| 投资人数字闸 | `registry/fundraising-external-numeric-anchors.v1.json` | 百分比 allowlist（**无** 3.85/53500 硬编码） |

**排除（非募资「硬顶」）：** `docs/runbook/ci-slo-baseline-and-timeout-notes.md`（CI job 超时）、合约 `limits.rs` 等。

---

## 2. 替换矩阵（活跃文档 · 统一口径）

| ID | 遗留表述 / 风险 | 标准替换 | SSOT |
|----|-----------------|----------|------|
| **B-01** | **硬顶**（募资列 / 会议议题） | **单目标 · 无硬顶** · 治理委员会逐国制定 | country-pool-fundraise-governance-v1 |
| **B-02** | **Seat 质押 × TTG 参考价 → 募资** | **三轨独立、无自动换算**；历史公式 **仅** [archive](archive/phase1-fundraise-stake-times-reference-price-formula-historical.md) | 同上 + protocol-ssot §4 |
| **B-03** | **Option C / A/B/C 估值锚驱动募资** | **三轨独立参数模型**；纪要见 [84-valuation-anchor-P1-memo](84-valuation-anchor-P1-memo.md)（**取代** Option C） | 84 §3.4～3.6 |
| **B-04** | 旧 **84 §四** 募资 **6000～7000**、CN **6000+硬顶8000** | 治理表：**CN/US 8000 · FR/ES 9000 · JP 5000 · TH 3500 · SG 3000 · KR 4000 · AU/AE 2000** | country-pool-fundraise-governance-v1 · 84 §四 **镜像** |
| **B-05** | 旧合计 **3.85 亿 / 38500 万** | **5.35 亿 / 53,500 万** | 同上 · API `fundraise_sum == 53500` |
| **B-06** | 「募资目标、**硬顶**、**估值锚**」会议清单 | 「**三轨独立参数**（募资 / Seat 质押 / Fee Points）· **TTG 参考价仅 Mock/FDV** · 十国表 **53,500 万**」 | 03 摘抄索引 · 本审计 §3 |
| **B-07** | 仅以 **84** 为募资写入口 | **84 = 镜像**；**写入口** = country-pool-fundraise-governance-v1 | 84 文首 Protocol Convergence |
| **B-08** | 「统一估值锚」混读为 Seat×价→募资 | **承销桶** 仍须 **FDV/折扣** 可核对（84 §1.5）；**≠** 跨轨自动换算 | ttg-reference-price-v1-draft · 84 §1.5 |

---

## 3. 十国募资表（对外/对内同一数字 · 万元）

| jurisdiction | 募资目标（万） |
|--------------|---------------|
| CN · US | 8000 |
| FR · ES | 9000 |
| JP | 5000 |
| TH | 3500 |
| SG | 3000 |
| KR | 4000 |
| AU · AE | 2000 |
| **合计** | **53,500（5.35 亿 CNY）** |

**三轨互链（开会必带）：**

1. **募资** → country-pool-fundraise-governance-v1  
2. **Seat 质押 TTG** → protocol-ssot.v1 §4  
3. **Fee Points** → country-revenue-model-v1-draft §4  
4. **TTG 200 CNY/TTG** → ttg-reference-price-v1-draft（**仅** Mock Swap / FDV 叙事）

---

## 4. 扫描结果与改写状态

| 文件 | 遗留项（改前） | 状态 |
|------|----------------|------|
| [fundraising/internal/02-融资方案产品经理工作包.md](../../fundraising/internal/02-融资方案产品经理工作包.md) | B-06 · B-07 · 硬顶问句 | **✅ 已改写** |
| [fundraising/internal/03-治理币与代币化工作包.md](../../fundraising/internal/03-治理币与代币化工作包.md) | B-08 估值锚混读 | **✅ 已改写** |
| [fundraising/internal/06-融资域决策总表.md](../../fundraising/internal/06-融资域决策总表.md) | B-06 · B-07 行 | **✅ 已改写** |
| [fundraising/internal/07-会议纪要模板-融资域.md](../../fundraising/internal/07-会议纪要模板-融资域.md) | B-06 固定议题 | **✅ 已改写** |
| [fundraising/internal/30-PitchDeck制作指南.md](../../fundraising/internal/30-PitchDeck制作指南.md) | Phase 1 十国「法务闭合后」无 SSOT 指针 | **✅ 已改写** |
| [product-manager/01-融资方案资料包.md](../../product-manager/01-融资方案资料包.md) | 同 02 | **✅ 已改写** |
| [product-manager/02-治理币与代币化方案资料包.md](../../product-manager/02-治理币与代币化方案资料包.md) | 同 03 | **✅ 已改写** |
| [product-manager/05-产品经理企业级决策总表.md](../../product-manager/05-产品经理企业级决策总表.md) | 融资数字口径 · 估值锚行 | **✅ 已改写** |
| [product-manager/06-产品经理会议纪要模板.md](../../product-manager/06-产品经理会议纪要模板.md) | B-06 | **✅ 已改写** |
| [product-manager/07-产品经理术语表.md](../../product-manager/07-产品经理术语表.md) | 缺三轨词条 | **✅ 已改写** |
| [product-manager/27-Pitch Deck 初稿](../../product-manager/27-Pitch Deck 初稿（页序版）.md) | 84 互链无治理募资 SSOT | **✅ 已改写** |
| [fundraising/external/*](../../fundraising/external/) | 无 3.85/硬顶/Option C 活跃正文 | **✅ 已净**（2026-06-15 grep） |
| [fundraising/external/06-Whitepaper.md](../../fundraising/external/06-Whitepaper.md) | 无十国募资硬数字（合规） | **— 保持**（数字走附录/03 摘抄） |
| [scripts/tools/build-investor-pitch-deck.py](../../../scripts/tools/build-investor-pitch-deck.py) | 不嵌入募资合计 | **— 保持** |
| [84 §九 changelog](../84-第一阶段10国Country-Pool发行参数总表.md) | 历史 Option C 行 | **— 保留**（变更记录） |
| [archive/*](archive/) | Seat×价公式 | **— 保留**（ARCHIVE） |

---

## 5. 机读闸（① · 可选本地自检）

```bash
# 业务活跃路径不得复活旧募资口径（允许「无硬顶」「不得…硬顶…」等否定/禁止句）
rg -n '38500|3\.85亿|募资目标和硬顶' docs/fundraising/internal docs/product-manager --glob '*.md' && exit 1 || true
rg -n 'Option C' docs/fundraising/internal docs/product-manager --glob '*.md' | rg -v '不得|已废止|禁止|取代|废止' && exit 1 || true
```

---

## 6. 诚实边界

- ① 工程默认 **53,500 万 / 三轨独立** **≠** 董事会/法务书面定稿 **≠** ③ 印刷 GO。  
- **ISS-007 / 窄切片 report.json GO** 不得冒充全站或投资人包 GO。  
- **国家池净利润 45/55（②）** 见 [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md) — **设计态**，与 FeeRouter 第一层 45/55 **不同键**。

---

## 7. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-15 | 初版：Business 域扫描 · 替换矩阵 · 十文件同批改写 |
