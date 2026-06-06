# Maintainer 一页 · 全页电影 L5（①）

**阶段：** **① 本地** — **除真实数据外已收口**（[`HOMEPAGE-NON-DATA-CLOSURE.md`](./HOMEPAGE-NON-DATA-CLOSURE.md)）。

## 1. 硬刷新目视（已完成可归档）

[`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md) — **2026-05-20 已签**。

## 2. 机读闸（推送前）

```bash
bash scripts/gates/verify-cinematic-l5-local.sh
```

## 3. ② 仅换素材时

```bash
bash scripts/gates/traveltrust-phase2-local-prep.sh
cd frontend && npm run dev   # 重启读 env
```

## ②③ 不属 UI 收口

实拍 mp4 · 社媒 URL · 真 API/链 · Lighthouse — 见 [`HOMEPAGE-NON-DATA-CLOSURE.md`](./HOMEPAGE-NON-DATA-CLOSURE.md)。

**工程锁：** `TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK` = **2026-05-20**（批次 **A–W**）。
