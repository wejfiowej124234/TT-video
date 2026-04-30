# GO_95_20260422_iss007_ci_billing_probe

**Purpose:** Follow-up on **ISS-007** (95 §9) — CI `e2e` job **success** + `github.run_id` as gate evidence.

## 1. `gh` probe (2026-04-22)

Command:

```bash
gh run list --workflow=build.yml --branch=main --limit=3
```

Recent `main` **Build** runs show **`completed` / `failure`** in **~5–6s** — too fast for `cargo build` + Playwright.

## 2. Run detail (`gh run view <id>`)

Example run: **`24629376907`** (`TT-Expedition/TT-Expedition`).

**Annotations (verbatim theme):**

> The job was not started because recent account payments have failed or your spending limit needs to be increased. Please check the 'Billing & plans' section in your settings

All matrix jobs (**`build`**, **`e2e`**, **`frontend`**, etc.) show the same **billing** gate — **no runner execution**, hence **no** `cargo build` / Playwright logs.

## 3. Implication for ISS-007

- **ISS-007** cannot be satisfied by **new `run_id`s** on this org until **GitHub Actions billing** is restored (or workflows run on a billed runner elsewhere).
- Prior narrative attributing failure solely to **「Build traveltrust-api」** may reflect **older runs** where jobs actually started; **current** failures on sampled `main` runs are **billing / not-started**, not compile errors.
- **Alternative gate** per 95 / ISS-007: **staging** **`report.json`** (R-001) with **`environment.name: "staging"`** — local **`PARTIAL_GO`** remains **non-closing** (already recorded under `evidence/GO_20260422_r001_local_partial/`).

## 4. Local compile sanity (Windows)

`cargo build -p traveltrust-api` can hit **Windows file lock** on `traveltrust-api.exe` (os error 5) if the binary is running; **`cargo check -p traveltrust-api`** succeeded in the same workspace session — **not** used as ISS-007 closure.

## 5. `e2e` job **success** on `main` (API + Playwright actually ran)

Using `gh api repos/<org>/<repo>/actions/runs/<id>/jobs` and `select(.name=="e2e")`:

| `github.run_id` | Workflow `conclusion` | **`e2e` job `conclusion`** | Notes |
|------------------|-------------------------|----------------------------|--------|
| **24618071375** | success (overall) | **failure** | **`error[E0583]`**: `file not found for module traveltrust_page`** on **`cargo build -p traveltrust-api`** (sha **`1413b09`**). Playwright **skipped**. |
| **24617983085** | success | **success** | Parent commit **`0844658`** — last sampled run where **`e2e` green** before **`1413b09`**. |
| **24617705812** | success | **failure** | (not expanded here) |
| **24441469630** | success | **failure** | |
| **24434037928** | success | **success** | |
| **24432975510** | success | **success** | |
| **24432834126** | success | **success** | |

**Repro commands (audit):**

```bash
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
for id in 24618071375 24617983085 24617705812 24441469630 24434037928 24432975510 24432834126; do
  gh api "repos/$REPO/actions/runs/$id/jobs" --jq ".jobs[] | select(.name==\"e2e\") | \"run ${id}: e2e \(.conclusion)\""
done
gh run view 24618071375 --job 71983704746 --log-failed | grep "error\[E"
```

## 6. Root cause for **24618071375** / **`1413b09`** (resolved in tree)

CI log: **`error[E0583]: file not found for module traveltrust_page`**.

Current workspace contains **`crates/api/src/routes/traveltrust_page.rs`** and **`routes/mod.rs`** wires **`mod traveltrust_page`** — i.e. the **B-191** merge gap that broke Linux CI is **present in this checkout** and should **`cargo build`** on Ubuntu once Actions billing allows runs again.

## 7. Net for Owner

1. **Billing**: until fixed, **no fresh `run_id`** will produce **any** job logs — ISS-007 **CI arm** blocked.
2. **After billing**: expect **`e2e`** to go green on **`main`** if **`traveltrust_page.rs`** remains tracked; use **new** `github.run_id` for **95 / ISS-007** (or confirm policy allows citing **24617983085** as last **full `e2e` success** — typically you want **HEAD** green, not stale sha).

## 8. Linux **`cargo build`** 旁证（2026-04-22 · Agent 环境）

**目标**：在本地尽量贴近 **Ubuntu CI** 的 **`cargo build -p traveltrust-api`**（排除 **Windows exe 占用** 噪声）。

| 尝试 | 结果 |
|------|------|
| **`docker run` `rust:1-bookworm`** + bind-mount 仓库 + **`cargo build -p traveltrust-api`** | **未达成**：`MSYS_NO_PATHCONV=1` 后 **镜像拉取** `Head …/rust/manifests/1-bookworm` → **EOF**（环境/registry 瞬断）。 |
| **`cargo check -p traveltrust-api --target x86_64-unknown-linux-gnu`** | **未安装**该 target（`can't find crate for core`）；未在本机执行 **`rustup target add`**（避免无确认的网络变更）。 |
| **`bash scripts/run-check-04-routes.sh`** | **`exit 0`**（路由/契约机读闸当前绿）。 |
| **`cargo check -p traveltrust-api`**（默认 Windows target） | 本会话此前 **`Finished`**（与 **E0583** 无模块文件 **正交** — 缺文件类错误在 **case-sensitive** 树上也应在 **`check`** 阶段暴露）。 |

**源码侧（防 E0583 回归）**：`crates/api/src/routes/mod.rs` 含 **`mod traveltrust_page`** 与 **`.merge(traveltrust_page::router())`**；同目录存在 **`traveltrust_page.rs`**（**B-191** 路由文件）。

**结论**：在 **无法拉 Linux 容器** 的前提下，以 **路由闸 + `cargo check`（Windows）+ 源文件存在** 作为 **「计费恢复后 CI 编译大概率恢复」** 的弱旁证；**ISS-007** 仍以 **真实 `e2e` job `success` + `run_id`** 或 **staging `report.json`** 为准。
