# `/guide/register` — 向导资质申请（①）



**阶段：** **① 本地**。**②③** 真链质押 / 审核 SLA 另闸。



**全链 SSOT：** [`lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md`](../../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md)



## 五步（产品 · 与商家对比）



| 步 | 向导 | 商家（对照） |

|----|------|----------------|

| 1 | 注册 / 登录 | 同左 |

| 2 | **本页** 资质 + 钱包 + 证件 | `/provider/register` KYB |

| 3 | —（**无** B 轨准入费 · **本步不质押**） | `/me/onboarding` 准入费 |

| 4 | 平台审核 | Admin 审核 |

| 5 | **审核通过后** `/staking` USDC 身份质押 | `/staking` + 发橱窗 |



## 本页边界（写死）



| 允许 | 禁止 |

|------|------|

| `POST /api/v1/guides` 提交资料 | 本页 **不要求**、**不提供** 质押主 CTA |

| 完成页链 `/guide` 看审核状态 | 完成页 **不** 链 `/staking`（2026-06-12） |

| 确认步文案说明「审核通过后再质押」 | 把质押与提交混为一步 |



## 提交后面板



| 面板 | 场景 | CTA |

|------|------|-----|

| `GuideRegisterDonePanel` | 首次提交成功 | `/guide`（工作台）· `/guides` · Hub |

| `GuideRegisterPendingPanel` | 再次进入且 pending | `/guide` · Hub |

| `GuideRegisterRejectedGate` | rejected | 重申请 |



**质押唯一主入口：** 审核通过且未质押时 **`/guide` 工作台 Banner** → `/staking#guide-identity-stake`。



## 代码



- `GuideRegisterPageMain.tsx` · `GuideRegisterDonePanel.tsx`

- 提交：`guideRegisterSubmitFlow.ts` → `POST /api/v1/guides`（**无** stake 字段）

- 门闸：`lib/guide/guideIdentityStakingNav.ts`



## 验收（①）



```bash

cd frontend && npx vitest run app/guide/register/guideRegisterPage.contract.test.ts lib/guide/guideIdentityStakingNav.test.ts

```



## 冻结



[GUIDE-REGISTER-UI-FREEZE.md](../../../evidence/GO_local_auth_l5/GUIDE-REGISTER-UI-FREEZE.md)


