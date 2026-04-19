# R-001 · 全站回归报告模板与汇总 JSON 结构

**Version:** 1.0.1  
**Status:** 与 **[93-全站功能验证矩阵-域别回归清单](93-全站功能验证矩阵-域别回归清单.md)** **§0.10**、**§7.1** 配套的可机读留痕格式。  
**互指**：验证用例与五态见 **93**；发布 **GO / PARTIAL GO / NO GO** 判定见 **93 §7.1**。**执行闭环（S1～S6）与机读闸**见 **[R-002](R-002-回归执行闭环与发布准入.md)**、**`scripts/validate-regression-report.py`**。

---

## 1. 每轮必须落盘的文件

| 文件 | 说明 |
|------|------|
| **`evidence/GO_YYYYMMDD/report.json`** | **汇总索引**（机读）：用例 ID、状态、环境、执行人、证据相对路径 |
| **`evidence/GO_YYYYMMDD/<域>-<用例ID>/`** | 单条用例目录（**93 §0.5**）：`request-response.redacted.json`、`notes.md` 等 |

**规则**：**不同 `environment.name`（见下）的 `report.json` 不得合并**；跨环境对比只允许并列展示，**禁止**汇总成单一 **PASS 比例**。

---

## 2. `report.json` 顶层结构（`schema_version`: `"1"`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| **`schema_version`** | string | 是 | 固定 **`"1"`**（本文件定义） |
| **`run_id`** | string | 是 | 本轮唯一 ID，建议 `GO_YYYYMMDD` 或 `GO_YYYYMMDD_n` |
| **`title`** | string | 否 | 人读标题，如「staging 发版前回归」 |
| **`executor`** | string | 是 | 执行人或角色（邮箱/工号/「QA-值班」均可） |
| **`reviewer`** | string | 否 | 复核人（**NO GO → GO** 升级时建议必填） |
| **`started_at`** | string | 是 | ISO-8601 时间 |
| **`finished_at`** | string | 是 | ISO-8601 时间 |
| **`environment`** | object | 是 | 与 **93 §0.9** 同构 |
| **`release_gate`** | string | 是 | **`GO`** \| **`PARTIAL_GO`** \| **`NO_GO`**（与 **93 §7.1** 一致） |
| **`release_gate_reason`** | string | 是 | **一句话**说明判定依据（含核心链路是否全绿） |
| **`cases`** | array | 是 | 见 **§3** |
| **`summary`** | object | 是 | 见 **§4** |

### 2.1 `environment` 对象

| 字段 | 枚举 / 类型 | 说明 |
|------|-------------|------|
| **`name`** | `local` \| `staging` \| `prod` | 运行环境 |
| **`database`** | `enabled` \| `disabled` | 是否接 **PostgreSQL**（或契约等价「持久化可用」） |
| **`chain_mode`** | `chain_off` \| `testnet` \| `mainnet` | 链模式 |
| **`auth_mode`** | `cookie` \| `bearer` \| `mixed` | 与 **93 §0.3** 一致 |

---

## 3. `cases[]` 元素

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| **`id`** | string | 是 | 用例 ID，如 **`A-LOG-001`**、**`B-MKT-001`** |
| **`status`** | string | 是 | **`PASS`** \| **`FAIL`** \| **`BLOCKED`** \| **`N_A`** \| **`NOT_RUN`**（与 **93 §0.2** 一致；JSON 键名用 **`N_A`** 避免键名含 `/`） |
| **`evidence_path`** | string | 否 | 相对仓库根路径，如 **`evidence/GO_20260418/A-LOG-001/`**；**NOT_RUN** 可空 |
| **`blocker`** | boolean | 否 | **`true`** 表示该条 **FAIL** 属 **93 §7.1** 定义的 **critical / NO GO** 触发项 |
| **`notes`** | string | 否 | 简短说明（含 **BLOCKED** 原因） |

---

## 4. `summary` 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| **`PASS`** | number | 计数 |
| **`FAIL`** | number | 计数 |
| **`BLOCKED`** | number | 计数 |
| **`N_A`** | number | 计数 |
| **`NOT_RUN`** | number | 计数 |

**说明**：`summary` **按本轮单一 environment 统计**；若生成多环境报告，应输出 **多个** `report.json` 或多元素数组（团队任选其一，**禁止**无说明合并）。

---

## 5. 人读模板（可粘贴到 PR / 发版工单）

```markdown
## 全站回归摘要（R-001）

- **run_id**：
- **environment**：local / staging / prod；database：enabled/disabled；chain_mode：…；auth_mode：…
- **执行人**：
- **时间**：开始 ～ 结束
- **release_gate**：GO / PARTIAL_GO / NO_GO
- **判定说明**：（引用 93 §7.1，说明 A 域、B 域 P0 核心链路、blocker）

### 五态计数
PASS / FAIL / BLOCKED / N_A / NOT_RUN

### 证据
- `evidence/GO_YYYYMMDD/report.json`
- 单条目录：…
```

---

## 6. 示例 `report.json`（片段）

```json
{
  "schema_version": "1",
  "run_id": "GO_20260418_01",
  "title": "staging pre-release",
  "executor": "qa@example.com",
  "started_at": "2026-04-18T10:00:00Z",
  "finished_at": "2026-04-18T12:30:00Z",
  "environment": {
    "name": "staging",
    "database": "enabled",
    "chain_mode": "testnet",
    "auth_mode": "cookie"
  },
  "release_gate": "PARTIAL_GO",
  "release_gate_reason": "A domain 100% PASS; B P0 core chain PASS; B-ESC-001 BLOCKED (wallet) per §7.1",
  "cases": [
    {
      "id": "B-MKT-001",
      "status": "PASS",
      "evidence_path": "evidence/GO_20260418/B-MKT-001/",
      "blocker": false,
      "notes": ""
    }
  ],
  "summary": {
    "PASS": 42,
    "FAIL": 0,
    "BLOCKED": 1,
    "N_A": 3,
    "NOT_RUN": 5
  }
}
```

---

**文档维护**：变更五态或 Release Gate 规则时，同步 **93** 与本文 **schema_version**（若 breaking 则 bump）。
