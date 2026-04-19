## TTG 经济对齐（人工对照）

**目录**：`run_20260417T073353Z/`（本文件与 `chain_reads.json` 同目录；相对仓库根 `evidence/ttg_econ_align/`）

### total_supply（链上）

- **脚本落盘（十进制 wei 字符串）**：`10000000000000000000000000`（见 `chain_reads.json` → `total_supply`）

### 桶表总量（02 / 82）

- （填写本轮锁定的文档版本与桶表总量口径）

### Treasury 持仓

- **链上**：`0`（`chain_reads.json` → `treasury_balance`）
- **台账「金库桶」应到位数额**：（填写）

### top_holders

- **说明**：`top_holders` 为 **金库** + **可选 `TTG_ECON_BALANCE_ADDRESSES`** 所列地址的 `balanceOf`；**不是** 全链 Top N 扫描。

### 结论

勾选其一并简述依据：

- [ ] **PASS**
- [ ] **SUSPECT**
- [ ] **FAIL**

### 说明（未披露 mint / 异常 holder / 占位桶）

- （填写）

---

**判据提示（与 Runbook §2.3 / §3.8 一致）**

- **PASS**：`totalSupply` 与设计一致；金库 / 已披露分配地址持仓符合预期。
- **SUSPECT**：分配与文档有偏差但可解释（测试 mint、中间态、明确占位未上链且已声明）。
- **FAIL**：未知 mint；关键地址持仓异常；与 02 / 82 明显冲突。
