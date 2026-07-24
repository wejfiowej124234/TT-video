# Pre-Mainnet Human UI/UX · Defect Register

**Session:** `20260724T065700Z-pre-mainnet-human-uiux`  
**Phase:** ①/② · ≠ Production GO · ≠ Mainnet Cutover  
**Round-1:** HU-001～010 FIXED  
**Round-2 = 第二批 Batch-2:** HU-011～017 OPEN · 生产级 + L5 · 修后：本地→Staging→Git→Final Truth cite  
**Tip:** `ea71c577` · Pin `PSG-REL-20260720-WEB3-CAND-V2` · Staging bake `2db694ae`  
**SSOT:** `docs/runbook/TT-PRE-MAINNET-HUMAN-UIUX-DEFECT-REGISTER-LATEST.md`（Batch-2 章程 + Final Truth 锚点表全文）  
**Rule:** 只登记至 Owner「开始第二批集体改」；禁止抢先改码。

## Round-1 FIXED
HU-001～010（见 SSOT）

## Round-2 = Batch-2 OPEN

| # | 主题 | 严重度 | 状态 |
|---|------|--------|------|
| HU-011 | 角色剧场封面进播放框 | P1 | OPEN · Batch-2 |
| HU-012 | `/` 默认 Ambient L5 宣传海报 | P1 | OPEN · Batch-2 |
| HU-013 | 选国家 Ambient 闪/双跳 | P1 | OPEN · Batch-2 |
| HU-014 | 注册验证码未达邮箱（Resend 测试模式） | P0 | OPEN · Batch-2 · 根因已证 |
| HU-015 | 社区「当前定位」非生产级 | P1 | OPEN · Batch-2 |
| HU-016 | 社区规范 UI + 真源对齐 | P1 | OPEN · Batch-2 |
| HU-017 | CMS 运营号仿用户不足 | P1 | OPEN · Batch-2 |

**闭环（集体改后）：** 生产级 + L5 → 更新 Register → 本地 → Staging → Git → Final Truth Baseline cite-only（Product/Release + Engineering SSOT）· Delta Recertify dry-run · **≠** Hard Gate / Cutover PASS。
