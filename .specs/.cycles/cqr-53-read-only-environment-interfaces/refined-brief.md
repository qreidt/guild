## Refined Request Brief

> Output of `refine-request` (re-run **2026-06-17**, verified against the codebase)
> for [`request.md`](./request.md) (CQR-53). **Supersedes the prior brief.** Resolves
> the critical review below into a hand-off for `spec-workflow-mcp`. Suggested
> spec-workflow spec name: **`read-only-environment-interfaces`**.

**Goal:** Give each environment a strictly read-only visual interface (active workers
+ current task + progress, inventory, funds) plus a city-wide background scene, and
decide the game's **environment art direction** by rendering one environment as 2D
art and one as 3D art over a shared, render-agnostic view-model.

**Task size:** **Large** — shared view-model + view container/registry + 2D art
prototype + comparison write-up. The 3D arm is in scope but **cut-able** (see
decisions), so realized size can land at Medium if 3D is dropped early.

---

### Framing correction (from refinement Q&A 2026-06-17)

The "2D vs 3D bake-off" is an **art-direction** decision: how the game's
*environments are rendered* — illustrated **2D** scenes (SVG/CSS) vs rendered **3D**
scenes (Three.js/TresJS) — with the read-only data (workers/task/progress, inventory,
funds) **surfaced over / within the art**. It is *not* a "which dashboard/chart
library" comparison. The data layer (view-model) is shared and render-agnostic; only
the *art* differs between the two arms.

The **city-global** view is "the city shown in the background" — an ambient
establishing scene for the no-active-tab state — **not** a per-building aggregation
dashboard.

### Decisions (refinement Q&A 2026-06-17)

- **Task labels → raw identifier.** Surface the action label as-is
  (`MakeIronSword`, `MineOres`, `WaitAction`). No humanization this pass; a formatter
  or label map is an easy later refinement (steering point).
- **3D arm → 2D first, 3D is a cut-able spike.** Build the 2D Blacksmith fully; build
  the 3D city-global only far enough to compare, and **cut it before completion if the
  2D arm already feels right.** Matches the "minimal, steerable first pass" framing.
  *(Update — as-built: the 3D arm was **not** cut; it was pursued as the primary 3D
  direction and iterated into the [`3d-city-grid`](./3d-city-grid/request.md)
  sub-feature — grid map, walls/roads, denser housing, a port + storage, debug grid.)*
- **Global view → city-as-background art scene** + city-level info already in the
  header (`city.money`, `city.citizens_count`). No city-level *aggregate* shape is
  required in the view-model for this slice.

---

### Scope

- **In:** render-agnostic reactive read-only **view-model**; environment **view
  container + registry** replacing the `<pre>` dump ([App.vue:30](../../../src/App.vue#L30));
  **1× 2D art prototype** — Blacksmith interior (SVG/CSS) surfacing workers + current
  task + progress, inventory, funds; **1× 3D art prototype** — city-global background
  scene (Three.js/TresJS), *cut-able*; **written 2D-vs-3D art-direction
  recommendation** (effort, feel, performance, maintainability) with enumerated
  rollout follow-ups.
- **Out:** any state mutation (assigning workers, trading — Market keeps its existing
  controls); worker/Adventurer naming; persistence; **label humanization**;
  **recipe-threshold / production-choice surfacing** (listed in the superseded
  interface-controls milestone but deferred); rolling the chosen art style out to the
  remaining environments (follow-up cycles).
- **This pass:** generate the spec only (Requirements → Design → Tasks via
  spec-workflow). **No implementation** — stop before Phase 4.

### Key behaviors

- Glance at an environment → viewer states who's working + on what + progress, what is
  in stock, and funds — without reading code (raw action identifiers are acceptable as
  labels).
- Views refresh **each tick** by deriving from the already-reactive `GameController`
  proxy ([App.vue:64](../../../src/App.vue#L64)) — see reactivity correction below.
- The "no active tab" state renders the city-global background scene (the 3D arm in
  this slice).

### Acceptance criteria

- [ ] From a glance, a viewer reports (a) workers + task + progress, (b) stock,
  (c) funds — no code-reading. Verified on the **Blacksmith** (2 workers, live
  recipe actions).
- [ ] The 2D (Blacksmith) art prototype and the 3D (city-global) art prototype both
  read the **same** view-model.
- [ ] A written 2D-vs-3D **art-direction** recommendation (effort, feel, performance,
  maintainability) with enumerated rollout follow-ups — produced even if the 3D arm is
  cut early (record why it was cut and what was learned).

---

### Corrections — to the source request *and* the prior brief

1. **Task label: the prior brief had it backwards — revert toward the original
   request.** The prior brief told the spec to read `active_action.name` (instance
   property). Verified against the real action classes:

   | Action (real instance) | `active_action.name` (prior brief) | `active_action.static.name` (≡ `constructor.name`) |
   |---|---|---|
   | `MakeIngot` + every Blacksmith recipe | **`undefined`** | `"MakeIngot"` |
   | `SellOres` / `SellWood` (transport) | `"Transport"` (generic) | `"SellOres"` (specific) |
   | `WaitAction` | `"Wait"` | `"WaitAction"` |

   The Blacksmith's production actions set `static name = '…'` and **no** instance
   `name` (e.g. [BlackSmith.ts:90-91](../../../src/game/city/buildings/BlackSmith.ts#L90)),
   so `active_action.name` is `undefined` for *every* action the 2D prototype renders.
   **Use `active_action.constructor.name` (≡ `active_action.static.name`)** — it is
   defined and specific for all concrete actions; it is `''` only on the abstract
   `Action` base ([Action.ts:25](../../../src/game/city/buildings/common/Action.ts#L25)),
   which is never instantiated.

2. **Progress edge cases.** `ticks_remaining` is `999` until `start()`
   ([Action.ts:29](../../../src/game/city/buildings/common/Action.ts#L29)); `start()`
   runs synchronously in `handleTick` so the UI rarely sees it, but a `Worker` begins
   with `active_action === null` ([Worker.ts:8](../../../src/game/city/buildings/common/Worker.ts#L8)).
   View-model must handle a **null active action** (idle) and **clamp progress to
   [0,1]**. Progress = `1 - ticks_remaining / total_ticks`.

3. **Night-frozen progress.** `MineOres`, `SellOres`, `TakeDownTree`, `MakeWood`,
   `SellWood` override `shouldTick() → !isNight()`, so their progress **freezes at
   night** (worker is "active" but not advancing). Blacksmith actions have **no** night
   guard. The view-model should be able to distinguish *working* vs *stalled* (at least
   noted for the 3D/rollout; not critical for the Blacksmith 2D prototype).

4. **Reactivity mechanism — NOT the `marketService` pattern.** The prior brief said to
   follow the `marketService` reactive-singleton pattern. That pattern is **Market-only**
   (MarketService is `reactive()` at its source). Buildings have no such wrapper; their
   reactivity comes from `reactive(GameControllerSingleton)`
   ([App.vue:64](../../../src/App.vue#L64)) because tick entry points (`c.nextTick`,
   `c.resume`) are invoked *through that proxy*, so nested building mutations propagate.
   **The view-model must derive building state from that reactive `c` / `city` /
   `buildings` chain — not from raw singleton imports** — or reads won't be reactive.
   Verifying per-tick reactivity (especially `inventory.getCountByGoodId()` read inside
   a computed) is the **#1 feasibility item** for the Design/Tasks phases.

5. **Worker counts (verified).** Blacksmith = **2** workers
   ([BlackSmith.ts:29-32](../../../src/game/city/buildings/BlackSmith.ts#L29)); IronMine
   = 1, LumberMill = 1 (second worker commented out in each). The 2D Blacksmith
   prototype renders exactly 2 workers → index labels "Smith 1" / "Smith 2".

6. **"5 environments" clarified.** `BuildingID` = BlackSmith, IronMine, LumberMill,
   Market ([Building.ts:9-14](../../../src/game/city/buildings/common/Building.ts#L9)).
   Read-only rollout targets **after** this slice = BlackSmith, IronMine, LumberMill,
   city-global (**4**); **Market is excluded** (already has `MarketPanel.vue` with
   controls). The "5" in the source counted Market.

7. **New dependencies confirmed absent.** [package.json](../../../package.json) has
   only `vue` as a runtime dep — `three` and `@tresjs/core` are both new. TresJS needs
   Vue ≥3.4 (have 3.5.13 ✓). `three` is heavy → this is the cut-point for the 3D arm.

8. **Building display names are inconsistent** (`IronMine` → "Iron Mine", `LumberMill`
   → "LumberMill", `BlackSmith` → "BlackSmith" because it sets no `static name`). Read
   `building.static.name`; accept the inconsistency this pass (consistent with the
   raw-label decision).

---

### Data sources (verified read-only; no engine change)

- **Building funds** → `building.money`; **city** → `city.money`,
  `city.citizens_count` (header already binds these, [App.vue:7](../../../src/App.vue#L7)).
- **Workers** → `building.workers[]` (`Worker[]`), anonymous → label by index.
- **Current task** → `worker.active_action?.constructor.name` (≡ `static.name`; see
  correction #1). Null when idle.
- **Progress** → `1 - active_action.ticks_remaining / active_action.total_ticks`,
  clamped to [0,1] (see correction #2).
- **Inventory** → `building.inventory.getCountByGoodId()` → `Map<ItemID, number>`
  (also mirrored to `building._data.inventory` each tick,
  [Building.ts:47](../../../src/game/city/buildings/common/Building.ts#L47)).
- **Item names/values** → `ItemRegistry[itemId].name` / `.value`
  ([registry.ts](../../../src/modules/items/registry.ts); `IItem` exposes both —
  `MarketPanel.vue` already uses `.name`).

### Spec deltas

- **Supersedes** the "Intended next UI milestone" in
  [`.specs/features/interface-controls/README.md`](../../features/interface-controls/README.md)
  (lines 74-83) — the `<pre>` dump is replaced by designed environment art. Note that
  milestone also lists *recipe thresholds / current production choice*, which is
  **deferred** (out of scope here).
- **Builds on** discovery experiment **X2** in
  [`.specs/discovery-next-feature-2026-06-08.md`](../../discovery-next-feature-2026-06-08.md)
  (thin read-only building detail panel wired to live reactive state), extending it
  with a render-agnostic view-model **and a 2D-vs-3D art-direction comparison**.

### Notes for the spec generator

- Keep both prototypes thin. The 3D arm's dependency weight is the explicit steering
  point: if the 2D Blacksmith already feels right, **cut the 3D arm before completing
  it** rather than building it to full — but still produce the written recommendation
  (record why it was cut).
- Reference reuse: `MarketPanel.vue` is the existing read-only-ish layout precedent
  (stock table, treasury). The new views are read-only **everywhere except** the
  excluded Market.
- The comparison write-up belongs under `.specs/` (canonical current-state docs) once
  the decision is made; enumerate the rollout follow-up cycles (BlackSmith done →
  IronMine, LumberMill, city-global) for the chosen art style.
