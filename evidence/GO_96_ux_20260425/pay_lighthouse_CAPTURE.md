# /pay — Lighthouse / Web Vitals 抽样（不改业务逻辑）

## 前置

1. 生产构建并起服（默认端口 3012）：

       cd frontend
       npm run build
       npm run start

2. 另开终端，在仓库根执行（示例为首页同机流程，替换 URL 为 pay）：

       cd frontend
       npx --yes lighthouse http://127.0.0.1:3012/pay --only-categories=performance,accessibility --output=json --output-path=../evidence/GO_96_ux_20260425/pay_3012.lighthouse.json --chrome-flags="--headless --no-sandbox --disable-gpu"

3. 可选：带真实 `orderId` 的支付页（需已登录且为参与方）：

       http://127.0.0.1:3012/pay?orderId=<uuid>

## 产出物

- 将生成的 `pay_3012.lighthouse.json` 保留在本目录；可再手工摘录 `categories` 与 `audits[largest-contentful-paint]` 等到 `pay_3012.metrics-snippet.json`（与 `frontend/evidence/lighthouse-root-3012.metrics-snippet.json` 同形），便于 96-16 D7 引用。

## 截图

- 浏览器或 Playwright 对 `/pay`（空态 / 带 orderId / 错误态）各宽度 320、768、1024、1440 导出 PNG，命名建议：`pay-320-empty.png` 等，放入本目录或 `evidence/GO_96_bundle_20260425/screenshots/`（自建）。

## 实证已落盘（2026-04-25）

- 已对运行中的 `http://127.0.0.1:3012/pay` 执行 Lighthouse（performance + accessibility）。
- 产物：`pay_3012.lighthouse.json`（完整 JSON）、`pay_3012.metrics-snippet.json`（摘录，供 D7 / 审计引用）。
