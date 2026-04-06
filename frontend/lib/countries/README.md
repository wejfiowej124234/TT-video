# 按国家独立定价模块

各国房价、用车价格、城际交通、住宿、景区/餐饮单价、向导等级价均不同，本目录按**国家独立成模块**，与 `geoOptions` 的国家名一致（中国、日本、泰国等）。

## 入口与使用

- **取配置**：`getPricingForCountry(country: string)`，未知国家回退到中国配置。
- **使用处**：`CustomItineraryModal` 的 `useQuoteCalculation`、`useItineraryForm`、表单单选向导等级时的「X/天」展示，均根据 `form.country` 取对应国家定价。

## 目录职责

| 文件 | 职责 |
|------|------|
| `types.ts` | `CountryPricingConfig`、`CityTransportType`、`TransportType`、`GuideLevel` |
| `cn.ts` | 中国：用车/城际/住宿/景区/餐饮/向导等级单价 |
| `jp.ts` | 日本 |
| `th.ts` | 泰国 |
| `sg.ts` | 新加坡 |
| `fr.ts` | 法国 |
| `it.ts` | 意大利 |
| `es.ts` | 西班牙 |
| `us.ts` | 美国 |
| `uk.ts` | 英国 |
| `au.ts` | 澳大利亚 |
| `index.ts` | `BY_COUNTRY` 映射、`getPricingForCountry`、类型与各国 config 导出 |

## 配置字段说明

- **cityTransportPrice**：市内用车（轿车/SUV/商务）每日单价。
- **intercityPricePerPerson**：城际交通（飞机/高铁）每人单价。
- **perAttraction** / **perFood**：景区、餐饮每人每处单价。
- **hotelPerNightPerPerson**：住宿每间夜每人。
- **guideLevelsSuggestedPerDay**：向导等级（初级/中级/高级/专家）建议日薪。

新增国家时：在 `geoOptions` 增加国家与城市后，在本目录新增 `xx.ts` 并写入 `CountryPricingConfig`，再在 `index.ts` 的 `BY_COUNTRY` 中注册即可。若该国需在行程中展示城市级景区/餐饮/酒店选项，须同步在 **lib/cityDetails** 维护该国城市数据（与 geoOptions 一致）；本目录仅负责**按国家定价**，cityDetails 负责**按城市提供选项与详情**。

## 各国币种（SSOT）

计价币种以 [44-阶段-国家独立定价模块](../../../docs/spec/44-阶段-国家独立定价模块.md) **§3.4 各国币种表** 为准；新增国家时须在该表与 `BY_COUNTRY` 同步增加一行。当前对应关系：中国 CNY、日本 JPY、泰国 THB、新加坡 SGD、法国/意大利/西班牙 EUR、美国 USD、英国 GBP、澳大利亚 AUD。

## 变更记录约定

修改某国定价或新增国家时，请在 MR 中简要注明**数据来源或依据**（如「按 2024 年 XX 地接价」「与运营确认」），便于审计与追溯。
