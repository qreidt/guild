# Request: Read-only environment interfaces — 2D vs 3D bake-off (vertical slice)

|                  |                                                                                                                                           |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Linear [CQR-53](https://linear.app/cqr/issue/CQR-53/read-only-environment-interfaces-2d-vs-3d-bake-off-vertical-slice)                    |
| **Branch**       | `feat/interface`                                                                                                                          |
| **Captured**     | 2026-06-16                                                                                                                                |
| **User framing** | Minimal, steerable first pass — keep it easy to refactor after the direction is confirmed. Full bake-off retained (2D + 3D + comparison). |

> Raw request, captured for the refine → spec-workflow pipeline. Critical review
> lives in [`refined-brief.md`](./refined-brief.md).

---

## Why

The game has no visual interface. Selecting a building shows a raw object dump
(`<pre>{{ activeBuilding }}</pre>`, `src/App.vue:30`); only the Market has a real
panel (`src/components/buildings/MarketPanel.vue`). Players can't see what their
city is doing.

## Goal

Give each environment a **read-only** visual interface surfacing: active workers +
their current task (with progress), inventory, and funds — plus a global city view
for the "no active tab" state. This story does **not** build all environments; it
builds the shared foundation and **one 2D + one 3D prototype**, then picks a
direction.

## Approach — vertical slice + bake-off

1. Build a render-agnostic, reactive view-model once.
2. Render one environment in **2D** (SVG/CSS — Blacksmith interior) and one in
   **3D** (Three.js/TresJS — city-global overview), both reading that view-model.
3. Compare on effort, feel, performance, and maintainability → recommend the style
   for full rollout.

## Scope

**In scope:** view-model, view container/registry, 1× 2D prototype, 1× 3D
prototype, comparison write-up. Strictly read-only.

**Out of scope:** any state-mutating interaction (assigning workers, trading —
Market keeps its existing controls), worker/Adventurer naming, persistence, and
rolling the chosen style out to all 5 environments (follow-up issues, enumerated by
the comparison sub-issue).

## Data already available read-only (no engine changes needed)

- **Funds** → `building.money`; city → `city.money`, `city.citizens_count`
- **Workers/tasks** → `building.workers[].active_action` → `static.name` +
  `ticks_remaining`/`total_ticks` for progress
  (`src/game/city/buildings/common/Action.ts`, `Worker.ts`)
- **Inventory** → `building.inventory.getCountByGoodId()` + `ItemRegistry` for
  names/values

## Success criteria

From a glance at an environment, a viewer states (a) who's working + on what +
progress, (b) what's in stock, (c) funds — without reading code; **and** a
documented 2D-vs-3D recommendation with rollout follow-ups.

## Known constraints

- Workers are anonymous `Worker` instances (no names yet) — v1 labels them by index
  ("Smith 1").
- Reactivity must follow the `marketService` reactive-singleton pattern (see
  `src/App.vue:66`) so views refresh each tick.

## Sub-issues (build order)

1. Read-only environment view-model (shared data layer)
2. Environment view container + registry (replace the `<pre>` dump)
3. 2D environment prototype — Blacksmith (SVG/CSS)
4. 3D environment prototype — City-global overview (Three.js/TresJS)
5. 2D vs 3D comparison & direction decision

Dependency chain: 1 → 2 → (3, 4) → 5.

> **Update (as-built):** sub-issue 4 (the 3D City-global arm) was not cut — it was
> pursued and iterated into the [`3d-city-grid`](./3d-city-grid/request.md) sub-feature
> (grid map, walls/roads, denser housing, a port + storage, a debug grid, and removal of
> the on-canvas overlay/legend in favour of the top bar).

> **Update (as-built):** sub-issue 3 (the 2D Blacksmith arm) was iterated into the
> [`2d-buildings-interface`](./2d-buildings-interface/request.md) sub-feature — the smith
> figures and hammer animation were dropped for vertical progress rows under a themed
> banner. That layout was then **rolled out**: it is extracted into a shared
> `BuildingInterior2D` shell and the **LumberMill** and **IronMine** now have their own
> 2D interiors, so no production environment falls back to the generic view.
