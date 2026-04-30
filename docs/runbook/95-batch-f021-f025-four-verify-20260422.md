# 95 · §3 批次 F-021～F-025 · 四验 + §8.2 对齐（2026-04-22）

> 与 **`../spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**/**§8.2**/**§9** 对读；**不**宣称 **93 PASS** / **E2E 归档** / **§8.2「行完成」** / **§3.1 `[x]`**（**ISS-007**）。

## 1. 环境

- **`DATABASE_URL`**：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（**`disputes`** **b118** 等 **PG** 成功路径子测须池；与 **`docker compose` · postgres** 一致）

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径 **`api.ts`↔04**）。

## 3. 机读命令与结果

| 过滤串 | passed | failed |
|--------|--------|--------|
| `cargo test -p traveltrust-api market_subsite::tests` | 10 | 0 |
| `cargo test -p traveltrust-api routes::guides::tests` | 7 | 0 |
| `cargo test -p traveltrust-api p21_guides_create_list_get_stake` | 1 | 0 |
| `cargo test -p traveltrust-api routes::disputes::tests` | 5 | 0 |

**说明**：**`guide_stake_without_chain_off_is_503_chain_off_unavailable`** 已包含在 **`routes::guides::tests` 7** 内（与 **v1.4.130** 脚注分条计数一致；**本批**未再单独 **`cargo test` 名单测名**）。

## 4. 分 F 四验（§3）

| F | 代码 | 路由 | 状态 | mock·PG |
|---|------|------|------|---------|
| **F-021** | **`routes/market_subsite.rs`** **`tests`** | **`…/market/provider/*`** | **503** **`chain_off_unavailable`** 等 | **10** 测 |
| **F-022** | 同上 | **`…/market/acquisition/*`** | 同上 | 同上套件 |
| **F-023** | **`routes/guides.rs`**；**`chain_off/tests_guides_me_orders`** | **`/api/v1/guides`** | **503/401** + **内存 p21** 向导链 | **`guides::tests` 7** + **`p21_guides_create_list_get_stake` 1** |
| **F-024** | **`guides.rs`** **`guide_stake_*`**；**`chain_off`** **stake impl** | **`/staking`** + API | **503**（无 **chain_off**）+ 生产闸 | 含于 **`guides::tests`** + **p21** |
| **F-025** | **`routes/disputes.rs`** **`tests`** | **`/api/v1/disputes*`** | **503** + **b099**/**b118** **PG** 信封 | **5** 测 |

## 5. §8.2 / §9

- **§8.2**：**UT**/**负例** 母表已为 **`[x]`**；**API·IT**/**93**/**E2E**/**行完成** 仍 **`[ ]`**（**无** **`auth_register_*` 风格** **`Router+PG`** 专母 / **ISS-007**）。
- **§9**：**不**新增 **ISS**。
