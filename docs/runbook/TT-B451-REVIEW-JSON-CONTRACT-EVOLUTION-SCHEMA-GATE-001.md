# TT-B451-REVIEW-JSON-CONTRACT-EVOLUTION-SCHEMA-GATE-001 · `reviews` **`meta.review_json_contract`** **跨版本演进**

**母表**：[B-451](../任务母表.md)

**前置**：**[TT-B450](./TT-B450-REVIEW-POST-JSON-SSOT-DOC-OPENAPI-ALIGN-001.md)**（**B-450**）已把 **`weight*`** **语义** **写回** **04/14/示例** **；** **本卡** **在** **不** **改变** **B-449** **`review`** **键** **合约** **前提** **下** **，** **为** **HTTP** **JSON** **增加** **代际** **元数据** **`meta.review_json_contract`** **（** **`schema_version`** **+** **`anchor`** **）** **，** **并** **机读** **/** **门禁** **防** **漂移** **。**

---

## §1 · 验收（封口条件）

### §1.1 机读

```bash
cargo test -p traveltrust-api b451_ -- --nocapture
```

- **须** **`DATABASE_URL`** **的** **用例** **在** **无** **库** **时** **跳过** **（** **见** **测试** **stderr** **）** **。**

### §1.2 文档 / 门禁 / 前端类型

```bash
python scripts/gates/check-b451-review-json-contract-evolution-gate.py
bash scripts/run-check-04-routes.sh
cd frontend && npx tsc --noEmit
```

### §1.3 破坏性变更清单（执行前）

| 动作 | 须同步 |
|------|--------|
| **`schema_version`** **+1** | **`REVIEW_JSON_CONTRACT_SCHEMA_VERSION`** **`reviews.rs`** **、** **04** **Reviews** **示例** **、** **`b451_*`** **断言** **、** **`check-b451-*`** **锚** |
| **字段** **重命名** **/** **删** **必填** **键** | **同上** **+** **新** **`anchor`** **或** **锚** **后缀** **代际** **（** **与** **产品** **共** **定** **）** **+** **兼容** **窗口** **说明** **（** **04** **演进** **段** **）** |

---

## §2 · 非目标

- **不** **自动** **提供** **OpenAPI** **bundle** **（** **仍** **以** **04+门禁** **为** **SSOT** **）** **。**
- **不** **在** **本卡** **内** **改动** **`b449_*`** **对** **`review`** **的** **断言** **（** **除非** **另** **开** **迁移** **TT** **明确** **打破** **兼容** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
