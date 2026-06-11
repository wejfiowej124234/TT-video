# TravelTrust — Litepaper (English)

**TravelTrust · Investor materials** · Release **1.3** · May 2026

> Mid-depth reader between the executive summary and the full investor whitepaper. **Not** an offer or investment advice. Token boundaries, FeeRouter math, and risks: [06-Whitepaper.md](06-Whitepaper.md). **Market absolutes and forecasts**: **NDA** only.

**Product demo / screen-recording engineering SSOT (internal · Phase ①)**: **`/`** Web3 travel home · **`/market`** (**`/discover`→`/market`**) — **[LANDING-MARKET-PAGES-CODE-SSOT](../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** · **[PM demo script](../../product-manager/24-产品经理核心产品路径与演示脚本.md)**.

---

## Abstract

TravelTrust decomposes travel trust into **Marketplace**, **on-chain Escrow**, **Dispute**, **Reputation**, **Community**, and **protocol Governance**. An **optional TTG** is for **governance and ecosystem budgeting**—**not** default payment for travel at MVP stage; settlement uses **allowlisted stable assets**. Capabilities and contract boundaries **mature with each public release**; **final completeness and naming follow published contracts**.

---

## Reading path

1. First touch: [01-OnePager.md](01-OnePager.md)  
2. Protocol/custody emphasis: [02-Investor-Executive-Summary.md](02-Investor-Executive-Summary.md)  
3. **This litepaper**  
4. Full protocol + token framing: [06-Whitepaper.md](06-Whitepaper.md)  
5. Chinese: [../05-Litepaper.md](../05-Litepaper.md)

---

## 01 Problem

Trust and settlement between guides/providers and travelers are costly: asymmetry, weak verifiability, opaque disputes, non-portable reputation. **Escrow**, **auditable state transitions**, and **structured disputes** reduce counterparty risk; **governance** (with TTG if launched) votes on parameters and budgets **without** mingling **user Escrow principal**.

---

## 02 Market opportunity (framework)

No unaudited **TAM** absolutes in public copy. **TAM / SAM / SOM** under **NDA** with **sources and definitions**. Structural beliefs:

- Experiences, cross-border, long-tail SKUs are **fulfillment-sensitive**;
- Users want **verifiable rules** and **transparent fund paths**;
- Infrastructure and wallet UX make **on-chain escrow + compliant disclosure** more realistic.

---

## 03 Protocol subsystems (lite)

| Layer | One-liner |
|-------|-----------|
| **Marketplace** | Discovery, matching, checkout |
| **Escrow** | **User principal** lock and release |
| **Dispute** | Evidence and resolution orchestration |
| **Reputation** | Outcomes become visible trust signals |
| **Community** | Help, content, supply growth |
| **Governance** | Parameters and budgets (**TTG**, if any) |

Text topology: `Discover → Match → Escrow → Fulfillment → (optional) Dispute → Settlement → Reputation → Community`.  
**FeeRouter** only routes **allocatable order fees**; **never** narratively merge with Escrow principal—**published first-layer percentages and the 100% closure** are **only** in [06-Whitepaper.md](06-Whitepaper.md) **Section 06** (this litepaper avoids restating them to prevent duplicate number narratives).

---

## 04 Roles (lite)

**Traveler** funds Escrow; **guide/provider** delivers and proves; **arbitrator/resolver** decides under rules (**fee denominators orthogonal** to first-layer fee split); **community** supports norms; **treasury and governance actors** handle **non-user-principal** flows. Full table: whitepaper **Section 04**.

---

## 05 Lifecycle (lite)

Institutions expect **Discover → Match → Escrow → Fulfillment → Dispute → Settlement → Reputation → Community**. Binding rules live in **contracts + terms**; public decks stay **qualitative**.

---

## 06 TTG (lite conclusions)

| Dimension | Statement |
|-----------|-----------|
| **For** | Governance voting/delegation, budgeting procedure (charter-final) |
| **Not by default** | Travel quote/settlement, Escrow co-mingling, equity story, guaranteed yield |
| **Supply** | **Not fixed** here; follow issuer disclosures |

Protocol may **never** issue TTG; no price/utility promise.

---

## 07 Go-to-market (lite)

Supply onboarding and tooling; demand via content and community (**not investment advice**); partners across payments/compliance/channels with disclosure; **regional** token/marketing limits—detail **NDA**. Full: whitepaper **Section 09**.

---

## 08 Moats (lite)

**Verifiable fulfillment data**, **reputation**, **dispute network**, **integrated stack**—mechanistic, not monopolistic.

**Institutional Why Win** (product → network) with compliance framing: [06-Whitepaper.md](06-Whitepaper.md) **Section 10.2**.

---

## 09 Risks (categories)

Regulation; contracts/upgrades; adoption/execution; token markets and governance attacks—**no performance warranty**. Enumeration: [06-Whitepaper.md](06-Whitepaper.md) **Section 11**.

---

## 10 Roadmap (lite)

Near-term **demonstrable main chain**; fee/governance **staged** under compliance/audit; quarterly **NDA**. Public notes **do not replace** agreements.

---

## Appendix: document split

- **This file**: medium-diligence **short read** (~8–12 pages PDF target); **deep narrative including §10.2 Why Win** lives in **[06-Whitepaper.md](06-Whitepaper.md)**—do not duplicate full whitepaper text here.  
- **[06-Whitepaper.md](06-Whitepaper.md)**: full architecture, FeeRouter, governance, risks, institutional framing.  
- **07-Protocol-Tokenomics** (shipped PDF): vectors + **same economic boundary** as **06** (no undisclosed percentages).
