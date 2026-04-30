# GO_95 · §10.3-1 — 无残留 `use` / 路由 / 前端 import（有界机读闸 · 2026-04-22 · v1.4.139）

**《95》**：`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` **§10.3** 首条  
**定位**：**有界 `[x]`** = 当前仓库在下列闸位下 **可编译、可 lint、04↔挂载** 一致；**不**等价「任意历史删模块 PR 均已做 orphan 审计」或 **rust-analyzer unused** / **eslint `unused-imports` 全仓扫**。

## 1. 命令与结果（本机）

| 闸位 | 命令 | 结果 |
|------|------|------|
| Rust 解析 + 链接 | `cargo check -p traveltrust-api` | **exit 0**（**Finished** `Checking traveltrust-api`） |
| Rust 测例编译 | `cargo test -p traveltrust-api --no-run` | **exit 0**（**Executable unittests** …） |
| 04 ↔ 路由 / `api.ts` 等 | `bash scripts/run-check-04-routes.sh` | **exit 0**（末段 **check-b457 OK**） |
| 前端 ESLint（Next） | `cd frontend && npm run lint` | **exit 0**（**Warning** 若干：`react-hooks/exhaustive-deps`、`@next/next/no-img-element` 等；**无** `Error`/阻塞级 **import 解析失败**） |

## 2. 与 **§10.3** 余三条关系

- **`TODO`/`FIXME`/HACK**：**v1.4.140** **`…section10_3_todo_fixme_hack_triage/README.md`** 有界 **`[x]`**。**`deprecated`**：**v1.4.141** **`…section10_3_deprecated_api_04_reconcile/README.md`** 有界 **`[x]`**。**Feature flag / 死开关**：**v1.4.142** **`…section10_3_feature_flag_dead_branch_bounded/README.md`** 有界 **`[x]`**（**§10.3** 四子条 **全 `[x]`**；**`dead_code`** 扇面仍见 **`…legacy_cleanup_audit/README.md` §4**）。  
- **本包不**替代删模块 PR 的 **Owner diff 审查**；若删 **`routes/mod.rs` merge` 域** 或 **`frontend/lib/api.ts` 大块**，仍须 **同 PR** 跑上表并更新证据。

## 3. 与 **§9** 关系

本轮 **未**发现须新立 **ISS-** 的 **P0** 断链；**lint Warning** 不记入 **§9**（非本行闭证范围）。
