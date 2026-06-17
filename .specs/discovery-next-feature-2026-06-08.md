# Discovery Plan: Next Feature After City Market

**Date:** 2026-06-08
**Product stage:** Existing pre-launch prototype (no users yet)
**Decision this informs:** Next-feature prioritization — a ranked, validated build plan for after the City Market (CQR-36)
**Discovery question:** Given the roadmap and the in-flight City Market, what should we build next in Guild?
**Focus chosen:** UI-facing validation

---

## Context

Guild is a Vue 3 + TypeScript + Vite browser city-management prototype. The current
playable surface is a one-screen city dashboard with tick controls and a building
sidebar; selecting a building shows a raw `<pre>` dump. The City Market feature
(CQR-36, 14 open Linear cards) is the work-in-flight. The roadmap points toward:
complete city resource loop → adventurer management → missions/expeditions → persistence.

Key existing-but-not-player-facing assets:
- Full `Adventurer` domain model (ranks, classes, 9 attributes, proficiencies, equipment slots)
- Equipment catalog (iron/wood/leather weapons + armor) with a durability model
- Transaction-based inventory plumbing

---

## Ideas Explored (roadmap-derived)

1. Save/Load persistence (localStorage)
2. Adventurer Roster UI
3. Equipment loadout + item transfer
4. Expeditions / Missions MVP (Forest zone)
5. Building detail panel + economy visibility
6. Building upgrades & construction
7. Market depth (spread, dynamic pricing, autonomous export — fills `market.console.ts` gap)
8. Equipment stat differentiation + durability getters
9. Crafting chain expansion (Tannery, Fletcher, Alchemist)
10. Console harness (`npm run console` headless REPL)

## Selected Ideas for Validation

| # | Idea | Rationale |
|---|------|-----------|
| 1 | Persistence | Lowest-cost enabler; nothing progresses without it (later — see note) |
| 2 | Adventurer Roster UI | Exposes an entire pillar already modeled in code |
| 5 | Economy visibility (building detail panel) | Core "readable economy" pillar; pattern exists (CQR-45) |

> Chosen via "Foundational 3" shortlist. Validation focus subsequently narrowed to **UI** —
> persistence (feasibility/sequencing) parked; effort concentrated on roster + economy UI.

## Critical Assumptions

| # | Assumption | Category | Impact | Uncertainty | Priority |
|---|-----------|----------|--------|-------------|----------|
| A | Persistence pays off now despite a churning data model (sequencing) | Viability | High | High | Leap of faith (parked) |
| B | A roster adds engagement without missions to use adventurers | Value | High | High | Leap of faith (parked) |
| C | Singleton/class-instance state serializes & rehydrates cleanly | Feasibility | High | Med-High | Critical (parked) |
| D | Players parse 9 attrs + proficiencies without overwhelm | Usability | Med | Med-High | **Targeted** |
| E | Economy visibility is valuable before upgrade/construction decisions | Value | Med | Med | **Targeted** |
| F | Detail panel is cheap & low-risk to build (MarketPanel pattern exists) | Feasibility | High-value/low-risk | Low | Just do it |

## Validation Experiments (UI focus)

| # | Tests | Method | Success Criteria | Effort |
|---|-------|--------|------------------|--------|
| X1 | E | Figma/paper mockup of building detail panel (inventory, workers, money flow), reusing CQR-45 MarketPanel layout | 5-second look → viewer states what the building produces, holds, earns | XS (~2h) |
| X2 | E, F | Thin read-only Building Detail Panel replacing `<pre>` dump, wired to live reactive state | You + 2–3 playtesters answer "what's this building doing & why" in <10s, no code-reading | S (1–2d) |
| X3 | D | Static roster mockup + 5-second test, flat vs. progressive-disclosure layouts | Viewer IDs an adventurer's role/strength at a glance; pick winning layout | XS (~3h) |
| X4 | D | Read-only Roster view wired to 3–4 seeded `Adventurer` instances (recruitment stubbed) | Roster scannable, adventurers distinguishable, decide what to hide behind "details" | S (1–2d) |

### Experiment details

- **X1 / X2 (Economy panel):** Hypothesis — a structured panel makes the sim legible where the
  `<pre>` dump does not. Measure via a think-aloud 5-/10-second test. Decision: if testers can't
  narrate the building's state, iterate layout before wiring more buildings.
- **X3 / X4 (Roster):** Hypothesis — progressive disclosure (summary card → expandable detail)
  beats a flat stat dump for the dense adventurer model. Measure via 5-second role-identification.
  Decision: adopt the winning layout as the roster spec; flag recruitment flow as a separate
  design decision (X4 seeds adventurers to sidestep it).

## Discovery Timeline

- **Day 1:** X1 + X3 mockups; run 5-second tests; pick layouts
- **Days 2–4:** X2 Building Detail Panel slice
- **Days 5–7:** X4 Read-only Roster slice
- **Day 8:** Synthesize; decide build order for full #5 and #2; revisit parked persistence (A/C)

## Decision Framework

- **X1/X2 succeed** → promote #5 to a full build (extend panel across all buildings); it's the safe enabler.
- **X3/X4 succeed** → commit #2 Adventurer Roster spec with the winning layout; open a recruitment-design card.
- **X3/X4 reveal overwhelm** → simplify the surfaced adventurer model (hide attributes until combat consumes them) before building.
- **Either UI proves hollow without payoff** → re-prioritize toward Expeditions MVP (#4) sooner to give roster/economy a purpose.
- **Parked (revisit after UI):** persistence sequencing (A) and serialization feasibility (C) — defer until the data model stabilizes post-Market.

## Open Questions / Design Gaps

- Recruitment: source, cost, and pool for adventurers (unspecified).
- Whether economy visibility needs player *decisions* (upgrades/construction, #6) to be meaningful.
- Persistence timing vs. data-model churn.
