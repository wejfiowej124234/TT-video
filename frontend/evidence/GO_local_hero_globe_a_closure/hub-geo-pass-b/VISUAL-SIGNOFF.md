# Pass B · 目视签收（① · maintainer）

**日期：** 2026-05-21  
**页面：** `http://127.0.0.1:3012/traveltrust` · 1536×960 · 硬刷新  
**对照：** `before-hero-hub-geo-pass-a-baseline.png` → `after-hero-hub-geo-pass-b-desktop.png`

## 结论

| 项 | 签收 |
|----|------|
| 巴黎 / 马德里 针脚与标签同源（Paris / Madrid SSOT） | **OK** |
| 上海 / 纽约 / 东京 / 新加坡 / 迪拜 核心标签与光点 | **OK** |
| 弧线端点与 hub 坐标一致 | **OK**（机读 + 截图） |
| 未改颜色/材质/标签数/交互 | **OK** |

## 枢纽目视（after）

| Hub | SSOT 城市 | 目视（after 截图） |
|-----|-----------|-------------------|
| cn | Shanghai | 「中国」在东亚陆块东侧 |
| us | New York | 美洲东岸（左缘） |
| fr | Paris | 「法国」西欧 |
| es | Madrid | 与 fr 分离、伊比利亚（光点；核心 6 无 es 文字标签） |
| jp | Tokyo | 「日本」东亚外海侧 |
| sg | Singapore | 「新加坡」东南亚南向 |
| ae | Dubai | 「阿联酋」中东 |

## 与 before 差异

- before：法/西针脚曾 `pinLat/pinLon` 偏移，标签与 WebGL 双轨。
- after：DOM 标签 / 光点 / Phase1 针脚 / 弧线均 `traveltrustHubGeo.ts`。

**机读：** `traveltrustHubGeoAlignment` 6/6 · P0/P1 Playwright PASS。
