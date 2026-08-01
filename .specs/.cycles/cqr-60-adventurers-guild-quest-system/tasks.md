# Tasks — Adventurers' Guild and the quest system (Phase 1)

> Build order follows the dependency chain **1 → 2 → 3 → 4 → 5 → 6**. Tasks read
> [`requirements.md`](./requirements.md) (R1–R9) and [`plan.md`](./plan.md).
>
> Nothing can post until the board exists, so tasks 1–2 gate everything. The one
> thing that can crash the running game is task 3: `reviewQuests()` runs inside the
> tick loop, where nothing catches — which is why `post()` returns `null` instead
> of throwing.
>
> ---
>
> **All 6 tasks complete (2026-07-31, branch `CQR-60`).** `npx vue-tsc -b --force`
> clean; the console harness reproduces the R8.4 end state exactly; the dev server
> renders the board panel and mounts the 3D city view with no console errors.
> Deviations are recorded as as-built deltas on the affected clauses in
> [requirements.md](./requirements.md) — the notable ones are R5 (locations live in
> a `world` module, not under `quests/`), R8 (`claim` / `fulfil` console commands
> added; `seed` moved to CQR-65) and R9 (ADR 0001 corrected).

- [x] 1. Locations and the forage table
  - File: `src/modules/world/location.ts` (new)
  - `Location` (`Town`, `Forest`), `TRAVEL_COST`, `FORAGE_TABLE`, `findChance`,
    `forageLocationFor`. Pure authored data — no Vue, no engine imports.
  - _Requirements: R5.1–R5.4_

- [x] 2. The quest board — types, resolver registry, service
  - Files: `src/modules/quests/common.ts`, `objectives.ts`, `quest.service.ts` (all new)
  - Three-state `QuestStatus`; `Objective` as a discriminated union with `location`
    on a shared base; the resolver registry keyed by `kind`; and the service with
    post / claim / fulfil / four queries, escrowing the reward at post time.
  - _Leverage: `modules/market/market.service.ts` (reactive singleton + wallet-param
    shape), `modules/items/registry.ts` (registry shape)_
  - _Requirements: R1.1–R1.5, R2.1–R2.6, R3.1–R3.5_

- [x] 3. The posting hook and the Apothecary's policy
  - Files: `src/game/city/buildings/common/Building.ts`, `Apothecary.ts` (modify)
  - `reviewQuests()` no-op on `BaseBuilding`, called once per tick from
    `handleTick` **before** the worker loop; the Apothecary's per-herb
    threshold / dedupe / affordability policy; `money` 100 → 1000; the production
    list lifted to one table carrying each recipe's reagent.
  - _Requirements: R4.1–R4.6_

- [x] 4. The Adventurers' Guild building and its plot
  - Files: `src/game/city/buildings/AdventurersGuild.ts` (new), `City.ts` (modify),
    `components/environment/views/city/town-layout.ts` (modify)
  - `BuildingID.AdventurersGuild`, the workerless building class, city
    registration, and the 2×2 plot at anchor `[3, 4]`.
  - _Leverage: `Market.ts` (workerless shape), `BUILDING_PLOTS` + `buildOccupancy`
    as the load-time correctness net_
  - _Requirements: R6.1–R6.5_

- [x] 5. View layer — DTO, composable, panel, mesh
  - Files: `modules/environment-view/{types,environment-view}.ts`,
    `components/environment/useEnvironmentView.ts`, `environment-registry.ts`,
    `views/CityGlobalView3D.vue` (modify);
    `views/AdventurersGuildView2D.vue`, `views/city/AdventurersGuildMesh.vue` (new)
  - `QuestRow` + `mapQuestBoard`, `useQuestBoard()`, the read-only board panel with
    no claim control, and the guild-hall mesh. Both registries take one line each.
  - _Requirements: R7.1–R7.4_

- [x] 6. Console harness and the verification scenario
  - File: `src/console.ts` (modify)
  - `quests` printing the mapped `QuestRow` DTO; `claim` / `fulfil` against a
    stubbed claimant with a debug purse. Then run the ~200-tick scenario.
  - _Requirements: R8.1–R8.4_
