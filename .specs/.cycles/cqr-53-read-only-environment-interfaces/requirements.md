# Requirements Document — Read-only Environment Interfaces

> Authored into the cycle from [`refined-brief.md`](./refined-brief.md) (CQR-53).
> Spec name: `read-only-environment-interfaces`. No steering docs exist
> (`.spec-workflow/steering/` absent), so "Alignment" references the canonical
> `.specs/` docs instead.

## Introduction

Guild has no designed visual interface for its environments. Selecting a building
renders a raw object dump (`<pre>{{ activeBuilding }}</pre>`,
[App.vue:30](../../../src/App.vue#L30)); only the Market has a real panel
([MarketPanel.vue](../../../src/components/buildings/MarketPanel.vue)). A player
cannot see, at a glance, who is working, on what, with what progress, what is in
stock, or how much money a building holds.

This feature delivers a strictly **read-only** visual interface for the game's
environments, proven through a **vertical slice that doubles as an art-direction
bake-off**: a single, render-agnostic, reactive **view-model** feeds (a) a **2D**
art rendering of one environment (the Blacksmith, SVG/CSS) and (b) a **3D** art
rendering of the city as an ambient background scene (Three.js/TresJS). The two arms
render the *same* data differently so the team can choose how Guild's environments
should look before rolling the chosen style out to the rest.

The 2D-vs-3D question is an **art-direction** decision (how environments are
*rendered*, with live data surfaced over the art), **not** a choice of dashboard or
chart library. The data layer is shared and render-agnostic; only the art differs.

## Alignment with Product Vision

- Implements discovery experiment **X2** in
  [`.specs/discovery-next-feature-2026-06-08.md`](../../discovery-next-feature-2026-06-08.md)
  ("thin read-only Building Detail Panel replacing the `<pre>` dump, wired to live
  reactive state"), extending it with a render-agnostic view-model **and** a
  2D-vs-3D art comparison.
- Supersedes the "Intended next UI milestone" in
  [`.specs/features/interface-controls/README.md`](../../features/interface-controls/README.md)
  (the `<pre>` dump becomes a designed environment view). That milestone also lists
  *recipe thresholds / current production choice*, which is **deferred** here.
- Advances the "readable economy" pillar: the same reactive pattern the City Market
  proved (`reactive(...)` in `App.vue`) now surfaces every environment, not just the
  Market.

## Requirements

### Requirement 1 — Read-only environment view-model (shared data layer)

**User Story:** As a UI developer, I want a render-agnostic, reactive view-model of an
environment, so that any renderer (2D, 3D, or plain HTML) can present the same data
without touching engine internals.

#### Acceptance Criteria

1. WHEN a consumer requests the view for a building THEN the system SHALL produce a
   plain, framework-agnostic `EnvironmentView` containing: the building display name,
   its funds, an ordered list of worker views, and an inventory list — derived solely
   from **read** access to existing game state (no engine mutation).
2. WHEN a worker has an active action THEN its worker view's task label SHALL be the
   action's runtime class name (`active_action.constructor.name`, equivalently
   `active_action.static.name`) and progress SHALL be
   `clamp(1 − ticks_remaining / total_ticks, 0, 1)`.
3. IF a worker has no active action, or its action is done, THEN the worker view SHALL
   report `status: 'idle'`, a null task label, and `0` progress.
4. IF `total_ticks ≤ 0`, OR the action has not started (`ticks_remaining > total_ticks`,
   i.e. the `999` sentinel from [Action.ts:29](../../../src/game/city/buildings/common/Action.ts#L29)),
   THEN progress SHALL be reported as `0` (never negative, never > 1).
5. WHEN each inventory entry is produced THEN it SHALL include the item id, the display
   name and unit value from `ItemRegistry[itemId]`, and the current count from
   `building.inventory.getCountByGoodId()`.
6. WHEN a city-global view is requested THEN the system SHALL produce a `CityView`
   containing `city.money`, `city.citizens_count`, and a minimal per-building summary
   (id, display name, funds, worker count) sufficient to render an ambient background
   scene — not a full per-building data dashboard.
7. WHEN the game advances a tick THEN every view SHALL reflect the new state without
   manual refresh (see NFR Reactivity).
8. The view-model SHALL NOT invoke any state-mutating method on buildings, workers,
   actions, inventory, or the controller (strictly read-only).

### Requirement 2 — Environment view container + registry (replace the `<pre>` dump)

**User Story:** As a player, I want a designed panel when I select an environment, so
that I see its state instead of a raw object dump.

#### Acceptance Criteria

1. WHEN a non-Market building is selected THEN the system SHALL render a designed
   environment view through a container component that **replaces** the
   `<pre>{{ activeBuilding }}</pre>` dump at [App.vue:30](../../../src/App.vue#L30).
2. WHEN no building is selected (the "no active tab" state) THEN the container SHALL
   render the city-global background scene.
3. WHEN the selected building has a registered art view THEN the container SHALL render
   that view; otherwise it SHALL render a thin **generic** read-only view driven by the
   same view-model (so no environment falls back to a raw dump).
4. WHEN the Market is selected THEN the existing `MarketPanel.vue` (with its controls)
   SHALL continue to render unchanged — the Market is **excluded** from the read-only
   treatment.
5. The registry SHALL map `BuildingID → art component` and SHALL be the single place a
   new environment art view is registered (adding one art view = one component + one
   registry entry, no view-model change).
6. The "no active tab" city scene SHALL also be reachable by clicking the **"City"**
   top-bar label, which deselects any building (`active_building_id = null`) and
   highlights while the city view is active ([App.vue](../../../src/App.vue)).

### Requirement 3 — 2D Blacksmith art prototype (SVG/CSS)

**User Story:** As a player, I want to look at the Blacksmith and immediately understand
what it is doing, so that the simulation is legible at a glance.

#### Acceptance Criteria

1. WHEN the Blacksmith is selected THEN the system SHALL render a **2D (SVG/CSS)**
   depiction of the blacksmith environment surfacing: its **2 workers** (labelled by
   index, "Smith 1" / "Smith 2" — verified count at
   [BlackSmith.ts:29](../../../src/game/city/buildings/BlackSmith.ts#L29)), each with its
   current task label and a visual progress indicator; the building inventory contents;
   and the building funds.
2. WHEN a worker's task label is shown THEN it SHALL display the **raw action
   identifier** (e.g. `MakeIronSword`, `MakeIngot`, `WaitAction`) — no humanization in
   this pass.
3. WHEN the game advances THEN worker progress and inventory SHALL update live.
4. The 2D view SHALL read **exclusively** from the shared view-model (no direct engine
   access) and SHALL be strictly read-only.
5. From a ~5-second glance, a viewer SHALL be able to state (a) who is working + on what
   + progress, (b) what is in stock, (c) the funds — without reading code.

### Requirement 4 — 3D city-global art prototype (Three.js/TresJS) — *cut-able*

**User Story:** As a player, I want the city shown as a backdrop when nothing specific is
selected, so that the game has an ambient sense of place.

#### Acceptance Criteria

1. WHEN no building tab is active THEN the system SHALL render a **3D (Three.js/TresJS)**
   ambient scene showing the city in the background. (City money / citizens are shown in
   the app top bar; the earlier on-canvas overlay was removed.) **This arm has been
   substantially advanced into a grid-based map** — see the
   [`3d-city-grid`](./3d-city-grid/request.md) sub-feature (grid model, walls/roads,
   denser housing, a port + storage, and a debug grid toggle).
2. The 3D scene SHALL read **exclusively** from the shared `CityView` (no direct engine
   access) and SHALL be strictly read-only.
3. The 3D arm introduced `three` and `@tresjs/core` as runtime dependencies (now present
   in [package.json](../../../package.json)), **isolated** behind a lazy-loaded component
   so the 2D path and initial bundle do not pull in `three`.
4. IF the 2D arm is judged sufficient during the slice THEN the 3D arm MAY be **cut
   before completion**, provided the comparison write-up (R5) records the decision and
   what was learned.

### Requirement 5 — 2D-vs-3D comparison & direction decision

**User Story:** As the team, I want a documented recommendation on environment art
direction, so that we commit one style for full rollout instead of guessing.

#### Acceptance Criteria

1. WHEN both prototypes exist (or the 3D arm is cut) THEN the system SHALL produce a
   **written comparison** evaluating **effort, feel, performance, and maintainability**,
   ending in a single recommended art direction.
2. The write-up SHALL enumerate the **rollout follow-up cycles** for the chosen style —
   the remaining read-only environments: **IronMine, LumberMill, city-global** (Market
   excluded; Blacksmith done by this slice).
   > **Update (as-built):** the 2D style was chosen for building interiors and
   > **IronMine + LumberMill are delivered**, via the shared `BuildingInterior2D` shell
   > in the [`2d-buildings-interface`](./2d-buildings-interface/requirements.md)
   > sub-feature (R6–R7). city-global remains 3D
   > ([`3d-city-grid`](./3d-city-grid/requirements.md)). The two arms are therefore
   > complementary, not exclusive: 2D interiors, 3D backdrop.
3. The write-up SHALL live under `.specs/` as canonical current-state documentation.

### Requirement 6 — Strictly read-only (cross-cutting)

**User Story:** As a maintainer, I want this whole feature to be read-only, so that it
cannot regress game state while we are only validating presentation.

#### Acceptance Criteria

1. The view-model, container, registry, generic fallback, and both art prototypes SHALL
   perform **no** state mutation: no assigning workers, no trading, no engine writes.
2. WHEN the feature needs an interactive economy surface THEN it SHALL rely on the
   pre-existing Market controls only; building new interactions is out of scope.

## Non-Functional Requirements

### Code Architecture and Modularity
- **Layer separation**: the render-agnostic view-model (types + pure mapper functions)
  lives in `src/modules/environment-view/` and imports **no** Vue and **no** `three`.
  Vue reactivity (a composable) and all components live in `src/components/environment/`.
- **Single registry**: `BuildingID → art component` mapping is centralised; the
  container has no per-building `if/else`.
- **Dependency isolation**: `three` / `@tresjs/core` are imported only by the 3D view,
  which is lazy-loaded — the 2D arm must build and run with the 3D deps uninstalled.
- **Reuse over reinvention**: item names/values from `ItemRegistry`; reactivity from the
  existing `reactive(GameControllerSingleton)` proxy; `MarketPanel.vue` as the read-only
  layout precedent.

### Reactivity
- Views SHALL refresh every tick by deriving from the reactive controller already in
  [App.vue:64](../../../src/App.vue#L64). Because the auto-run loop's deep-reactive
  propagation through nested building state is not guaranteed, the composable SHALL read
  the reactive `controller.tick` as an explicit **per-tick heartbeat** (the footer at
  [App.vue:35](../../../src/App.vue#L35) proves `tick` updates each tick) and re-derive
  the view from the building resolved fresh via `controller.city.buildings.get(id)`.
  **Verifying live updates is the #1 feasibility item** and must be confirmed before the
  art arms are built.

### Performance
- The 2D SVG/CSS view SHALL be cheap (no per-frame work beyond Vue's tick-driven
  re-render).
- The 3D scene SHALL be thin and SHALL NOT noticeably degrade the tick loop or frame
  rate; it SHALL be lazy-loaded so `three` is absent from the 2D/initial bundle.

### Reliability
- Progress SHALL always be a finite number in `[0, 1]`; a null/`undefined`/`999`-sentinel
  action SHALL never produce `NaN`, negative, or out-of-range progress.
- A building with no registered art view SHALL still render (generic fallback) — never a
  blank panel or raw dump.

### Usability
- Every non-Market environment SHALL be reachable from the existing `BuildingsList`
  selection with no hidden menu.
- The Blacksmith view SHALL pass a 5-second legibility check (R3.5).

### Security
- Not applicable (single-player, client-side, no untrusted input).
