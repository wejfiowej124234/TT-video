# GO_95 · §9 ISS-007 — GitHub Actions billing 旁证（job 未启动）

**目的**：把 **`gh run view`** 机读到的 **Annotations** 落盘，避免将 **「workflow conclusion=failure」** 误读为 **「测试断言失败」**。

**台账**：**95** **v1.4.143** — **§9·ISS-007** 现象列已并入本旁证摘要；**§6** 变更日志 **1.4.143** 行互链本目录。

---

## §1 复现命令（只读）

```bash
gh run view 24629376907
```

（可选）失败日志占位（**billing 场景下 job 未跑，常无 log**）：

```bash
gh run view 24629376907 --log-failed || true
```

---

## §2 `gh run view` 摘录（Annotations · 代表句）

**Run**：`24629376907` · **workflow**：`Build` · **repo**：`TT-Expedition/TT-Expedition`（以执行环境 **`gh`** 默认远端为准）。

**各 job 共性 Annotation（机读）**：

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

**判读**：

- **runner 未分配** → **非** `cargo test` / Playwright **步骤红**。
- **ISS-007** 闭证条件（**95**）：仍须 **`e2e` job `success` + `github.run_id`** 或 **staging `report.json` / R-001**；**本旁证不闭 ISS-007**。

---

## §3 本机契约旁证（与 CI 解耦）

登记日（**Cursor** 会话）复跑：

```bash
bash scripts/run-check-04-routes.sh
python scripts/check-spec93-routes-vs-app.py
```

**结果**：

- **`run-check-04-routes.sh`**：**exit 0**
- **`check-spec93-routes-vs-app.py`**：**OK**（**app routes=119**，**spec §5 mentions=83**）

**本地 Playwright**：**`frontend`** 下 **`npm run e2e`** 经 **`scripts/run-e2e-default.mjs`** — **非 CI** 时默认 **`PLAYWRIGHT_FULL_STACK=1`**（与 **`e2e:sepolia` / `e2e:auth-chain`** 同源：同步根 **`.env`→`.env.local`**、必要时 **`cargo build -p traveltrust-api`**），避免仅起 Next 时 **`ECONNREFUSED :8080`**。仅前端烟测：**`PLAYWRIGHT_FULL_STACK=0 npm run e2e`**。

---

## §4 相关证据

- **`evidence/GO_95_20260422_section9_iss007_build_yml_e2e_reread/README.md`** — **`build.yml` / `e2e` 编排机读**（与 **v1.4.134**/**v1.4.136** 叙事同族）。
