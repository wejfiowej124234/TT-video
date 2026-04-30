# GO_95 · §7.6 Admin 与 internal 基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.6** 三行已 **`[x]`** 的前提下，复跑 **`/api/v1/internal/*`** 秘钥门（**`internal_gate_tests`**）、**`routes::admin::tests`** 扇面、以及 **04 路由闸**。  
**不**替代 **`evidence/GO_95_20260422_section7_6_admin_internal/README.md`** 全文；**不**替代 **[140](140-阶段开发云部署与交付架构.md)** 外网探针 / **WAF** / **NetworkPolicy** 人读闭合。

## 2. 命令与结果（仓库根）

```bash
cargo test -p traveltrust-api internal_gate_tests
# → 6 passed; 0 failed

cargo test -p traveltrust-api routes::admin::tests
# → 172 passed; 0 failed

bash scripts/run-check-04-routes.sh
# → exit 0
```

## 3. 与 §7.6 子条互证

| §7.6 子条 | 原域审包 § |
|-----------|------------|
| 非 admin 调 admin → 全拒 | **`…section7_6_admin_internal/README.md` §1** |
| admin 写审计可查 | **§2** |
| **`INTERNAL_API_SECRET`** / **`/internal/`** | **§3** + 本轮 **`internal_gate_tests`** |

## 4. 诚实边界

- **178** 路径闸与 **admin 172** 测为**机读窄扇面**；**不**等价 **F-030** **行完成** / **70** 全文深测。
- **`internal_api_secret` unset** 时 **no_gate** 行为见测试名；生产纵深仍以 **Runbook**/**[R-002](R-002-回归执行闭环与发布准入.md)** 为准。
