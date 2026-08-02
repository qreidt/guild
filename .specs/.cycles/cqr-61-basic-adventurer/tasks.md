# Tasks — The basic adventurer: claim, forage, deliver (Phase 2)

> Build order follows the dependency chain **1 → 2 → 3 → 4 → 5 → 6**. Tasks read
> [`requirements.md`](./requirements.md) (R0–R10) and [`plan.md`](./plan.md).
>
> Tasks 1 and 2 are prerequisites that touch working code for a feature that does
> not otherwise involve them — each lands as its own revertable commit before any
> adventurer code exists. Task 4 is the one that can crash the running game:
> `claim` and `fulfil` throw, and the adventurer calls both from inside the tick
> loop, where nothing catches.
>
> ---
>
> **All 6 tasks complete (2026-08-01, branch `CQR-61`).** `npx vue-tsc -b
> --force` clean; `npm run build` clean; the console harness reproduces the R10.1
> end state exactly and diffs clean across two runs at the same seed; the
> production preview renders the roster and the board's claimant with no console
> errors. Deviations are recorded as as-built deltas on the affected clauses in
> [requirements.md](./requirements.md) — the notable ones are **R4.1** (the
> planner returns steps, not actions — ADR 0006), **R7.5** (deferred settlement
> needed no `start()` override) and **R9.5** (the 3D guild mesh is still visually
> unverified; screenshots do not work in this environment).

- [x] 1. Prefactor — the action input origin is per-instance
  - File: `src/game/city/buildings/common/Action.ts` (modify), plus
    `Apothecary.ts`, `LumberMill.ts`, `IronMine.ts`, `BlackSmith.ts`
  - `input_origin` static → instance, mirroring `output_destination`; dropped
    from the `IAction` interface so base-class reads fail to compile. 17
    declaration sites.
  - Verified by diffing a 200-tick console run against the same run before the
    change — byte-identical.
  - _Requirements: R0.1–R0.3_
  - _Commit: `2ba61ed`_

- [x] 2. Shared seeded random and the console `seed` command (CQR-65)
  - Files: `src/modules/random/random.ts` (new),
    `components/environment/views/city/town-layout.ts`, `src/console.ts` (modify)
  - `mulberry32` lifted out of the layout; `actorSeed` generalising the layout's
    `cellSeed` mixing to a string id; `RandomStream` with a generation counter so
    `seed <n>` re-pins live streams.
  - _Leverage: `town-layout.ts`'s existing `cellSeed` pattern_
  - _Requirements: R1.1–R1.5_
  - _Commit: `69ea8a9`_

- [x] 3. Objective planning, and delivery inside settlement
  - Files: `modules/quests/{common,objectives,quest.service}.ts`,
    `modules/world/location.ts`, `src/console.ts`, `CONTEXT.md` (modify);
    `docs/adr/0006-*.md` (new)
  - `ObjectiveStep` union; `plan()` and `delivery()` on the resolver interface
    with gather's implementations; `planObjective()` short-circuiting a settled
    quest; `QuestClaimant.location`; `questService.get()`; `fulfil()` moving the
    goods before flipping the status; `travelCost` / `buildingLocation`; Deliver
    and Travel added to the glossary.
  - _Leverage: the Phase 1 resolver registry; `transactionService` as the
    validated debit/credit path_
  - _Requirements: R2.1–R2.4, R3.1–R3.2, R4.1–R4.4_
  - _Commit: `05ded21`_

- [x] 4. The adventurer, the roster service, and three actions
  - Files: `game/adventurer/Adventurer.ts`,
    `game/controllers/GameController.ts` (modify);
    `game/adventurer/actions/{Travel,Forage,Deliver}Action.ts`,
    `modules/adventurers/adventurer.service.ts` (new)
  - Name / location / active action / claimed quest / seeded stream / wallet
    getter / claimant getter; the `handleTick` → `chooseNextAction` → step switch
    loop with its narrow catch; the lazily-seeded roster ticked as a sibling to
    the city.
  - _Leverage: `Action` and its `shouldTick()` stall; `BaseBuilding.handleTick`
    as the shape of the loop; `GameController.city`'s lazy getter as the
    import-cycle precaution_
  - _Requirements: R5.1–R5.5, R6.1–R6.3, R7.1–R7.7, R8.1–R8.5_

- [x] 5. View layer — DTO, mapper, composable, panel, nav
  - Files: `modules/environment-view/{types,environment-view}.ts`,
    `components/environment/useEnvironmentView.ts`,
    `views/AdventurersGuildView2D.vue`, `App.vue`, `Layout.vue` (modify);
    `components/adventurers/AdventurerRoster.vue` (new)
  - `AdventurerView` + `mapAdventurer` / `mapRoster`; `claimantName` on
    `QuestRow`; `useAdventurerRoster()`; the read-only roster panel; a "People"
    section in the left menu. Also drops two dead engine imports from
    `Layout.vue`.
  - _Requirements: R9.1–R9.3, R9.5_

- [x] 6. Console harness and the five verification scenarios
  - File: `src/console.ts` (modify)
  - `adventurers` printing the mapped `AdventurerView` DTO; `quests` resolving
    the claimant's name; the debug `fulfil` stub given a location. Then run
    R10.1–R10.5.
  - _Requirements: R9.4, R10.1–R10.5_
