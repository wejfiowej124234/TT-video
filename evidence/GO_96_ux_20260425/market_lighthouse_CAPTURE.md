# /market — Lighthouse / 截图证据

## Lighthouse（与 /pay 同级）

已生成：

- `market_3012.lighthouse.json` — 完整结果
- `market_3012.metrics-snippet.json` — 摘录（performance / accessibility + 核心 Web Vitals）

再生命令（需本机 3012 已 `npm run build && npm run start`）：

    cd frontend
    npx --yes lighthouse http://127.0.0.1:3012/market --only-categories=performance,accessibility --output=json --output-path=../evidence/GO_96_ux_20260425/market_3012.lighthouse.json --chrome-flags="--headless --no-sandbox --disable-gpu"
    cd .. && node -e "/* 同 pay 摘录脚本，替换路径为 market_3012 */"

## 多宽度截图（320 / 768 / 1024 / 1440）

请用浏览器设备模式或 Playwright 导出 PNG，建议命名：

- `screenshots/market/market-320.png` … `market-1440.png`

目录：`evidence/GO_96_ux_20260425/screenshots/market/`（可自建）。
