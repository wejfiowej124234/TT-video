# 历史工程公式 · Seat 质押 × TTG 参考价 → 募资目标（ARCHIVE）

**Status:** **ARCHIVE ONLY · 已废止（2026-06-15）**  
**取代：** [country-pool-fundraise-governance-v1.md](../country-pool-fundraise-governance-v1.md) · [country-revenue-model-v1-draft.md §4](../country-revenue-model-v1-draft.md) **三轨独立参数**

**禁止：** 在现行文档、API、UI、示例、注释中引用本页公式或示例数值。

---

## 背景

Phase ① 本地开发期曾用下列 **临时工程公式**，使 API/UI 在 TTG 参考价草案定稿后快速对拍。**该公式从未构成治理决议**，已于 **2026-06-15** 废止。

---

## 废止公式（勿再引用）

```
Seat 质押 TTG（枚） = total_supply × steward_stake_bps ÷ 10,000
募资目标（万元）   = round(Seat 质押 TTG × reference_price_cny_per_ttg ÷ 10,000)
```

其中 `reference_price_cny_per_ttg = 200`，`total_supply = 10,000,000 TTG`。

---

## 废止原因

- 募资目标属 **Country Pool 独立治理参数**（董事会/治理委员会按国家市场规模制定）
- Seat 质押属 **责任锁仓与治理资格**（Seat 等级 · protocol-ssot）
- Fee Points 属 **国家收益分配等级**（与 Seat 等级档）
- **三者无自动换算关系**；TTG 参考价仅用于 Mock Swap 与 FDV 叙事

---

## 现行 SSOT

| 体系 | 文档 |
|------|------|
| 募资目标 | [country-pool-fundraise-governance-v1.md](../country-pool-fundraise-governance-v1.md) |
| Seat 质押 | [protocol-ssot.v1.md §4](../protocol-ssot.v1.md) |
| Fee Points | [country-revenue-model-v1-draft.md](../country-revenue-model-v1-draft.md) |
| TTG 参考价 | [ttg-reference-price-v1-draft.md](../ttg-reference-price-v1-draft.md) |
