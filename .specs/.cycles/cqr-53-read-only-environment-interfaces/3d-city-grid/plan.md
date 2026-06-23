# Plan — 3D City as a Grid-Based Map

> Companion to [`requirements.md`](./requirements.md) (R1–R9) and
> [`request.md`](./request.md). Sub-feature `3d-city-grid` of CQR-53 — refactors the
> parent [R4](../requirements.md) 3D arm. Read-only (parent R6) throughout.

## Overview

A new framework-agnostic **grid module** (`views/city/grid.ts`) defines a fixed-cell
coordinate system (`CELL = 3`), occupant/terrain types, cell↔world helpers, the
deterministic **house dense-merge**, and the **single-occupant assertion**.
[`town-layout.ts`](../../../../src/components/environment/views/city/town-layout.ts) is
refactored from continuous scatter into **authored cell data** — wall tiles, road
tiles, terrain regions, 2×2 building plots, house cells and tree decorations — and
assembles them (with the merge + assertion) once at module load.
[`CityGlobalView3D.vue`](../../../../src/components/environment/views/CityGlobalView3D.vue)
is refactored to render purely by iterating that assembled data; one new mesh,
`HouseDenseMesh.vue`, renders merged 2×2 housing. Everything else (hero meshes, camera,
lighting, overlay, `CityView` prop, lazy-loading) is preserved.

The grid is **layout-only**: hardcoded data, no engine reads, no placement UI, no
per-tick rebuild (parent R4/R6). The point is to express the town as data and let the
"one building per cell" rule be machine-checked.

## As-built deltas (post-implementation)

The build followed this plan with a few deliberate divergences (all reflected in
[`requirements.md`](./requirements.md) R5/R10–R12). Where the sections below still
describe a single `TOWN_MAP` object, read it as the conceptual model — the code keeps
the per-kind export arrays instead:

- **Render arrays, not one `TOWN_MAP`.** `town-layout.ts` keeps the per-kind export
  arrays the view already consumed — `WALL_BOXES`, `GROUND_PATCHES` (sea + fields +
  per-cell road **and** narrow trail plates), `HERO_PLOTS`, `DECORATIVE_HOUSES`,
  `DENSE_HOUSES`, `TREES` — plus a new `STRUCTURES`. `grid.ts` is still the source of
  truth: those arrays are *derived from* the authored cells, and `buildOccupancy(PLACED)`
  still asserts the single-occupant invariant. This kept the `.vue` render loops nearly
  unchanged (lower risk than a full `TOWN_MAP` dispatch refactor).
- **`structure` occupant + port/storage (R10).** `grid.ts` gained a fifth occupant kind
  `{ kind:'structure'; model:string }`; `town-layout.ts` authors `STRUCTURE_PLOTS` (port,
  storage) and exports `STRUCTURES`; the view dispatches by `model` via a
  `STRUCTURE_MODELS` map. New meshes: `PortMesh.vue`, `StorageMesh.vue`.
- **Blacksmith off the road (R5).** Anchor `(-2,-1)` → `(-2,-2)`, centre `[-4.5,-4.5]`;
  the C9 road-overlap is resolved (the road cross renders unbroken).
- **Road network (R4).** Gate column extended to `(0,-5..5)` (adds the east-gate path);
  `TRAIL_CELLS` `(-5..-9,0)` is a narrow trail to the LumberMill; both fold into the road
  set so trees/buildings avoid them.
- **Denser interior + sea reserve (R6, R11).** ~41 house cells confined to `i ∈ [-4,2]`;
  the southern band `i ∈ [3,4]` is left open for the port.
- **UI (R12).** Added the `SHOW_GRID` debug grid (`TresGridHelper`, lines on cell
  boundaries); **removed** the on-canvas money/citizens overlay and the hero legend;
  widened the camera (`[30,35,27]`, look-at `[-4,2,-7]`, fov `52`) to frame the harbour;
  made the app **"City"** label deselect to the city view (`App.vue`).

## Steering Document Alignment

No steering docs exist (`.spec-workflow/steering/` absent). The design follows the
conventions of the parent cycle and the existing `views/city/` code:

### Technical Standards
- TypeScript strict; no new `any`. Discriminated unions for occupants/terrain.
- Vue 3 `<script setup>` + TresJS, matching the current meshes; **no store**.
- Framework-agnostic logic (grid math, merge, assertion) in plain `.ts`; all `three`
  usage stays in `.vue` meshes.
- In-memory, computed once at module load (the existing `mulberry32` seed pattern may be
  reused for deterministic house/tree variety).

### Project Structure
```
src/components/environment/views/
├── CityGlobalView3D.vue          # MODIFIED — renders from assembled grid data
└── city/
    ├── grid.ts                   # NEW — cell model, types, helpers, merge, assertion (no Vue/three)
    ├── town-layout.ts            # MODIFIED — authored cell data + assembly; keeps PALETTE
    ├── HouseDenseMesh.vue        # NEW — 2×2 "5+" dense-housing mesh
    ├── PortMesh.vue              # NEW — medieval harbour (dock, crane, boat)
    ├── StorageMesh.vue           # NEW — timber storage warehouse
    ├── HouseMesh.vue             # unchanged
    ├── TreeMesh.vue              # unchanged
    ├── MountainMesh.vue          # unchanged
    ├── MarketMesh.vue            # unchanged
    ├── BlacksmithMesh.vue        # unchanged
    ├── LumberMillMesh.vue        # unchanged
    └── MineMesh.vue              # unchanged
```

## Code Reuse Analysis

### Existing components to leverage
- **`PALETTE`** (`town-layout.ts`): all colours (grass/stone/water/field/path/wood/…)
  stay; the grid keeps using it so the look is unchanged.
- **`HouseMesh.vue`**: single-house render, prop-driven dims — reused for `house` cells
  and composed inside `HouseDenseMesh`.
- **`TreeMesh.vue` / `MountainMesh.vue`**: reused unchanged for tree decoration and the
  NW mountain backdrop.
- **Hero meshes** (`MarketMesh`/`BlacksmithMesh`/`LumberMillMesh`/`MineMesh`): reused at
  the 2×2 block centre; only their **position/scale** wrapper changes (a small per-model
  centring offset, captured in the plot config).
- **`mulberry32` / `pick`** (`town-layout.ts`): the deterministic PRNG can be reused to
  vary house dims/rotation and tree scale per cell without flicker.
- **`CityGlobalView3D.vue` scaffolding**: camera, ambient/directional light + shadow
  setup, fog, ground plane, the money/citizens overlay and the hero legend all stay.

### Integration points
- **Container** (`EnvironmentView.vue`): unchanged — still lazy-loads
  `CityGlobalView3D` for the no-active-tab state, bound to `useCityView()`.
- **`CityView`** (`types.ts`): unchanged contract; the component still reads only
  `view.money`, `view.citizens`, `view.buildings[]`.

## Architecture

```mermaid
graph TD
    GRID["grid.ts\nCELL, types, helpers,\nmergeHouses(), buildOccupancy()+assert"]
    DATA["town-layout.ts (authored data)\nWALL_TILES, ROAD_CELLS, TERRAIN,\nBUILDING_PLOTS, HOUSE_CELLS, TREES + PALETTE"]
    ASM["assembled @ module load\nTOWN_MAP = { occupancy, terrain, trees }"]
    V3D["CityGlobalView3D.vue\n(renders by iterating TOWN_MAP)"]
    MESHES["meshes: Wall/Tower (inline boxes),\nRoad plates, Hero*, HouseMesh,\nHouseDenseMesh (NEW), TreeMesh, MountainMesh"]
    CV["CityView (prop)\nmoney / citizens / buildings"]

    GRID --> DATA --> ASM --> V3D --> MESHES
    CV --> V3D
```

### Modular design principles
- **`grid.ts`** owns the *model*: math, types, merge, validation. Pure, unit-testable,
  zero framework imports.
- **`town-layout.ts`** owns the *content*: the authored arrays + one assembly call that
  runs the merge and the assertion, exporting a ready `TOWN_MAP`.
- **`CityGlobalView3D.vue`** owns *presentation only*: iterate `TOWN_MAP` and dispatch
  each occupant/terrain/tree to a mesh. No layout maths in the template.

## Components and Interfaces

### `src/components/environment/views/city/grid.ts` — NEW
- **Purpose:** the grid model — the only place cell math, merge and validation live.
- **Interfaces:**
  ```typescript
  export const CELL = 3;                 // world units per cell
  export const GRID_MIN = -16;           // inclusive index bounds (covers ±48)
  export const GRID_MAX = 16;

  export type Cell = readonly [number, number];          // (i, j) integer indices
  export type Terrain = 'grass' | 'water' | 'field' | 'mountain' | 'road';

  export type Occupant =
    | { kind: 'wall'; variant: 'wall' | 'tower'; axis?: 'x' | 'z' }
    | { kind: 'building'; id: BuildingID }   // 2x2, anchored at this cell
    | { kind: 'house' }                      // 1x1
    | { kind: 'house-dense' }                // 2x2, anchored at this cell
    | { kind: 'structure'; model: string };  // decorative (port/storage), any footprint

  export interface PlacedOccupant { anchor: Cell; w: number; d: number; occ: Occupant; }

  export function cellCenter(i: number, j: number): [number, number];          // [i*CELL, j*CELL]
  export function blockCenter(i: number, j: number, w: number, d: number): [number, number];
  export const key = (i: number, j: number): string => `${i},${j}`;
  export function isBuildable(t: Terrain): boolean;                            // t === 'grass'

  /** Deterministic 2x2 greedy tiling. Pure: same input -> same output. */
  export function mergeHouses(houseCells: Cell[]): { dense: Cell[]; singles: Cell[] };

  /** Builds cell->occupant map; throws on overlap or non-buildable placement. */
  export function buildOccupancy(
    placed: PlacedOccupant[],
    terrainAt: (i: number, j: number) => Terrain,
  ): Map<string, PlacedOccupant>;
  ```
- **Key logic:**
  - `mergeHouses`: put house cells in a `Set`; iterate cells in ascending `(j, i)`; for an
    unconsumed `(i,j)`, if `(i+1,j)`,`(i,j+1)`,`(i+1,j+1)` are all present and unconsumed,
    emit a `dense` anchor at `(i,j)` and mark all four consumed; otherwise emit a `single`.
    Deterministic by the fixed scan order (R6.3–R6.4).
  - `buildOccupancy`: for each placed occupant, expand its `w×d` cells; for each cell
    assert (a) not already in the map and (b) `isBuildable(terrainAt(cell))` when the
    occupant is `building`/`house`/`house-dense` (walls/towers are exempt — they sit on
    the perimeter). Throw a descriptive `Error(`cell i,j claimed by … and …`)` on
    violation (R2.2–R2.3).
- **Dependencies:** `BuildingID` (type only). **No Vue, no `three`.**

---

### `src/components/environment/views/city/town-layout.ts` — MODIFIED
- **Purpose:** the authored map content + one-time assembly. Keeps `PALETTE`,
  `GROUND_SIZE`, the compass comment block, `MOUNTAINS`, and the `mulberry32`/`pick`
  helpers.
- **Authored cell data (module-level constants):** `BUILDING_PLOTS` (4 hero 2×2 plots),
  `STRUCTURE_PLOTS` (port + storage 2×2, `model`-keyed), `ROAD_CELLS` (`(0,-5..5)` ∪
  `(-4..4,0)`), `TRAIL_CELLS` (`(-5..-9,0)`), `HOUSE_CELLS` (~41 interior grass cells,
  `i ∈ [-4,2]`), and `terrainAt(i,j)` (grass/water/field/mountain/road). `WALL_CELLS` is
  generated by `buildWallCells()`; `MOUNTAINS` / `GROUND_PATCHES` (sea + fields) are kept.
- **Assembly + assertion (runs once at load):**
  ```typescript
  const { dense, singles } = mergeHouses(HOUSE_CELLS);
  const PLACED: PlacedOccupant[] = [
    ...wallTiles, ...buildingPlots, ...structurePlots,  // structures are 2×2 occupants too
    ...dense /* house-dense 2×2 */, ...singles /* house 1×1 */,
  ];
  export const OCCUPANCY = buildOccupancy(PLACED, terrainAt); // throws on conflict / bad terrain
  ```
- **Derived render arrays (consumed by the view):** `HERO_PLOTS`, `WALL_BOXES`,
  `GROUND_PATCHES` (sea + fields + per-cell road plates + narrow trail plates;
  building-covered road cells dropped — C9), `DECORATIVE_HOUSES`, `DENSE_HOUSES`,
  `TREES` (filtered by terrain + `OCCUPANCY` + a port-reserve guard), and `STRUCTURES`.
  *(No single `TOWN_MAP` object — see As-built deltas.)*
- **Authored values (carried-over placement):**

  | Building   | anchor `(i,j)` | block centre    | mesh offset note                                                                 |
  |------------|----------------|-----------------|----------------------------------------------------------------------------------|
  | Market     | `(2, 2)`       | `[7.5, 7.5]`    | mesh ~centred; offset `[0,0]`                          |
  | Blacksmith | `(-2, -2)`     | `[-4.5,-4.5]`   | moved 1 cell north off the E–W road (C9 resolved)     |
  | LumberMill | `(-11, -1)`    | `[-31.5,-1.5]`  | mesh authored off-origin → centring offset `[-1.0, 0]` |
  | IronMine   | `(-10, -9)`    | `[-28.5,-25.5]` | mesh ~centred; offset `[0,0]`                          |
  | **Port**   | `(3, -2)`      | `[10.5,-4.5]`   | `structure` (model `port`); dock/boat extend over sea |
  | **Storage**| `(3, -4)`      | `[10.5,-10.5]`  | `structure` (model `storage`); between port and farm  |

- **Dependencies:** `grid.ts`, `BuildingID`. **No Vue, no `three`.**

---

### `src/components/environment/views/city/HouseDenseMesh.vue` — NEW
- **Purpose:** render a 2×2 `house-dense` block as a denser cluster reading as "5 or
  more" dwellings (e.g. 3–4 packed `HouseMesh` instances of varied size/height + a couple
  of half-cells, or one larger tenement block plus smaller annexes), filling the 6×6
  footprint.
- **Props:** `position: [number, number, number]` (the block centre), optional
  `rotationY`, `seed?: number` (for deterministic internal variety).
- **Presentation:** composes `HouseMesh` instances at fixed local offsets within the
  6×6 footprint; uses `PALETTE.walls`/`PALETTE.roofs`. Must visibly differ from a single
  `HouseMesh` and from the hero buildings (R6.5).
- **Dependencies:** Vue + `HouseMesh` + `PALETTE`. (Indirect `three` via `HouseMesh`.)

---

### `src/components/environment/views/CityGlobalView3D.vue` — MODIFIED
- **Purpose:** render the scene by iterating the derived export arrays from
  `town-layout.ts`; keep the camera/lights/fog/ground scaffolding.
- **Changes (as-built):**
  - Walls/towers: loop `WALL_BOXES` (pre-built `BoxRect`s — position/size/colour).
  - Roads + trail + terrain: loop `GROUND_PATCHES` (sea, fields, per-cell road plates,
    narrow trail plates) as flat planes.
  - Hero buildings: `heroBuildings` (from `props.view.buildings` × `HERO_PLOTS`) dispatch
    via `HERO_MODELS[id]` at `plot.position` / `plot.scale`.
  - Structures: loop `STRUCTURES` → dispatch via `STRUCTURE_MODELS[model]`
    (`port`→`PortMesh`, `storage`→`StorageMesh`).
  - Houses: loop `DECORATIVE_HOUSES` → `HouseMesh`; `DENSE_HOUSES` → `HouseDenseMesh`.
    Trees: loop `TREES` → `TreeMesh`.
  - **Debug grid:** `<TresGridHelper v-if="SHOW_GRID">` (lines on cell boundaries — R12.1).
  - **Removed:** the on-canvas money/citizens overlay and the hero legend (R12.2).
  - **Camera:** `[30,35,27]`, look-at `[-4,2,-7]`, fov `52` (frames the harbour).
- **Reactivity:** the render arrays are module-level constants (the town never rebuilds
  on a tick); only *which* hero meshes render derives from `props.view.buildings`
  (parent R6, R9.2).

### Changes to existing files

| File                                                                                      | Change                                                                                                                                                                                           |
|-------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [town-layout.ts](../../../../src/components/environment/views/city/town-layout.ts)        | Refactor from continuous scatter to authored cell data + assembly (merge + assertion). Keep `PALETTE`, `GROUND_SIZE`, `MOUNTAINS`, `GROUND_PATCHES` (sea/fields), compass comment, PRNG helpers. |
| [CityGlobalView3D.vue](../../../../src/components/environment/views/CityGlobalView3D.vue) | Render from the derived export arrays (`WALL_BOXES`, `GROUND_PATCHES`, `HERO_PLOTS`, `STRUCTURES`, `DECORATIVE_HOUSES`, `DENSE_HOUSES`, `TREES`); add `STRUCTURE_MODELS` dispatch + the `SHOW_GRID` grid; **remove** the money/citizens overlay and legend; widen the camera.                                                                            |
| `city/grid.ts`                                                                            | **New** model module (incl. the `structure` occupant kind).                                                                                                                                                                            |
| `city/HouseDenseMesh.vue`                                                                 | **New** dense-housing mesh. |
| `city/PortMesh.vue`, `city/StorageMesh.vue`                                               | **New** structure meshes (port, storage). |
| [App.vue](../../../../src/App.vue)                                                         | The **City** top-bar label deselects to the 3D city view (`active_building_id = null`).                                                                                                                                                                      |

## Data Models

- **`Cell = readonly [number, number]`** — integer grid indices.
- **`Terrain`** — `grass | water | field | mountain | road`; `isBuildable === grass`.
- **`Occupant`** — discriminated union (`wall`/`building`/`house`/`house-dense`/
  `structure`); trees are **not** occupants.
- **`PlacedOccupant`** — `{ anchor: Cell; w; d; occ }`; the unit the assertion validates.
- **Render transforms** — `HeroPlot`, `BoxRect`, `GroundPatch`, `HouseTransform`,
  `DenseHouseTransform`, `StructureTransform`, `TreeTransform`: the per-kind export
  arrays the view iterates (in lieu of a single `TOWN_MAP`).

All are plain data; none hold engine references or methods (parent R6).

## Error Handling

### Error scenarios
1. **Two occupants on one cell** — `buildOccupancy` throws at module load naming the
   cell + both occupants. Surfaces immediately in dev (R2.2–R2.3).
2. **Building/house on non-buildable terrain** (water/field/mountain/road) — same
   assertion throws (R2.3, R8.3).
3. **Building plot overlaps a road cell** — *not* an error: the road cell is filtered out
   where a building covers it (R4.3); the building wins. *(The original Blacksmith/road
   overlap, C9, was instead resolved by moving the Blacksmith one cell north — see
   As-built deltas; no building currently overlaps a road.)*
4. **Tree on an occupied or road/water cell** — filtered out during `TOWN_MAP` assembly
   (R7.2); never rendered, never asserted.
5. **House region not divisible into clean 2×2s** (L-shapes, odd widths) — `mergeHouses`
   emits as many 2×2 dense blocks as the deterministic scan finds and leaves the rest as
   singles (R6.3); never throws.
6. **Hero mesh mis-centred in its 6×6 plot** — a visual issue tuned via the plot
   `offset`/`scale`; flagged for the LumberMill (off-origin mesh). Not a runtime error.

## Testing Strategy

No automated runner is configured; verification is the parent cycle's pattern — manual
dev-server checks plus optional pure-function checks via `npm run console` (tsx).

### Pure unit checks (optional, no runner setup)
- `mergeHouses`:
  - a clean 2×2 → `{ dense: [(i,j)], singles: [] }`.
  - a 3×2 block → one dense 2×2 + two singles (deterministic).
  - an isolated single → `{ dense: [], singles: [(i,j)] }`.
- `buildOccupancy`: authoring two occupants on one cell throws; the real `TOWN_MAP`
  assembles without throwing.
- `cellCenter(5,5)` → `[15,15]`; `blockCenter(2,2,2,2)` → `[7.5,7.5]`.

### Manual verification checklist (dev server, no tab selected)
1. **Grid alignment:** walls form a continuous ring of tiles at the map edge `±15`; N/E/W
   gates are open gaps; the south (sea) side is open; corners + bastions show towers.
2. **Roads:** the gate path and E–W road read as tiled plates; no road tile pokes through
   the Blacksmith (building wins).
3. **Hero buildings:** Market, Blacksmith (inside) and LumberMill, IronMine (outside,
   north) sit within ~1 cell of their old spots; each model is centred in its 6×6 plot
   (check LumberMill offset).
4. **Houses:** the interior cluster shows a mix of single houses and at least one dense
   "5+" block where four houses meet; the dense block is visually distinct.
5. **Trees:** forest/greenery survives; no tree overlaps a building/house/road; Mine and
   Mill keep their clearance.
6. **Assertion:** temporarily duplicating a house cell onto an occupied cell makes the
   module throw at load (then revert).
7. **Read-only / reactivity:** the town does not rebuild on a tick; selecting a building
   shows its view and clicking the **City** label returns to the 3D city; money/citizens
   stay in the top bar (no on-canvas overlay or legend).
8. **Structures + grid (R10–R12):** the port + storage render by the sea (south band) in
   the medieval theme; the LumberMill trail and east-gate path are present; flipping
   `SHOW_GRID` overlays cell-boundary lines.
9. **Isolation & types:** `vue-tsc -b` passes; the 3D component + meshes are still the
   only importers of `three`/`@tresjs/core` (the 2D path builds without them).
