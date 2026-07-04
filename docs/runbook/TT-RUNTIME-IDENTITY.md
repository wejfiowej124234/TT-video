# TT-RUNTIME-IDENTITY · 平台唯一身份判断器

**Machine key：** `TT_RUNTIME_IDENTITY` · Production guard：`TT_PRODUCTION_RUNTIME_IDENTITY`  
**SSOT：** [`registry/runtime-identity-ssot.v1.json`](../../registry/runtime-identity-ssot.v1.json)

| 运行时 | 模块 |
|--------|------|
| **Node / scripts / CI** | `scripts/dev/lib/runtime-identity.cjs` |
| **Rust API** | `crates/api/src/runtime_identity.rs` |

---

## 用法（禁止 ad-hoc env 判断）

### Node

```javascript
const { RuntimeIdentity } = require('./scripts/dev/lib/runtime-identity.cjs');

const id = RuntimeIdentity.current();
if (id.isProduction()) { /* ... */ }
if (id.isStaging()) { /* ... */ }
if (id.allowsCommunityShowcaseSeed()) { /* ... */ }
```

探针证据：

```javascript
const id = RuntimeIdentity.fromProbeEvidence('evidence/.../production-runtime-identity');
```

### Rust

```rust
use crate::runtime_identity::RuntimeIdentity;

let id = RuntimeIdentity::current();
if id.is_production() { /* ... */ }
if id.allows_community_showcase_seed() { /* ... */ }
```

---

## Profile 枚举

| Profile | 典型条件 |
|---------|----------|
| **production** | `TRAVELTRUST_DEPLOYMENT_PROFILE=production` |
| **staging** | `=staging` · `staging_mirror` |
| **local** | `=local` · seed off |
| **development** | `=local` + `SEED=1` |
| **demo** | showcase/demo flags on |
| **unknown** | 无法解析 |

---

## 已接入 Guard（增量迁移）

| Guard | 接入方式 |
|-------|----------|
| **Production Runtime Identity Guard** | `evaluateProductionGuard()` |
| **Configuration Truth** | `evaluateConfigurationTruth()` |
| **Community Media Guard** | `RuntimeIdentity.current()` 日志 + 生产约束 |
| **Community showcase seed** | `RuntimeIdentity::allows_community_showcase_seed()` |
| **Market public walkthrough** | `RuntimeIdentity::allows_seed_*_public_market()` |
| **Release Train G1/G2/G3 Verification** | Identity + Configuration Truth |

**迁移纪律：** 新脚本 **必须** 使用 `RuntimeIdentity.current()`；旧 `if (process.env.TRAVELTRUST_DEPLOYMENT_PROFILE === 'production')` 逐步替换。

---

## 与 Configuration Truth 的关系

- **RuntimeIdentity** — 「当前进程/实例是什么环境」
- **Configuration Truth** — 「六层配置声明是否一致且已到达 Runtime」

两者均在 G2/G3 Verification 强制 PASS。
