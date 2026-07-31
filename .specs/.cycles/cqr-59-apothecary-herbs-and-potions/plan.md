# Plan — Apothecary + City Expansion

> Companion to [`requirements.md`](./requirements.md) and
> [`refined-brief.md`](./refined-brief.md). Authored into the cycle (CQR-59).

## Overview

Two phases against one dependency: **the Apothecary's plot does not exist until the town
grows.**

**Phase A** replaces the symmetric `TOWN_HALF_CELLS = 5` ring in `town-layout.ts` with an
explicit inland rectangle (`i −8…4`, `j −6…6`), keeping the south side open to the sea
where the shoreline already is. Growing inland rather than uniformly is what makes the new
area buildable: symmetric growth to the same 169-cell footprint pulls 26 cells of *sea*
into the interior, because water starts at world x = 14 — cell column `i = 5`, exactly the
current south wall line. Two boundary conflicts fall out and are reconciled: the east wall
would cross farmland (fields shift east), and the LumberMill would touch the north wall
(the mill moves out).

**Phase B** adds 35 stackable goods, an `Apothecary` building with two brewing actions, a
2D interior on the shared `BuildingInterior2D` shell, and a 3D hero mesh at anchor
`[-8, 1]` — one of the plots Phase A opened.

Nothing here introduces a new pattern. Every piece has a sibling in the codebase to copy:
`BlackSmith` for production, `IronMineView2D` for the interior, `BlacksmithMesh` for the
mesh, `goods.ts` for the items.

## Steering Document Alignment

No steering docs exist (`.spec-workflow/steering/` absent). The design follows the
conventions in [`CLAUDE.md`](../../../CLAUDE.md) and the CQR-53 cycle.

### Technical Standards
- TypeScript strict; no new `any`.
- Vue 3 `<script setup>` + Composition API; **no store library** — reactivity flows from
  `reactive(GameControllerSingleton)` and the per-tick `controller.tick` heartbeat.
- Framework-agnostic domain logic in `src/modules/`; the engine in `src/game/`; Vue UI in
  `src/components/`.
- `three` / `@tresjs/core` imported **only** in `.vue` mesh components;
  `CityGlobalView3D.vue` stays lazy-loaded.
- In-memory only; no persistence.

### Project Structure

```
src/
├── modules/items/
│   ├── id.ts                          # +35 ItemID entries (33 herbs + 2 potions)
│   ├── registry.ts                    # +35 ItemRegistry mappings
│   └── values/goods.ts                # +35 Item subclasses, extend the default export
├── modules/environment-view/
│   └── environment-view.ts            # WORKER_LABEL_PREFIX += Apothecary -> 'Herbalist'
├── game/city/
│   ├── City.ts                        # register Apothecary in the buildings Map
│   └── buildings/
│       ├── common/Building.ts         # BuildingID.Apothecary
│       └── Apothecary.ts              # NEW — building + 2 brew actions
└── components/environment/
    ├── BuildingInterior2D.vue         # 4th ThemeName + THEMES entry
    ├── environment-registry.ts        # +1 async-imported entry
    └── views/
        ├── ApothecaryView2D.vue       # NEW — 2D interior
        ├── CityGlobalView3D.vue       # +1 static import, +1 HERO_MODELS entry
        └── city/
            ├── ApothecaryMesh.vue     # NEW — 3D hero mesh
            └── town-layout.ts         # Phase A: the whole expansion
```

`grid.ts` is **untouched** — the cell math, the dense-house merge and the single-occupant
assertion all generalise to the new extents without modification.

## Code Reuse Analysis

### Existing Components to Leverage

- **`BlackSmith`** ([BlackSmith.ts](../../../src/game/city/buildings/BlackSmith.ts)): the
  production-building template — `InventoryAccountService.init` seeding at line 18, the
  priority-list `chooseNextAction()` at line 37, and the `Action` subclass shape
  (`static building_id`, `static input_origin`, `input`, `output_destination`, `output`).
  The Apothecary is a **simpler** version: no `MakeIngot` intermediate to fall back on and
  no `BuyFromMarketAction`.
- **`BuildingInterior2D.vue`**: header, themed banner slot, worker progress rows and
  inventory shelf — the whole interior layout, already validated on three buildings. The
  Apothecary supplies only a banner `<svg>` and a theme name.
- **`IronMineView2D.vue`**: the closest template for the new view — banner SVG with
  `prefers-reduced-motion`-guarded ambient animation, scoped styles, `role="img"` +
  `aria-label`.
- **`BlacksmithMesh.vue` / `LumberMillMesh.vue`**: hero-mesh authoring style — `three`
  primitives, `PALETTE` colours from `town-layout.ts`.
- **`goods.ts`**: the `Item` subclass shape (`static id/name/value/weight`) and the
  default-export object literal that `registry.ts` destructures.
- **`buildOccupancy()`** ([grid.ts:126](../../../src/components/environment/views/city/grid.ts#L126)):
  the load-time correctness net for the whole of Phase A. Every layout edit is validated by
  simply importing the module.
- **`useEnvironmentView` / `mapEnvironmentView`**: the view-model already handles any
  building generically. **No changes** beyond one `WORKER_LABEL_PREFIX` entry.

### Integration Points

- **`City.ts`**: one entry in the `buildings` Map. `BuildingsList.vue` iterates that Map and
  renders `building.constructor.name`, so the sidebar picks the Apothecary up with **no
  edit**.
- **`CityGlobalView3D.vue`**: `heroBuildings` already iterates `props.view.buildings` and
  looks up `HERO_PLOTS[b.id]`. Registering the building in `City.ts` plus adding the
  `BUILDING_PLOTS` and `HERO_MODELS` entries is sufficient — the render loop needs no change.
- **`environment-registry.ts`**: one `defineAsyncComponent` entry; the container dispatches
  on it with no per-building branching.

## Architecture

### Phase A — the layout rework

`town-layout.ts` is authored data with derived render arrays, computed once at module load.
The expansion is a **data change plus one function rewrite**, not an architectural change.

The single structural edit is replacing the scalar `TOWN_HALF_CELLS` with per-axis bounds.
Everything downstream — `buildWallCells()`, `ROAD_CELLS`, the occupancy assembly, the
derived `WALL_BOXES` / `GROUND_PATCHES` — reads those bounds.

```
INTERIOR_MIN_I = -8   INTERIOR_MAX_I = 4      walls: N i=-9, S open (i=+5), E j=-7, W j=+7
INTERIOR_MIN_J = -6   INTERIOR_MAX_J = 6      gates: (-9,0) (0,-7) (0,+7)
```

Order matters, because two edits are coupled:

```
1. fields shift east ──────► removes the wall/farmland conflict
2. bounds + walls + roads ─► the wall can now land at j=-7 cleanly
   + trail + mill move       (one internally-consistent commit — buildOccupancy gates it)
3. trees + houses ─────────► dressing for the new band
```

Step 2 must be atomic: moving the north wall to `i = −9` without also moving the gate, the
road and the trail leaves the town with an unreachable mill and a trail that starts inside
the walls.

### Phase B — the building

Standard four-layer flow, no new concepts:

```
ItemID ──► goods.ts (Item subclass) ──► ItemRegistry
                                            │
Apothecary.chooseNextAction() ──► BrewXAction ──► Action.start()
       │  validateLedger() FIRST          │            └─► createTransaction() debits stacks
       │  else continue / WaitAction      └─► tick ×12 ─► commitTransaction() credits potion
       │
       └──► inventory (stacks) ──► mapEnvironmentView ──► ApothecaryView2D
```

### Modular Design Principles
- **Single responsibility**: `town-layout.ts` authors *where things are*; the mesh
  components author *what they look like*; `grid.ts` owns cell math and validation.
- **Additive registration**: each new surface is one entry in one map. No `if/else` chains
  gain a branch.
- **Fail fast at load**: layout errors surface as a module-import throw, not a silent
  render artefact — with the two documented exceptions in Error Handling below.

## Components and Interfaces

### `src/components/environment/views/city/town-layout.ts` — Phase A

**Bounds.** Replace `const TOWN_HALF_CELLS = 5` with per-axis interior bounds and derived
wall lines. Keep them module-private; nothing outside this file reads them today.

**`buildWallCells()`** — rewrite for a rectangle. Same `WallCell[]` return shape, so
`WALL_BOXES` downstream is unchanged:
- four corner towers at `(−9, −7)`, `(−9, +7)`, `(+5, −7)`, `(+5, +7)`;
- north wall along `i = −9` for `j` −6…6, skipping the gate at `j = 0`, bastion towers at
  `|j| = 1`, `axis: "z"`;
- east wall along `j = −7` for `i` −8…4, skipping the gate at `i = 0`, bastions at
  `|i| = 1`, `axis: "x"`;
- west wall along `j = +7` for `i` −8…4, skipping the gate at `i = 0`, no bastions;
- south (`i = +5`): no wall tiles — corners only.

**`ROAD_CELLS`** — row `i = 0` for `j` −6…6; column `j = 0` for `i` −8…4, skipping `(0,0)`.

**`TRAIL_CELLS`** — `i = −9, −10, −11` at `j = 0`. Stops at −11: the relocated mill covers
`(-13, 0)` and `(-12, 0)`.

**`FIELD_1` / `FIELD_2`** — z −33.5…−24.5 and −33…−25. **And** the matching `field-1` /
`field-2` plates in `GROUND_PATCHES`, both to z centre **−29**. Two sources of truth for the
same rectangle; they must move together.

**`BUILDING_PLOTS`** — `LumberMill` anchor `[-11, -1]` → `[-13, -1]`; add
`Apothecary: { anchor: [-8, 1], offset: [0, 0], scale: ~1.0, tone: <herbal green/violet> }`
(Phase B, task 7).

**`LUMBER_CENTER`** — `blockCenter(-13, -1, 2, 2)` → world `[-37.5, -1.5]`.

**`HOUSE_CELLS`** — author a cluster in the new west / north-west band. Hard constraint:
**never** claim `(-8,1) (-7,1) (-8,2) (-7,2)`.

**`buildTrees()`** — retune two bands. The interior-greenery band samples world ±12
(cells ±4) and now covers only the middle of a 13×13 interior. The forest belt samples
x −23…−34, i.e. cells i −8…−11 — cells −8 and −9 are now *inside* the new north wall.

### `src/modules/items/` — Phase B

- **`id.ts`**: 35 `ItemID` entries in two commented groups (`// Herbs`, `// Potions`),
  matching the existing `// Weapons` / `// Armors` style. Enum key and value identical,
  PascalCase, e.g. `IronbarkMoss = 'IronbarkMoss'`.
- **`values/goods.ts`**: 35 `Item` subclasses — `static id`, `static name` (the *display*
  name, so `'Ironbark Moss'` for `IronbarkMoss`), `static value`, `static weight = 1`. Every
  one added to the default-export object literal, which grows from 4 to 39 entries.
- **`registry.ts`**: 35 `[ItemID.X]: Goods.X` mappings under `// Herbs` / `// Potions`.

### `src/game/city/buildings/Apothecary.ts` — new

```ts
export class Apothecary extends BaseBuilding {
    level = 1;
    money = 100;
    static building_id = BuildingID.Apothecary;

    public inventory = InventoryAccountService.init(BuildingID.Apothecary, {
        stacks: new Map([[ItemID.Bloodroot, 10], [ItemID.Manabloom, 10]]),
    });

    constructor() {
        super();
        this.setup();
        this.workers = [new Worker(), new Worker()];
    }

    protected chooseNextAction(): Action {
        const list = this.inventory.getCountByGoodId();

        const production_list = {
            [ItemID.HealthPotion]: { desired_amount: 3, action: BrewHealthPotionAction },
            [ItemID.ManaPotion]:   { desired_amount: 3, action: BrewManaPotionAction },
        };

        for (const [item_id, recipe] of Object.entries(production_list)) {
            const current_amount = list.get(item_id as ItemID) ?? 0;
            if (current_amount >= recipe.desired_amount) continue;

            const action = new recipe.action();
            if (!this.inventory.validateLedger(action.input!)) continue;  // ← load-bearing

            return action;
        }

        return new WaitAction();
    }
}
```

Two deliberate differences from `BlackSmith.chooseNextAction()`:
- **no `BuyFromMarketAction` preamble** — the Apothecary has no income (R4.9);
- **no `make_ingot` fallback** — there is no intermediate stage, so an insufficient recipe
  simply `continue`s.

The `continue` on failed validation is the whole safety mechanism. `return new WaitAction()`
there instead would also be safe but strictly worse: worker B would idle at tick 13 rather
than falling through to the mana line.

Both actions are plain `Action` subclasses with no `finished()` override — the base
`commitTransaction()` credits the output, exactly as `MakeIronSwordAction` does.

**Declare `output` and `output_destination` as instance properties, not statics.**
`Action.start()` reads `this.output`, and `Action` declares
`public output: null | GoodLedger = null`. `MakeIngotAction` declares `static output`, so
its *instance* `output` stays null, the transaction carries nothing, and it has to credit
the ingot by hand via `inventoryRepository.putGood()` in `finished()`. Copying that shape
without also copying the manual `putGood()` produces an action that consumes its herbs and
silently outputs nothing. `MakeIronSwordAction` is the correct template.

```ts
class BrewHealthPotionAction extends Action {
    static name = 'BrewHealthPotion';
    static building_id = BuildingID.Apothecary;
    total_ticks = 12;

    static input_origin = BuildingID.Apothecary;
    input = new Map([[ItemID.Bloodroot, 3]]);

    output_destination = BuildingID.Apothecary;
    output = new Map([[ItemID.HealthPotion, 1]]);
}
```

`static name = 'BrewHealthPotion'` shadows `Function.name`, so `resolveTaskLabel` — which
reads `action.constructor.name` — renders "BrewHealthPotion" in the 2D view, consistent
with the Blacksmith's "MakeIronSword".

### `src/components/environment/BuildingInterior2D.vue` — modify

Add a fourth member to `ThemeName` and its `THEMES` entry. Tailwind only sees classes it can
find in source, so the strings must be written out in full — no interpolation:

```ts
type ThemeName = 'amber' | 'emerald' | 'sky' | 'violet';

violet: {
  funds: 'bg-violet-900/40 border-violet-700 text-violet-300',
  task:  'text-violet-300 font-medium',
  bar:   'bg-violet-500',
  count: 'text-violet-300',
},
```

### `src/components/environment/views/ApothecaryView2D.vue` — new

Same shape as `IronMineView2D.vue`: a `view: EnvironmentView | null` prop passed straight
through to `BuildingInterior2D` with `theme="violet"`, a `funds-icon` (e.g. `⚗`), an
`empty-message`, and a `#banner` SVG. The banner is decorative and **encodes no worker
state** — a workshop: shelved bottles, a mortar and pestle, a bubbling still. Any ambient
animation must be guarded by `@media (prefers-reduced-motion: reduce)`.

### `src/components/environment/views/city/ApothecaryMesh.vue` — new

`three` primitives in the style of `BlacksmithMesh.vue`, sized for a 2×2 plot (6×6 world
units) and drawing colours from `PALETTE`. Suggested silhouette: a timbered shop with a
steep roof, a chimney with a small still, and a hanging shop sign — readable at the fixed
45° camera distance.

### Changes to existing files

| File | Change |
|---|---|
| `city/town-layout.ts` | Phase A in full; `BUILDING_PLOTS` gains `Apothecary` |
| `items/id.ts` | +35 enum entries |
| `items/values/goods.ts` | +35 classes, default export 4 → 39 |
| `items/registry.ts` | +35 mappings |
| `buildings/common/Building.ts` | `BuildingID.Apothecary = 'Apothecary'` |
| `city/City.ts` | +1 `buildings` Map entry, +1 import |
| `environment-view/environment-view.ts` | `WORKER_LABEL_PREFIX` += `Apothecary: 'Herbalist'` |
| `environment/BuildingInterior2D.vue` | 4th `ThemeName` + `THEMES` entry |
| `environment/environment-registry.ts` | +1 async-imported entry |
| `environment/views/CityGlobalView3D.vue` | +1 static import, +1 `HERO_MODELS` entry |
| `.specs/roadmap.md` | "Alchemist's Lab" → "Apothecary" |

## Data Models

**`ItemID`** — 35 additions. Enum key === value, PascalCase throughout (matching every
existing entry).

**Item statics** — `id: ItemID`, `name: string` (display), `value: number`,
`weight: number`, inherited `stackable = true`. Values per
[`request.md` § Herb catalog](./request.md#herb-catalog); all herbs weight 1; both potions
value 20, weight 1.

*Calibration, for reference when adding later herbs:* anchored to `IronOre` 2,
`IronIngot` 5, `IronSword` 10, `WoodStaff` 30 — a common herb sits at ore level, an uncommon
at sword level, a rare at roughly a staff. Brewing carries a 2× markup (9g of herbs → a 20g
potion), matching the LumberMill's 1 Lumber (10g) → 20 WoodPlank (20g). 12 ticks sits
between the Blacksmith's 8 and the Mill's 14.

**No new DTOs.** `EnvironmentView` / `WorkerView` / `InventoryRow` cover the Apothecary
unchanged.

**Grid model unchanged.** `Cell`, `Terrain`, `Occupant`, `PlacedOccupant` all generalise;
`GRID_MIN`/`GRID_MAX` (±16) already contain the expanded town and the relocated mill at
`i = −13`.

## Error Handling

### Error Scenarios

1. **Action returned without validated input** → `Action.start()` →
   `transactionService.createTransaction()` throws `InsufficientTransactionContentsError`
   ([transaction.service.ts:22](../../../src/modules/inventory/transaction.service.ts#L22)),
   before `inventoryRepository.takeGoods()` reaches its own `InsufficientGoodsError`.
   Uncaught through `handleTick` → `City.handleTick` → `GameController.nextTick` — the tick
   loop dies.
   **Handling:** `validateLedger()` before every `return` in `chooseNextAction()`; `continue`
   on failure; `WaitAction` as the terminal.

2. **Two workers race for the same scarce stock** → worker A's `start()` debits the ledger
   inside the same `handleTick` loop, so worker B's `chooseNextAction()` sees the reduced
   count.
   **Handling:** none needed — this is correct behaviour and R4.11's trace depends on it.
   Do **not** hoist `chooseNextAction()` out of the loop or batch the `start()` calls.

3. **Duplicate cell claim or building on non-grass terrain** → `buildOccupancy()` throws at
   **module load**, so the 3D view never mounts.
   **Handling:** intended fail-fast. Read the thrown cell key — it names both occupants.

4. **Trail plate overlapping a road tile or a building** → *silent*. `terrainAt` returns
   `"grass"` for building cells **before** checking roads, so nothing throws; the result is
   two plates z-fighting at y = 0.03.
   **Handling:** author `TRAIL_CELLS` to stop at `i = −11`. Optionally filter `TRAIL_CELLS`
   through `occupantCovers` the way `ROAD_CELLS` already are.

5. **Field rect and `GROUND_PATCHES` plate out of sync** → *silent*. Terrain reports grass
   where the plate renders brown, or vice versa; buildings could then be authored onto
   visually-farmland cells.
   **Handling:** move both in the same edit; verify by eye that no wall crosses brown ground.

6. **Missing `HERO_MODELS` entry for a registered building** → `heroModel(id)` returns
   `undefined` and the plot renders empty.
   **Handling:** add the `BUILDING_PLOTS` entry and the `HERO_MODELS` entry in the same task.

7. **Item missing from `ItemRegistry`** → `ItemRegistry[itemId]` is `undefined` and
   `mapInventory` throws on `.name` the first time that item enters an inventory.
   **Handling:** `ItemRegistry` is typed `Record<ItemID, IItem>`, so a missing entry is a
   **compile error**. `vue-tsc` catches it — which is why the typecheck runs before the dev
   server.

## Testing Strategy

No automated test runner is configured. Verification is the typecheck, the dev server, and
the console harness.

### Typecheck

```bash
npx vue-tsc -b --force
```

`-b` is incremental — without `--force` it can no-op and print nothing after edits. Then
`npm run build` for the full Vite build.

### Console harness

The one-shot form dispatches a single command and exits, so it can only prove registration
and seeding. Use the **interactive** REPL for the end state:

```bash
npm run console
```

- `buildings` → the Apothecary is listed, level 1, 2 workers.
- `inspect Apothecary` → seeded `Bloodroot 10`, `Manabloom 10`.
- `tick 40` → then `inspect Apothecary` → `HealthPotion 3`, `ManaPotion 3`, `Bloodroot 1`,
  `Manabloom 1`, both workers on `WaitAction`, money unchanged.
- `tick 200` → still no throw; the state is unchanged.
- `market` → no potion ever appears in stock or in `recentTrades`.

### Manual verification checklist

**Phase A**
1. The 3D city view mounts at all — proves `buildOccupancy()` passed at module load.
2. Enlarged ring renders: three gates, corner towers, south open to the sea.
3. No wall crosses brown farmland; the fields sit outside the east wall.
4. The LumberMill has visible clearance from the north wall and is still connected by the
   trail; no trail plate renders under it or over a road tile.
5. Trees do not sprout inside the walls where the old forest belt used to be; the new
   interior band is not bare.
6. Count free 2×2 anchors (temporary log or the `SHOW_GRID` overlay, already `true` at
   [CityGlobalView3D.vue:54](../../../src/components/environment/views/CityGlobalView3D.vue#L54))
   — expect ≥ 40, including `[-8, 1]`.

**Phase B**
7. The Apothecary appears in the buildings sidebar (no edit was needed there).
8. Its plot renders the new mesh, immediately inside the north gate, abutting the road.
9. Selecting it opens the themed 2D interior — not `GenericEnvironmentView`.
10. Workers read "Herbalist 1" / "Herbalist 2".
11. Task labels and progress bars update live each tick; inventory updates live.
12. Funds render and never change.
13. No console errors during a normal run.

**Both**
14. `npx vue-tsc -b --force` and `npm run build` both clean.
