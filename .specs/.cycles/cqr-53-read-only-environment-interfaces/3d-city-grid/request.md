# Refined Request: 3D city as a grid-based map

|                  |                                                                                            |
|------------------|--------------------------------------------------------------------------------------------|
| **Parent cycle** | [CQR-53 — Read-only environment interfaces](../request.md)                                 |
| **Sub-feature**  | `3d-city-grid` (refactor of the 3D city-global art arm, R4)                                |
| **Branch**       | `feat/interface`                                                                           |
| **Captured**     | 2026-06-22                                                                                 |
| **Task size**    | **Medium** — multi-file, contained to the 3D view module; full spec, moderate parallelism. |

> This refines a raw request into a brief for the spec-writer. It does **not** write
> the spec. It documents the decisions taken (incl. the four answered questions) and
> the placement choices carried over from the current free-form 3D layout, so the
> hand-authored grid can be iterated on with a clear reference.

---

## Goal

Refactor the 3D city-global view from **free-form continuous placement** into a
**grid-based map** where each cell holds at most one building, while preserving the
current look as closely as the grid allows. Stays a **read-only, authored static
backdrop** (R4/R6) — no engine coupling, no interactivity.

## Background — what exists today (the placement we must carry over)

All authored geometry lives in
[`town-layout.ts`](../../../../src/components/environment/views/city/town-layout.ts)
as **continuous** (non-grid) coordinates, computed once at module load and rendered
by [`CityGlobalView3D.vue`](../../../../src/components/environment/views/CityGlobalView3D.vue).
Only the 4 hero buildings + the money/citizens overlay are live; houses and trees are
a seeded decorative scatter.

**Compass convention** (unchanged — see [[guild-3d-map-compass]]): `N = -x`,
`S = +x` (sea, open side), `E = -z` (farm fields), `W = +z`.

Key facts the grid must respect:

| Element           | Current placement (world units)                                                                                                           |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| World ground      | `GROUND_SIZE = 100` → x, z ∈ [-50, 50]                                                                                                    |
| Walls             | square ring at `±TOWN_HALF = ±15`; N/E/W walls each with a central gate + bastions; **S (sea) side open**; corner towers on all 4 corners |
| Market (hero)     | center `[8, 8]`, inside walls; 6×6 cobbled pad                                                                                            |
| Blacksmith (hero) | center `[-5, -2]`, inside walls                                                                                                           |
| LumberMill (hero) | center `[-31, 0]`, **outside** walls, north among forest                                                                                  |
| IronMine (hero)   | center `[-28, -26]`, **outside** walls, north among forest                                                                                |
| Paths             | vertical gate path `x∈[-1.5,1.5], z∈[0,15]`; horizontal road `x∈[-12,12], z∈[-1.5,1.5]`                                                   |
| Houses            | ~28 seeded, inside walls, sizes ~1.2–2.1 wide, random rotation                                                                            |
| Trees             | ~110 seeded: forest belt N, mountain scatter NW, inner greenery, map edges                                                                |
| Terrain           | sea (S, `+x`), 2 farm fields (E, `-z`), 3 mountains (NW, outside)                                                                         |

## Decisions (answered)

1. **Cell size = 3 world units.** A 2×2 main building = 6×6 — exactly the current
   Market pad. The walls at `±15` fall on `±5` cells exactly, so the perimeter aligns
   to the grid with no drift.
2. **Grid spans the entire map.** One grid over the full `100×100` ground (index range
   ~`-16..16`, 33×33 cells). Sea / fields / mountains are **terrain cell types** that
   are non-buildable; the Mine and LumberMill (outside the walls) live on the grid.
3. **House cluster merge: tile 2×2 → one dense "5+" mesh.** Every 2×2 block of houses
   is replaced by a single **dense-block** mesh (depicting 5+ dwellings) over those 4
   cells. Larger contiguous house regions are greedily tiled into as many 2×2 dense
   blocks as fit; leftover cells stay single-house meshes.
4. **Authored static backdrop (read-only).** Grid contents (walls, paths, houses,
   trees) are hardcoded grid data, as today. Only the 4 hero buildings + money/citizens
   reflect live state. No `city.citizens_count` coupling.

## Grid model

- **Coordinate convention:** cell `(i, j)` has its center at world `(i·3, j·3)`.
  Single-cell occupants (house, wall tile, tree) sit at the cell center. A **2×2**
  occupant fills cells `{i, i+1} × {j, j+1}` with model center at
  `((i+0.5)·3, (j+0.5)·3)`. Anchor = the **min-corner** `(−x, −z)` cell + a `[w, d]`
  footprint. Provide `cellCenter(i,j)` / `blockCenter(i,j,w,d)` helpers.
- **Terrain types** (per cell, non-occupying, govern buildability): `grass`
  (buildable), `water` (sea), `field` (farm), `mountain`, `road` (path tile).
- **Occupant types** (≤ 1 per cell — the hard invariant): `wall` (subtypes:
  `wall` / `tower` / `gate`=empty pass-through), `building` (2×2 hero),
  `house` (1×1), `house-dense` (2×2 merged). **Trees do not occupy** a cell.
- **Invariant:** no cell carries more than one occupant; enforced by a build-time
  assertion over the authored data (fails loudly in dev if two occupants collide).

### Per-element grid rules

1. **Walls** — one wall tile per perimeter cell along `i = ±5` and `j = ±5`. **Gate**
   cells (currently the central gate on N/E/W) are left empty (pass-through). **Corner
   towers** become a tower tile on each of the 4 corner cells; **bastions** flanking
   the gates become tower tiles on the adjacent cells. The **south (`i = +5`) edge
   stays open** (sea) — no wall tiles, corners excepted.
2. **Paths** — one road tile per cell. The current cross becomes: vertical column
   `(0, 0..5)` (gate path) + horizontal row `(−4..4, 0)` (E–W road). Road cells block
   buildings/houses; trees may not sit on `road`.
3. **Main buildings (Market, Blacksmith, LumberMill, IronMine)** — each a **2×2**
   occupant, snapped to the nearest 2×2 block to its current center (table below). The
   existing per-building meshes are reused at the 6×6 footprint.
4. **Houses** — each a **1×1** occupant on a `grass` cell, snapped from the current
   scatter (nearest free cell; later collisions pushed to the nearest free cell). Then
   the 2×2 dense-merge pass runs (decision 3), producing a **new** `HouseDenseMesh`
   for merged blocks and keeping `HouseMesh` for singles.
5. **Trees** — **non-occupying** decoration. A tree may be placed only on a cell whose
   terrain is `grass`/`field`/`mountain`-adjacent **and** that has no building/house/
   wall/road occupant; a cell may hold one or more trees at sub-cell offsets (preserves
   the dense forest feel). Trees never share a cell with a building.
6. **Terrain (sea, fields, mountains)** — rendered as before but tagged as
   non-buildable cell types so the authoring/assertion knows nothing can be placed on
   them.

### Carried-over placement — snapping reference (to be finalized in spec)

Snap rule: pick the cell block whose center is nearest the current world center.

| Building   | Current center | Min-corner cell `(i,j)` | Cells              | New center       |
|------------|----------------|-------------------------|--------------------|------------------|
| Market     | `[8, 8]`       | `(2, 2)`                | `{2,3}×{2,3}`      | `[7.5, 7.5]`     |
| Blacksmith | `[-5, -2]`     | `(-2, -1)`              | `{-2,-1}×{-1,0}`   | `[-4.5, -1.5]`   |
| LumberMill | `[-31, 0]`     | `(-11, -1)`             | `{-11,-10}×{-1,0}` | `[-31.5, -1.5]`  |
| IronMine   | `[-28, -26]`   | `(-10, -9)`             | `{-10,-9}×{-9,-8}` | `[-28.5, -25.5]` |

Max drift ≤ 1 cell (≤ 3 units) on any axis — visually negligible. Houses/trees snap
the same way; their final authored set is iterated in implementation.

## Conflicts & resolutions

| #   | Conflict                                                                    | Resolution                                                                                                                         |
|-----|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| C1  | Continuous wall runs vs "each wall point = 1 grid square"                   | Decompose perimeter into per-cell wall tiles; gates = empty cells; towers/bastions = tower tiles. South stays open.                |
| C2  | Main buildings span 4 cells but are anchored by a single center today       | 2×2 occupant, min-corner anchor + `[w,d]` footprint; snap centers per the table.                                                   |
| C3  | "Trees don't occupy a cell but can't coexist with buildings" (self-tension) | Trees are non-occupying decoration allowed only on cells with no occupant; multiple trees per cell allowed at sub-cell offsets.    |
| C4  | Snapping collisions: two houses/trees land on one cell                      | Single-occupant rule wins; later occupant pushed to nearest free cell. Every shifted structure is documented in the authored data. |
| C5  | House meshes are ~1.5 units; a 3-unit cell is bigger                        | House sits centered in its cell with street gaps (intended look); sizes may be nudged up during iteration.                         |
| C6  | A 2×2 house-dense block looks like a 2×2 main building                      | Different mesh (`HouseDenseMesh`) + the hero flag/legend already distinguishes the 4 real buildings.                               |
| C7  | Greedy 2×2 tiling is order-dependent for L-shaped/odd house regions         | Define a deterministic scan (e.g. row-major, lowest `(j,i)` first); leftover cells stay single houses. Documented in spec.         |
| C8  | "Entire map" grid includes unbuildable sea/mountain                         | Terrain cell types mark non-buildable cells; assertion forbids occupants there.                                                    |
| C9  | Paths cross the Market/cross center                                         | Road cells are floor-only; where a road cell meets a building cell, the building occupant wins and the road tile is omitted there. |
| C10 | Outside heroes (Mine/Mill) sit among forest trees                           | Their 2×2 cells (and a small clearance ring) are cleared of tree decoration, matching today's `nearAny(OUTSIDE_HEROES)` clearance. |

## Scope

**In scope**
- A grid model + helpers in the `town-layout` module (cell↔world, terrain/occupant
  types, the single-occupant assertion).
- Re-authoring walls, paths, the 4 hero buildings, houses and trees as grid data that
  approximates the current layout.
- A new `HouseDenseMesh` component + the 2×2 merge pass for houses.
- `CityGlobalView3D.vue` updated to render from the grid data (single-cell vs 2×2
  occupants, dense-house blocks).

**Out of scope**
- Any interactivity / placement UI / engine mutation (cycle is strictly read-only).
- Tying house count to population or any other live game state.
- A visible gridline overlay (unless trivially useful for debugging — optional, off by
  default).
- Re-styling individual meshes beyond what the grid snap requires.
- The 2D arm, view-model, container/registry, and the comparison write-up (other CQR-53
  sub-issues) — unchanged.

## Acceptance criteria

- [ ] Every wall, path tile, house, dense-house block and main building occupies a
      whole number of cells; main buildings and dense-house blocks are exactly 2×2.
- [ ] No cell carries more than one occupant — the build-time assertion passes, and
      forcing a collision makes it fail loudly in dev.
- [ ] The 4 hero buildings render within ≤ 1 cell of their current positions (per the
      snapping table) and still read as the labelled hero structures.
- [ ] A 2×2 block of houses renders as a single dense "5+" mesh; an isolated house
      renders as the single-house mesh; a larger house region tiles into dense blocks +
      leftover singles deterministically.
- [ ] Trees appear only on cells with no building/house/wall/road occupant; the Mine and
      LumberMill keep their tree-free clearance.
- [ ] The view remains strictly read-only and reactive only for money/citizens (R4.2,
      R6); the town geometry never rebuilds on a tick.
- [ ] `vue-tsc -b` passes; the 3D arm stays lazy-loaded (no `three` in the 2D/initial
      bundle).

## Constraints

- **Read-only** (R6): no engine reads beyond the existing `CityView`; no mutation.
- **Module boundaries** (NFR): grid data + helpers stay framework-agnostic in the
  `town-layout` module (no Vue, no `three`); meshes stay in `views/city/`.
- **Dependency isolation:** no new runtime deps; reuse `three` / `@tresjs/core`.
- **Performance:** geometry authored once at module load; per-tick work limited to the
  overlay, as today.

## Dependencies

- Builds on the existing R4 3D arm (`CityGlobalView3D.vue`, `town-layout.ts`, the
  `views/city/*Mesh.vue` set). No dependency on the unfinished 2D/comparison sub-issues.

## Notes for the spec writer

- The exact grid index range, the deterministic 2×2 tiling scan order, and the final
  authored house/tree sets are spec/implementation details — this brief fixes the
  *model* and *rules*, not every cell.
- Consider expressing the authored map as a compact per-cell table or a small set of
  typed arrays keyed by `(i,j)`, so iteration is "edit data, not geometry."
- `HouseDenseMesh` is the only genuinely new mesh; everything else is re-placement of
  existing components.
- Keep the compass comment block from `town-layout.ts` — it stays correct under the
  grid.
