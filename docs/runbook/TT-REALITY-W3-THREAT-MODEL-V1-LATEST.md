# Reality-W3 · Threat Model v1（预案 · ≠ C-09）

**STATUS:** ACTIVE · Owner Self Review pack  
**Machine key:** `TT_REALITY_W3_THREAT_MODEL_V1`  
**PCR:** `PCR-SEC-GOV-THREAT-MODEL`  
**Phase:** ② Staging Reality Closure · **≠** ③ Production GO · **≠** 第三方实审报告（C-09）

## 范围

| 域 | 资产 | 信任边界 |
|----|------|----------|
| Auth / Session | 邮箱口令 · Bearer session · 重置令牌 | 公网 ↔ API ↔ PG `users`/`sessions` |
| Pay / Escrow | 订单态 · mock/PSP · 链下 escrow | 旅行者/向导 ↔ API ↔ DB/chain_off |
| Admin Console | 六角色 RBAC · Audit · DSAR | Admin ↔ API ↔ PG |
| CMS 写 | 公告/治理车道 · Catalog | SuperAdmin/Ops ↔ API ↔ PG/COS |

## STRIDE 摘要（v1）

| 威胁 | 示例 | 缓释（现行 / W3） | 残余 |
|------|------|-------------------|------|
| Spoofing | 盗会话 · 伪造 Admin | STRICT_SESSION_GATE · 改密/重置 revoke-all · Admin 2FA 策略 | 用户端 2FA 未强制（ADR 另轨） |
| Tampering | 改订单态 · 绕过发布 | RBAC · Audit · 双写 meta | 高危二次确认矩阵仍靠 2FA 闸 |
| Repudiation | 否认发布/改密 | `auth_audit` · `admin_audit` · DSAR events | 导出签名完整归档 ②/③ |
| Info disclosure | DSAR 包泄漏 · PII 日志 | Admin DSAR 台账 · 证据禁写密码 | 全自动导出包未完成 |
| DoS | 注册/登录刷爆 | rate_limits meta · 邮件发送窗 | 边缘 WAF ③ |
| Elevation | Ops 发布治理 · 非 Admin 调 Admin | 车道拒绝 · `admin_2fa_required` | Solo SuperAdmin 策略（W2 ACCEPT） |

## 数据流（简图）

```text
Browser/App → HTTPS → tt-api → (PG | chain_off | email Resend | COS)
Admin UI    → HTTPS → tt-api/admin/* → RBAC → Audit
```

## Owner 签收栏

| 项 | 值 |
|----|-----|
| 覆盖 Auth/Pay/Escrow/Admin/CMS | YES（本页） |
| 年审提醒 | 每次 Formal Baseline / Reality Delta 复读 |
| Owner Self Review | Reality-W3 证据包引用本页 |
| **≠ C-09** | 本页 **不是** 第三方审计/渗透实战证明 |

**SSOT 互指：** [Enterprise Maturity · SG-01](./TT-POST-BASELINE-ENTERPRISE-MATURITY-PLANNING-LATEST.md) · [Wave Acceptance W3](./TT-REALITY-CLOSURE-WAVE-ACCEPTANCE-LATEST.md)
