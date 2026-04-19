# TT-B454-REVIEW-JSON-CONTRACT-DEGRADE-EVIDENCE-REPLAY-001 · **`review_json_contract_degrade`** **证据化回放与发布后核查**

**母表**：[B-454](../任务母表.md)

**前置**：**[TT-B452](./TT-B452-REVIEW-JSON-CONTRACT-CLIENT-PARSE-DEGRADE-001.md)**（**B-452**）客户端 **`degrade`** **；** **[04 §3.4 · B-453](../spec/04-后端与API.md)** **`trackReviewJsonContractDegrade`** **/** **`review_json_contract_degrade`** **实时** **观测** **。**

**本卡** **将** **降级** **事件** **从** **实时** **观测** **收口** **为** **可** **归档** **、** **可** **回放** **、** **可** **写入** **发布** **评审** **的** **证据** **链** **（** **NDJSON** **/** **`replay_summary.json`** **）** **，** **支撑** **灰度** **/** **回滚** **裁决** **。**

---

## §1 · 验收（封口条件）

### §1.1 回放脚本（机读）

```bash
python scripts/gates/replay-b454-review-json-contract-degrade-evidence.py \
  evidence/b454_review_json_contract_degrade/fixtures/sample_events.ndjson
```

### §1.2 文档 / 门禁 / 证据目录

```bash
python scripts/gates/check-b454-review-json-contract-degrade-evidence-gate.py
bash scripts/run-check-04-routes.sh
```

### §1.3 证据字段（与实现对齐）

导出行**须**包含 **`frontend/lib/analytics.ts`** **`ReviewJsonContractDegradeObservabilityPayload`** **五** **键** **：** **`degrade`** **、** **`api_path`** **、** **`schema_version_reported`** **、** **`schema_version_effective`** **、** **`client_max_supported`** **。** **可选** **审计** **元** **数据** **（** **回放** **忽略** **）** **：** **`captured_at`** **、** **`environment`** **、** **`release_id`** **、** **`git_sha`** **、** **`client_build`** **。** **若** **日志** **为** **嵌套** **结构** **，** **须** **为** **`{"event":"review_json_contract_degrade","payload":{...}}`** **（** **回放** **脚本** **支持** **unwrap** **）** **。**

---

## §2 · 发布后核查 Runbook（人读）

### §2.1 导出（T+0，发布窗口后 4h 内）

| 步骤 | 动作 |
|------|------|
| 1 | 在观测系统按 **事件名** **`review_json_contract_degrade`** **（** **或与** **埋点** **管线** **一致** **的** **别名** **）** **筛选** **目标** **环境** **/** **前端** **构建** **/** **API** **版本** **。 |
| 2 | 导出 **NDJSON** **（** **推荐** **）** **或** **JSON** **数组** **；** **脱敏** **：** **不得** **包含** **token** **、** **Cookie** **、** **PII** **；** **仅** **保留** **payload** **五** **键** **+** **§1.3** **可选** **审计** **字段** **。 |
| 3 | 落盘至 **`evidence/b454_review_json_contract_degrade/run_<UTC>/events.ndjson`** **（** **`<UTC>`** **为** **导出** **时刻** **）** **。 |

### §2.2 回放与归档（T+0）

```bash
python scripts/gates/replay-b454-review-json-contract-degrade-evidence.py \
  evidence/b454_review_json_contract_degrade/run_<UTC>/events.ndjson \
  --write-summary evidence/b454_review_json_contract_degrade/run_<UTC>/replay_summary.json
```

将 **`replay_summary.json`** **与** **导出** **说明** **（** **环境** **、** **时间** **窗** **、** **发布** **单号** **）** **一并** **附** **在** **发布** **记录** **/** **变更** **单** **上** **。**

### §2.3 发布后复核（T+24h）

| 检查项 | 绿灯（可继续放量） | 黄灯（收紧灰度 / 排障） | 红灯（优先回滚或冻结发布） |
|--------|-------------------|------------------------|---------------------------|
| **`unknown_future_schema` / 总** **`review_json_contract_degrade`** **占比** **（** **同** **窗** **口** **）** | **≈0** **或** **仅** **预期** **内** **（** **已** **公告** **的** **`schema_version`** **升级** **演练** **）** | **&gt;0** **且** **持续** **上升** **，** **未** **匹配** **公告** **窗口** | **占比** **陡增** **或** **`malformed_meta`** **与** **服务端** **声明** **的** **`meta.review_json_contract`** **明显** **不一致** **（** **须** **对** **照** **B-451** **/** **API** **响应** **）** **。**
| **`malformed_meta`** | **0** **（** **或** **已** **归因** **的** **单点** **脏** **数据** **）** | **零星** **、** **可** **复现** **路径** **未** **明** | **批量** **出现** **（** **疑似** **网关** **截断** **/** **错误** **序列化** **）** **。**
| **`missing_meta`** **（** **成功** **HTTP** **体** **）** | **0** **（** **B-451** **已** **保证** **成功** **体** **含** **合约** **元** **数据** **）** | **非零** **须** **对** **照** **是否** **中间件** **剥** **`meta`** **/** **缓存** **分片** | **与** **服务端** **抽样** **GET/POST** **`/reviews`** **不一致** **。**

**说明**：阈值**为** **人读** **默认** **；** **生产** **须** **结合** **业务** **流量** **与** **SLO** **在** **运维** **台账** **固化** **。**

---

## §3 · 非目标

- **不** **替代** **B-451** **/** **B-452** **/** **B-453** **的** **实现** **门禁** **（** **本** **卡** **仅** **证据** **链** **与** **发布后** **核查** **）** **。**
- **不** **在** **本** **卡** **内** **规定** **具体** **厂商** **日志** **查询** **语法** **（** **仅** **规定** **导出** **形状** **与** **回放** **命令** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
