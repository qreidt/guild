# Requirements Document — 3D City as a Grid-Based Map

> Authored into the cycle from [`request.md`](./request.md) (CQR-53, sub-feature
> `3d-city-grid`). This refactors the **3D city-global art arm** (parent
> [R4](../requirements.md)) from free-form continuous placement to a grid model. All
> parent constraints (read-only **R6**, dependency isolation, reactivity) still apply.
> No steering docs exist (`.spec-workflow/steering/` absent), so "Alignment" references
> the canonical `.specs/` docs and the parent cycle.

## Introduction

The 3D city-global view is currently authored as **continuous** `(x, z)` coordinates
in [`town-layout.ts`](../../../../src/components/environment/views/city/town-layout.ts)
and rendered by
[`CityGlobalView3D.vue`](../../../../src/components/environment/views/CityGlobalView3D.vue):
walls are long box segments, houses and trees are a seeded scatter, and the 4 real
buildings sit at hand-picked centres. There is no notion of a cell, so nothing
enforces "one building per place" and the layout cannot be reasoned about as a map.

This feature introduces a **grid map model**: a single grid of fixed-size square
cells spans the whole ground plane; every wall, path tile, house and main building
occupies a whole number of cells, at most one occupant per cell; trees are
non-occupying decoration. The current look is **carried over** by snapping today's
positions onto the grid (max drift ≤ 1 cell). The view stays a **read-only, authored
static backdrop** — only *which* of the 4 hero buildings exist reflects live state
(parent R4.1–R4.2, R6). City money/citizens are shown in the app top bar; the former
on-canvas overlay and the hero legend were removed (see R9, R12).

The grid is an **authoring/layout** construct, not gameplay: there is no placement UI,
no engine mutation, and no coupling to `city.citizens_count`. It exists so the map can
be expressed as data ("edit cells, not geometry") and so the single-occupant rule can
be machine-checked.

## Alignment with Product Vision

- Refines parent requirement **R4** (3D city-global art prototype) without changing its
  contract: the component still reads exclusively from the shared `CityView`
  ([types.ts](../../../../src/modules/environment-view/types.ts)) and stays lazy-loaded
  behind the container (parent R4.2–R4.3, NFR Dependency Isolation).
- Upholds parent **R6** (strictly read-only): the grid is hardcoded data; no view
  mutates engine state.
- Preserves the documented **compass convention** (`N=-x`, `S=+x` sea, `E=-z` farms,
  `W=+z`) and the established town silhouette, so the bake-off's 3D arm keeps the feel
  it has already iterated to.

## Requirements

### Requirement 1 — Grid coordinate model & helpers

**User Story:** As a layout author, I want a single grid coordinate system with
cell↔world helpers, so that every structure is placed by cell index rather than raw
world units.

#### Acceptance Criteria

1. The system SHALL define a constant cell size `CELL = 3` world units and a fixed
   integer index range covering the `GROUND_SIZE = 100` plane (≈ `-16..16` per axis,
   33×33 cells), exported from a framework-agnostic module (no Vue, no `three`).
2. WHEN a single-cell occupant is placed at cell `(i, j)` THEN its world centre SHALL be
   `cellCenter(i, j) = [i·CELL, j·CELL]`.
3. WHEN a `w×d` block is anchored at its **min-corner** cell `(i, j)` THEN its world
   centre SHALL be `blockCenter(i, j, w, d) = [(i + (w−1)/2)·CELL, (j + (d−1)/2)·CELL]`;
   for a 2×2 block this is `[(i+0.5)·CELL, (j+0.5)·CELL]`.
4. The walls at world `±15` SHALL map to cell indices `±5` exactly (no fractional
   offset), confirming `CELL = 3` aligns the existing perimeter to the grid.

### Requirement 2 — Single-occupant invariant & build-time assertion

**User Story:** As a maintainer, I want "one building per cell" enforced automatically,
so that an authoring mistake fails loudly instead of rendering two overlapping meshes.

#### Acceptance Criteria

1. The system SHALL define occupant kinds `wall` (variant `wall` | `tower`), `building`
   (2×2, keyed by `BuildingID`), `house` (1×1), `house-dense` (2×2), and `structure`
   (decorative authored block keyed by a `model` string, any footprint — see R10);
   **trees are not occupants**.
2. WHEN the authored map is assembled at module load THEN the system SHALL build a
   cell→occupant map and SHALL assert that no cell is claimed by more than one occupant.
3. IF two occupants claim the same cell, OR a `building`/`house`/`house-dense` occupant
   is placed on a non-buildable terrain cell (R8), THEN the assertion SHALL throw with a
   message naming the conflicting cell and occupants (dev-time fail-fast).
4. The assertion SHALL run as part of authoring the static data (once at module load),
   adding no per-tick cost.

### Requirement 3 — Walls as per-cell tiles

**User Story:** As a viewer, I want the town wall to read as a grid of wall pieces, so
that each wall point occupies exactly one cell.

#### Acceptance Criteria

1. The perimeter SHALL be authored as one wall tile per cell along the ring `i = ±5` /
   `j = ±5`, each rendered as a box sized to the cell length (`CELL` along the wall axis,
   existing thickness/height across it) so adjacent tiles abut into a continuous wall.
2. The N/E/W central **gate** cells SHALL be left empty (pass-through); the **south
   side** (`i = +5`, sea) SHALL have **no** wall tiles except the two corner towers.
3. The four corner cells (`±5, ±5`) SHALL each carry a `tower` tile; the gate-flanking
   **bastions** SHALL be `tower` tiles on the cells adjacent to each framed gate.
4. The wall/tower meshes and colours SHALL reuse the current palette and dimensions so
   the silhouette is preserved.

### Requirement 4 — Paths as per-cell road tiles

**User Story:** As a viewer, I want the roads to be made of grid tiles, so that each
path square occupies one cell.

#### Acceptance Criteria

1. The roads SHALL be authored as `road` terrain cells: the **full** gate column
   `(0, −5..5)` — connecting the centre to the **west** gate `(0, 5)` **and** the
   **east** gate `(0, −5)` — plus the N–S road row `(−4..4, 0)`, rendered as flat
   `CELL×CELL` plates just above the grass (current path colour). A narrower **trail**
   of cells `(−5..−9, 0)` SHALL run from the north gate out to the LumberMill, rendered
   as thin plates (see R10.5).
2. A `road` cell SHALL be non-buildable (no `house`/`building`/`house-dense` may be
   authored on it) and SHALL NOT host a tree.
3. WHERE a `building` occupant covers a cell that the road would otherwise tile (e.g.
   the Blacksmith plot meeting the E–W road), the building SHALL win and the road tile
   SHALL be omitted on that cell (no overlap, no z-fighting).

### Requirement 5 — Main buildings as 2×2 occupants (positions carried over)

**User Story:** As a viewer, I want each main building to fill a 2×2 block near where it
sits today, so that the four real buildings keep their recognised places on the grid.

#### Acceptance Criteria

1. Market, Blacksmith, LumberMill and IronMine SHALL each be authored as a **2×2**
   `building` occupant anchored at the min-corner cell
   (Market `(2,2)`→`[7.5,7.5]`, Blacksmith `(-2,-2)`→`[-4.5,-4.5]`,
   LumberMill `(-11,-1)`→`[-31.5,-1.5]` with a `[-1.0, 0]` mesh offset,
   IronMine `(-10,-9)`→`[-28.5,-25.5]`). **The Blacksmith was moved one cell north from
   its original `(-2,-1)` so it no longer sits on the E–W road** — the prior C9
   road-overlap (R4.3) is thereby resolved and is now moot.
2. Each building SHALL render its existing per-building mesh
   (`MarketMesh`/`BlacksmithMesh`/`LumberMillMesh`/`MineMesh`) at the block centre, with
   a per-building centring offset and scale tuned so the model sits within its 6×6
   footprint (the LumberMill mesh in particular is authored off-origin and needs an
   offset).
3. The buildings SHALL remain driven by `CityView.buildings` for `name`/order/legend
   (as today); the grid only supplies where and how big each renders.
4. The Market and Blacksmith SHALL remain inside the walls; the LumberMill and IronMine
   SHALL remain outside to the north among the forest.

### Requirement 6 — Houses as 1×1 occupants with 2×2 dense-merge

**User Story:** As a viewer, I want a 2×2 cluster of houses to read as a denser block,
so that grouped housing shows "5 or more" dwellings instead of four separate huts.

#### Acceptance Criteria

1. Houses SHALL be authored as `house` (1×1) occupants on buildable `grass` cells,
   confined to the interior band `i ∈ [-4, 2]` (the southern rows `i ≥ 3` are reserved —
   R11), clear of the road plus and the Market/Blacksmith plots. The authored set is
   **dense** (~41 cells → a mix of single houses and several 2×2 dense blocks).
2. WHEN four `house` cells form a 2×2 block THEN the system SHALL replace them with a
   single `house-dense` occupant over those four cells, rendered by a **new**
   `HouseDenseMesh` depicting 5+ dwellings.
3. WHEN a contiguous house region is larger than 2×2 THEN the system SHALL greedily tile
   it into as many 2×2 `house-dense` blocks as fit, using a **deterministic** scan
   (row-major, ascending `j` then `i`); cells not absorbed into a block SHALL remain
   single `house` meshes.
4. The merge SHALL be a pure function over the authored house cells (same input →
   same output), and SHALL be unit-checkable independently of rendering.
5. A `house-dense` block SHALL be visually distinct from a 2×2 `building` (different
   mesh); the hero legend already distinguishes the 4 real buildings.

### Requirement 7 — Trees as non-occupying decoration

**User Story:** As a viewer, I want trees to fill the empty land and forest, so that the
greenery survives the grid refactor without blocking buildable cells.

#### Acceptance Criteria

1. Trees SHALL be authored as decoration anchored to a cell plus an optional sub-cell
   offset and scale; a cell MAY hold more than one tree (preserving the dense forest).
2. A tree SHALL be placed only on a cell whose terrain is buildable-or-natural
   (`grass`/`field`) **and** that carries no `wall`/`building`/`house`/`house-dense`
   occupant and is not a `road` cell.
3. The LumberMill and IronMine 2×2 plots (and a small clearance ring around them) SHALL
   carry no trees, matching today's `nearAny(OUTSIDE_HEROES)` clearance.
4. Trees SHALL NOT be counted as occupants by the R2 assertion.

### Requirement 8 — Whole-map terrain classification

**User Story:** As a layout author, I want every cell tagged with a terrain type, so the
grid spans the entire map yet only grass is buildable.

#### Acceptance Criteria

1. Every cell SHALL have a terrain type in `grass` (default, buildable), `water` (sea,
   south `+x`), `field` (farms, east `-z`), `mountain` (NW footprints), or `road` (R4).
2. The sea, farm fields and mountains SHALL keep their current rendered geometry; their
   underlying cells SHALL be tagged so the R2 assertion forbids building occupants there.
3. Only `grass` cells SHALL be buildable for `house`/`house-dense`; `building`
   (hero) plots SHALL also sit on `grass` (the four plots already fall on grass).

### Requirement 9 — Read-only & reactivity preserved (cross-cutting)

**User Story:** As a maintainer, I want the grid refactor to change only *how* the
backdrop is authored, so that the read-only and reactivity guarantees are untouched.

#### Acceptance Criteria

1. The grid data and all meshes SHALL perform **no** engine mutation and SHALL read no
   engine state directly; the component SHALL consume only the `CityView` prop (parent
   R4.2, R6).
2. The authored town geometry SHALL be built **once** at module load and SHALL NOT
   rebuild per tick. The only live-derived part is *which* hero meshes render (from
   `CityView.buildings`). The on-canvas money/citizens overlay and the hero legend have
   been **removed** — those values live in the app top bar (see R12).
3. `three` / `@tresjs/core` SHALL remain imported only by the 3D component and its
   meshes; the 2D/initial bundle SHALL still build with them uninstalled (parent
   R4.3, NFR Dependency Isolation).

### Requirement 10 — Decorative port + storage structures (added during iteration)

**User Story:** As a viewer, I want a harbour and a storage warehouse by the sea, so the
coastal town reads as a working port near the farm.

#### Acceptance Criteria

1. The system SHALL support a `structure` occupant (R2.1): a decorative, collision-checked
   authored block keyed by a `model` string, placed on `grass` and validated by the same
   single-occupant / buildable-terrain assertion as buildings/houses.
2. A **Port** structure (2×2) SHALL sit on the reserved southern band by the sea
   (anchor `(3,-2)` → `[10.5,-4.5]`), rendered by a new `PortMesh`; its dock / boat /
   crane geometry MAY extend past the 2×2 footprint over the water.
3. A **Storage** warehouse structure (2×2) SHALL sit just east of the port
   (anchor `(3,-4)` → `[10.5,-10.5]`), between the port and the farm fields, rendered by
   a new `StorageMesh`.
4. Both meshes SHALL align with the medieval theme (timber/stone, reusing `PALETTE`),
   SHALL be strictly read-only, and SHALL dispatch by `model` string via a
   `STRUCTURE_MODELS` map in the view (mirroring the hero-mesh dispatch).
5. A narrow **trail** (R4.1) SHALL connect the LumberMill to the town via the north gate.

### Requirement 11 — Reserved sea-side space for a future port (added during iteration)

**User Story:** As a designer, I want open space toward the sea, so a port and its future
expansion have room.

#### Acceptance Criteria

1. The southern interior band `i ∈ [3, 4]` (toward the open sea, `+x`) SHALL be kept clear
   of houses (R6.1) and of trees (a port-reserve guard in tree placement), leaving room
   for the port/storage and future coastal structures.
2. The N–S road SHALL reach the southern edge (`(4,0)`) so the port connects to the sea
   opening.

### Requirement 12 — On-canvas UI: debug grid + overlays removed (added during iteration)

**User Story:** As a developer, I want to toggle a cell grid and keep the canvas free of
duplicated HUD, so the view is clean and easy to debug.

#### Acceptance Criteria

1. `CityGlobalView3D.vue` SHALL expose a boolean `SHOW_GRID` flag that, when `true`,
   overlays a cell grid (a `TresGridHelper` whose lines fall on **cell boundaries**, one
   square per cell) for visualising placement; it SHALL be purely cosmetic (no engine
   effect) and trivially toggleable.
2. The on-canvas money/citizens overlay and the hero-building legend SHALL be **removed**;
   the canvas SHALL show only the 3D scene (those values live in the app top bar).
3. The app's **"City"** top-bar label SHALL be clickable to deselect any building and
   return to the 3D city view (`active_building_id = null`), highlighting while the city
   view is active (implemented in `App.vue`; parent-cycle container — see parent R2).

## Non-Functional Requirements

### Code Architecture and Modularity
- **Layer separation:** grid types + helpers + merge + assertion live in a
  framework-agnostic module (`views/city/grid.ts`) with **no** Vue and **no** `three`;
  the authored map data lives in `town-layout.ts`; meshes stay `.vue` under `views/city/`.
- **Data over geometry:** the map SHALL be expressed as compact authored arrays keyed by
  cell, so iteration means editing data, not editing render code.
- **Single source of placement:** `CityGlobalView3D.vue` SHALL render purely by
  iterating the assembled occupancy/terrain/tree data — no per-structure literals in the
  template beyond the occupant→mesh dispatch.
- **Reuse over reinvention:** reuse the existing `PALETTE`, `HouseMesh`, `TreeMesh`,
  `MountainMesh`, and the four hero meshes; the new meshes are `HouseDenseMesh`,
  `PortMesh` and `StorageMesh`.

### Performance
- The grid (≤ ~1100 cells) and all geometry SHALL be computed once at module load; the
  assertion and merge SHALL be O(cells). No per-frame or per-tick allocation beyond the
  existing overlay.
- Mesh count SHALL stay comparable to today (per-cell wall tiles replace a handful of
  long wall boxes — still a small, static count well within the current budget).

### Reliability
- A buildable cell SHALL never carry two occupants (R2). A non-finite or out-of-range
  cell index SHALL be rejected by the helpers/assertion rather than silently rendered.
- Removing or relocating a structure SHALL be a data edit that the assertion re-validates
  at load — never a half-updated render.

### Usability / Visual fidelity
- The refactored scene SHALL be recognisably the same town: walls, gates, the road
  cross, the four hero buildings near their current spots, an interior house cluster, and
  the northern forest — within the documented ≤ 1-cell drift.

### Security
- Not applicable (single-player, client-side, no untrusted input).
