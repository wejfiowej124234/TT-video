# TravelTrust · Platform Capability Registry

**Machine SSOT：** [`registry/platform-capability-registry.v1.json`](../registry/platform-capability-registry.v1.json)  
**Coverage Audit：** `bash scripts/dev/run-platform-coverage-audit.sh`  
**Machine key：** `TT_PLATFORM_CAPABILITY_REGISTRY` · `TT_PLATFORM_COVERAGE_AUDIT`

---

## 用途

不是检查「功能是否完成」，而是检查 **Platform Capability 在全仓的覆盖率** — 避免靠人工猜还有哪些模块未迁移 `RuntimeIdentity` / `Configuration Truth` 等。

---

## 总表（Capability Registry）

| Capability | Owner | Runtime | Verification | Coverage | Status |
|------------|-------|---------|--------------|----------|--------|
| RuntimeIdentity | Sebastian Ward | ✅ | ✅ | 见 Audit | ACTIVE |
| ConfigurationTruth | Sebastian Ward | ✅ | ✅ | 见 Audit | ACTIVE |
| DDG | Sebastian Ward | ✅ | ✅ | 100% target | CLOSED |
| PCP Governance | Sebastian Ward | ✅ | ✅ | 100% target | FROZEN |
| Public Builder | Sebastian Ward | ✅ | ✅ | 100% target | FROZEN |
| OCS | Sebastian Ward | ✅ | ✅ | 100% target | CLOSED |
| Community Media Guard | Sebastian Ward | ✅ | ✅ | 100% target | ENFORCED |

> **Coverage %** 由 [`audit-platform-coverage.cjs`](../scripts/dev/audit-platform-coverage.cjs) 按 Registry 中 **modules** 自动计算；运行后见 evidence 或控制台表。

---

## 命令

```bash
# 生成覆盖率报告 + evidence
bash scripts/dev/run-platform-coverage-audit.sh

# 严格模式（任一 Capability 低于 target → exit 1）
node scripts/dev/audit-platform-coverage.cjs --require-pass
```

**证据路径：** `evidence/GO_platform_capability/coverage-audit/<stamp>/`

- `platform-coverage-audit.json` — 机读
- `platform-coverage-audit.md` — 人类表

---

## 输出示例

| Platform Capability | Coverage | Unmigrated Modules |
|---------------------|----------|-------------------|
| RuntimeIdentity | ~82% | Community Admin, Stripe, Monitoring, … |
| ConfigurationTruth | ~76% | Fly Deploy, GitHub Actions, CFG drift, … |
| DDG | 100% | — |
| Community Media Guard | 100% | — |

（具体数字以最近一次 Audit 为准。）

---

## 维护纪律

1. **新增 Platform Capability** → 在 `platform-capability-registry.v1.json` 增加一行 + modules + audit_rules  
2. **迁移模块** → 从 `unmigrated_modules` 消失即 Coverage 上升  
3. **Production Readiness Verification 前** → 建议跑 `--require-pass` 或至少记录 ATTENTION 项  
4. YAML 摘要 [`platform-capability-registry.v1.yaml`](../registry/platform-capability-registry.v1.yaml) 与 JSON **同批** 更新（人类读）

---

## 与 Priority Ladder 关系

| Tier | 本 Registry |
|------|-------------|
| **P1-B** Platform Coverage | 本 Audit |
| **P2** Platform Adoption | `TT_PLATFORM_ADOPTION` 总指标 |

Release 前：**先看 Coverage Audit，不要 grep。**

- **Verification 六真源** — 验证某次探针 PASS/FAIL  
- **Platform Coverage Audit** — 验证能力是否 **全仓接齐**（Architecture / Migration 覆盖率）

两者互补，不互相替代。
