# ops/kubernetes（示例清单）

与 **集群侧** **Ingress / NetworkPolicy** 相关的**可复制示例**；行为与门禁仍以 **[TT-9618 §3.5](../../docs/runbook/TT-9618-onboarding-local-testnet.md)**、**[04-附录 §1](../../docs/spec/04-附录-商家主理人准入费HTTP契约草案-配96-18.md)**、**[96-03](../../docs/spec/96-03-安全密钥与供应链.md)** 为准。

| 文件 | 说明 |
|------|------|
| **examples/onboarding-internal-webhook-ingress-nginx.example.yaml** | **ingress-nginx**：私网 **`/api/v1/internal`** 前缀；**可选** 双向 TLS（**`auth-tls-*`**；**批次 K / P0** **mTLS** **须**在网关终止，与 **Stripe 公网** webhook **分 Ingress**；YAML 头注释含 **可选** **`limit-rps`**（默认注释）。API **不**读客户端证书。**不**替代 **③ 生产 GO**。 |
| **examples/onboarding-stripe-webhook-ingress-nginx.example.yaml** | **ingress-nginx**：公网 **`/api/v1/hooks/stripe`** 前缀（**TLS 终止**）；**`Stripe-Signature`** 验签在 **API**（**`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`**）。YAML 头注释含 **可选** **`limit-rps` / `limit-connections`**（默认注释）；**不**替代 WAF/全链路速率模型/密钥轮换 Runbook。 |
| **examples/onboarding-internal-api-networkpolicy.example.yaml** | **可选**：限制 **API Pod** 入站仅来自 **Ingress Controller** 命名空间（**须**按集群改 **`namespaceSelector`** / **`podSelector`**）。YAML 头注释互指 **TT-9618 §3.5** 与 **internal Ingress**（**mTLS** / **limit-rps**）；**不**替代应用层 **`ONBOARDING_INTERNAL_WEBHOOK_*`**。 |

应用前全局替换占位 **`host`**、**`secretName`**、**`service.name`**、**`ingressClassName`**、**`namespace`**。
