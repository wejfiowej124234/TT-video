# GO_95 · §12.1 · S-1 读通批次登记（非主行闭证）

**日期**：2026-04-22  
**范围（95 §12.1）**：**00**、**01**、**04**、**07**、**08-5**、**14**、**95**（索引/契约/版本/ABI 与代码入口一致 — **S-1 主批次目标**）。

## 1. 本轮读通与对拍（有界）

| 文档 | 本轮触及（锚点/节） | 与代码/门禁对读 |
|------|---------------------|-----------------|
| **00** | 读前摘要表、**B-181** 行、`api_router()` **21×merge** 叙述 | 与 **`crates/api/src/routes/mod.rs`** 文件头注释一致 |
| **01** | `# TravelTrust 总库总览`、**§〇** 一读即懂 | 仓库骨架 **§8** 与 **04/07** 入口链一致（未做全篇逐条审计） |
| **04** | **`## 三、API 路由规划`**、**`### 3.4 API 总览`** | **`bash scripts/run-check-04-routes.sh` exit 0**（**check-04-routes-vs-code** / **check-04-api-ts-routes-vs-doc-34.py 178**） |
| **07** | **`### 0.6 API · ABI · 路由域`** — **21** 次 **merge** 域列表 | 与 **`routes/mod.rs`** **`api_router()`** **逐条 merge 顺序** 同源；**`bash scripts/check-07-version-triple.sh` OK**（**07 Version: 1.0.858**） |
| **08-5** | **`## 1. 已入仓的产物`**、**clean-clone** 互指 | 未在本包重复跑 **check-08-consistency.sh**；本轮以 **04 门禁**为主证 |
| **14** | **`### 2.1 权威源：04 §三 与 crates/api 实际路由`** 篇首 | **HTTP 表 SSOT** 仍归 **04 §3.4** |
| **95** | 文首 Version、**§12.3** 域表、**§12.1.1** 子证规则 | 本登记 **不**将本轮升格为 **S-1 主行 [x]** |

## 2. 代码真值锚（api_router）

**文件**：`crates/api/src/routes/mod.rs`  
**事实**：**21** 次 **.merge(...)**，序为 health_meta → auth → admin → me → market_subsite → guides → orders → traveltrust_page → itineraries → discover → messages → disputes → evidence → media → intents → community → country_ledger_jurisdiction → did_rank → governance → trust_growth → internal（与 **07 §零 0.6**、**14 §2.1**、**95 §12.3** 表体一致）。

## 3. 命令结果（机读 · 非 S-1 闭证）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
```

**结果（本轮）**：**OK: 07 version triple aligned (1.0.858).**；**run-check-04-routes.sh 全程 exit 0**（含 B-432～457 等登记闸）。

## 4. 诚实边界（满分闸）

- **不得**将本 README 或上列门禁绿单独当作 **95 §12.1 · S-1** 主表完成的替代证据。
- **未**对 **01/04/08-5/14** 做全文无遗漏人读。
- **§7.7** 多实例 SSOT（**ISS-009**）与 **§8.2** **93/E2E** 仍为发布主链阻塞面，与 S-1 批次正交。
