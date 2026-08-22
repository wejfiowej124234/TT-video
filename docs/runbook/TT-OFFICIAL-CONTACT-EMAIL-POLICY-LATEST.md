# TravelTrust · Official Contact Email Policy

**STATUS:** `ACTIVE`  
**Plane:** PRODUCT（与 Resend 发信轨正交 · **≠** Web3 Candidate / Sepolia）  
**Machine SSOT:** [`registry/traveltrust-official-contact-email.v1.yaml`](../../registry/traveltrust-official-contact-email.v1.yaml)  
**Deliverability（系统发信）:** [TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST](TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md)  
**Etherscan 提交前:** [TT-ETHERSCAN-SUBMISSION-PREFLIGHT-LATEST](TT-ETHERSCAN-SUBMISSION-PREFLIGHT-LATEST.md)（V9 Mainnet 就绪后执行）

---

## 双通道（写死）

### 1 · 系统自动邮件

```text
noreply@web3-ttg.com
        ↓
Resend（TRAVELTRUST_RESEND_FROM）
        ↓
验证码 / 密码重置 / 系统通知
```

- **禁止**用于 Etherscan、合作洽谈、媒体、人工回复。
- **禁止**改为 Gmail 发件；Resend 域验证绑定 `web3-ttg.com` 子域。

### 2 · 官方人工联系

```text
traveltrust.ir@gmail.com
        ↓
Gmail（Owner 收件箱）
        ↓
Etherscan / 合作 / 媒体 / 人工回复
```

- **对外统一**显示此地址（官网联系、Etherscan Project Email、GitHub 官方 Security 等须一致）。
- **暂不要求** `contact@web3-ttg.com`；日后若需域名邮箱可再启用 Cloudflare Email Routing，**不阻塞**当前阶段。

---

## 一致性规则

提交 Etherscan Token Info / Logo 或对外合作资料前，下列字段须 **同一邮箱**：

| 表面 | 填写 |
|------|------|
| 官网 Contact / 页脚联系 | `traveltrust.ir@gmail.com` |
| Etherscan · Project Email | `traveltrust.ir@gmail.com` |
| `docs/github-official/SECURITY.md` | `traveltrust.ir@gmail.com` |
| 白皮书 Contact（若有） | `traveltrust.ir@gmail.com` |

**≠** `noreply@web3-ttg.com`（仅系统发信）。

---

## 与测试账号

手测登录账号（C1–E2）见 [TT-TEST-ACCOUNTS-QUICK-REFERENCE](TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) — **`@test.com` 等 ≠ 官方联系邮箱**。

---

## 变更闸门

| 变更 | 动作 |
|------|------|
| 更换对外 Gmail | 同批更新 registry + 本 runbook + 所有 public_surfaces_must_match 列表 + Etherscan 预检 |
| 启用 `contact@web3-ttg.com` | 新开 Owner 决策 · DNS/Cloudflare · 再统一 public 表面 |
| 修改 `noreply@` / Resend | 仅邮件投递轨 · 须过 [TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST](TT-EMAIL-DELIVERABILITY-CLOSURE-LATEST.md) |
