# Request: Apothecary — herb catalog + health/mana potions

|                  |                                                                                                                                                                                                                   |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Linear [CQR-59](https://linear.app/cqr/issue/CQR-59) — _description + sub-issues to be filled in on your go-ahead_                                                                                                |
| **Branch**       | feat/CQR-59                                                                                                                                                                                                       |
| **Captured**     | 2026-07-31                                                                                                                                                                                                        |
| **User framing** | Keep the recipes minimal and increment later. Ship the full herb catalog up-front, but only the health and mana potion actions. New building must reach full visual parity with the environments built in CQR-53. |

> Raw request, captured for the refine → spec-workflow pipeline.
> Ingredient design notes live in [`../../apothecary-herb-catalog.md`](../../apothecary-herb-catalog.md).

---

## Why

The city has three producers (LumberMill, IronMine, BlackSmith) and all three are
self-feeding: `TakeDownTreeAction` and `MineOresAction` conjure inputs from nothing,
so throughput is bounded only by tick count. The Apothecary is the first building
whose input must come from **outside** — eventually from adventurers returning with
foraged herbs. It introduces the consumables crafting chain the roadmap calls for
("crafting chains for armor, weapons, and consumables") and gives the **Herbalism**
proficiency, already defined in `src/game/adventurer/_.md`, an economic purpose.

## Goal

Add the **Apothecary**: a production building that brews foraged herbs into potions,
with the complete herb catalog implemented as items and exactly two brewing actions.
Potions accumulate in the building's inventory. Visual treatment matches the existing
environments — 2D interior + 3D hero mesh on the city map.

## Naming note

`roadmap.md:52` lists this building as **"Alchemist's Lab"**. The chosen name is
**Apothecary**; update that roadmap line as part of this cycle so the docs do not drift.

The deferred halves of the original idea map to buildings already on the roadmap:
**Hunter's Lodge** (animals → meat) and **Tannery** (pelts → leather, which would give
the five unused `Leather*` armor IDs a producer).

## Scope

### In scope

1. **`BuildingID.Apothecary`** + `Apothecary` building class, registered in `City.ts`.
2. **All 33 herbs** implemented as stackable goods — `ItemID` entries, `Item` subclasses
   in `modules/items/values/`, and `ItemRegistry` mappings.
3. **Two potions** — `HealthPotion`, `ManaPotion` — also stackable goods.
4. **Two brewing actions** only:
   - `BrewHealthPotionAction` — `Bloodroot ×3` → `HealthPotion ×1`, 12 ticks
   - `BrewManaPotionAction` — `Manabloom ×3` → `ManaPotion ×1`, 12 ticks
5. **Full visual parity** with the CQR-53 environments (see below).
6. Seeded starting inventory so the building is exercisable before adventurers exist.

### Out of scope

- **Adventurer delivery of ingredients.** No worker gathers herbs; there is no
  gathering action. Supply is seeded for now.
- **Monster-harvested reagents** (slime residue, spore caps, bones) — later pass.
- **Recipes for the other 31 herbs.** They exist as items with no producer or consumer.
- **An intermediate essence stage** between herb and potion. Considered and deferred:
  its value is smoothing bursty adventurer deliveries, and until adventurers exist the
  supply is a flat seeded stack with nothing to smooth.
- **Potion consumption.** Nothing drinks potions yet.
- **Selling potions.** No `TransportAction`, no market line.
- Spoilage, night-gated foraging, herb tiers affecting anything mechanical.

### Deliberate decision: implement the full catalog now

All 33 herbs get item entries even though only two have recipes. The catalog is
authored up-front so future adventurer loot tables, zone forage tables, and later
recipes all have stable `ItemID`s to target rather than growing the enum piecemeal.

Accepted trade-off: 31 of the 33 will have no producer and no consumer on merge. The
codebase already carries precedent for unused item entries (`LeatherHelmet`,
`LeatherChest`, `LeatherPants`, `LeatherBoots`, `LeatherGlove`, `WoodShield` are all in
`ItemID` and `ItemRegistry` with nothing producing them).

## Herb catalog

All herbs: stackable goods, weight `1`.

| ItemID         | Display name  | Tier     | Value |
|----------------|---------------|----------|------:|
| `Greycap`      | Greycap       | Common   |     2 |
| `Stonemoss`    | Stonemoss     | Common   |     2 |
| `Thistlewort`  | Thistlewort   | Common   |     2 |
| `Hollowreed`   | Hollowreed    | Common   |     2 |
| `Bloodroot`    | Bloodroot     | Common   |     3 |
| `Manabloom`    | Manabloom     | Common   |     3 |
| `Sunleaf`      | Sunleaf       | Common   |     3 |
| `Oxroot`       | Oxroot        | Common   |     3 |
| `Bitterleaf`   | Bitterleaf    | Common   |     3 |
| `Ashcap`       | Ashcap        | Common   |     3 |
| `Coldmint`     | Coldmint      | Common   |     4 |
| `Sourberry`    | Sourberry     | Common   |     4 |
| `Copperfern`   | Copperfern    | Common   |     4 |
| `Duskbloom`    | Duskbloom     | Common   |     5 |
| `Gallnut`      | Gallnut       | Uncommon |     8 |
| `Mirebloom`    | Mirebloom     | Uncommon |     8 |
| `Witchhazel`   | Witchhazel    | Uncommon |     9 |
| `IronbarkMoss` | Ironbark Moss | Uncommon |    10 |
| `Bloodcap`     | Bloodcap      | Uncommon |    10 |
| `Foxglove`     | Foxglove      | Uncommon |    11 |
| `Moonwort`     | Moonwort      | Uncommon |    12 |
| `Nightshade`   | Nightshade    | Uncommon |    12 |
| `Emberfruit`   | Emberfruit    | Uncommon |    12 |
| `Amberseed`    | Amberseed     | Uncommon |    14 |
| `Frostcap`     | Frostcap      | Rare     |    28 |
| `Ghostcap`     | Ghostcap      | Rare     |    30 |
| `Glowspore`    | Glowspore     | Rare     |    32 |
| `Cryptbloom`   | Cryptbloom    | Rare     |    35 |
| `Starbloom`    | Starbloom     | Rare     |    36 |
| `Silverleaf`   | Silverleaf    | Rare     |    38 |
| `Heartsap`     | Heartsap      | Rare     |    40 |
| `Emberheart`   | Emberheart    | Rare     |    42 |
| `Kingsroot`    | Kingsroot     | Rare     |    45 |

Tier is descriptive only in this cycle — it drives no code. It exists so forage tables
and later recipes have a rarity axis to key off.

### Potions

| ItemID         | Display name  | Value | Weight |
|----------------|---------------|------:|-------:|
| `HealthPotion` | Health Potion |    20 |      1 |
| `ManaPotion`   | Mana Potion   |    20 |      1 |

**Value calibration** — anchored to the existing economy (`IronOre` 2, `IronIngot` 5,
`IronSword` 10, `WoodStaff` 30): a common herb sits at ore level, an uncommon at sword
level, a rare at roughly a staff. Brewing carries a 2× markup (9g of herbs → a 20g
potion), matching the LumberMill's Lumber→WoodPlank ratio. 12 ticks sits between the
Blacksmith's 8 and the Mill's 14.

## Building behavior

- **Workers:** 2. Two lines rather than one so `chooseNextAction()` actually exercises
  the priority-list branch that later herbs will extend.
- **Action selection:** mirror `BlackSmith.chooseNextAction()` — a priority-ordered
  production list with `desired_amount` targets per potion, falling through to
  `WaitAction`.
- **Targets:** 20 of each potion.
- **Seed:** `Bloodroot = 10`, `Manabloom = 10`
- **Expected steady state:** the Apothecary brews until both targets are met, then sits
  on `WaitAction` indefinitely. This is correct, not a bug — there is no consumer yet,
  and it resumes on its own once potions are drunk. `desired_amount` is the knob for
  keeping it busy during testing.

## Visual parity requirements

The building must reach the same finish as the environments built in CQR-53 — no
falling back to `GenericEnvironmentView`.

**2D interior**
- `src/components/environment/views/ApothecaryView2D.vue`, built on the shared
  `BuildingInterior2D` shell (as `BlacksmithView2D` / `LumberMillView2D` /
  `IronMineView2D` do) with its own banner art and accent theme.
- Registered in `src/components/environment/environment-registry.ts`.
- Worker label prefix `'Herbalist'` in `WORKER_LABEL_PREFIX`
  (`src/modules/environment-view/environment-view.ts`), else workers read "Worker 1".

**3D city map**
- `src/components/environment/views/city/ApothecaryMesh.vue`, authored from `three`
  primitives like the other hero meshes.
- Entry in `HERO_MODELS` in `CityGlobalView3D.vue`.
- Entry in `BUILDING_PLOTS` in `city/town-layout.ts`.

**Placement — depends on the city-expansion sub-feature.**

The town as it stands has **no free 2×2 grass anchors left inside the walls** — the 9×9
interior is fully occupied by houses, roads, the Market plot (`[2, 2]`, which covers cell
`(3, 2)`) and the Blacksmith plot (`[-2, -2]`). That is what triggered
[`city-expansion/`](./city-expansion/request.md), which grows the interior inland to
`i −8…4`, `j −6…6` and opens up 45 free plots.

**Proposed anchor: `[-8, 1]`** — verified free in the expanded layout, immediately inside
the north gate (`(-9, 0)`, distance 1.4) on the forest side where the herbs come from.
Nearby alternatives: `[-8, -2]`, `[-7, 1]`.

> **Dependency:** the expansion must land before this plot exists. If the expansion is
> deferred or descoped, the Apothecary falls back to an outside-the-walls plot next to the
> LumberMill and IronMine — `[-7, 1]` in the *current* layout is verified free — plus a
> `TRAIL_CELLS` extension to reach it.

## Known engine constraints

These are live behaviours of the current engine that the implementation must respect.

1. **An action returned without validated input crashes the tick.**
   `Action.start()` → `transactionService.createTransaction()` →
   `inventoryRepository.createTransaction()` calls `takeGoods()`, which **throws**
   `InsufficientGoodsError` when the goods are not there. Nothing up the chain
   (`handleTick` → `City.handleTick` → `GameController.nextTick`) catches it. With
   externally supplied, scarce ingredients this is far more reachable than it is for the
   Blacksmith sitting on 400 ore. **`chooseNextAction()` must validate before returning,
   or return `WaitAction`.**

2. **Herbs and potions must be stackable goods**, defined in `modules/items/values/goods.ts`
   extending `Item` — not `EquippableItem`. Equipment is `stackable = false` but its
   crafted output is committed into the `stacks` ledger anyway, so `getCount()` (which
   reads `instances` for non-stackables) disagrees with `getCountByGoodId()` (which reads
   `stacks`). The Blacksmith only works because its production list uses the latter.
   Stackable goods avoid that inconsistency entirely.

3. **The Apothecary will have no income.** It never sells, so `money` stays at its
   starting value and `BuyFromMarketAction` is not a usable fallback. Note the Blacksmith's
   market-buy is already dead code for this reason: it requires `money >= 2 × 80 = 160g`,
   starts at 100g, and has no income, so the condition can never become true — confirmed
   over a 250-tick headless run in which only the LumberMill and IronMine ever traded.
   **Seeding is the only working supply bridge.**

4. **Bad grid placement throws at module load,** not at render. `buildOccupancy()` in
   `city/grid.ts` enforces one occupant per cell and grass-only terrain for buildings.

5. **`BuildingID` values are PascalCase** except `Market = 'market'`. Use
   `Apothecary = 'Apothecary'` to match the majority. The enum value doubles as the
   inventory account id.

6. **Reactivity** follows the `reactive(GameControllerSingleton)` + per-tick `controller.tick`
   heartbeat; the 2D view reads through the existing `useEnvironmentView` view-model and
   needs no new plumbing.

## Touchpoints

| #  | File                                                         | Change                                               |
|----|--------------------------------------------------------------|------------------------------------------------------|
| 1  | `src/modules/items/id.ts`                                    | 35 new `ItemID` entries (33 herbs + 2 potions)       |
| 2  | `src/modules/items/values/goods.ts`                          | 35 new `Item` subclasses (33 herbs + 2 potions)      |
| 3  | `src/modules/items/registry.ts`                              | 35 registry mappings                                 |
| 4  | `src/game/city/buildings/common/Building.ts`                 | `BuildingID.Apothecary`                              |
| 5  | `src/game/city/buildings/Apothecary.ts`                      | Building + 2 brew actions                            |
| 6  | `src/game/city/City.ts`                                      | Register in the `buildings` Map                      |
| 7  | `src/modules/environment-view/environment-view.ts`           | `WORKER_LABEL_PREFIX`                                |
| 8  | `src/components/environment/views/ApothecaryView2D.vue`      | New 2D interior                                      |
| 9  | `src/components/environment/environment-registry.ts`         | Register the 2D view                                 |
| 10 | `src/components/environment/views/city/ApothecaryMesh.vue`   | New 3D hero mesh                                     |
| 11 | `src/components/environment/views/city/CityGlobalView3D.vue` | `HERO_MODELS` entry                                  |
| 12 | `src/components/environment/views/city/town-layout.ts`       | `BUILDING_PLOTS` anchor `[-8, 1]`                    |
| 13 | `.specs/roadmap.md`                                          | "Alchemist's Lab" → "Apothecary"                     |

## Success criteria

- The Apothecary appears in the buildings sidebar, on the 3D city map as its own mesh,
  and opens a themed 2D interior showing workers, tasks with progress, inventory and funds.
- Running the sim produces Health and Mana potions that accumulate in the Apothecary's
  inventory and are never sold.
- Once both potion targets are met the building idles on `WaitAction` without throwing.
- All 33 herbs resolve through `ItemRegistry` with correct names and values.
- `npx vue-tsc -b --force` clean; `npm run build` clean; no console errors in the dev server.
- `npm run console -- inspect Apothecary` reports the expected workers, actions and stock.

## Resolved decisions

| Question                               | Decision                                                                                                                                                                                                                                                                                                                     |
|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Linear ticket                          | **CQR-59**                                                                                                                                                                                                                                                                                                                   |
| Branch                                 | **`feat/CQR-59`**                                                                                                                                                                                                                                                                                                            |
| Trail extension to the Apothecary plot | **Not needed.** `[-8, 1]` covers cells `(-8,1) (-7,1) (-8,2) (-7,2)`, and the expanded N–S road runs along `j = 0` from `i = −8`, so the plot abuts the road directly. The remaining trail work — reconnecting the new north gate to the relocated LumberMill — belongs to [`city-expansion/`](./city-expansion/request.md). |
| Where the herbs live                   | **Extend `values/goods.ts`.** No new `herbs.ts` / `potions.ts`.                                                                                                                                                                                                                                                              |
