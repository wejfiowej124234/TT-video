# TT · PSG Runtime Change Propagation — Enterprise Deepening Gap Analysis

**STATUS:** `ACTIVE`  
**Scope:** Wave A+B governance deepen only  
**UTC:** 2026-07-17T17:30:00Z  
**SSOT:** `registry/runtime-dependency-registry.v1.yaml`  
**Derived:** `registry/runtime-dependency-registry.derived.v1.json`  

**禁止宣称：** Wave C/D 完成 · 十六维完成 · Production Cert 刷新 · Tag/Archive/`TT_PRODUCTION_GO` 变更  

---

## 1 · 结论

| 问题 | 结论 |
|------|------|
| Registry 是否唯一 SSOT？ | **是（本轮深化后）** — Gate 只认 derived JSON；YAML 为唯一手写源 |
| Gap/Probe/Validation/Compatibility 是否手工双轨？ | **已消除主路径** — 由 `generate-rcp-registry-derived.py` 生成 |
| PSG 是否仍有重复规则？ | **有意并存（ACCEPT）** — EnvAlign / COS / RC parity 与 RCP 职责不同；见 §3 |
| Wave C/D / 十六维？ | **NOT_STARTED / NOT_COMPLETE** |

---

## 2 · 本轮增量（已落地）

| 项 | 内容 |
|----|------|
| change_class 枚举 | CONFIG / API_SCHEMA / DATA_REBIND / STORAGE / ENV / DEPLOY / FEATURE_FLAG / ABI / MEDIA_HOST / BUILD_ARG |
| Producer/Consumer | owner · change_classes · surface · fingerprint |
| Required Validations | 域内列表 → derived `validation_scope` |
| Waive Policy | never_waive vs RCP-PAIR-01 may_waive |
| Compatibility Rules | 域级 + `compatibility_matrix` 边 |
| Deploy Dependency Graph | Data/CMS/OCS → API → Web → Browser |
| Runtime Compatibility Matrix | API↔Web↔CMS↔OCS↔Media↔FeatureFlag↔RuntimeEnv |
| Generator | `scripts/dev/generate-rcp-registry-derived.py` |
| Gate | 校验 derived 与 YAML sha256 一致，否则 FAIL |

---

## 3 · 相对既有 PSG 的重复 / 漂移 / 遗漏

| ID | 现有 | 与 RCP | 处置 |
|----|------|--------|------|
| DUP-ENVALIGN | EnvAlign · caps **键名** | 不验 host↔remotePatterns | **KEEP** Admission；RCP 管 FE |
| DUP-COS | COS Integrity · 对象 HEAD | 不验 `/_next/image` | **KEEP** COS；RCP 管渲染路径 |
| DUP-RC-PARITY | Staging RC next_image tripwire | 与 RCP-MEDIA-02 重叠 | **ACCEPT 双轨**（暂不合并；非 Wave C） |
| HAND-GAP | 原 RCP yaml 手写 Gap/模块表 | 易漂移 | **已删薄** → 指针 + derived |
| MISS-DEPLOY-GRAPH | 无显式部署依赖边 | Media 漂移类复发 | **已补** `deploy_dependency_graph` |
| MISS-CHANGE-CLASS | 无统一变更分类 | 难自动选验证集 | **已补** |
| MISS-COMPAT-MATRIX | 无跨运行时兼容边 | 难企业级审阅 | **已补** |

---

## 4 · 优化方案（不扩 Wave C/D Gate）

1. **唯一手写：** Dependency Registry YAML  
2. **每次改 Registry：** 必跑 generator；Gate 校验 sha  
3. **P1 近期待办（仍属第一优先级，非 C/D）：**  
   - Deploy 钩子：API/Web deploy 后非阻塞调用 RCP  
   - 可选注入 `TT_WEB_STAGING_IMAGE_TAG` 强化 Web 指纹  
4. **P2/P3：** 只扩 Registry domain / change_class，**禁止**平行 Gate 森林  

---

## 5 · 实施计划

| 步 | 动作 | 状态 |
|----|------|------|
| 1 | 深化 Registry schema v1.1 | DONE |
| 2 | Generator + derived JSON | DONE |
| 3 | Thin RCP binder yaml v2 | DONE |
| 4 | Gate 消费 derived + stale FAIL | DONE |
| 5 | Gap Analysis 本文 | DONE |
| 6 | 独立治理 commit（Owner 授权后） | PENDING |
| 7 | Deploy 钩子 / image tag | NOT_STARTED（P1 剩余） |
| 8 | Wave C domain enforce | NOT_STARTED |

---

## 6 · 影响评估

| 面 | 影响 |
|----|------|
| 冻结 Certification / Tag / Archive / GO | **无** |
| Wallet / MEDIA_ALIGNMENT / OA | **无** |
| 日常维护 | 改依赖关系只改 Registry + regenerate |
| 误用风险 | 忘跑 generator → Gate FAIL（有意） |
| 性能 | Staging 采样成本不变 |

---

## 7 · 诚实边界

```
Wave A+B ENFORCED
十六维 NOT_COMPLETE
Wave C/D NOT_STARTED
P2 Data/Contract · P3 Observability/Business = 路线图 only
```
