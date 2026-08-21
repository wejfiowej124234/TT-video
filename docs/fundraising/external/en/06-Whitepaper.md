# TravelTrust — Investor whitepaper (protocol stack · governance & TTG boundaries)

> **30-second pre-read**: this is an **institutional note on the full travel-commerce stack** and risks; **not** a token-sale-only document. If you see “governance token” in filenames or search snippets, use this box + the Abstract as the controlling frame. **TTG (if any)** is for governance/budgeting—**not** default travel checkout—see Abstract below.

**TravelTrust · Investor materials** · Release **1.3** · May 2026

> **TTG V9 Mainnet Edition (Official protocol whitepaper · ACTIVE):** [`docs/whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md`](../../whitepaper/TT-TTG-V9-MAINNET-EDITION-WHITEPAPER-EN-LATEST.md) · Design Lock **DL_R1** · stamp `TTG_V9_MAINNET_EDITION_WHITEPAPER_PASS`. This investor note does **not** supersede V9 Token/Fee/Stake/Genesis ACTIVE semantics; on conflict, Mainnet Edition controls.

> **General information only**; **not** an offer of securities or virtual assets in any jurisdiction, and **not** investment, tax, or legal advice. Official disclosures, terms of service, and executed agreements control. This note expands architecture, roles, and market framing for **institutional DD**; **unspecified quantitative claims** (absolute TAM, forecasts, on-chain counts) are available only under **NDA** with **source, as-of date, and environment**—do not treat this as a full economic model or legal package.

---

## Abstract

TravelTrust is a decentralized travel-commerce stack: **Marketplace** for discovery and matching, **on-chain Escrow** for milestone-based release, **Dispute** and **Reputation** for verifiable fulfillment evidence, **Community** for support and growth, and **Governance** for procedural coordination of parameters and ecosystem budgets. An **optional governance token (TTG)** is intended for **governance voting/delegation and budgeting**, **not** as default pricing or Escrow settlement for travel orders—orders settle primarily in **allowlisted stable assets**.

The protocol may **never** issue TTG pending product and regulatory assessment. This document is **forward-looking**; deployment completeness and on-chain naming follow **public release and contracts**, and does not claim full production deployment in any jurisdiction.

**Skim path (reduce reading tax)**: if time-boxed, read **this Abstract → Section 06 (fee split denominators) → Section 11 (risks)**, then expand other sections as needed.

**Reading path**: lite [05-Litepaper.md](05-Litepaper.md) · FAQ [03-FAQ.md](03-FAQ.md) · Chinese [../06-Whitepaper.md](../06-Whitepaper.md).

---

## 01 Vision and industry context

### 1.1 Trust costs in global travel commerce

High-intent experiences (guides, bespoke itineraries) suffer **information asymmetry** and **weak verifiability**: service quality and dispute paths are often opaque; reputation is hard to port across platforms, raising **counterparty risk** and **cold-start** friction.

### 1.2 Limits of Web2 marketplaces

Centrally operated platforms excel at matching and payments but often exhibit: (1) **opaque rules** and appeals; (2) **custody narratives** misaligned with user funds reality; (3) **reputation** detached from provable transaction evidence; (4) high cost of **cross-border disputes**. DD usually asks whether escrow, rules, and evidence can be made **auditable** without destroying UX.

### 1.3 Why on-chain escrow matters

TravelTrust uses **Escrow** as the settlement ritual: funds move under **on-chain constraints** tied to milestones and dispute branches (implementation and rollout as publicly disclosed). The goal is **crypto-native assurance** on high-dispute-value steps—not replacing all Web2 UX—while keeping **FeeRouter** and **governance** flows narratively separate from **user principal** (see **Section 06**).

---

## 02 Market opportunity (framework and discipline)

### 2.1 How we use TAM / SAM / SOM

This document **does not** state unaudited market-size absolutes. **TAM / SAM / SOM** are provided **under NDA** with **traceable sources, as-of dates, and definitions**. Public narrative emphasizes **structure**:

- Digitization of travelers and experience supply still expands;
- **Cross-border, guide-led, long-tail SKUs** are trust-sensitive;
- **Web3 infrastructure** makes programmatic escrow and governance feasible.

### 2.2 Online travel and experiences (qualitative)

Investor comps focus on mobile adoption, experiences growth, take-rate structure, dispute/refund rates, and regional regulation. TravelTrust anchors on **fulfillment certainty** and **portable reputation**, not a single “on-chain GMV” slogan.

### 2.3 Window for Web3 + travel

The window joins rising demand for **transparent rules** and **self-custody options** with improving **wallet UX** and chain costs. Risks: see **Section 11 (adoption and execution)**.

### 2.4 Why now (institutional evidence framing—qualitative, no undisclosed absolutes)

Funds assess **whether the structure holds**, not a single headline. TravelTrust’s public argument chain:

1. **Demand**: guided/experience inventory is **fulfillment-sensitive**—disputes/refunds erode margin and brand; **auditable rules** fit risk models better than “trust us.”  
2. **Supply**: providers need **portable reputation** and **clear release rules**; repeated cold start across channels raises CAC.  
3. **Technology**: escrow contracts, AA/wallets, and compliant stable settlement make “on-chain escrow + off-chain UX” more buildable (chain/environment as released).  
4. **Regulation**: consumer protection and **fund-path disclosure** expectations are rising—**separating principal from protocol fees** supports long-term compliance dialog (**not** legal advice).

**Public boundary on “wait a year” (qualitative)**: **Not** a call to subscribe or a performance promise; only why funds often pair **structural windows** with **execution readiness**. (1) **Fragmented distribution** increases need for **embeddable custody/dispute** in B2B integrations—waiting does not reverse direction, only **who ships auditable templates first**. (2) **Disclosure pressure** does not soften by deferring—early, auditable **principal vs fee** language helps pilot conversations. (3) **Maturing rails** move competition from “can it demo?” to **scalable pilots**—gaps are **execution and disclosure readiness**, see **§10.2** and **§11**.

**Evidence pack** (structure, comps, regulatory memos, metric dictionaries) is **NDA**; **no** unaudited TAM printed here.

### 2.5 Market structure shifts (qualitative)

- **Long-tail inventory** rises—need **standard milestones + standard settlement ritual**.  
- **Distribution fragments**—traffic is not only super-apps; brands/communities/KOLs need **embeddable escrow/dispute rails**.  
- **Payments & compliance**: stables plus local rails; public stance stays **allowlisted settlement + principal isolation**.

### 2.6 User behavior trends (qualitative)

- **Pre-trip research deepens**—video/community/multi-tab compare; **verifiable trust** beats vanity stars.  
- **Sensitivity to “where money sits and when it moves”**—especially cross-border and high-ticket services.  
- **Willingness to trade for transparent rules** if **UX stays strong** and **disputes are legible**—product risk is UX, not chain alone.

---

## 03 Protocol architecture (subsystems)

Layering for **DD dialog** (product map as in deck vectors):

| Subsystem | Role | Money / governance |
|-----------|------|---------------------|
| **Marketplace** | Discovery, listing, matching, quotes, checkout | Order intent; **not** identical to final on-chain settlement state |
| **Escrow** | Lock, milestone release, refund branches | **User principal**; **isolated** from protocol-fee paths |
| **Dispute** | Evidence, arbitration/mediation orchestration | **Arbitration fees / slashing** are **orthogonal** to allocatable-fee pies |
| **Reputation** | Ratings, credentials, display | Network effects; **not** automatically TTG incentives |
| **Community** | Help, content, supply onboarding | Growth; pairs with **GTM** |
| **Governance** | Parameter and budget procedures | **TTG** (if any) for votes; **timelock** patterns in **Section 08** |

**Text topology**: `Marketplace → Order → Escrow → Fulfillment → {Release | Dispute} → Reputation → Community`; **Governance** and **FeeRouter** operate on **parameters/budgets**, **not** user Escrow principal custody logic.

---

## Addendum 03 · Competitive landscape (qualitative matrix)

For **IC memos / DD calls**—no market-share numbers; named comps and bands **NDA**. Core claim: **fulfillment evidence + escrow ritual + integrated stack**, not a single category label.

| Axis | Typical Web2 travel / OTA | Typical crypto payments/wallets | TravelTrust stack |
|------|---------------------------|-----------------------------------|-------------------|
| **Primary object** | Matching & inventory | Asset transfers & accounts | **Travel order fulfillment + escrow** |
| **Trust** | Platform brand + support | On-chain finality | **Escrow state machine + auditable rules** |
| **Disputes** | Often opaque appeals | Usually not productized | **Structured disputes/resolvers (orthogonal fee denominators)** |
| **Reputation** | In-walled gardens | Address/credentials | **Tied to order/dispute outcomes** |
| **Token default** | Usually none | General-purpose layers | **TTG for governance/budget only—not travel payment** |

**How to read it**: TravelTrust does **not** claim to replace all Web2 demand; it offers **embeddable custody/dispute infrastructure** with **FeeRouter** for allocatable fees (**public layer: 100% / 45% / 55%** only—Section 06).

---

## 04 Role model

| Role | Responsibility | DD focus |
|------|----------------|----------|
| **Traveler** | Browse, order, fund Escrow, accept, review | Fund safety, dispute rights, privacy minimization |
| **Guide / Provider** | Deliver, proofs, comms | Collateral/slashing (if any), appeals |
| **Arbitrator / Resolver** | Decide under rules, trigger release/refund | Incentives, credentials, **fee denominator** separation |
| **Community moderator** | Norms, non-chain triage | Boundary vs formal **Dispute** |
| **Treasury** | Protocol treasury for **non-user-principal** flows (if on-chain) | Multisig/custody disclosures |
| **Governance participant** | Propose, vote, delegate | **TTG** vs **settlement asset** separation |

---

## 05 Lifecycle and state machine

Institutional whitepapers expect an end-to-end path:

**Discover → Match → Escrow → Fulfillment → Dispute (optional) → Settlement → Reputation → Community**

Notes:

- **Escrow** and **Settlement** conditions follow **released contracts** and **terms**;
- **Dispute** may overlap parts of fulfillment—**must not** be merged into the **FeeRouter first-layer** percentage story without footnotes;
- **Reputation** should trace to **orders and dispute outcomes**, not social hype alone.

---

## Addendum 05 · Narrative case journey (teaching example)

> **Note**: **Educational, anonymized** story to show how evidence closes loops—**not** any real order, amount, or return; assets/chains/contracts per **terms and release**.

**Players**: traveler **Alex**, guide **Sam** (pseudonyms).

1. **Discover / Match**: Alex finds Sam’s SKU, confirms milestones and quote, order intent created.  
2. **Escrow fund**: Alex deposits per rules into **Escrow** (allowlisted stables, etc.); on-chain state: “in fulfillment.”  
3. **Fulfillment**: Sam delivers and uploads **proofs** (off-chain/on-chain pointers as implemented).  
4. **Path A — no dispute**: Alex accepts milestone; Escrow **releases** to Sam; **Reputation** records clean close.  
5. **Path B — dispute**: Alex opens **Dispute**; resolver rules **partial release / full refund / extension**, etc. (**Arbitration economics ≠ FeeRouter 45%/55% denominator**—footnote always).  
6. **Reputation / Community**: Outcomes update reputation; Sam’s **verifiable history** helps cross-channel work; Alex gets help content.

**DD prompts from the story**: Are Escrow and FeeRouter on **separate slides/ledgers**? Are dispute fees **footnoted away** from **45%/55%**? How are proofs handled with **privacy minimization**?

---

## 06 FeeRouter and value flows (published percentages)

### 6.1 Three flows: principal, protocol fees, governance agenda

- **Principal flow**: funds in **Escrow** follow **release rules**; not the “allocatable fee” numerator.  
- **Protocol fee flow**: **allocatable order fees** entering **FeeRouter**—public narrative expands only through **first layer** here.  
- **Governance flow**: **TTG** (if any) coordinates **parameters and budgets**; does **not** change Escrow ownership logic per order.

### 6.2 Published first-layer split (illustrative)

- **100%** of **allocatable platform fees** closes the router numerator only; **excludes** user-paid on-chain gas.  
- **First layer (illustrative)**: national/regional allocatable bucket **~45%**; **Global Pool ~55%**. **Internal** Global splits (incentive, reserve, ops) follow the **executed economics addendum**—**not** expanded here when not locked in public disclosure.  
- **Arbitration fees** and **performance slashing** are **orthogonal** to the **45%/55%** story—separate denominators; do **not** merge into one pie without footnotes.

### 6.3 Boundary diagram (narrative discipline)

Operate with three logical ledgers: **Escrow principal**, **fee routing**, **treasury/governance**—and **one layer of percentages per slide** when speaking publicly.

---

## 07 TTG utility and boundaries

### 7.1 Intended utility (charter-final)

1. **Governance**: votes on **parameters** (fee tiers, allowlist processes) under **timelock**, multisig, and risk thresholds.  
2. **Delegation**: delegate voting power to representatives (implementation and caps as released).  
3. **Treasury / budget**: procedural votes on **treasury** spend; separate custody disclosures.  
4. **Incentives**: contributor pools must avoid **guaranteed yield** narratives and **formulaic dividends** tied to order principal.

### 7.2 What TTG is **not** (unless re-reviewed and disclosed)

Not default **travel payment**; not **equity**; not **co-mingled** Escrow settlement; not a **fixed-return** instrument.

### 7.3 Supply, allocation, vesting

Not fixed herein; **inflation/burn** (if any) needs economic intent and **user-fund isolation**. Chain follows deployment (**EVM-compatible** baseline today).

---

## 08 Governance framework (roadmap)

Roadmap-level components—completeness as per **public release**:

| Component | Intent |
|-----------|--------|
| **Timelock** | Delayed execution; reduce acute governance attacks |
| **Governor (or equivalent)** | Proposal and voting lifecycle |
| **RegionVault** | On-chain custody/forwarding aligned with **national/regional fee bucket** (naming as implemented) |
| **DAO process** | Quorum, review periods, emergency pause—**jurisdiction-dependent** |

**Compliance**: on-chain governance may intersect with **securities/VASP** rules; counsel and regional gating apply.

---

## 09 Go-to-market

### 9.1 Supply

Guide/provider onboarding: agreements, **KYB/KYC** as required, SKU standardization, **fulfillment tooling**, Escrow milestone templates.

### 9.2 Demand and community

Content matrix, destination depth, traveler education (**not investment advice**), ambassadors under **non-manipulation** rules.

### 9.3 KOLs and channels

Disclosed partnerships; channel economics separate from **protocol fee** accounting where applicable.

### 9.4 Partners

OTAs, DMCs, payments/compliance—joint offerings without compromising **Escrow** independence.

### 9.5 Regional strategy

Rollout per jurisdiction: licensing, advertising, token communications may **diverge**; priorities under **NDA**.

---

## 10 Moats and differentiation

| Dimension | Mechanistic (non-absolute) |
|-----------|------------------------------|
| **Fulfillment data** | On-chain Escrow events, dispute outcomes, releases |
| **Reputation** | Credentials tied to service history (privacy conscious) |
| **Dispute network** | Rule-bound resolution; **fee denominator** separation |
| **Integrated stack** | Marketplace, escrow, dispute, community as **one product system** |

### 10.1 Moat as network effects (mechanism-first, no secret metrics)

- **Fulfillment network**: more **structured closes and disputes** → better resolver playbooks and risk controls (**not** a promised scale stat).  
- **Reputation network**: more verifiable history → providers **reuse trust across channels** (depends on UX/privacy).  
- **Data loop (lawful)**: **consented / lawful** aggregates to improve risk and templates—**not** undisclosed PII resale.  
- **Protocol loop**: partners embed custody/dispute APIs; **FeeRouter** + **RegionVault** keep **auditable economic boundaries** (public still **100% / 45% / 55%** first layer).

### 10.2 Why Win: product viability → network durability (institutional framing)

Mechanism chain from **single-product clarity** to **self-reinforcing network**—**not** a performance warranty; adoption/regulatory/execution risks stay in **Section 11**.

- **Supply:** on-chain Escrow + legible milestones reduce fear on high-friction, higher-ticket services; verifiable fulfillment history supports **cross-channel reuse** (community, KOL, B2B); tooling-led onboarding (SKU templates, dispute/help, **KYB/KYC** as required) targets **repeatable supply growth** (execution-dependent).  
- **Demand:** visible Escrow + legible disputes support cross-border/premium intent; retention/referral lean on **provable outcomes**; **no default TTG payment**; **allowlisted stables** parallel familiar pay rails.  
- **Data loop:** more structured closes/disputes → better risk/resolver playbooks → lower perceived counterparty risk (**logic**, not a GMV promise); data stays **lawful, consented, minimized**—**not** undisclosed surveillance/resale.  
- **Flywheel:** clear rules → trust-sensitive trials → orders/events compound → reputation → better supply → dispute mix can improve → referrals—any broken hop (UX, compliance, liquidity) stalls; needs **four-track** execution (product/protocol/market/compliance).  
- **Embedding cost:** custody/dispute/fee routing binds accounting, support, and disclosures to the **published first-layer fee boundary (100%/45%/55%)**; rip-and-replace implies **reconciliation + retraining** (**practical stickiness**, not a monopoly guarantee).  
- **Regional path:** prove Escrow + disputes + disclosures in **one or few jurisdictions**, then replicate where **RegionVault / national bucket** narrative aligns; token messaging/licensing may diverge; **TTG governance** (if any) focuses on **parameters/budgets**, isolated from **user principal** (**not** legal advice).  
- **Value capture:** allocatable fees enter **FeeRouter**; public story stops at **first layer**; inner splits follow **executed annexes**; network value from **higher-quality density** + **lower unit dispute cost**, not subsidy races; “irreversible” in public copy means **structural inertia** when flywheels compound—**not** perpetual monopoly or promised returns.

---

## 11 Risks

### 11.1 Regulatory

Token classification; marketing limits; possible **non-issuance** or **geo blocks**.

**Qualitative branches (not forecasts, not legal advice)**: a fast IC scan of “if rules tighten, does the public story still cohere?”—**not** a promise of outcomes.

- **Stricter promotion:** no public token selling; **TTG may never issue** (intro + **§07**).  
- **Consumer custody pilots constrained:** narrow to **B2B embed / licensing** + disclosure packs; counsel under **NDA**.  
- **Higher fund-path disclosure:** reinforce **principal vs protocol-fee rails** + auditable exports; operating metrics **NDA**.

### 11.2 Smart contracts and upgrades

Bugs, key management, oracles/bridges (if used)—audit, bug bounty, staged rollout.

### 11.3 Adoption and execution

Supply cold start, traveler habits, competition; roadmap may change materially.

### 11.4 Token and markets

Liquidity, volatility, governance attacks, delegation concentration.

### 11.5 General

Forward-looking only; **no performance guarantee**. **Token value is not guaranteed.**

---

## 12 Roadmap (qualitative)

- **Near term**: demonstrable main chain (market→order→escrow→dispute/ratings→reputation→community); **no** blanket “fully live in production” unless formally announced.  
- **Mid term**: fee routing and governance **staged** by jurisdiction and audit; **RegionVault** and **Governor** wiring subject to safety and compliance review.  
- **Long term**: multi-region expansion; RWA/bridge ideas require **separate** legal and technical review.

Quarterly detail under **NDA**; public materials **do not replace** executed agreements.

---

## 13 Appendix

### 13.1 Glossary (excerpt)

- **Escrow**: on-chain custody of order funds under release rules.  
- **FeeRouter**: router for **allocatable** order fees (**45% / 55%** first-layer illustrative).  
- **TTG**: governance token ticker, **if issued**.  
- **Allocatable platform fees**: the **100%** numerator domain—**excludes** gas and **user principal**.

### 13.2 Disclaimer

General information; not an offer. Percentages and mechanics are **disclosure-final**.

### 13.3 In-pack references

- [05-Litepaper.md](05-Litepaper.md)  
- [03-FAQ.md](03-FAQ.md)  
- [01-OnePager.md](01-OnePager.md)  
- Chinese: [../06-Whitepaper.md](../06-Whitepaper.md)

### 13.4 DD-style Q&A (public boundary)

Illustrative **investor questions** vs **public-safe answers**; numbers, comp legal reviews, and chain exports—**NDA**.

| Question | Public answer highlights |
|----------|--------------------------|
| **OTA vs infra?** | Both **consumer UX** and **embeddable custody/dispute**; no claim to flip incumbents overnight. |
| **TTG vs order funds?** | **Separated**: allowlisted settlement for Escrow; TTG is governance/budget only (if issued). |
| **Do 45%/55% include arbitration/slashing?** | **No**—separate denominators; see Section 06. |
| **Evidence for “why now”?** | **Structure + behavior + tech** (Sections 2.4–2.6); **TAM absolutes** only NDA. |
| **Top failure modes?** | Adoption, regulatory, contracts, governance attacks (Section 11); no performance warranty. |
| **How to verify deployment?** | **Contract addresses, environment labels, audit/runbook blurbs** as released—detail NDA. |
| **Vs other Web3 travel?** | **Fulfillment-first**, token not payment by default; matrix in **Addendum 03**. |
| **Why Win in one chain?** | Supply reuse + demand trust ritual + escrow flywheel + embedding + regional rollout; see **§10.2**, not a performance warranty. |

Full FAQ: [03-FAQ.md](03-FAQ.md).
