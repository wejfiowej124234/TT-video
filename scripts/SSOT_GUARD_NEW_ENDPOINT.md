# 新 HTTP 端点接入 SSOT Guard 的标准流程（TT + allowlist）

适用于：在**新的或现有的** `GET/POST …` 响应**根级**（或与现有 B-097 / B-110 **同形键族**）引入 **链上只读 SSOT**（`*_data_source` / `*_is_chain_ssot` 或等价）。

## 1. 任务与文档（必须）

1. **开立 TT**（执行卡）：描述端点、键名、出现/不出现条件、与 **04 §3.4**（或指定节）对齐的验收句。  
2. **更新契约**：在 **`docs/spec/04-后端与API.md`**（默认仅 §3.4 / 相关表行）登记路由与字段；必要时 **14** 互指。  
3. **勿**在未登记 TT 的情况下把键硬塞进现有 **B-097** / **B-110** 静态 guard 的**隐含范围**。

## 2. 代码侧 allowlist（静态 guard）

1. **二选一**（或并存）：  
   - **A.** 新建 **`scripts/ssot-guard-<domain>-<surface>.py`**，白名单 **允许 `m.insert` 的文件路径** + **merge 函数切片**规则（照抄 **Escrow** / **B-110** 模式）。  
   - **B.** 在既有 guard 中增加**显式 allowlist**（路径元组 + 键正则），并在 PR 描述中引用 TT。  
2. 将新脚本接入 **`scripts/ssot-guard-ci-v2.py`** 的 `stages` 列表（在 **`response_contract_snapshots` 之前或后**按依赖排序），或把规则并入已有阶段（需同 TT 说明）。  
3. 运行 **`bash scripts/check-invariants.sh`**（或 **`python3 scripts/ssot-guard-ci-v2.py`**）本地通过后再推 PR。

## 3. 响应契约快照（CI Gate v2）

1. 在 **`scripts/ssot-guard-fixtures/v2/`** 增加 **`*.snapshot.json`**（**脱敏**、无密钥）。  
2. 扩展 **`scripts/ssot-guard-response-contract.py`** 中的校验函数（**一条 fixture 对应一组不变量**）。  
3. 若契约**有意变更**，须 **TT + 04 同批**，并**更新快照**；禁止只改快照不改 spec。

## 4. CI 入口

- **统一编排**：**`scripts/check-invariants.sh`** → **`scripts/ssot-guard-ci-v2.py`**（含静态 + 快照契约）。  
- **Build workflow**：**`.github/workflows/build.yml`** **Check invariants** 步已覆盖。

## 5. 失败时读什么

- **`target/ssot-guard-ci-v2-report.json`**  
- **`scripts/templates/SSOT_GUARD_FAILURE_REPORT.md`**  
- **`evidence/GO_20260407_SSOT_GUARDS.md`**（两条已落地 guard 总览）
