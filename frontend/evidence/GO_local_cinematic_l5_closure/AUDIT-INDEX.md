# 非地球 L5 审计 · 索引（①）

**阶段：①** — 代码批 **A–W** 已收口（工程锁 2026-05-20）；**②③** 见 defer 分册。

## 工程闸（①）

```bash
bash scripts/gates/verify-cinematic-l5-local.sh
# 或（frontend 目录）：
# npm run test:cinematic-l5 && npm run verify:cinematic-l5
# npm run capture:cinematic-l5
CAPTURE_CINEMATIC_L5_REFRESH=1 bash scripts/gates/verify-cinematic-l5-local.sh
bash scripts/gates/capture-cinematic-l5-evidence.sh
# local-delivery-expanded：diff 含 cinematic 时自动 verify（可 SKIP_TRAVELTRUST_CINEMATIC_L5_VERIFY=1）
TRAVELTRUST_CINEMATIC_L5_VERIFY=1 bash scripts/gates/local-delivery-expanded.sh
```

| 产物 | 路径 |
|------|------|
| 完成度 | [`COMPLETION-STATUS.md`](./COMPLETION-STATUS.md) |
| Maintainer 一页 | [`MAINTAINER-ONE-PAGE.md`](./MAINTAINER-ONE-PAGE.md) |
| 工程锁 | [`ENGINEERING-LOCK.md`](./ENGINEERING-LOCK.md) |
| 台账互指 | [`ISSUES-ENGINEERING-SYNC.md`](./ISSUES-ENGINEERING-SYNC.md) |
| §6.2 勾选 | [`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md) |
| 截图步骤 | [`CAPTURE.md`](./CAPTURE.md) |
| C1 地球 | [`../GO_local_hero_globe_a_closure/`](../GO_local_hero_globe_a_closure/) |
| L1 公告标签对比度 | [`L1-PULSE-LABEL-CONTRAST-FREEZE.md`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md) · **closed ① 2026-06-03** |

## ① 增量 a11y 收口（不改 A–W 工程锁）

| 册 | 内容 |
|----|------|
| [`L1-PULSE-LABEL-CONTRAST-FREEZE.md`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md) | L1「项目动态 · 全部 ›」暖金对比度 · portal + `text-ref-sun/NN` 失效修复 |

## ②③ defer（不冒充 ① 闭卷）

| 册 | 内容 |
|----|------|
| [`DEFER-02-ROLE-MEDIA.md`](./DEFER-02-ROLE-MEDIA.md) | U1 · 五角色旅游实拍 mp4 |
| [`DEFER-03-LIGHTHOUSE-WCAG.md`](./DEFER-03-LIGHTHOUSE-WCAG.md) | U4–U5 · Lighthouse / WCAG / Percy |

## Runbook 真源

[`docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md`](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md) · [`issues-phase1-ui-ux-traveltrust-v6.md`](../../../docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md) **TT-PH1-197**～**205**
