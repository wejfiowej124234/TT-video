# 线 A 验收结论



**验证时间**：2026-04-17（本机：`API_BASE=http://127.0.0.1:3012`，链：**Sepolia `11155111`**，根 `.env` + `PORT=3012` + `SEED_TEST_ACCOUNTS=1` + Postgres；Timelock 裁断见 **`evidence/timelock_truth_arbitration/decision_record.v3.json`**）  

**证据**：[`capture.log`](capture.log)（同目录）、API 日志 [`api_smoke.log`](api_smoke.log)



---



**PASS（线 A）**（与 [Runbook §7.1 · 线 A](../../../ops/RUNBOOK.md#line-a-feerouter-pass) 六条对齐）：



1. **`chain_id` 全链路一致** — ✅ 已验证：`GET /meta` → `chain.chain_id` = `11155111`（见 `capture.log` Step 1）  

2. **`/meta` 七键**与部署台账一致 — ✅ 已验证：`chain.contracts` 含七项协议地址 + 与 ChainConfig 同源规则句（Step 1）  

3. **Track B** 入口机读存在且与披露一致 — ✅ 已验证：`governance.treasury_track_b_entrances` schema + `entries`（Step 2）  

4. **FeeRouter** 四向地址链上可读 — ✅ 已验证：`cast call` countryBucket / globalStakers / globalReserve / globalOps（Step 3；须 `FEE_ROUTER_ADDRESS` + `CHAIN_RPC_URL` + `cast`）  

5. **分轨 A/B** 在 **`event_log`** 与 **API** 中一致表达 — ✅ **API 侧已取样**：Track B + `governance/pool` + `fee-pool-aggregates` 同包内一致；**`event_log.track_type` 全库/索引对账**为运维向持续项（非本脚本单次输出），见 Runbook 与 internal indexer-reconcile  

6. **projection** 数据未被误用为链上 **SSOT** — ✅ 已验证：`fee-pool-aggregates` → `data_source: "projection"`；`governance/pool` → `data_source: "database"`（非冒充链上主读；Step 4～5）  



---



**本包状态**：✅ **已验证（线 A 最小闭环）** — 以 **`capture.log`** 为运行时真值；口头 PASS 无效，以本文件 + 日志为准。

**与历史 FAIL /「待验证」**：在 **B-434 v3** 裁断与本轮 **`API_BASE`/环境对齐** 之前标注的线 A 相关 FAIL 或「仍待验证」，**已由本证据包 superseded**（旧结论不再代表当前测试网版本）；若需对外说明，优先引用本节 + **`README.md`** 对外口径段。



**FAIL 条件**（任一则整体 FAIL）：任一步 `curl`/`cast` 失败、401 无 Bearer、`contracts` 空、四向 `cast` 全失败、或 `fee-pool-aggregates` 根级冒充 `pool` 主读（当前实现与 B110-SSOT-07 一致，未见冒充）。


