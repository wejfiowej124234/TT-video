# Mainnet Validation v1

**性质：** Phase ③ 各 Wave 主网广播后的**真实主网验证** + Shadow Launch + Production GO。  
**SSOT：** [`registry/web3-three-phase-closure-discipline.v1.yaml`](../../registry/web3-three-phase-closure-discipline.v1.yaml) → `mainnet_validation`

---

## 在整体流程中的位置

```text
Phase ③ Mainnet（Wave 1 → Wave 2 → Wave 3 分批广播）
        ↓
Mainnet Validation              ← 本阶段
  · 每 Wave 链上验证
  · Shadow Launch
  · Production GO
```

Sepolia PASS **不等于** Mainnet Production GO。主网每一 Wave 都须独立验证。

---

## 每 Wave 验证项

| 检查 | 说明 |
|------|------|
| REGISTRY-ADDRESSES | `protocol-convergence-deployments` mainnet block 已填入 |
| ON-CHAIN-SMOKE | chain_id=1 合约 smoke / 关键路径 tx |
| API-META-PARITY | `/meta` 与 Registry 一致 |
| INDEXER-SYNC | Indexer 消费主网事件 |

```bash
node scripts/dev/run-mainnet-wave-validation.cjs --wave=1
node scripts/dev/run-mainnet-wave-validation.cjs --wave=2
node scripts/dev/run-mainnet-wave-validation.cjs --wave=3
```

Evidence: `evidence/GO_production_readiness/mainnet-validation/`

---

## Shadow Launch

- Wave 1 核心合约（EscrowFactoryV2 · FeeRouter）广播后启动
- 监控 P0 回归 · 资金流异常 · Indexer 延迟
- 未 PASS → **禁止** Wave 2/3 · 执行 Rollback Runbook

Ref: `evidence/mainnet_shadow_launch/` · G6 no-rollback confirmation

---

## Production GO 前置（全部 PASS）

1. Phase ①② + Exit Review + Deployment Package
2. Phase ③ 三 Wave 广播 + 各 Wave validation PASS
3. Shadow Launch PASS
4. G6 无回滚确认
5. R-01 PASS
6. Owner Production GO signoff
7. `WEB3_MAINNET_PRODUCTION_PASS`

---

## 相关

- [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md)
- [WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md](WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md)
