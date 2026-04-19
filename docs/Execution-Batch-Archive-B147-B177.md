# Execution Phase · Batch 归档视图（B-147～B-177）

**B-180 · docs-only**：本文件是 **Batch-1 / Batch-2 / Batch-3** 的 **归档摘要视图**，便于执行期与 Phase Close 扫档。**不** 粘贴 **TT 正文**；**不** 新开 B 或 TT；**不** 改写 **[任务母表](任务母表.md)**、**[AI任务卡索引](AI任务卡索引.md)** 中 **B-147～B-177** 各行的 **范围 / 边界 / 验收** 语义（**仍以母表 + 索引为 SSOT**）。

**状态**：各 B 的 **实现与封口** 以母表「状态」列与索引「一览」为准；本页 **不** 充当封口登记簿。**母表 Execution 观测 Batch-3（B-169～B-177）**：**九张 TT 均已封口**（**索引序号 169～177**；**含** **TT-B177** **文档登记** **对齐母表/索引**）。

**执行顺序（索引钉死）**：详见 **[AI任务卡索引 · 未封口 · 结构化三批](AI任务卡索引.md)**（Batch-1 / Batch-2 / Batch-3 推荐顺序）。

---

## 总表

| 批次 | 覆盖 B 范围 | 已形成能力（母表已登记之能力主题汇总；**非**「代码已交付」认定） | 未覆盖边界（批级摘要） | 对后续影响 |
|------|-------------|--------------------------------|------------------------|------------|
| **Batch-1** | **B-147～B-157** | **SSOT 元数据门禁**扩面（`contracts/**`、PR CI 引用严格）；**治理提案 L2 对拍**（承前序 SEQ）；**orders / indexer 运维向只读观测**（链同步读模型、NULL chain 聚合、投影缺列、链头与 DB 尾漂移、reconcile 耗时与批次、订单金额与 Region 事件对拍标记）；**internal tick 计数器标准化** | 默认 **不** 打开 `CRATES_METADATA_GATE_FAIL`；**不** 替代已封口 **SEQ2 / B-097** 主叙事；**不** 擅自 bump **compound / checks_total**（除非母表另句 + **B-120** 同批）；观测 **不** 升格为业务双源 SSOT | 为 Batch-2 **门禁三线、807 indexer、治理费路由与 vault 对拍** 提供 **元数据与 internal 形状** 基础；Batch-1 末 **小收敛** 扫文档入口（见索引 **B-178** 规划） |
| **Batch-2** | **B-158～B-162**，**B-164～B-168**（**无 B-163**） | **frontend / lockfile** 触面元数据门禁；**indexer-reconcile-gate / internal-drill** 与 110、脚本、07 **机读同锚**；**correction / executor 行数**、**质押与锁仓块滞后**、**rpc_escrow_sample_meta 摘要**；**chain_tip 叙事与 reconcile 对齐**；**GET /meta → indexer.*** 与 110/04 **字段级收口**；**escrow 粗态** 链 vs DB **drift 标记** | **不** 与 Batch-1 **B-147/B-148**、**B-149/B-157** 重复实现同一职责；**不** 擅自改 gate 语义；bump **checks_total** 须与 **B-120** 叙事一致；对拍类 **不** `DELETE`/backfill | 收紧 **CI 与 807 indexer 叙事**；为 Batch-3 **reorg 哨兵、三水线、矩阵壳、治理粗对拍与 meta 治理子域** 提供 **对齐后的基线**；Batch-2 末小收敛 **标出与 Batch-1 重复叙事** |
| **Batch-3** | **B-169～B-177** | **reorg 哨兵**只读汇总；**finality 三水线**并列；**DB 链维足迹 + 多表尾块**（与 **B-171/B-176** 统一机读壳约束）；**proposalCount 尾部** 粗对拍（**不**替代 **B-149** 逐提案）；**Timelock delay 镜像**（与 **B-167/B-177** 叙事分工）；**tick 失败/跳过分桶**；**RPC chainId vs 配置** 探针；**GET /meta governance.* + pool** 与 04/110 **收口** | **不** 再造 **同维度平行顶层** matrix/drift JSON（索引 **Batch-3 防重复规则**）；**不** 与 **B-149/B-167/B-173** **混叙事**；**不** 弱化 **SEQ2**；**不** 默认 per-request **eth_call** 风暴 | 三批封口后进入 **B-178** 规划，再 **B-179～** 分拆（含 **B-181 internal 拆分、B-185 统一观测壳** 等）；Batch-3 末小收敛 **核对矩阵壳与 B-173·B-177 边界是否可落实** |

---

## Batch-1（B-147～B-157）

| 项 | 摘要 |
|----|------|
| **覆盖 B** | B-147, B-148, B-149, B-150, B-151, B-152, B-153, B-154, B-155, B-156, B-157 |
| **已形成能力** | 元数据门禁（contracts、CI refs）；治理提案投影 **L2**；订单链同步读路径；orders / governance 投影 **只读聚合与缺列**；链头 vs DB 尾 **漂移**；reconcile **性能形态**；订单与 Region **对拍标记**；**tick 响应计数器** 标准化 |
| **未覆盖边界** | 仍以 **母表各 B「边界」列** 为准；批级共性：**门禁默认宽容**、**观测非 SSOT 接管**、**compound 谨慎 bump** |
| **对后续影响** | 奠定 **Batch-2** 的 **gate 文档锚** 与 **meta/indexer 收口** 输入；执行顺序以 **索引 Batch-1 推荐序** 为准 |

---

## Batch-2（B-158～B-162，B-164～B-168）

| 项 | 摘要 |
|----|------|
| **覆盖 B** | B-158, B-159, B-160, B-161, B-162, B-164, B-165, B-166, B-167, B-168（**无 B-163**） |
| **已形成能力** | 前端与 lockfile **元数据触面**；**workflow / 110 / 07 / 脚本** gate **三线对齐**；correction/executor、质押锁仓滞后、**rpc 样本元数据** 摘要；**chain_tip** 与 meta 叙事；**807 indexer.*** 对齐；**escrow 粗态** drift |
| **未覆盖边界** | 与 Batch-1 **类别互斥** 已在母表 **Batch-2 · 与 Batch-1 非重叠** 句；**不** 替代 B-149 细对拍、B-157 仅总数等 |
| **对后续影响** | **807** 与 **gate 机读** 稳定后，Batch-3 才能安全叠 **矩阵壳、治理 meta 子域、链身份探针** |

---

## Batch-3（B-169～B-177）

| 项 | 摘要 |
|----|------|
| **覆盖 B** | B-169, B-170, B-171, B-172, B-173, B-174, B-175, B-176, B-177 |
| **已形成能力** | **reorg** 可见性；**finality 三水线**；**多表链维 + 尾块**（**统一壳**）；**proposal 尾部** 粗对拍；**Timelock** 参数镜像；**失败/跳过** 分桶；**chainId** 配置对拍；**governance.* / pool** 与规范对齐；**B-177** **807 根键序契约** + **reconcile 可选** **`governance_pool_meta_chain_alignment_observability`**（**锚** **`177-…-OBS-V1`**） |
| **未覆盖边界** | **B-171/B-176** **须** 共用 **单一 multi_table 类机读壳**（键名以 TT 为准）；**B-173/B-177** **须** 与 **B-149/B-167** **分工** 清晰；详见索引 **Batch-3 · 防重复规则** |
| **对后续影响** | **母表观测 Batch-3 九卡 TT 已尽封口**；**B-147～B-177** **对应 TT** **均已封口** → **B-178 Phase Close 规划前置已满足**（**见** **母表 B-178**）；**152～168** **母表行** **若** **仍有** **未封口** **项** **以** **母表/索引状态列** **为准**（**不** **回滚** **Phase Close** **文档真源**）；**B-185** 观测壳落地依赖本批 **矩阵/漂移** 纪律与 **B-181** **internal** 结构拆分顺序（见 Phase Close 总序） |

### Execution 观测 Batch-3 · TT 封口清单（B-169～B-177）

| **B** | **TT** | **索引一览** |
|-------|--------|----------------|
| B-169 | TT-B169-INDEXER-REORG-SENTINEL-OBS-001 | 序号 **169** · 已封口 |
| B-170 | TT-B170-INDEXER-FINALITY-WINDOW-TRIPLE-OBS-001 | 序号 **170** · 已封口 |
| B-171 | TT-B171-MULTI-CHAIN-DB-CHAIN-ID-FOOTPRINT-MATRIX-OBS-001 | 序号 **171** · 已封口 |
| B-172 | TT-B172-GOVERNOR-PROPOSAL-COUNT-CHAIN-VS-PROJECTION-DRIFT-001 | 序号 **172** · 已封口 |
| B-173 | TT-B173-TIMELOCK-DELAY-CHAIN-VS-META-BUNDLE-ALIGN-001 | 序号 **173** · 已封口 |
| B-174 | TT-B174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-001 | 序号 **174** · 已封口 |
| B-175 | TT-B175-RPC-CHAIN-ID-VS-CONFIG-PROBE-RECONCILE-001 | 序号 **175** · 已封口 |
| B-176 | TT-B176-PER-TABLE-INDEXED-TAIL-BY-CHAIN-MATRIX-OBS-001 | 序号 **176** · 已封口 |
| B-177 | TT-B177-META-GOVERNANCE-CHAIN-ALIGNMENT-04-110-ALIGN-001 | 序号 **177** · 已封口 |

---

**维护**：仅当 **母表 / 索引** 对 Batch 范围或批次纪律 **显式变更** 时，同步改本页 **总表与三节首列**；**不** 在本页扩写实现细节或替代 TT。
