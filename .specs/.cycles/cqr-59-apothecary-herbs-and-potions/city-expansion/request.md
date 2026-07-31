# Request: City expansion — grow the walled town inland

|                  |                                                                                                                               |
|------------------|---------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Sub-feature of [CQR-59](https://linear.app/cqr/issue/CQR-59) — see [`../request.md`](../request.md)                              |
| **Branch**       | `feat/CQR-59`                                                                                                                   |
| **Captured**     | 2026-07-31                                                                                                                      |
| **User framing** | "The city was already too small to begin with." Expand it; the Apothecary should be able to sit inside the walls.               |

---

## Why

The walled town is **completely full**. Measured against the current grid: the 9×9
interior (81 cells) has **zero free 2×2 blocks** — every buildable cell is claimed by
houses, roads, the Market plot (`[2, 2]`) or the Blacksmith plot (`[-2, -2]`). Any new
hero building is forced outside the walls next to the LumberMill and IronMine, which is
what triggered this.

## Goal

Grow the walled interior so there is room for the Apothecary and several future
buildings, without wasting the new area on sea or farmland.

## Chosen shape — grow inland, not uniformly

`TOWN_HALF_CELLS = 5` produces a square ring. Raising it uniformly pulls **sea** into
the interior, because water starts at world x=14 — cell column `i=5`, which is exactly
the current south wall line.

Measured options (free 2×2 anchors = plots a hero building could take):

| Shape | Interior cells | Water | Field | Free 2×2 anchors |
|---|---:|---:|---:|---:|
| Current (W=5) | 81 | 0 | 0 | **0** |
| Symmetric W=6 | 121 | 11 | 0 | 1 |
| Symmetric W=7 | 169 | 26 | 0 | 25 |
| Symmetric W=8 | 225 | 45 | 10 | 47 |
| **Chosen — inland** | **169** | **0** | **0** | **45** |
| Inland, one cell larger | 196 | 0 | 0 | 68 |

The inland rectangle yields **80% more buildable land than symmetric growth of the same
169-cell footprint**, and it reads correctly: a coastal town grows inland while its
south wall stays on the shoreline where it already is.

### Target layout

```
interior   i −8 … 4      (13 cells, north→south)
           j −6 … 6      (13 cells, east→west)

walls      N   i = −9
           S   i = +5    unchanged — open to the sea, corner towers only
           E   j = −7
           W   j = +7

gates      N  (−9, 0)    E  (0, −7)    W  (0, +7)

corners    (−9, −7)  (−9, +7)  (+5, −7)  (+5, +7)
```

Compass per `town-layout.ts`: N = −x, S = +x (sea), E = −z (farms), W = +z.

**Verified after extending the roads:** 87 free interior cells, **45 free 2×2 anchors**.

The old wall ring on the N/E/W sides becomes interior land and frees up. The south line
at `i = +5` is unchanged.

### Roads

Extend to the new gates, keeping the existing cross shape:

- gate column `i = 0`, `j` from −6 to 6
- N–S row `j = 0`, `i` from −8 to 4

## Consequential changes

Two boundary conflicts were measured. Both proposals below are my call — override if
you'd rather go the other way.

### 1. The east wall lands on farmland — move the fields out

`terrainAt(i, −7)` returns `field` along the whole east wall line. Walls are exempt from
the terrain check (`needsBuildable()` in `grid.ts` covers only building/house/structure),
so it would not throw — but it puts a wall straight through the farms.

**Proposal:** shift both field rects ~6 world units further east so they sit just outside
the new wall, preserving their size. `FIELD_1` z −27.5…−18.5 → **−33.5…−24.5**;
`FIELD_2` z −27…−19 → **−33…−25**. Farms outside the walls is the natural read, and it
keeps the full 13×13 interior.

Alternative if you'd rather not touch the fields: pull the east interior in to `j = −5`
(wall at `j = −6`, world z = −18, which clears the field edge at −18.5 by half a cell) and
accept a 13×12 interior.

### 2. The LumberMill would touch the north wall — move it out

The Mill occupies `i = −11…−10`; the new north wall sits at `i = −9`. **Gap: 0 cells.**
No collision (different cells, so no load-time throw), but it will look cramped — the
mill visually welded to the wall.

**Proposal:** move the LumberMill anchor `[-11, -1]` → **`[-13, -1]`** (verified free
grass), restoring a 2-cell gap and keeping it on the forest trail just outside the north
gate. Knock-on edits: `LUMBER_CENTER` in the tree-clearance calc, and `TRAIL_CELLS`.

Alternative: leave it and accept the abutment.

### 3. Housing in the new band

`HOUSE_CELLS` is hand-authored for the current 9×9 interior. The expanded band will be
bare grass. That is partly the point — it is where new buildings go — but it will look
sparse.

**Proposal:** author a modest cluster of new houses in the west/north-west band, and
deliberately leave the area near the north gate open for the Apothecary and future
buildings. Exact cells are a level-design pass, not a spec decision.

## Code touchpoints

| # | File | Change |
|---|---|---|
| 1 | `city/town-layout.ts` | Replace `TOWN_HALF_CELLS` with per-axis bounds (or centre + extents) |
| 2 | `city/town-layout.ts` | `buildWallCells()` — rework for a rectangle: 3 walled sides, open south, gates + corner towers |
| 3 | `city/town-layout.ts` | `ROAD_CELLS` — extend the cross to the new gates |
| 4 | `city/town-layout.ts` | `FIELD_1` / `FIELD_2` rects — shift east |
| 5 | `city/town-layout.ts` | `BUILDING_PLOTS` — move `LumberMill`, add `Apothecary` |
| 6 | `city/town-layout.ts` | `TRAIL_CELLS`, `LUMBER_CENTER` — follow the Mill |
| 7 | `city/town-layout.ts` | `HOUSE_CELLS` — author the new band |
| 8 | `city/town-layout.ts` | `buildTrees()` — the interior-greenery and forest-belt bands assume the old extents |

`GROUND_SIZE` is 100 world units (±50); the new walls reach world x −27…+15 and
z ±21, so the ground plane does **not** need resizing.

## Success criteria

- The town renders with the enlarged wall ring, three gates, and corner towers, with the
  south side still open to the sea.
- `buildOccupancy()` passes at module load — no duplicate-cell or non-buildable-terrain
  throws.
- At least 40 free 2×2 interior plots exist, and the Apothecary takes one of them.
- No wall crosses farmland; no hero building touches a wall.
- `npx vue-tsc -b --force` and `npm run build` clean; the 3D city view renders with no
  console errors.

## Open questions

- Field shift vs. pulling the east wall in (proposal 1).
- Move the LumberMill vs. accept the abutment (proposal 2).
- How much new housing to author, versus leaving land open for future buildings.
