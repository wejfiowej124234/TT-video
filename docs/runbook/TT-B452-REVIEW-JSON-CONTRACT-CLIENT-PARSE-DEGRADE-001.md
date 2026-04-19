# TT-B452-REVIEW-JSON-CONTRACT-CLIENT-PARSE-DEGRADE-001 · **`reviews`** **`meta.review_json_contract`** **客户端解析与降级**

**母表**：[B-452](../任务母表.md)

**前置**：**[TT-B451](./TT-B451-REVIEW-JSON-CONTRACT-EVOLUTION-SCHEMA-GATE-001.md)**（**B-451**）已定义 **`meta.review_json_contract`** **；** **本卡** **在** **消费侧** **（** **`frontend/lib/reviewJsonContract.ts`** **+** **`apiClient/orders.ts`** **）** **将** **`schema_version`** **演进** **映射** **为** **`reviewJsonContractClient.degrade`** **，** **并** **机读** **/** **Vitest** **防** **漂移** **。**

---

## §1 · 验收（封口条件）

### §1.1 前端单测

```bash
cd frontend && npx vitest run lib/reviewJsonContract.test.ts lib/apiClient/orders.itinerary-reviews.test.ts --run
```

### §1.2 类型与门禁

```bash
cd frontend && npx tsc --noEmit
python scripts/gates/check-b452-review-json-contract-client-gate.py
bash scripts/run-check-04-routes.sh
```

### §1.3 `schema_version` **bump** **清单** **（** **执行前** **）**

| 动作 | 须同步 |
|------|--------|
| **服务端** **`REVIEW_JSON_CONTRACT_SCHEMA_VERSION`** **+1** | **04** **/** **B-451** **段** **、** **`b451_*`** **、** **`check-b451-*`** **（** **与** **B-451** **Runbook** **一致** **）** |
| **前端** **可消费** **上限** **+1** | **`CLIENT_REVIEW_JSON_CONTRACT_SCHEMA_MAX_SUPPORTED`** **`reviewJsonContract.ts`** **、** **`parseReviewJsonContractMeta`** **分支** **、** **`lib/reviewJsonContract.test.ts`** **、** **`check-b452-*`** **锚** **、** **本** **Runbook** |

---

## §2 · 非目标

- **不** **在** **本卡** **内** **改变** **B-449/B-450** **对** **`review.weight*`** **的** **HTTP** **断言** **（** **除非** **另** **开** **TT** **）** **。**
- **不** **替代** **B-451** **服务端** **演进** **门禁** **：** **客户端** **仅** **并列** **观测** **与** **降级** **标签** **。**

---

**文档版本**：1.0 · 2026-04-17
