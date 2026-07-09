# 阶段一 · 前端审计（① 本地 · 2026-05-17）

**登记真源：** [issues-phase1-local.md](./issues-phase1-local.md)（**PH1-FE-*** 行）  
**机读旁证：** `npm run check:e2e:tsc` + `npm run test:a8-community`（409 passed）· `artifacts/pi1-closure-verify-*.log`  
**浏览器验收：** 代码/机读绿 **不等于** PH-1 可签；须 **PH1-FE-01～03** 手验 **closed**。

---

## 1. 审计范围

| 域 | 路径/能力 |
|----|-----------|
| 社区 Feed | `/community`、帖图/视频封面/内联播放 |
| 发布抽屉 | `/community?publish=1`、`PublishDrawer`（文字/图/视频/封面上传） |
| 我的社区 | `/community/me`、头像本地上传 |
| 媒体 URL | `communityMediaClientUrl.ts`、`next/image` + `unoptimized` |
| API 对齐 | 匿名 GET uploads（PH1-UI-09）、capabilities、multipart |
| 自动化 | Playwright `smoke-community`、Vitest a8、staging/diagnostic spec |

---

## 2. 审计方法

1. 静态代码走读：`PublishDrawer/*`、`CommunityFeedCardMedia*`、`usePublishForm`
2. 机读：`verify-pi1-local-stack.ps1`、API 探针、`strict_on_community_post_media_get_public`
3. Vitest：`test:a8-community`（写路径/错误码；**不覆盖**浏览器选文件发帖）
4. E2E 缺口：`smoke-community.spec.ts` 无「已登录 + 本地视频 + 封面上传 + Feed 可见」默认可跑用例

---

## 3. 结论摘要

| 类别 | 结论 |
|------|------|
| 后端/机读 | PH1-UI-09/11、capabilities — 已收口（须新 API 二进制 + 一键脚本） |
| 前端实现 | 封面上传、multipart、Feed URL 解析 — 代码在工作区 |
| 阶段一缺口 | **浏览器主路径** 现登记为 **PH1-FE-***，挡 PH-1 |
| 自动化 | PH1-FE-06：可补 ① 本地 Playwright 或手验 + 截图 |

---

## 4. 发现问题（PI-1 清单）

| ID | 优先级 | 类型 | 摘要 | 状态 |
|----|--------|------|------|------|
| PH1-FE-01 | **P0** | 浏览器 | Feed 帖图/封面可见（非 401 裂图） | verify |
| PH1-FE-02 | **P0** | 浏览器 | 视频+封面上传发帖 → Feed 可播 | verify |
| PH1-FE-03 | **P0** | 浏览器 | 多图发帖成功 | verify |
| PH1-FE-04 | P1 | 浏览器 | 纯文字帖 | verify |
| PH1-FE-05 | P1 | 浏览器 | `/community/me` 头像上传回显 | verify |
| PH1-FE-06 | P1 | 自动化 | 缺默认 chromium 视频+封面发帖 e2e | open |
| PH1-FE-07 | P1 | 流程 | local-smoke #7a～7f 与 FE 对拍 | fix |

PH1-UI-01～11、PH1-DEV-01 保持 **closed**（实现/机读）。

---

## 5. 浏览器手验步骤（维护者）

**前置：** `scripts\start-api-with-seed.bat`（勿 `SKIP_API_BUILD=1`）· 登录 `tourist@test.com` / `Test123!`

| ID | 步骤 | 通过判据 |
|----|------|----------|
| FE-01 | 打开 `/community` | 有图帖正常；控制台无 uploads **401** |
| FE-02 | `?publish=1` → 视频 → mp4 → 选封面 jpg → 发布 | Feed 新帖可播 |
| FE-03 | 发布抽屉 → 图片 → 2 张 → 发布 | Feed 可见多图 |
| FE-04 | 文字帖发布 | Feed 可见 |
| FE-05 | `/community/me` 头像本地上传 | 刷新后仍正确 |

证据：`artifacts/fe-browser-YYYYMMDD-feNN.png`

---

## 6. 与 TT-MASTER

- **PI-1 / PH-1**：PH1-FE **P0** 全 **closed** 后方可勾/签
- **A-08**：`local-smoke.md` #7a～7f
