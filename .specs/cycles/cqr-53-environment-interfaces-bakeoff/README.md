# Cycle: Read-only Environment Interfaces — 2D vs 3D Bake-off

|              |                                                                                                                 |
|--------------|-----------------------------------------------------------------------------------------------------------------|
| **Linear**   | [CQR-53](https://linear.app/cqr/issue/CQR-53/read-only-environment-interfaces-2d-vs-3d-bake-off-vertical-slice) |
| **Branch**   | `feat/interface`                                                                                                |
| **Status**   | Planned — spec only, no implementation yet                                                                      |
| **Size**     | Large (full bake-off: shared layer + 2D + 3D + comparison)                                                      |
| **Snapshot** | 2026-06-16                                                                                                      |

> This is a **minimal, steerable plan**, not a finished design. It is expected to
> be refactored once the direction is confirmed — see [Steering points](#steering-points).

## Why

The game has no visual interface. Selecting a building shows a raw object dump
(`<pre>{{ activeBuilding }}</pre>`, [App.vue:30](../../../src/App.vue)); only the
Market has a real panel ([MarketPanel.vue](../../../src/components/buildings/MarketPanel.vue)).
Players can't see what their city is doing.

## Goal

Give each environment a **read-only** visual interface surfacing active workers +
their current task (with progress), inventory, and funds — plus a global city view
for the "no active tab" state. This cycle does **not** build all environments; it
builds the shared foundation and **one 2D + one 3D prototype**, then picks a
direction.

## Approach — vertical slice + bake-off

1. Build a render-agnostic, reactive **view-model** once.
2. Render one environment in **2D** (SVG/CSS — Blacksmith interior) and one in
   **3D** (Three.js/TresJS — city-global overview), both reading that view-model.
3. Compare on effort, feel, performance, and maintainability → recommend the style
   for full rollout.

## Scope

**In scope:** view-model, view container/registry, 1× 2D prototype, 1× 3D
prototype, comparison write-up. Strictly read-only.

**Out of scope:** any state-mutating interaction (assigning workers, trading — the
Market keeps its existing controls), worker/Adventurer naming, persistence, and
rolling the chosen style out to all environments (follow-up cycles, enumerated by
the comparison sub-issue).

## Build order

Dependency chain: **1 → 2 → (3, 4) → 5**.

| # | Sub-issue                                       | Output                                                                                   |
|---|-------------------------------------------------|------------------------------------------------------------------------------------------|
| 1 | Read-only environment view-model                | Shared, reactive data layer (the contract both renderers consume)                        |
| 2 | Environment view container + registry           | Replaces the `<pre>` dump; routes the active environment id to its registered view       |
| 3 | 2D environment prototype — Blacksmith           | SVG/CSS interior reading the view-model                                                  |
| 4 | 3D environment prototype — City-global overview | Three.js/TresJS scene reading the view-model; doubles as the "no active tab" global view |
| 5 | 2D vs 3D comparison & direction decision        | Write-up (lands as `./comparison.md`) + rollout follow-up cycles                         |

The 4 buildings (BlackSmith, IronMine, LumberMill, Market) + the city-global view
are the "5 environments" full rollout targets. The Market is special: it already
has `MarketPanel.vue` with controls and is excluded from the read-only treatment.

## Shared view-model — starting shape

Minimal contract only; refine during sub-issue 1. Both renderers depend on this,
nothing else.

```ts
interface EnvironmentVM {
  id: string;            // BuildingID
  name: string;
  funds: number;
  workers: WorkerVM[];
  inventory: InventoryLineVM[];
}

interface WorkerVM {
  label: string;             // index-based v1: "Smith 1", "Smith 2"
  task: string | null;       // active_action.name, or null when idle
  progress: number | null;   // 0..1 done, or null when idle
}

interface InventoryLineVM {
  itemId: string;
  name: string;
  count: number;
}

// "No active tab" global state, rendered by the 3D prototype.
interface CityVM {
  name: string;
  funds: number;
  citizens: number;
  environments: { id: string; name: string; funds: number }[];
}
```

## Read-only data sources

No engine changes needed — everything below already exists.

| Need                  | Source                                                          | Notes                                                                                                                                                                                                                             |
|-----------------------|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Building funds        | `building.money`                                                | per-building wallet                                                                                                                                                                                                               |
| City funds / citizens | `city.money`, `city.citizens_count`                             | header already binds these ([App.vue:7](../../../src/App.vue))                                                                                                                                                                    |
| Workers               | `building.workers[]` (`Worker[]`)                               | anonymous — label by index ("Smith 1")                                                                                                                                                                                            |
| Current task          | `worker.active_action?.name`                                    | ⚠ use the **instance** `name` (`'Wait'`, `'Transport'`). CQR-53 cites `static.name`, but `Action` declares `static name = ''` ([Action.ts:25](../../../src/game/city/buildings/common/Action.ts)), so that path resolves to `''`. |
| Task progress         | `1 - active_action.ticks_remaining / active_action.total_ticks` | 0 at start → 1 done; `ticks_remaining` is `999` until `start()` ([Action.ts:29](../../../src/game/city/buildings/common/Action.ts))                                                                                               |
| Inventory             | `building.inventory.getCountByGoodId()` → `Map<ItemID, number>` | also cached on `building._data.inventory` each tick ([Building.ts:47](../../../src/game/city/buildings/common/Building.ts))                                                                                                       |
| Item names / values   | `ItemRegistry[itemId]`                                          | `src/modules/items/registry.ts`                                                                                                                                                                                                   |

## Success criteria

From a glance at an environment, a viewer states **(a)** who's working + on what +
progress, **(b)** what's in stock, **(c)** funds — without reading code; **and** a
documented 2D-vs-3D recommendation with rollout follow-ups.

## Constraints & decisions

- **Read-only.** No mutation anywhere in this cycle.
- **Reactivity** follows the `marketService` reactive-singleton pattern
  ([App.vue:64-69](../../../src/App.vue)) so views refresh each tick — the engine
  and UI share the same proxy.
- **Workers are anonymous** (`Worker` has no name) — v1 labels them by index.
- **3D adds dependencies.** Three.js / TresJS are **not** in `package.json` today;
  sub-issue 4 introduces them. Keep the 3D prototype thin.

## Steering points

Revisit these once the first slice (sub-issues 1–2) is in hand and before sinking
effort into the 3D prototype:

- **Is the bake-off still worth it?** If the 2D Blacksmith prototype already feels
  right, the 3D arm (and its new dependency weight) may be cut early rather than
  built to completion.
- **View-model shape.** The interfaces above are a guess. Expect to refactor field
  names / nesting once the 2D renderer consumes them for real.
- **"No active tab" view.** Assigned to the 3D prototype here. If 3D is deferred,
  this state needs a cheap 2D/text city summary instead.
- **Registry mechanism.** How sub-issue 2 maps an environment id → its view (static
  map vs. dynamic component) is left open; pick the simplest thing that works.

## Out of scope / follow-ups

- Rolling the chosen style out to the remaining environments (one follow-up cycle
  per environment, enumerated by sub-issue 5).
- Worker / Adventurer naming.
- Persistence of any UI state.
- Any state-mutating interaction.

## Relation to prior discovery

The 2D Blacksmith prototype is the build-arm of experiment **X2** in
[discovery-next-feature-2026-06-08.md](../../discovery-next-feature-2026-06-08.md)
(thin read-only building detail panel replacing the `<pre>` dump). This cycle
extends that bet with a render-agnostic layer and the 3D comparison.
