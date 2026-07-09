# ① 真人 UI 盲测（钱包）

Base: `http://127.0.0.1:3012` · chainId `31337`

## A Guide `/staking?scope=guide`
- [ ] pool 地址与 meta 一致
- [ ] 连接钱包 + stake/withdraw

## B Provider `/staking?scope=provider`
- [ ] pool `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- [ ] approve + stake

## C Chain B
- [ ] 游客下单 → 导游 accept
- [ ] 支付步记录（预期 mock-pay 不可用 → BL-③-001）
- [ ] `/escrow/41e8c12f-b9fb-4ee7-b788-21ce2554bf43`

## D 多身份 `/me/identities`（multi-demo@test.com）
- [ ] 与 `03-multi-identity-smoke.log` 一致

---
## 分轨说明

- **轨 A（8080 chain-on）**：A/B/D 质押与多身份 — 用当前 Next @3012
- **轨 C Chain B UI**：订单 `1f73075a-f5c7-40bd-9c61-9bb948f99c55` 已在 **8081** API 闭环；UI 核对若 Next 仍指 8080，可能看不到 completed — 可仅 API 证据或临时指 8081
