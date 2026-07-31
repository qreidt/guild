# Refined Request Brief: Apothecary + City Expansion

|              |                                                                                      |
|--------------|--------------------------------------------------------------------------------------|
| **Source**   | [`request.md`](./request.md) + [`city-expansion/request.md`](./city-expansion/request.md) |
| **Linear**   | [CQR-59](https://linear.app/cqr/issue/CQR-59)                                          |
| **Branch**   | `feat/CQR-59`                                                                          |
| **Refined**  | 2026-07-31                                                                             |
| **Delivery** | **One combined spec** (user decision) — expansion and Apothecary in a single Requirements → Design → Tasks chain, sequenced as Phase A → Phase B. |

---

## Goal

Grow the walled town inland to open up buildable plots, then add the **Apothecary** — a
production building that brews foraged herbs into health and mana potions — with the full
33-herb catalog as items and full 2D/3D visual parity with the CQR-53 environments.

**Task size:** large — module/system level. Layout rework + 35 item entries + a new
building with 2 actions + 2 new Vue views + a shared-component change.

---

## Scope in

**Phase A — city expansion** (must land first; the Apothecary plot does not exist until it does)

1. Replace `TOWN_HALF_CELLS = 5` with per-axis bounds: interior `i −8…4`, `j −6…6`.
2. Rework `buildWallCells()` for a rectangle — walls at `i = −9` (N), `j = −7` (E),
   `j = +7` (W); south (`i = +5`) stays open to the sea; gates at `(−9, 0)`, `(0, −7)`,
   `(0, +7)`; four corner towers.
3. Extend `ROAD_CELLS`: row `i = 0` for `j` −6…6; column `j = 0` for `i` −8…4.
4. Shift the farm rects east so no wall crosses farmland — `FIELD_1` z −27.5…−18.5 →
   **−33.5…−24.5**; `FIELD_2` z −27…−19 → **−33…−25**.
5. Move the LumberMill anchor `[-11, -1]` → **`[-13, -1]`**, restoring a gap to the new
   north wall. Follow with `LUMBER_CENTER` and `TRAIL_CELLS`.
6. Rebuild `TRAIL_CELLS` for the relocated gate and mill: `i = −9, −10, −11` at `j = 0`.
7. Retune `buildTrees()` bands for the new extents.
8. Author a modest new house cluster in the west / north-west band, leaving the area near
   the north gate open. Exact cells are a level-design pass, not a spec decision.

**Phase B — Apothecary**

9. `BuildingID.Apothecary = 'Apothecary'`; `Apothecary` building class; registered in `City.ts`.
10. All **33 herbs** + **2 potions** as stackable goods — `ItemID` entries, `Item`
    subclasses in `modules/items/values/goods.ts`, `ItemRegistry` mappings. Values and
    display names exactly as tabled in [`request.md`](./request.md#herb-catalog).
11. Two brewing actions: `BrewHealthPotionAction` (`Bloodroot ×3` → `HealthPotion ×1`,
    12 ticks) and `BrewManaPotionAction` (`Manabloom ×3` → `ManaPotion ×1`, 12 ticks).
12. 2 workers; seeded inventory `Bloodroot = 10`, `Manabloom = 10`.
13. Full visual parity: `ApothecaryView2D.vue` on the `BuildingInterior2D` shell,
    `ApothecaryMesh.vue` from `three` primitives, plot anchor `[-8, 1]`.
14. `.specs/roadmap.md:52` "Alchemist's Lab" → "Apothecary".

## Scope out

- Adventurer delivery of ingredients; any gathering action. Supply is seeded.
- Monster-harvested reagents (slime residue, spore caps, bones).
- Recipes for the other 31 herbs — items only, no producer and no consumer.
- An intermediate essence stage between herb and potion.
- Potion consumption; selling potions (no `TransportAction`, no market line).
- Spoilage, night-gated foraging, herb tiers driving any mechanic (tier is descriptive).
- `BuyFromMarketAction` for the Apothecary — see constraint 3.
- Symmetric town growth, resizing `GROUND_SIZE`, or reworking the sea/port band.

---

## Decisions resolved this round

| Question | Decision |
|---|---|
| Spec delivery shape | **One combined spec**, phased A → B. |
| Potion targets vs. seed | **Keep seed 10/10; drop `desired_amount` to 3 per potion.** Overrides the "20 of each" in `request.md`. |
| East wall on farmland | **Shift both field rects ~6 units east.** Keeps the full 13×13 interior. |
| LumberMill / wall abutment | **Move the anchor to `[-13, -1]`.** |
| 2D accent theme | **Add a 4th `ThemeName`.** `'violet'` unless the spec writer prefers another — `amber` / `emerald` / `sky` are all taken. |
| New housing volume | Spec writer's call — a modest cluster, north-gate band left clear. |

---

## Key behaviors

- **Brewing.** `chooseNextAction()` walks a priority-ordered production list. For each
  recipe below its `desired_amount`, it calls `this.inventory.validateLedger(action.input!)`
  and returns the action only on success; on failure it **`continue`s to the next recipe**
  (Blacksmith pattern, minus the `make_ingot` fallback, which has no analogue here).
  Falls through to `WaitAction`.
  *Failure path:* returning an unvalidated action crashes the tick — see constraint 1.
- **Two-worker interleave.** `handleTick` calls `chooseNextAction()` then `start()` per
  worker in the same loop, so worker A's transaction debits the ledger before worker B
  chooses. Worker B sees the reduced stock; the `continue` branch is what lets it fall to
  the mana line.
- **Steady state.** Once both potions reach 3, both workers sit on `WaitAction`
  indefinitely. Correct, not a bug — nothing consumes potions yet.
- **Load-time layout validation.** `buildOccupancy()` throws on a duplicate cell or a
  building/house/structure on non-grass terrain. A bad authored placement fails the module
  import, not the render.

## Data flow

- **Input:** seeded `Bloodroot = 10` + `Manabloom = 10` into the `Apothecary` inventory
  account at construction (`InventoryAccountService.init`, Blacksmith pattern). No external
  or runtime source.
- **Output:** `HealthPotion` / `ManaPotion` committed into the same account's `stacks`
  ledger on action finish. Never leaves the building.
- **Persistence:** none — no save/load exists.
- **Read path:** `useEnvironmentView` → `mapEnvironmentView` → `ApothecaryView2D`. Reactivity
  rides the existing `reactive(GameControllerSingleton)` + `controller.tick` heartbeat; no
  new plumbing.

---

## Acceptance criteria

**Phase A**

- [ ] Town renders with the enlarged ring: three gates, corner towers, south open to the sea.
- [ ] `buildOccupancy()` passes at module load — no duplicate-cell or terrain throws.
- [ ] ≥ 40 free 2×2 interior anchors exist; `[-8, 1]` is one of them.
- [ ] No wall cell crosses a field rect; no hero building shares an edge with a wall.
- [ ] The `GROUND_PATCHES` `field-1` / `field-2` plates move in lockstep with the `FIELD_1` /
      `FIELD_2` rects — new z centre **−29** for both. (These are two independent sources of
      truth for the same rectangle; a mismatch renders brown ground where terrain says grass.)
- [ ] No trail plate overlaps a road tile or sits under the relocated LumberMill.

**Phase B**

- [ ] Apothecary appears in the buildings sidebar (auto — `BuildingsList` iterates
      `city.buildings`; no edit needed), as its own mesh on the 3D map, and opens a themed
      2D interior showing workers, tasks with progress, inventory and funds.
- [ ] Worker labels read "Herbalist 1" / "Herbalist 2", not "Worker 1".
- [ ] All 33 herbs resolve through `ItemRegistry` with the tabled names and values.
- [ ] **End state after ~37 ticks:** `HealthPotion 3`, `ManaPotion 3`, `Bloodroot 1`,
      `Manabloom 1`, money unchanged at its starting value, both workers on `WaitAction`.
      Ticking well past that throws nothing.
      *Traced:* t1 both brew health (Bloodroot 10→4) · t13 A brews health, B fails the
      Bloodroot check and falls to mana · t25 both brew mana · t37 targets met → Wait.
      This path exercises the priority loop, the `continue`-on-insufficient-input branch,
      and the `WaitAction` fallthrough.
- [ ] Verified via the **interactive** REPL: `npm run console`, then `tick 40`, then
      `inspect Apothecary`. Note the one-shot form `npm run console -- inspect Apothecary`
      runs a single command and exits, so it can only prove registration and seeding —
      it cannot reach the end state. Adjust the criterion in `request.md` accordingly.

**Both**

- [ ] `npx vue-tsc -b --force` clean; `npm run build` clean.
- [ ] Dev server renders the 3D city view and the Apothecary interior with no console errors.

---

## Constraints

- **Engine 1 — unvalidated input crashes the tick.** `Action.start()` →
  `transactionService.createTransaction()` throws `InsufficientTransactionContentsError`
  ([`transaction.service.ts:22`](../../../src/modules/inventory/transaction.service.ts))
  before `inventoryRepository.takeGoods()` gets to throw its own `InsufficientGoodsError`.
  Nothing catches either up the `handleTick` → `City.handleTick` → `nextTick` chain.
  With scarce seeded ingredients this is far more reachable than it is for the Blacksmith
  sitting on 400 ore. *(Corrects `request.md` constraint 1, which names the wrong error.)*
- **Engine 2 — herbs and potions must be stackable goods** extending `Item` in
  `values/goods.ts`, not `EquippableItem`. Non-stackables commit into `stacks` but
  `getCount()` reads `instances`, so the two disagree.
- **Engine 3 — the Apothecary has no income.** It never sells, so `money` is fixed and
  `BuyFromMarketAction` can never fire. Seeding is the only supply bridge. (The Blacksmith's
  market-buy is already dead code for the same reason: it needs 160g against a fixed 100g.)
- **Engine 4 — `BuildingID` values are PascalCase** except `Market = 'market'`. Use
  `Apothecary = 'Apothecary'`; the value doubles as the inventory account id.
- **Engine 5 — the class name is the display name.** `mapEnvironmentView` reads
  `building.static.name`; `BlackSmith` does not declare `static name` and falls back to the
  JS class name. Naming the class `Apothecary` is sufficient — no `static name` needed.
- No new `any`; TypeScript strict. Vue 3 `<script setup>`, no store library.
- `three` / `@tresjs/core` imported **only** inside `.vue` mesh components; `ApothecaryMesh.vue`
  must not leak `three` into the 2D or initial bundle.
- No automated test runner. Verification is `vue-tsc`, `npm run build`, the dev server, and
  the console harness.

## Dependencies

- **Phase B depends on Phase A.** Anchor `[-8, 1]` covers cells `(-8,1) (-7,1) (-8,2) (-7,2)`
  — all inside the *expanded* interior only. It abuts the extended `j = 0` road directly,
  so no trail extension is needed to reach it.
- **Phase A internal ordering:** field rects and the `GROUND_PATCHES` plates must move
  together; `TRAIL_CELLS` and `LUMBER_CENTER` must follow the LumberMill anchor.
- Phase A must not author houses onto the reserved Apothecary cells.

---

## Notes for the spec writer

**Corrections to the source requests — apply these, do not copy the originals verbatim:**

1. `request.md` touchpoint 11 gives `src/components/environment/views/city/CityGlobalView3D.vue`.
   The file is actually at **`src/components/environment/views/CityGlobalView3D.vue`** (the
   `city/` subdir holds the meshes, `grid.ts` and `town-layout.ts` only).
2. **`BuildingInterior2D.vue` is a missing touchpoint.** `ThemeName` is a closed union of
   `'amber' | 'emerald' | 'sky'` — all three taken by Blacksmith / LumberMill / IronMine. A
   4th member plus its `THEMES` entry is required.
3. `city-expansion/request.md` touchpoint 4 says "`FIELD_1` / `FIELD_2` rects — shift east"
   but omits the hardcoded `GROUND_PATCHES` plates that must move with them.
4. `request.md` success criteria list `npm run console -- inspect Apothecary`; that one-shot
   form cannot reach the post-tick state. Use the interactive REPL.
5. `desired_amount` is **3** per potion, not 20.

**Non-obvious implementation detail:**

6. **Trail must stop short of the relocated mill.** The `[-13, -1]` anchor covers `(-13,0)`
   and `(-12,0)`, so `TRAIL_CELLS` runs `i = −9, −10, −11` only. `terrainAt` returns
   `"grass"` for building cells *before* it checks roads, so an overlap would not throw —
   it would silently render a trail plate under the mill. Note also that `ROAD_CELLS` are
   filtered through `occupantCovers` when building `GROUND_PATCHES` but `TRAIL_CELLS` are
   not; consider filtering both.
7. **`goods.ts` grows from 4 to 39 entries**, and its `export default { … }` object literal
   must list every one — `registry.ts` destructures off it (`Goods.Bloodroot`). Extend the
   existing file; **do not** introduce `herbs.ts` / `potions.ts` or a barrel (explicit user
   decision in `request.md`).
8. **No night gate on brewing.** `shouldTick()` stays default `true`. The LumberMill gates on
   `!isNight()` because chopping is outdoor work; brewing is indoors, and the Blacksmith sets
   the indoor precedent. (`isNight()` is stubbed to `false` regardless.)
9. **`resolveTaskLabel` reads `constructor.name`**, which a `static name = '…'` field shadows.
   Declaring `static name = 'BrewHealthPotion'` makes the 2D task label read
   "BrewHealthPotion" — consistent with the Blacksmith's "MakeIronSword".
10. **Southern corner towers already stand in the sea.** `(5, ±5)` falls inside the `SEA`
    rect today; walls are exempt from the buildable check, so this renders rather than
    throwing. Moving them to `(5, ±7)` preserves the existing look — it is not a new
    regression, but confirm it reads acceptably in the render.
11. **The mill at `[-13, -1]` sits at world `[-37.5, -1.5]`**, past the forest belt
    (`x = −23…−34`) and near the northern scenery edge. No occupancy or terrain conflict —
    `mtn-1` at `[-38, -36]` r=10 is ~33 units away — but verify it does not read as
    stranded, and that the vacated area around `[-31.5, -1.5]` fills with trees sensibly
    once the 5-unit `treeCellOk` clearance ring moves with `LUMBER_CENTER`.

**Verified against the code, no action needed:**

- `BuildingsList.vue` iterates `city.buildings` and renders `building.constructor.name` —
  the Apothecary appears in the sidebar with zero edits.
- The "0 free 2×2 anchors in the current interior" measurement is correct.
- The 2× brewing markup does match the LumberMill: 1 Lumber (10g) → 20 WoodPlank (20g).
- Fallback plot `[-7, 1]` is genuinely free grass in the *current* layout, should Phase A
  be descoped mid-cycle.
