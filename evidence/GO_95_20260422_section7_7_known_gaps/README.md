# GO_95 — §7.7 已知缺口（对拍 · 2026-04-22）

**95 文档**：`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` **§7.7**  
**目标**：对五条「补齐后勾」作**可复核**的代码/文档锚点与边界说明；**不**用机读数替代 P0/资金域终验。

## 1. 真托管主路径与 mock 互斥部署 — **可勾 `[x]`（运行时在「生产安全默认」下 fail-closed）**

- **`crates/api/src/startup/mod.rs`**：当 **`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS=1`** 且 **`P3_CHAIN_OFF=1`** 时 **退出进程**，文案明确 **chain-off mock / mock-pay** 与生产安全默认不兼容。  
- **边界**：**不**等于「链上主网已部署/资金终验」；运维仍须按 **Runbook**/**缺口官方总表** 配置 **`ESCROW_*`** 等与真托管一致的环境。

## 2. 多实例内存 SSOT 方案落地 — **仍为 `[ ]`**（**§9 ISS-009** 跟踪）

- **登记**：**`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` §9 · ISS-009** — 闭证须 **Runbook/编排** 声明副本模型 **或** **PG/Redis** 分布式锁 **或** **ADR** 显式「单写者」；**本 README 不**替代 **ISS-009** 关闭。  
- **例**：**`startup/mod.rs`**（**`L392–L404`**）在 **prod safe** 下若 **`SCHEDULE_SLOTS_PATH`** 未设会 **WARN**（档期锁**易失、重启清空**）。  
- **例**：**`crates/api/src/schedule_engine.rs`** — 文件持久化缓解**单进程**重启；**多副本**仍须共享存储或 DB 锁（见 **ISS-009**）。  
- **例**：`chain_off` 内存态与多副本一致性仍见 **state / hydrate / 双写** 叙事与 **§7.5** 证据边界。  
- **不**以 **HTTP 幂等 DB 命中**（下节）覆盖「全站内存 SSOT」缺口。

## 3. 对象存储 **270** 全量 — **§7.7 本条 `[x]`（计划落款 · v1.4.106；≠ 270 §十一 `Implemented` 全闭）**

**对读**：[270-阶段文件媒体证据存储系统](../../docs/spec/270-阶段文件媒体证据存储系统.md) **§二**（须纳管对象）/**§8.1**（概念 API ↔ 路由）/**§十**（P0～P2 阶段计划）/**§11.3**（达成度快照；**Signed URL** 仍为 **Partial**）；**[PROFILE-AVATAR-OBJECT-STORAGE](../../docs/runbook/PROFILE-AVATAR-OBJECT-STORAGE.md)**（头像预签名/本机回退/多副本边界）。

**§二 × 工程扇面（机读清点 · 2026-04-22）**：以 **代码锚点** 为主，**不**替代 **270 §十一** 状态机升级或 **桶策略/CDN** 运维证据。

| §二 纳管对象 | 主要代码/契约锚点 | 相对 **270 Target**（诚实边界） |
|--------------|-------------------|--------------------------------|
| 向导资质文件 | **`POST …/guides/upload-doc`**、**`GET …/uploads/guides/:name`**（**`routes/guides.rs`**/**`chain_off/guides.rs`**） | **Implemented-Minimal**（与 **270 §11.3** 表一致）；**大文件**长期仍须对象存储引用模型强化 |
| 用户头像 | **`storage/profile_avatar_presign.rs`**、**`routes/me.rs`** **`profile-avatar/*`**、**`db/profile_avatar_presign_pending.rs`** | **分域预签 + 本机回退**；**生产全链**仍与 **§9 ISS-008**/**F-007** 同源 |
| 行程附件 | **`chain_off/itineraries.rs`** 等（**链下** bundle；**非**统一 `media_objects` 桶模型） | **未**按 **270 §六** 统一元数据/版本实体；属 **P1+** 工程面 |
| 聊天图片 | **`chain_off/messages.rs`**/**`routes/community/dm_social.rs`** 等（多为 **URL/外链** 或链下字段口径） | **未**单列 **270** 级媒体管线 |
| 争议证据 | **`routes/evidence.rs`** + **`chain_off/evidence.rs`** + **`db/evidence.rs`**（**回执/hash**、**DB SSOT** 叙事） | **Implemented-Minimal**（**哈希回执** 为主）；**blob 对象存储流** 见 **270 §8.1** **Signed URL** **Partial** |
| 审核截图 | **Admin/community reports** 等（**`db/community_reports`**/**`routes/community/feedback_reports.rs`**） | **分域**；**未**统一 **270 §六** |
| AI 输出快照 | **Evidence** **`snapshot_hash`** 等字段链（**`chain_off/evidence.rs`**） | **哈希/元数据** 为主；**对象版本/CDN** 仍 **Target** |

**里程碑落款（执行 Owner=Release/EM+FE）**：**P0** — **270 §10.1** 对象存储接入 + **§11.3** 中 **Signed URL** 从 **Partial** 升级到 **Implemented** 的必要证据（**桶隔离 + 审计样例**）；**P1** — **§10.2** 生命周期/冷热分层与 **行程/聊天** 纳管扩展；**P2** — **§10.3** 多区域与成本治理。

**命令（本轮 v1.4.106 旁证）**：

```bash
cargo test -p traveltrust-api idempotency
cargo test -p traveltrust-api key_hash_tests
bash scripts/run-check-04-routes.sh
```

（**不**表示 **270** **§十一** 已 **`Implemented`** 全闭；仅证 **§7.7** 其它已闭子项与 **04** 路由窗未被本文档编辑破坏。）

**本轮机读（2026-04-22）**：**`cargo test -p traveltrust-api idempotency`** **4 passed**；**`cargo test -p traveltrust-api key_hash_tests`** **1 passed**；**`bash scripts/run-check-04-routes.sh` exit 0**。

## 4. 幂等跨重启 + **[120](../../docs/spec/120-阶段开发观测告警日志与审计链路.md)** — **可勾 `[x]`（HTTP 写幂等条目的狭义闭合）**

- **`crates/api/src/middleware/mod.rs`**：注释 **55-S8** — 在带 **`pool`** 时，对 **`X-Idempotency-Key`** 计算 **`key_hash`**，**`get_cached_response` / `save_cached_response`** 读写 **`idempotency_keys`**。  
- **`crates/api/src/db/idempotency.rs`**：表持久化、**`key_hash` 单测**；与 **F-028**/**`idempotency_http_contract_tests`** 同链。  
- **边界**：**仅** 覆盖「需幂等键的写 API 响应快照」跨进程/重启；**不** 表示 **120** 文档全文、全链路可观测/审计/日志留存已人签闭合。

## 5. 治理 pool / rewards 接真源或 UI 降级为预览 — **`[x]`（预览/分轨落款 · v1.4.126）**

- **结论**：按 **「或」** 分支，**UI 降级 + `data_source` 分轨披露** 与 **后端多轨（DB / 条件链上 SSOT / placeholder）** 已落盘；**主证据**：**`evidence/GO_95_20260422_section7_7_governance_pool_rewards_preview/README.md`**。  
- **诚实边界**：**不**表示 **83/84** 账本终局、**S-4** 主行已闭、或 **rewards 聚合** 生产人签已闭；仍跟踪 **域 J**/**§11.1 Governance 扩展只读**/**§9** 开放项。  
- **锚点**：**`GET /api/v1/governance/pool|rewards`** — **`governance_pool.rs`**/**`router.rs`**/**`mod.rs`**；**`frontend/app/governance/page.tsx`** **`GovernanceTargetNotice`** + **`chain_read` / `database` / `placeholder`** 分支。

## 6. 命令（本轮）

```bash
cd /path/to/Wbe3-TravelTrust
cargo test -p traveltrust-api idempotency
cargo test -p traveltrust-api key_hash_tests
bash scripts/run-check-04-routes.sh
```

**v1.4.99 增补（§7.7 · ISS-009 登记后）**

```bash
cargo test -p traveltrust-api schedule_engine::tests
bash scripts/run-check-04-routes.sh
```

- **机读（本机）**：`schedule_engine::tests` **1 passed**；`run-check-04-routes.sh` **exit 0**。  
- **语义**：上列**不**闭合 **§7.7** 多实例 SSOT；仅证 **`schedule_engine`** 单测子集与契约门禁未因文档更新而破坏。

- **`idempotency`** 过滤子集：至少包含 **`idempotency_http_contract_tests`**、**`idempotency_cache_meta_top_keys_order_and_literals_753`** 等；以 CI/本地全输出为准。  
- **`key_hash_tests`**：位于 **`db/idempotency.rs`** 内嵌 **`mod`**.

## 7. 与 §7.7 勾选对应关系

| §7.7 行 | 结论 | 说明 |
|--------|------|------|
| 真托管 / mock 互斥 | `[x]` | 见 §1 |
| 多实例内存 SSOT | `[ ]` | 见 §2；**§9 ISS-009** |
| 270 全量 | `[x]` | 见 §3（**计划落款**；**≠** **270 §11.3** 全能力 **Implemented**） |
| 幂等跨重启 / 120 | `[x]` | 见 §4（狭义 HTTP 幂等 PG） |
| 治理 pool/rewards | `[x]` | 见 §5（**预览/分轨落款**；**≠** **83/84**/**S-4** 终局） |

**95 版本带**：v1.4.86（首版证据包）；**v1.4.99** 起 **§2** 互指 **§9 ISS-009**（**§7.7** 多实例内存 SSOT 仍为 **`[ ]`**）；**v1.4.106** 起 **§3** 为 **270** **计划落款 `[x]`**；**v1.4.126** 起 **§5** 为 **pool/rewards 预览/分轨落款 `[x]`**（**§7.7** **4/5 `[x]`**；**余 `ISS-009`**）。**U/C/总 %** 以 **`docs/spec/95-…md` §0.2** 现行表为准。
