# G3-01 · Production Network

**Domain SSOT:** [`registry/g3-production-domains.v1.json`](../../registry/g3-production-domains.v1.json)  
**Checklist (machine):** [`registry/g3-01-production-network-checklist.v1.json`](../../registry/g3-01-production-network-checklist.v1.json)  
**Evidence root:** `evidence/GO_production_readiness/G3-01/`  
**Matrix gap:** PRM-DOM-B001 · closes when domain **VERIFIED**

---

## 执行顺序（写死 · 不要直接改 DNS/CDN）

### 第一步 · 冻结 Scope（必须先完成）

**G3-01 Production Network — 唯一 Scope：**

| In scope | Out of scope（直接拒绝） |
|----------|-------------------------|
| Domain | 新增功能 |
| DNS | UI |
| TLS | 业务逻辑 |
| CDN | API 变更 |
| WAF | Platform |
| CORS | Registry |
| | Builder |

**准入问题（唯一）：** 是否属于 **G3-01 Scope**？**不是 → 拒绝。**

Scope 已冻结：`registry/g3-01-production-network-checklist.v1.json` · `scope_frozen_utc: 2026-07-04`

---

### 第二步 · 建立 Checklist（改配置前写完）

**禁止**一边改 DNS/CDN 一边补清单。

机读清单：[`g3-01-production-network-checklist.v1.json`](../../registry/g3-01-production-network-checklist.v1.json)

| Group | Items |
|-------|--------|
| Domain | DOM · REDIRECT · robots · sitemap · favicon |
| DNS | DNS · IPv6 · DNSSEC（可选） |
| TLS | TLS · CAA · HSTS · SSL Labs |
| CDN | CDN · Cache · Compression · HTTP/3 |
| CORS | CORS |
| WAF | Security headers · WAF · Rate limit |

**每项状态机（与 Domain 相同）：**

```text
PLANNED → IMPLEMENTING → VERIFIED → CLOSED
```

工作副本：`evidence/GO_production_readiness/G3-01/checklist.v1.json`（与 registry 同步进度）

---

### 第三步 · Implementation

按 Checklist **逐项**实施 · 证据落盘：

| 目录 | 内容 |
|------|------|
| `implementation/` | 变更记录 · 配置导出 · Owner 确认 |
| `evidence/` | 探针输出 · SSL Labs · curl · 截图路径 |

**不要**在本步新建 Verification 类型。

---

### 第四步 · Verification（复用 Release Train · 禁止新建 G3 Verification）

**只复用现有三层：**

```bash
bash scripts/dev/run-reality-verification.sh --gate G3 --domain G3-01
bash scripts/dev/run-evidence-integrity-audit.sh G3
# G3 Formal（与 G2 同构 · Per-Domain）
```

**禁止：** 为 G3-01 单独发明第四套 verification 脚本/product。

---

### 第五步 · Formal → VERIFIED → Matrix CLOSED

```text
Formal Acceptance
    ↓
Domain status VERIFIED
    ↓
PRM-DOM-B001 CLOSED
    ↓
signoff.json 更新
    ↓
进入 G3-02 Web3 USDC Escrow Payment
```

---

## Production-only 纪律（G3 全域 · 写死）

**G3 的 VERIFIED 必须来自真实 Production Environment。**

**禁止：**

```text
Local PASS  →  Production VERIFIED
Staging PASS → Production VERIFIED
```

**必须：**

```text
Production Environment
    ↓
Reality Verification
    ↓
Evidence（production 探针 / 配置真源）
    ↓
Formal Acceptance
    ↓
VERIFIED
```

证据包须标明 `environment: production` · production hostname · 禁止用 staging URL 冒充。

---

## 诚实边界

- ① 本地 curl / ② Staging Fly **不能**关闭 G3-01 · PRM-DOM-B001  
- Checklist 全 **CLOSED** ≠ Domain **VERIFIED**（仍须 Verification + Formal）  
- G3-01 **VERIFIED** ≠ Production GO

**上级 SSOT：** [`G3-PRODUCTION-DOMAINS.md`](G3-PRODUCTION-DOMAINS.md)
