# P5-5 收口证据索引（84 参数与开放费点 · 只读文档镜像 · 母表/台账封口）

**锚点 ID**：**`TT-DOC-P5-5-PM-CLOSE-001`**

**过门口径**：与 **[84-第一阶段10国Country-Pool发行参数总表](../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)**、**[04 §3.4 · `GET …/governance/protocol-reference`](../docs/spec/04-后端与API.md)**、**[08-4-附录-收益流闭环图-FeeRouter-Target](../docs/spec/08-4-附录-收益流闭环图-FeeRouter-Target.md)**（linkage 与镜像 **45/55·65/20/15** 同锚）一致；**不**替代发版 **`evidence/GO_YYYYMMDD/`** bundle（目录约定见 [README §目录约定](README.md#目录约定)）。

**收口日期**：2026-04-09

## 子波次完成情况（P5-5-1 / P5-5-2 / P5-5-3）

| 波次 | 交付摘要 |
|------|----------|
| **P5-5-1** | **`governance_doc_reference`**：**84** 十国表 + **`fee_router`** 分层 + **`checksums`**（含 **layer1/Global 内拆合计 100%**、**`phase1_open_over_country_bucket`** 叙事锁定）；**`DOC_VERSION` ↔ 84 文首版本**；**`cargo test -p traveltrust-api` `governance_doc_reference`**；触及 linkage 指针时 **`bash scripts/check-governance-doc-linkage.sh`** |
| **P5-5-2** | **`protocol-reference` / `protocol-reference/pending`**：**`X-Implementation-Status`** 常量契约；**`fee_pool_cross_check_from_pref`** → **`fee-pool-aggregates`** 之 **`cross_check`** 旁证（**仍只引用文档镜像**，**不**读 pending）；**`GET …/governance/params`** 并列 **`protocol_reference_reads`** + **`protocol_reference_doc_version`**；**`cargo test -p traveltrust-api`**（**`protocol_reference_*` / `cross_check` / `b084_*` / `p552_*`** 等） |
| **P5-5-3** | **前端 `/governance/params`**：仅 **fetch** **`protocol-reference`** + **`pending`**；**`lib/governanceParams84Readonly`**（substance / diff / checksum 键序）；**数据源 `role="note"`** 明示 **非** **fee-pool-aggregates Σ**、**非** **`governance/pool` 链上主读**；**`npm test -- governanceParams84Readonly --run`** + **`npm run test:i18n:ci`** |

## 与 B-115 边界（已封口 · 正交）

| 维度 | B-115（Snapshot / Claim / 分配） | P5-5 |
|------|----------------------------------|------|
| **叙事** | **RegionShareSnapshotLine**、**`region_share_snapshot_lines`**、**`RegionDistributionClaim`**、投资者分配对账 | **84 文档镜像**（百分数 / 十国开放费点 / checksums）**只读展示** |
| **禁止** | — | **不**改 **B-115** 表、路由、登记器；**不**把镜像当作 **分配 Σ** 或 **Snapshot** 真值 |

**互证**：[**GO_B115_CLOSE.md**](GO_B115_CLOSE.md)

## 与 B-116 边界（已封口 · 正交）

| 维度 | B-116（FeeRouter / RegionVault 投影 · **`fee-pool-aggregates` Σ**） | P5-5 |
|------|---------------------------------------------------------------------|------|
| **叙事** | **`PlatformFeeRouted` / `RegionVaultForwarded`** → 投影 → **Σ** | **静态 JSON 镜像** + **`cross_check`** **旁证切片**（与 **`protocol-reference`** 同源字段） |
| **禁止** | — | **不**改合约、**indexer**、投影写入、**`build_fee_pool_aggregate_body`** **Σ 语义**；**禁止**用镜像 **覆盖** 或 **冒充** **Σ** / **链上读数** |

**互证**：[**GO_B116_CLOSE.md**](GO_B116_CLOSE.md) · [**GO_B116_P4.md**](GO_B116_P4.md)

## 与 P5-1 边界（已封口 · 正交）

| 维度 | P5-1（**`country_ledger_ssot_v0`** · 试点运营账本） | P5-5 |
|------|-----------------------------------------------------|------|
| **叙事** | **CountryPoolLedgerV0** + **`p5_country_ledger_lines`** + **`country-ledger/:j`** | **84 参数表** 与 **开放费点** **产品/披露** 向 **HTTP 文档镜像** |
| **禁止** | — | **不**写入 **`p5_country_ledger_lines`**；**不**改 **`country-ledger`**；**不**从镜像 **派生** 账本 SSOT 行 |

**互证**：[**GO_P5_1_CLOSE.md**](GO_P5_1_CLOSE.md)

## 验收命令（可复核）

```bash
cargo test -p traveltrust-api governance_doc_reference
cargo test -p traveltrust-api p552_
cargo test -p traveltrust-api cross_check
cargo test -p traveltrust-api b084_
bash scripts/check-governance-doc-linkage.sh

cd frontend && npm test -- governanceParams84Readonly --run && npm run test:i18n:ci
```

**说明**：**Rust** 以当前仓库 **CI / 本地** **`cargo test -p traveltrust-api`** 相关用例全绿为准；**linkage** 在同批改动触及 **83/84/82/08-4 附录** 等已纳入脚本指针时必跑。**前端** 以 **`governanceParams84Readonly`** + **i18n gate** 为准。

## 台账互指

- **任务母表**：[**docs/任务母表.md**](../docs/任务母表.md) **P5-5** 行（**☑ 已封口**）
- **evidence 入口**：[**README · P5-5**](README.md#p5-5-doc-mirror-84-readonly-close)

## 明确排除（非 P5-5 封口范围）

- **84 §三 3.4 / 3.5 / 3.6** 募资列 **A/B/C 定稿**、**法务签核** 流产品化
- **Admin** 或 **链上** **发布** 待生效包导致 **资金流 / 路由真值** 变化（本卷仅 **文档镜像 + env overlay 预览**）
- **Vault 专项对账导出** 已由 **P5-2-B** **另卷封口**（[**GO_P5_2_B_CLOSE.md**](GO_P5_2_B_CLOSE.md)）；**多辖区** 产品化 **UI** 等 **84 更广 Target** **不**因本收口自动 **Implemented**
- **将 `fee-pool-aggregates` Σ 与本文档镜像合并为单一对外「官方费点」叙事**（**禁止**；前端已 **分源标注**）
