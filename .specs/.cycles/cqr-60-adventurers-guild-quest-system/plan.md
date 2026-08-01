# Plan — Adventurers' Guild and the quest system (Phase 1)

> Companion to [`requirements.md`](./requirements.md) and [`request.md`](./request.md).
> Authored into the cycle (CQR-60).

## Overview

Four layers, built bottom-up, with one hard dependency: nothing can post until the
board exists.

1. **World** — `Location`, travel costs, and the forage table. Pure authored data.
2. **Quests** — the board service, the quest/objective types, and the resolver
   registry.
3. **Engine** — the `reviewQuests()` hook on `BaseBuilding`, the Apothecary's
   policy, and the `AdventurersGuild` building with its grid plot.
4. **View** — the `QuestRow` DTO and mapper, the composable, the 2D board panel,
   the 3D mesh, and the console command.

Nothing here introduces a new pattern. `marketService` is the template for the
service (a reactive singleton the engine and UI share), `Market` for a workerless
building, `ItemRegistry` for the resolver registry, `ApothecaryView2D` /
`ApothecaryMesh` for the art, and the existing console commands for the harness.

## Steering document alignment

No steering docs exist (`.spec-workflow/steering/` absent). The design follows
[`CLAUDE.md`](../../../CLAUDE.md) and the CQR-53 / CQR-59 cycles.

- TypeScript strict; no new `any`.
- Framework-agnostic domain logic in `src/modules/`; the engine in `src/game/`;
  Vue UI in `src/components/`.
- No store library — reactivity flows from `reactive(GameControllerSingleton)` and
  the per-tick `controller.tick` heartbeat.
- `three` / `@tresjs/core` imported only in `.vue` mesh components;
  `CityGlobalView3D.vue` stays lazy-loaded.

## Components

### `src/modules/world/location.ts` (new)

`Location` (`Town`, `Forest`), `TRAVEL_COST`, `FORAGE_TABLE`, plus `findChance` and
`forageLocationFor`. Difficulty is authored per location/item pair, so the same herb
can be plentiful in one place and absent from another without touching the item
definitions. The Town's table is empty on purpose — it is what makes the
obtainability check a real check.

Lives under `world/`, not `quests/`, because a location is a world concept
(`CONTEXT.md` files it under Places) and Phase 2's travel and foraging read it
directly. `Zone` is deliberately absent.

### `src/modules/quests/common.ts` (new)

`QuestStatus`, `Objective` (+ `GatherObjective` on a shared `ObjectiveBase` that
carries `location`), `Quest`, `QuestClaimant`, `Wallet`, and three errors.

`Wallet` is declared here rather than imported from `market/common.ts`: the two are
structurally identical and interchangeable at every call site, and the quest board
has no business depending on the market. If a third money-holder appears, lift both
into a shared module.

### `src/modules/quests/objectives.ts` (new)

The resolver registry — the one place that knows how to *read* an objective.
`summarize`, `isObtainable`, `isFulfilled`, `concerns`. Method-shorthand parameters
are bivariant in TypeScript (`strictFunctionTypes` exempts them), so a resolver for
one union member satisfies the widened registry entry with no cast, and dispatch
stays sound because key and value both come from `objective.kind`.

`plan()` — turning an objective into the next `Action` — is Phase 2's addition to
this same interface.

### `src/modules/quests/quest.service.ts` (new)

`post`, `claim`, `fulfil`, `getAll`, `getOpen`, `getByPoster`, `getOutstandingFor`.

The critical asymmetry: **`post()` returns `null` and never throws**, because it is
called from inside the tick loop where nothing catches (the same hazard
`Apothecary.chooseNextAction` already carries a comment about). Both refusals —
unaffordable, unobtainable — are legible in-game rather than exceptional. `claim`
and `fulfil` *do* throw, because they are called by an actor outside the tick loop
and misuse there is a bug worth surfacing.

### `src/game/city/buildings/common/Building.ts` (modify)

`BuildingID.AdventurersGuild`, plus the `reviewQuests()` no-op called from
`handleTick` before the worker loop.

### `src/game/city/buildings/Apothecary.ts` (modify)

`money` 100 → 1000; `reviewQuests()` implementing the three-clause policy; the
production list lifted to a module-level table carrying each recipe's reagent so
the brew loop and the quest loop read one source of truth.

### `src/game/city/buildings/AdventurersGuild.ts` (new) + `City.ts` (modify)

A thin `BaseBuilding` shell: no workers, a wait action that is never reached, and
registration in the city map.

### `src/components/environment/views/city/town-layout.ts` (modify)

One `BUILDING_PLOTS` entry, anchor `[3, 4]`. `buildOccupancy()` validates it at
module load and throws on a collision, so a bad anchor fails at boot rather than
overlapping silently.

### View layer (modify + new)

`QuestRow` in `environment-view/types.ts`; `mapQuestBoard` in
`environment-view.ts`; `useQuestBoard()` beside `useCityView()`;
`AdventurersGuildView2D.vue` and its registry entry;
`AdventurersGuildMesh.vue` and its `HERO_MODELS` entry.

### `src/console.ts` (modify)

`quests`, printing the mapped DTO. Plus `claim` / `fulfil` with a stubbed claimant,
which is what makes the state machine testable headlessly.

## Error handling

| Scenario | Handling |
|---|---|
| Poster cannot afford the reward | `post()` returns `null`, no debit. The board goes quiet, which is the intended "nobody's hiring" signal. |
| Objective unobtainable anywhere | `post()` returns `null` and warns — an authoring bug, not a game state. |
| Claiming a non-Open quest | `QuestNotClaimableError`. Outside the tick loop. |
| Fulfilling with the wrong claimant, or an unsatisfied objective | `QuestNotFulfillableError`. |
| Bad grid anchor | `buildOccupancy()` throws at module load, before anything renders. |

## Testing strategy

There is no test runner; `CLAUDE.md` says to verify via the dev server and
`vue-tsc`. The console harness is the substitute, and a good one — it drives the
same singletons the Vue app uses.

**One seam: the console command table.** The whole feature is observable through
it. `quests` prints the `QuestRow` DTO the panel consumes rather than the service's
internal objects, which collapses what would otherwise be a second seam (the view
mappers) into the first — free, because the mappers are pure and read-only.

Tests exercise external behaviour only: post, advance ticks, read the board.
Nothing reaches into service internals, and nothing asserts on *how* a quest got
onto the board — only that it did, with the right objective, reward, status and
poster.

The 3D mesh, the plot anchor and the panel layout are verified visually. No seam
for art.
