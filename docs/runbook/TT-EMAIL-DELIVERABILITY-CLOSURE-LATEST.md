# TT Email Deliverability Closure · LATEST

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**STATUS:** ACTIVE · **② 邮件信誉收口**（≠ ③ Production GO · ≠ Mainnet Hard Gate）  
**Checked:** 2026-07-24 · DNS machine twin [`TT-EMAIL-DELIVERABILITY-DNS-CHECK-LATEST.json`](./TT-EMAIL-DELIVERABILITY-DNS-CHECK-LATEST.json)  
**Domain:** `web3-ttg.com` · **FROM:** `TravelTrust <noreply@web3-ttg.com>`（Resend）  
**Pin cite:** `PSG-REL-20260720-WEB3-CAND-V2` · tip `ea71c577`（cite-only）  
**Owner 观察截图：** 2026-07-24 12:40～12:51 · 垃圾箱 + TravelTr 折行  
**Round-8（Owner 授权抛光 · 2026-07-24）：** 修短 `alt=TT` + 金框头标 + 码字距 · **再冻**模板；DNS 仍冻；信誉闸仍 OPEN

---

## 0 · Owner 本轮指令（写死）

| 动作 | 状态 |
|------|------|
| 邮件 HTML 抛光（折行 / L5） | **Round-8 DONE** → 部署后 **再 FROZEN** |
| **停止**修改 DNS（认证/BIMI） | **FROZEN** · 仅 Postmaster 验证 TXT 除外（§2） |
| **停止** Staging 自定义域名绑定（为发信） | **STOPPED** |
| SPF / DKIM / DMARC | **AUTH PASS**（§1） |
| Google Postmaster + 暖域 | **OWNER_ACTION** · `TT_POSTMASTER_VERIFIED: PENDING` |
| Gmail **3/3 收件箱** | **OWNER_ACCEPTANCE** · `TT_GMAIL_INBOX_GATE: OPEN` |
| BIMI / VMC | **DEFERRED** · **不阻塞** Mainnet Hard Gate / Cutover |

### 0.1 · L5 / 排版（Round-8 后）

| # | 项 | 状态 |
|---|-----|------|
| 1 | 暖金暗壳 · 码区 · 中英 · 页脚 | **L5 保持** |
| 2 | 屏蔽图折行 TravelTr/ust | **FIXED（Round-8）** · `alt="TT"` + 56×56 金框 · 品牌名 `nowrap` |
| 3 | 码字距 | **提升** · `&nbsp;` 分隔 |
| 4 | 列表灰「T」 | BIMI 独立轨 |
| 5 | 进垃圾箱 | 信誉闸 §2–§3（与版式解耦） |

### 0.2 · Final Truth Baseline 对齐（cite-only · 唯一真源标准）

| 锚点 | 本批关系 |
|------|----------|
| **Final Truth Baseline** | 本活轨对齐；**禁止**平行真源 |
| **Candidate v2** | cite-only · 不改 tip / 协议基线 |
| **V3.1.1 Final** | cite-only |
| **PSG-EGM Final** | cite-only · 经济治理无变更 |
| **PSG Governance Anchor** | cite-only · 治理锚不因邮件抛光移动 |
| **Product / Release Baseline** | **主战场** · Auth 注册验证码 UX / L5 邮件体验 |
| **Engineering SSOT Anchor** | **主战场** · `auth_email_templates` · Staging bake · Git |
| **Release Integrity** | Staging Patch 008↻ Round-8 · Promotion DEFERRED |
| **PSG Delta Recertify（dry-run）** | 非资金 / 非协议 · 产品邮件抛光 · **不**触发 Hard Gate 翻转 |
| **Feature Inventory / Reality Closure** | ② 发码路径已通；Inbox/Postmaster 仍 Owner |
| **PRR** | 本批 ≠ PRR 关闭 |
| **Mainnet Hard Gate / Cutover Hard Gate** | BIMI/VMC/Inbox 暖域 **均不阻塞**；本批 **≠** 切闸 PASS |

---

## 1 · 认证验证（SPF · DKIM · DMARC）· 机读 PASS

复跑：`bash scripts/dev/check-email-deliverability-dns.sh`

| 检查项 | 记录 | 期望 | 2026-07-24 结果 |
|--------|------|------|-----------------|
| **SPF** | `send.web3-ttg.com` TXT | `v=spf1 include:amazonses.com …` | **PASS** `~all` |
| **SPF MX（反馈）** | `send.web3-ttg.com` MX | Amazon SES feedback | **PASS** |
| **DKIM** | `resend._domainkey.web3-ttg.com` TXT | 公钥 `p=` 存在 | **PASS** |
| **DMARC** | `_dmarc.web3-ttg.com` TXT | `v=DMARC1` + `p=quarantine` 或 `reject` | **PASS** |
| Apex SPF | `web3-ttg.com` TXT | **无**第二套冲突 SPF | **CONFIRM_DESIGN**（Expected Difference） |

**诚实句：** Auth PASS ≠ 收件箱稳定。新域 + OTP 仍可能进垃圾箱，靠 Postmaster 暖域 + Owner「非垃圾」训练。

### 可选加固（非本闸硬失败 · Owner 自愿）

在 Cloudflare `_dmarc` 可演进为（保持 `p=quarantine`）：

```text
v=DMARC1; p=quarantine; pct=100; adkim=r; aspf=r; rua=mailto:dmarc@web3-ttg.com;
```

须先有可收信的 `dmarc@` 邮箱或第三方 rua；**禁止**为「好看」改成 `p=none`（削弱 BIMI/未来品牌轨）。

Resend 控制台：域 `web3-ttg.com` 三项全绿即可；**禁止**在根域另加与 `send.` 冲突的 SPF。

---

## 2 · Google Postmaster Tools（Owner 必做）

入口：https://postmaster.google.com/

| 步骤 | 动作 | 完成判据 |
|------|------|----------|
| 1 | 用 **Owner Google 账号**登录 Postmaster | 控制台可开 |
| 2 | **Add domain** → `web3-ttg.com` | 域出现在列表 |
| 3 | 按提示加 DNS 验证 TXT（Cloudflare → 根或指定主机） | Postmaster 显示 **Verified** |
| 4 | 保持日常注册发码（低频、真实路径） | 数日后可见 Spam rate / Domain reputation |
| 5 | 监控目标（暖域期） | Spam rate **低**；Reputation **High/Medium**；若 High spam → 停量排查 |

**禁止：** 用 Postmaster 绿冒充 Hard Gate PASS；用短时间轰炸 OTP「刷信誉」。

回填本表（Owner）：

| 键 | 值 |
|----|-----|
| `TT_POSTMASTER_DOMAIN` | `web3-ttg.com` |
| `TT_POSTMASTER_VERIFIED` | **`PENDING`** → Owner 验证通过后改为 **`PASS`** |
| `TT_POSTMASTER_VERIFIED_AT` | — |
| `TT_POSTMASTER_NOTE` | — |

**DNS 例外（唯一允许）：** Postmaster 要求的 **域名验证 TXT** 一条；**禁止**顺手改 SPF/DKIM/DMARC/BIMI。

---

## 3 · Gmail 收件箱验收闸（② · Owner Acceptance）

**前置：** §1 AUTH PASS · Staging API 已配 `TRAVELTRUST_RESEND_FROM` · 使用**未污染**测试邮箱（未曾大量标垃圾）。

| # | 步骤 | PASS |
|---|------|------|
| A | 打开既有垃圾箱邮件 → **「这不是垃圾邮件」**（训练一次） | Owner |
| B | （可选）点「显示已阻止的内容」→ 确认 TT 标/码区可读 | 版式复验 · 非 Inbox 硬闸 |
| C | 换**新** Gmail（或干净标签）→ Staging `/auth/register` 发码 | API **200** `email_sent` |
| D | 邮件出现在 **收件箱**（非垃圾箱） | 是 |
| E | 连续 **3/3** 次（间隔 ≥10 min）进收件箱 | 是 |
| F | 信头或 Resend：`spf/dkim/dmarc` pass / Delivered | 是 |

**闸状态键：**

| 键 | 当前 | 收口 |
|----|------|------|
| `TT_GMAIL_INBOX_GATE` | **`OPEN`** | Owner 3/3 证据齐 → **`PASS`** |
| `TT_GMAIL_INBOX_EVIDENCE` | — | 日期 + 邮箱掩码 + 三次时间戳 |

**2026-07-24 12:40 截图：** 仍在垃圾箱 → **不可**将本闸标 PASS。

失败时只查：Resend 事件 · Postmaster spam rate · 是否仍用已标垃圾邮箱；**禁止**改邮件系统 / 改认证 DNS / 重开 Staging 挂域当根因。

---

## 4 · BIMI / VMC · 独立品牌轨（Hard Gate 非阻塞）

| 项 | 口径 |
|----|------|
| 列表灰「T」 | **预期**（无 VMC/CMC） |
| BIMI DNS 已有 `l=` | 可保留；**不**再为本闸改 Staging 域名或模板 |
| VMC/CMC + Tiny-PS SVG + 同域托管 | **后续品牌任务** |
| **Mainnet Hard Gate / Cutover / Production GO** | **不因缺 BIMI/VMC 而 FAIL** · **不因本投递暖域未完而自动 PASS** |

---

## 5 · Final Truth / Hard Gate 对齐（cite-only）

| 锚点 | 关系 |
|------|------|
| Final Truth Baseline | 本 runbook = 活轨投递收口 |
| Candidate v2 / EGM | cite-only |
| Product / Engineering SSOT | FROM + DNS Auth + Postmaster + Inbox gate |
| **Mainnet Hard Gate** | BIMI/VMC **非轴**；Inbox 暖域 = ops/产品轨 · **≠** 资金 Hard Gate 翻转条件 |
| HU-014 | 出站路径 FIXED；本文件接管 **投递信誉收口** |

---

## 6 · 闸键收口规则（写死）

| 条件 | 动作 |
|------|------|
| Postmaster 域 Verified | `TT_POSTMASTER_VERIFIED: PASS`（本 md + json 同批） |
| Gmail 3/3 收件箱证据齐 | `TT_GMAIL_INBOX_GATE: PASS` |
| 任一项未齐 | **保持 PENDING / OPEN** · 禁止假完成 |
| BIMI/VMC | 永不作为本闸或 Hard Gate 翻转条件 |

## 7 · 一句话

**版式接近 L5（屏蔽图折行属降级态·后置）；邮件/DNS 已冻；信誉收口 = Postmaster PASS + Inbox 3/3 PASS；BIMI 不挡 Hard Gate。**
