# R-003 · 仅 A 域（本地干净口径）

**范围**：与 **[R-003 §1](../../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)** 表一致的计划内 A 域最低集合：**A-ENV-001**，**A-LOG-001～003**，**A-ME-001**，**A-NEG-001～002**。

**环境声明**：

- **`environment.name`**: `local`（非 staging 首轮交付；与 R-003 文档 D1「首选 staging」区分）。
- **执行 API**：为在**不占用**已锁定的默认 `target/debug/traveltrust-api.exe` 的前提下复现登出语义，本轮使用**独立构建目录**编译的二进制，监听 **`http://127.0.0.1:8082`**（见 `report.json` 与单条 `notes.md`）。数据库与 `.env` 中 **`DATABASE_URL`** 与本地 Docker Postgres 一致。
- **登出修复**：`POST /auth/logout` 现已删除内存与 `sessions` 表中的会话（见 `crates/api` 变更）；若仍使用旧进程，请先**停止 API → 重新 `cargo build` → 再起**。

**门禁**：**A 域计划内条目 100% PASS 前不进入 B 域**；本包**未包含任何 B-*** 用例。

**复跑**：

```bash
# 1) 启动与本包同口径 API（示例：8082 + DATABASE_URL + SEED_TEST_ACCOUNTS=1）
# 2) 生成/补全单条 JSON：
python scripts/dev/collect-r003-domain-a-evidence.py --api-base http://127.0.0.1:8082 --out evidence/r003_local_domain_a/run_20260418T024003Z
# 3) A-ENV-001 / A-LOG-001 为手工 curl 或保留本 run 目录下已有文件
python scripts/validate-regression-report.py evidence/r003_local_domain_a/run_20260418T024003Z/report.json --fail-on-no-go
```
