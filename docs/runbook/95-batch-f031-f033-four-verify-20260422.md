# 95 · §3 批次 F-031～F-033 · 四验 + §8.2 对齐（2026-04-22）

> **不**宣称 **93 PASS** / **§8.2「行完成」** / **§3.1 `[x]`**（**ISS-007**）。**`routes::itineraries::tests` 11** 与 **`itinerary_custom_draft` 8** + **`itinerary_custom_http` 3** 为**同一母模块**子集关系（**11 = 8+3**），**证据计数不**升格为 **22** 闭证。

## 1. 环境

- **`DATABASE_URL`**：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径）。

## 3. 机读命令与结果

| 过滤串 | passed | failed |
|--------|--------|--------|
| `create_post_commerce_parse` | 5 | 0 |
| `tests_create_post_commerce` | 3 | 0 |
| `trust_growth_api_tests` | 6 | 0 |
| `trust_growth_autopilot` | 2 | 0 |
| `itinerary_custom_draft` | 8 | 0 |
| `itinerary_custom_http` | 3 | 0 |
| `routes::itineraries::tests` | 11 | 0 |

## 4. 分 F（§3）

| F | 说明 |
|---|------|
| **F-031** | 社区帖子 **commerce** 解析 + **PG·IT**（**`tests_create_post_commerce_db`**） |
| **F-032** | **Trust growth** **`trust_growth_api_tests`** + **`trust_growth_autopilot`** |
| **F-033** | **行程自定义** 草稿 + **`POST …/custom`** HTTP 负例 + **`routes::itineraries::tests`** 整扇面 |

## 5. §8.2 / §9

- **F-031～033**：**93**/**E2E**/**行完成**/**§8.2·API·IT（除已 `[x]` 叙事外）** 仍 **`[ ]`** — **ISS-007**。
- **§9**：**不**新增 **ISS**。
