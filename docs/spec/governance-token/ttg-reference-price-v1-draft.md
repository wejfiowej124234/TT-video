# TTG 参考价 v1 草案（① · ENGINEERING_DEFAULT）

**Version:** v1-draft-20260615  
**Status:** **ENGINEERING_DEFAULT（① 本地 Mock · 待产品/法务书面确认）**  
**Companion 机读：** `frontend/lib/governance/ttgReferencePriceV1.ts` · `GET /api/v1/governance/ttg-exchange/quote` · `protocol_reference_json().valuation_anchor`

**互指（三轨独立 · 无自动换算）：**

- **募资目标** → [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)  
- **Seat 质押** → [protocol-ssot.v1 §4](protocol-ssot.v1.md)  
- **Fee Points / 国家收益** → [country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md)

---

## 1. 本文件管辖范围（TTG 参考价 · Mock Swap · FDV）

| 键 | 值 | 说明 |
|----|-----|------|
| `total_supply` | **10,000,000 TTG** | [protocol-ssot.v1 §1](protocol-ssot.v1.md) |
| `reference_price_cny_per_ttg` | **200 CNY** | FDV 叙事 · ① Mock Swap |
| `fdv_cny` | **20 亿元人民币** | 200 × 10,000,000 |
| `mock_usdc_cny_fx` | **7.2** | ① 本地 USDC→CNY 示意（非 oracle） |
| `mock_usdc_per_ttg` | **200 ÷ 7.2 ≈ 27.7778 USDC** | 首页 Mock Swap 固定价 |

**本文件不管辖：** Country Pool **募资目标（万元）** — 见 [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)。

**阶段边界：** ① 本地 Mock · **②** 测试网 Router/Treasury · **③** 法务签字。

---

## 2. 定稿后动作

| 步 | 动作 |
|----|------|
| 1 | 法务确认参考价 / FDV（与募资表分开签字） |
| 2 | ② 真兑换；关闭 `mock_fixed_v1` 或仅 dev |
| 3 | 募资数值变更只改 [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) |

**不替代：** [LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)
