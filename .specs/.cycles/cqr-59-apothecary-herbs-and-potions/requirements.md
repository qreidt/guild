# Requirements Document — Apothecary + City Expansion

> Authored into the cycle from [`refined-brief.md`](./refined-brief.md) (CQR-59),
> which consolidates [`request.md`](./request.md) and
> [`city-expansion/request.md`](./city-expansion/request.md).
> Spec name: `apothecary-herbs-and-potions`. No steering docs exist
> (`.spec-workflow/steering/` absent), so "Alignment" references the canonical
> `.specs/` docs instead.
>
> Delivered as **one combined spec**, phased **A (city expansion) → B (Apothecary)**.

## Introduction

Guild's three producers — LumberMill, IronMine, BlackSmith — are all self-feeding.
`TakeDownTreeAction` ([LumberMill.ts:49](../../../src/game/city/buildings/LumberMill.ts#L49))
and `MineOresAction` conjure their inputs from nothing, so throughput is bounded only by
tick count. The **Apothecary** is the first building whose input must come from *outside*
— eventually from adventurers returning with foraged herbs. It opens the consumables
crafting chain the roadmap calls for and gives the **Herbalism** proficiency, already
defined in [`src/game/adventurer/_.md`](../../../src/game/adventurer/_.md), an economic
purpose.

It cannot be built where it belongs. The walled town's 9×9 interior has **zero free 2×2
blocks** — every buildable cell is claimed by houses, roads, the Market plot (`[2, 2]`) or
the Blacksmith plot (`[-2, -2]`). So this cycle first grows the town **inland** (south
stays on the shoreline), then places the Apothecary inside the new walls.

Supply is **seeded**, not gathered: 10 Bloodroot + 10 Manabloom at construction. Two
recipes ship; the other 31 herbs are authored as items with no producer and no consumer,
so future loot tables, forage tables and recipes have stable `ItemID`s to target rather
than growing the enum piecemeal.

## Alignment with Product Vision

- Delivers the **Alchemist's Lab** entry in
  [`.specs/roadmap.md:52`](../../roadmap.md) under its chosen name, **Apothecary**;
  R7 reconciles that line so the docs do not drift.
- Advances "crafting chains for armor, weapons, and consumables" — the first consumables
  producer, and the first non-self-feeding one.
- Extends the CQR-53 art direction unchanged: **2D interiors, 3D backdrop**, per
  [`2d-vs-3d-decision.md`](../../features/environment-interfaces/2d-vs-3d-decision.md).
  The Apothecary reuses the shared `BuildingInterior2D` shell and the authored grid map
  rather than introducing a new pattern.
- The deferred halves of the original idea map to buildings already on the roadmap:
  **Hunter's Lodge** (animals → meat) and **Tannery** (pelts → leather, which would give
  the five unused `Leather*` armor IDs a producer).

---

# Phase A — City Expansion

### Requirement 1 — Enlarged inland town footprint

**User Story:** As a player, I want the walled town to have room to grow, so that new
buildings can sit inside the walls instead of being exiled to the outskirts.

#### Acceptance Criteria

1. WHEN the town layout is built THEN the walled interior SHALL span cells `i −8…4`
   (13 north→south) and `j −6…6` (13 east→west), replacing the symmetric
   `TOWN_HALF_CELLS = 5` ring at
   [town-layout.ts:132](../../../src/components/environment/views/city/town-layout.ts#L132).
2. WHEN the perimeter is generated THEN walls SHALL sit at `i = −9` (N), `j = −7` (E) and
   `j = +7` (W), with the **south side (`i = +5`) left open to the sea** — corner towers
   only, matching the existing treatment.
3. WHEN gates are placed THEN they SHALL open at `(−9, 0)`, `(0, −7)` and `(0, +7)`, and
   four corner towers SHALL sit at `(−9, −7)`, `(−9, +7)`, `(+5, −7)`, `(+5, +7)`.
4. WHEN roads are generated THEN the existing cross SHALL extend to the new gates: row
   `i = 0` for `j` −6…6, and column `j = 0` for `i` −8…4.
5. WHEN the module loads THEN `buildOccupancy()`
   ([grid.ts:126](../../../src/components/environment/views/city/grid.ts#L126)) SHALL pass
   — no duplicate-cell claim and no building/house/structure on non-grass terrain.
6. WHEN the expanded layout is measured THEN **at least 40 free 2×2 interior anchors**
   SHALL exist, and `[-8, 1]` SHALL be one of them.
7. The **compass convention SHALL be unchanged** — N = −x, S = +x (sea), E = −z (farms),
   W = +z. The source-of-truth comment at the top of `town-layout.ts` SHALL remain
   accurate.
8. `GROUND_SIZE` SHALL NOT change. The new walls reach world x −27…+15 and z ±21, well
   inside the ±50 ground plane.

### Requirement 2 — Boundary reconciliation (no wall through farmland, no building against a wall)

**User Story:** As a player, I want the enlarged town to still read as a coherent place, so
that the expansion does not put a wall through a field or weld a building to the ramparts.

#### Acceptance Criteria

1. WHEN the east wall is placed at `j = −7` THEN it SHALL NOT cross farmland. The farm
   rects SHALL shift east: `FIELD_1` z −27.5…−18.5 → **−33.5…−24.5**; `FIELD_2` z
   −27…−19 → **−33…−25**, preserving their size.
   *(Today `terrainAt(i, −7)` returns `field` along that whole line. Walls are exempt from
   the buildable check in `needsBuildable()`, so this renders rather than throwing.)*
2. WHEN the field rects move THEN the hardcoded `field-1` / `field-2` plates in
   `GROUND_PATCHES`
   ([town-layout.ts:427](../../../src/components/environment/views/city/town-layout.ts#L427))
   SHALL move in lockstep — new z centre **−29** for both. These are two independent
   sources of truth for the same rectangle; a mismatch renders brown ground where terrain
   reports grass.
3. WHEN the north wall lands at `i = −9` THEN the LumberMill SHALL NOT abut it. Its anchor
   SHALL move `[-11, -1]` → **`[-13, -1]`**, restoring a 2-cell gap on the forest trail
   outside the north gate.
4. WHEN the LumberMill moves THEN `LUMBER_CENTER`
   ([town-layout.ts:472](../../../src/components/environment/views/city/town-layout.ts#L472))
   SHALL follow it, so the 5-unit tree-clearance ring stays centred on the mill.
5. WHEN the trail is rebuilt THEN `TRAIL_CELLS` SHALL run `i = −9, −10, −11` at `j = 0` —
   from the new north gate out to the relocated mill's edge, **stopping short of the mill's
   own cells** `(-13, 0)` and `(-12, 0)`.
6. The trail SHALL NOT overlap a road tile, and no trail plate SHALL render underneath a
   building. *(`terrainAt` returns `"grass"` for building cells **before** it checks roads,
   so an overlap would not throw — it would silently z-fight at y = 0.03. Note `ROAD_CELLS`
   are already filtered through `occupantCovers` when building `GROUND_PATCHES` but
   `TRAIL_CELLS` are not.)*
7. WHEN tree generation runs THEN `buildTrees()`
   ([town-layout.ts:488](../../../src/components/environment/views/city/town-layout.ts#L488))
   SHALL be retuned for the new extents: the interior-greenery band (currently world ±12,
   i.e. cells ±4) and the forest belt (currently x −23…−34, which now falls *inside* the
   new north wall) SHALL respect the enlarged interior.
8. WHEN the new interior band is dressed THEN a modest cluster of houses SHALL be authored
   in the west / north-west band, and the area near the north gate SHALL be left open for
   the Apothecary and future buildings.
9. `HOUSE_CELLS` SHALL NOT claim any of `(-8, 1)`, `(-7, 1)`, `(-8, 2)`, `(-7, 2)` —
   the reserved Apothecary plot.

---

# Phase B — Apothecary

### Requirement 3 — Herb and potion item catalog

**User Story:** As a designer, I want the whole foraged-herb catalog to exist as items
up-front, so that loot tables, forage tables and later recipes can target stable `ItemID`s
instead of growing the enum piecemeal.

#### Acceptance Criteria

1. WHEN the item catalog is extended THEN **all 33 herbs** SHALL exist as `ItemID` entries,
   `Item` subclasses, and `ItemRegistry` mappings, with the display names and values tabled
   in [`request.md` § Herb catalog](./request.md#herb-catalog).
2. WHEN the potions are added THEN `HealthPotion` ("Health Potion") and `ManaPotion`
   ("Mana Potion") SHALL exist the same way, each with value `20` and weight `1`.
3. All 35 new items SHALL be **stackable goods** extending `Item` in
   [`values/goods.ts`](../../../src/modules/items/values/goods.ts) — **not**
   `EquippableItem`. *(Equipment is `stackable = false` but its crafted output is committed
   into the `stacks` ledger anyway, so `getCount()` — which reads `instances` for
   non-stackables,
   [inventory.repository.ts:54](../../../src/modules/inventory/inventory.repository.ts#L54)
   — disagrees with `getCountByGoodId()`, which reads `stacks`.)*
4. All herbs SHALL have weight `1`.
5. WHEN a new item is looked up THEN `ItemRegistry[itemId]` SHALL resolve to a constructor
   exposing the correct `name`, `value`, `weight` and `stackable: true`.
6. The catalog SHALL extend the existing `goods.ts` — **no** new `herbs.ts` / `potions.ts`
   and no barrel file. Its `export default { … }` object literal SHALL list every entry,
   because [`registry.ts`](../../../src/modules/items/registry.ts) destructures off it.
7. Tier (Common / Uncommon / Rare) SHALL remain **descriptive only** in this cycle — it
   drives no code. It exists so forage tables and later recipes have a rarity axis.
8. IF an item has no producer and no consumer THEN that SHALL be accepted. 31 of the 33
   herbs ship this way; the codebase already carries the precedent (`LeatherHelmet`,
   `LeatherChest`, `LeatherPants`, `LeatherBoots`, `LeatherGlove`, `WoodShield`).

### Requirement 4 — Apothecary building and brewing actions

**User Story:** As a player, I want a building that turns foraged herbs into potions, so
that the herb catalog has an economic purpose and the city produces consumables.

#### Acceptance Criteria

1. WHEN the building is registered THEN `BuildingID.Apothecary = 'Apothecary'` SHALL exist
   ([Building.ts:9](../../../src/game/city/buildings/common/Building.ts#L9)) and an
   `Apothecary` class SHALL be added to the `buildings` Map in
   [City.ts:27](../../../src/game/city/City.ts#L27).
   *(PascalCase matches every id except `Market = 'market'`; the value doubles as the
   inventory account id.)*
2. WHEN the building is constructed THEN it SHALL have **2 workers** and a seeded inventory
   of `Bloodroot = 10` and `Manabloom = 10`, via `InventoryAccountService.init` — the
   pattern at [BlackSmith.ts:18](../../../src/game/city/buildings/BlackSmith.ts#L18).
3. WHEN `BrewHealthPotionAction` runs THEN it SHALL consume `Bloodroot ×3`, produce
   `HealthPotion ×1`, and take **12 ticks**.
4. WHEN `BrewManaPotionAction` runs THEN it SHALL consume `Manabloom ×3`, produce
   `ManaPotion ×1`, and take **12 ticks**.
5. WHEN `chooseNextAction()` selects work THEN it SHALL walk a priority-ordered production
   list with a `desired_amount` of **3** per potion, mirroring
   [BlackSmith.ts:37](../../../src/game/city/buildings/BlackSmith.ts#L37).
6. **Every returned action SHALL have validated input.** For each recipe below its
   `desired_amount`, `chooseNextAction()` SHALL call
   `this.inventory.validateLedger(action.input!)` and return the action only on success;
   on failure it SHALL `continue` to the next recipe. IF no recipe qualifies THEN it SHALL
   return `WaitAction`.
   *(Returning an unvalidated action crashes the tick — see NFR Reliability.)*
7. WHEN both potion targets are met THEN both workers SHALL sit on `WaitAction`
   indefinitely without throwing. This is correct, not a bug: nothing consumes potions yet,
   and production resumes on its own once something does.
8. Potions SHALL accumulate in the building's own inventory and SHALL NOT be sold — no
   `TransportAction`, no market line.
9. The Apothecary SHALL NOT use `BuyFromMarketAction`. *(It never sells, so `money` is
   fixed and the buy condition can never become true. The Blacksmith's market-buy is
   already dead code for exactly this reason: it needs `money >= 2 × 80 = 160g`, starts at
   100g, and has no income.)*
10. Brewing SHALL NOT be night-gated — `shouldTick()` stays the default `true`. *(The
    LumberMill gates on `!isNight()` because chopping is outdoor work; brewing is indoors,
    and the Blacksmith sets the indoor precedent. `isNight()` is stubbed to `false`
    regardless.)*
11. WHEN the simulation runs from a fresh start THEN it SHALL reach this end state and hold
    it: `HealthPotion 3`, `ManaPotion 3`, `Bloodroot 1`, `Manabloom 1`, `money` unchanged
    at its starting value, both workers on `WaitAction`.

    | Tick | Event |
    |---|---|
    | 1 | Both workers brew health (Bloodroot 10 → 4) |
    | 13 | Worker A brews health; worker B fails the Bloodroot check and falls through to mana |
    | 25 | Both workers brew mana |
    | 37 | Both targets met → `WaitAction` |

    This trace exercises all three branches of `chooseNextAction()`: the priority loop, the
    `continue`-on-insufficient-input fallthrough, and the `WaitAction` terminal.

### Requirement 5 — 2D Apothecary interior

**User Story:** As a player, I want the Apothecary to look like the other environments, so
that opening it feels finished rather than falling back to a generic panel.

#### Acceptance Criteria

1. WHEN the Apothecary is selected THEN the system SHALL render
   `ApothecaryView2D.vue` built on the shared `BuildingInterior2D` shell — the same
   composition as `BlacksmithView2D` / `LumberMillView2D` / `IronMineView2D` — with its own
   banner art and accent theme. It SHALL NOT fall back to `GenericEnvironmentView`.
2. WHEN the accent theme is chosen THEN a **fourth `ThemeName`** SHALL be added to
   [BuildingInterior2D.vue:13](../../../src/components/environment/BuildingInterior2D.vue#L13),
   with its `THEMES` entry. The union is currently closed at `'amber' | 'emerald' | 'sky'`
   and all three are taken (Blacksmith / LumberMill / IronMine).
3. WHEN the view is registered THEN it SHALL be one entry in
   [`environment-registry.ts`](../../../src/components/environment/environment-registry.ts),
   async-imported like its siblings.
4. WHEN workers are labelled THEN `WORKER_LABEL_PREFIX`
   ([environment-view.ts:23](../../../src/modules/environment-view/environment-view.ts#L23))
   SHALL map `BuildingID.Apothecary → 'Herbalist'`, so the view reads "Herbalist 1" /
   "Herbalist 2" and not "Worker 1".
5. WHEN the interior renders THEN it SHALL surface both workers with their task label and
   progress, the building inventory, and the building funds — live-updating each tick.
6. The view SHALL read **exclusively** from the `EnvironmentView` DTO and SHALL be strictly
   read-only. No new view-model plumbing is required.
7. The building's display name SHALL be `Apothecary`. *(`mapEnvironmentView` reads
   `building.static.name`; `BlackSmith` does not declare `static name` and falls back to
   the JS class name, so naming the class `Apothecary` is sufficient.)*
8. No change SHALL be required in `BuildingsList.vue` — it iterates `city.buildings` and
   renders `building.constructor.name`, so the Apothecary appears in the sidebar
   automatically.

### Requirement 6 — 3D hero mesh and city plot

**User Story:** As a player, I want the Apothecary on the city map as its own building, so
that the town visibly grows when I add one.

#### Acceptance Criteria

1. WHEN the city map renders THEN `ApothecaryMesh.vue` SHALL draw the building from `three`
   primitives, in the style of the other hero meshes.
2. WHEN the mesh is registered THEN it SHALL be one entry in `HERO_MODELS` in
   [CityGlobalView3D.vue:73](../../../src/components/environment/views/CityGlobalView3D.vue#L73).
   *(Note the file is at `views/`, **not** `views/city/` — that subdirectory holds the
   meshes, `grid.ts` and `town-layout.ts` only.)*
3. WHEN the plot is authored THEN `BUILDING_PLOTS` SHALL gain an `Apothecary` entry
   anchored at **`[-8, 1]`**, covering cells `(-8,1) (-7,1) (-8,2) (-7,2)`.
4. The plot SHALL require **no trail extension**: it abuts the extended `j = 0` road
   directly, and sits immediately inside the north gate `(−9, 0)` on the forest side where
   the herbs come from.
5. `three` / `@tresjs/core` SHALL be imported **only** inside the `.vue` mesh component, so
   the 2D and initial bundles stay free of `three`.
6. IF Phase A is descoped mid-cycle THEN the fallback anchor SHALL be `[-7, 1]` — verified
   free grass in the *current* layout, outside the walls next to the LumberMill and
   IronMine — plus a `TRAIL_CELLS` extension to reach it.

### Requirement 7 — Documentation reconciliation

**User Story:** As a maintainer, I want the canonical docs to match what shipped, so that
the next cycle starts from an accurate picture.

#### Acceptance Criteria

1. WHEN the cycle lands THEN [`.specs/roadmap.md:52`](../../roadmap.md) SHALL read
   **"Apothecary"** instead of "Alchemist's Lab".
2. WHEN implementation deviates from this spec THEN the deviation SHALL be recorded as an
   **as-built delta** (a note on the affected requirement), not by rewriting the original
   brief — per the Specs convention in [`CLAUDE.md`](../../../CLAUDE.md).
3. WHEN Phase A changes the map THEN the compass comment at the top of `town-layout.ts` and
   the grid design docs under
   [`cqr-53-read-only-environment-interfaces/3d-city-grid/`](../cqr-53-read-only-environment-interfaces/3d-city-grid/)
   SHALL be checked for statements the expansion invalidates (notably the 9×9 interior and
   `TOWN_HALF_CELLS`), and corrected or annotated.
4. `.specs/apothecary-herb-catalog.md` SHALL be marked as superseded by this cycle for the
   questions it lists as open ("which herbs brew into which potions", "how many potion
   lines ship in v1", "which subset gets `ItemID` entries") — all three are now answered.

---

## Non-Functional Requirements

### Code Architecture and Modularity
- **Layer separation**: item definitions and the view-model stay in `src/modules/`; the
  building and its actions in `src/game/`; Vue UI in `src/components/`. No layer inversion.
- **Dependency isolation**: `three` / `@tresjs/core` imported only in `.vue` mesh
  components; `CityGlobalView3D.vue` stays lazy-loaded so `three` is absent from the 2D and
  initial bundles.
- **Pure data layout**: `town-layout.ts` and `grid.ts` remain free of Vue and `three` —
  authored data plus cell math, with the render arrays derived from the grid so the
  renderer keeps iterating data rather than geometry.
- **Reuse over reinvention**: the `BuildingInterior2D` shell for the interior; the
  Blacksmith's `chooseNextAction` shape for production; `InventoryAccountService.init` for
  seeding; `ItemRegistry` for names and values.
- **One registration point per concern**: one `environment-registry.ts` entry for the 2D
  view, one `HERO_MODELS` entry for the mesh, one `BUILDING_PLOTS` entry for the plot.

### Reliability
- **An action returned without validated input crashes the tick.** `Action.start()` →
  `transactionService.createTransaction()` throws `InsufficientTransactionContentsError`
  ([transaction.service.ts:22](../../../src/modules/inventory/transaction.service.ts#L22))
  before `inventoryRepository.takeGoods()` gets to throw its own `InsufficientGoodsError`
  ([inventory.repository.ts:192](../../../src/modules/inventory/inventory.repository.ts#L192)).
  Nothing catches either up the `handleTick` → `City.handleTick` → `GameController.nextTick`
  chain. With externally supplied, scarce ingredients this is far more reachable than it is
  for the Blacksmith sitting on 400 ore.
- **Worker interleave is load-bearing.** `handleTick`
  ([Building.ts:46](../../../src/game/city/buildings/common/Building.ts#L46)) calls
  `chooseNextAction()` then `start()` per worker inside the same loop, so worker A's
  transaction debits the ledger *before* worker B chooses. Worker B must see the reduced
  stock; that is what makes the `continue` branch reachable.
- **Bad grid placement throws at module load, not at render.** `buildOccupancy()` enforces
  one occupant per cell and grass-only terrain for buildings, houses and structures. A bad
  authored placement fails the module import — the 3D view will not mount at all.
- Ticking well past the steady state SHALL throw nothing.

### Reactivity
- Views refresh through the existing `reactive(GameControllerSingleton)` + per-tick
  `controller.tick` heartbeat. The 2D view reads through the existing `useEnvironmentView`
  view-model and needs **no new plumbing**.
- Layout data is computed **once at module load** with a fixed seed, so the reactive
  per-tick re-render never rebuilds meshes.

### Performance
- The expansion roughly doubles the interior cell count (81 → 169). Wall, road, house and
  tree arrays are built once at load; per-tick cost SHALL NOT change.
- The 2D interior SHALL be cheap — no per-frame work beyond Vue's tick-driven re-render.

### Code Quality
- TypeScript strict; **no new `any`**.
- Vue 3 `<script setup>` + Composition API; no store library.
- 35 new item classes are mechanical repetition — they SHALL follow the existing
  `goods.ts` shape exactly rather than introducing a factory or a generated file.

### Testing
- No automated test runner is configured. Verification is `npx vue-tsc -b --force`,
  `npm run build`, the dev server, and the `npm run console` harness.
- The console harness SHALL be driven **interactively** for end-state checks: the one-shot
  form (`npm run console -- <cmd>`) dispatches a single command and exits, so it can prove
  registration and seeding but never reach the post-tick state.

### Security
- Not applicable (single-player, client-side, no untrusted input).
