# Tasks — Everyday apothecary items, ingredients and recipes

> Build order follows [`plan.md`](./plan.md), "Build order": **1 → 2 → 3 → 4 → 5 → 6**,
> one commit each. Tasks read [`requirements.md`](./requirements.md) (R1–R11) and
> `plan.md`.
>
> Tasks 1 and 2 are inert — they add items and forage rows nothing yet reads, and each
> leaves the game running unchanged. **Task 3 is a prefactor** that lands the potion
> quest delta (R7.6) alone, before any new product exists to confuse the diff.
> **Task 5 is the one that can kill the tick loop**: two workers reaching a sale in the
> same pass throw out of `handleTick`, where nothing catches. It ships by itself.
>
> The user makes the commits and opens the PR.
>
> ---
>
> **All 6 tasks complete (2026-10-24, branch `CQR-118`).** `npx vue-tsc -b --force`
> clean, `npm run build` clean, `npm test` 11/11. At `seed 1`, `tick 300` the
> Apothecary's money rose 1000 → 1139 on twelve sales totalling 490g, all seven
> products made and sold, potions untouched. R6.7 was verified by disabling the guard
> and reproducing the throw. Two as-built deltas are recorded on
> [requirements.md](./requirements.md) R7.1 and R9.1 — `gatherQuantityFor` lives in
> `modules/quests/sizing.ts`, not on the Apothecary, because no test can import a
> building module through the `Action`/`Building`/`City` import cycle. One deviation
> not in the spec: two batches of each ingredient are seeded at construction, as CQR-59
> did for the herbs, so the rotation is watchable before an adventurer has walked.

- [x] 1. The fifteen items
  - Files: `src/modules/items/id.ts`, `src/modules/items/values/goods.ts`,
    `src/modules/items/registry.ts` (modify)
  - Eight ingredients and seven products per the R1.1 and R2.1 tables: `ItemID` entries,
    `Item` subclasses with `static id / name / value / weight = 1`, default-export
    entries, and registry mappings. Put them in their own commented section of
    `goods.ts`, below the herb catalog and above the potions, headed so a reader sees
    these are everyday ingredients and not herbs — nothing brews a potion from them.
    `Mint` is its own item and does not touch the existing `Coldmint`.
  - Inert on merge: nothing produces or consumes any of the fifteen. That is expected
    and matches the CQR-59 precedent of authoring a catalog ahead of its recipes.
  - `npx vue-tsc -b --force` clean. `ItemRegistry` is `Record<ItemID, IItem>`, so a
    missing mapping fails the build rather than slipping through.
  - _Leverage: the CQR-59 herb block in `goods.ts` is the shape to copy_
  - _Requirements: R1.1–R1.4, R2.1–R2.3_

- [x] 2. The eight forage rows
  - Files: `src/modules/world/location.ts` (modify)
  - The R3.1 chances under `FORAGE_TABLE[Location.Forest]`, each with the brief's
    authored spot as a trailing comment — Beach, Shore rocks, Forest streams, Damp
    forest ground, Forest, Damp woods, Mountain springs — so a future Coast is a cut and
    paste. Add no `Location` member and no `TRAVEL_COST` entry; both records are
    exhaustive over `Location` and neither changes.
  - Still inert: no production row asks for these yet. Verify by reading, not by running
    — `forageLocationFor(ItemID.Kelp)` returning `Forest` is what task 4 will depend on.
  - _Leverage: the existing commented tiers in the Forest table (commons at 0.6 down to
    Duskbloom at 0.2) — the new chances slot into that same ladder_
  - _Requirements: R3.1–R3.4_

- [x] 3. Prefactor — derived reagents and derived quest quantity
  - Files: `src/game/city/buildings/Apothecary.ts` (modify),
    `src/game/city/buildings/Apothecary.test.ts` (new)
  - Still only the two potions in `PRODUCTION_LIST`. Drop the `reagent: ItemID` field
    and derive the list from the action's `input` keys (`reagentsOf`, plan.md); carry
    the `ponytail:` note about lifting the input map to a static if the review pass ever
    shows in a profile — **not** by making `input` static, which is the
    `BrewHealthPotionAction` footgun. Replace `HERB_QUEST_QUANTITY` and
    `HERB_QUEST_REWARD` with `MIN_QUEST_VALUE = 20` and the exported pure
    `gatherQuantityFor(unit_value, recipe_amount)`; reward becomes
    `ItemRegistry[item].value × quantity`. Keep `HERB_RESTOCK_THRESHOLD` at 6.
  - **This changes the potion quests** from 10 Bloodroot at 45g to 9 at 27g, and the
    same for Manabloom (R7.6). That is the whole visible effect of this commit, which is
    why it ships alone.
  - Then the test, per R9: every row of the R7.2 table plus Bloodroot and Manabloom at
    9; the floor is reached and the quantity divides by the recipe amount; and an
    ingredient already clearing the floor at one unit gives 1, not 20. Shape and imports
    follow `ForageAction.test.ts` — `node:test`, `node:assert/strict`, no framework.
    `npm test` green.
  - _Leverage: the comment on `HERB_QUEST_REWARD` already names this derivation as the
    intended replacement; `ForageAction.test.ts` for the test shape_
  - _Requirements: R5.2, R7.1–R7.7, R9.1–R9.4_

- [x] 4. The seven make actions, and rotation
  - Files: `src/game/city/buildings/Apothecary.ts` (modify)
  - Seven `Action` subclasses per the R4.4 table, named `Make…` not `Brew…` (R4.5), with
    `static building_id`, **instance** `input` / `input_origin` / `output` /
    `output_destination`, and `total_ticks = 6` from one shared constant. Seven
    `PRODUCTION_LIST` rows with `desired_amount: 1`.
  - Put a comment on `desired_amount` saying what it now is: **not a stock target but
    the rotation.** Products are sold on completion so their stock sits at 0; drop the
    field or set it to 0 and the first row with ingredients wins on every pass, forever,
    and the building silently becomes a soap factory (R5.4).
  - Verify rotation before moving on: run the dev server or the console long enough to
    see all seven made, not repeats of the first (R5.5). Nothing throws when this
    regresses, so it has to be looked at.
  - _Leverage: `BrewHealthPotionAction` is the shape to copy, including its comment
    about instance vs static `output`_
  - _Requirements: R4.1–R4.5, R5.1, R5.3–R5.6, R8.1, R8.2, R8.5, R8.6_

- [x] 5. The sell action, the fall-through, and the one-sell guard
  - Files: `src/game/city/buildings/Apothecary.ts` (modify)
  - `SellEverydayGoodsAction extends TransportAction` with
    `static building_id = BuildingID.Apothecary` — `TransportAction.finished()` resolves
    the building through it — `total_ticks = 4`, and `input` a snapshot of the seven
    everyday products only. **Never potions**: ADR 0004 still forbids that, and a
    snapshot of "everything stackable" would breach it silently (R6.3).
  - Rewrite the tail of `chooseNextAction` to the ladder in plan.md: scan the production
    list first and return a recipe if one is under target; then, only if nothing is to
    be made, return `WaitAction` when a sell is already in flight, a sale when the shelf
    is not empty, and `WaitAction` otherwise. Selling before the scan restores the
    soap-factory trap (R6.5).
  - **The guard is the point of this commit.** Two workers both falling through to a
    sale snapshot the same shelf; the second `finished()` throws
    `InsufficientGoodsError` from `takeGoods`, `TransportAction.finished()` catches only
    `MarketInsufficientFundsError`, and it escapes through `handleTick` →
    `City.handleTick` → `nextTick` and kills the loop. Guard with
    `this.workers.some((w) => w.active_action instanceof SellEverydayGoodsAction &&
    !w.active_action.isDone())`, and comment that it is sound because `handleTick`
    assigns and starts each worker before choosing for the next.
  - Verify by running past the first two full rounds, where both workers reach the
    fall-through together — the cadence that produces the crash.
  - _Leverage: `LumberMill.SellWoodAction` for the `TransportAction` shape; it has the
    same latent bug and cannot hit it, because its second worker is commented out_
  - _Requirements: R6.1–R6.9, R8.3_

- [x] 6. Documentation, the ADR amendment and the Linear correction
  - Files: `docs/adr/0004-the-apothecary-is-meant-to-run-out-of-money.md`,
    `.specs/architecture.md`, `.specs/apothecary-herb-catalog.md`,
    `.specs/.cycles/README.md`, this cycle's `requirements.md` (modify), plus the Linear
    ticket
  - Amend ADR 0004: the Apothecary now has an income line from everyday goods; the
    prohibition on selling **potions** to the market stands, and so does its reason. Add
    the note, do not rewrite the original. Widen the `architecture.md` Items module line
    past "Lumber, WoodPlank, IronOre, IronIngot" and note in the World module line that
    the forage table now feeds everyday production too. Note in the herb catalog that
    the everyday ingredients are a second, separate input catalog.
  - Then run R11.2 and record the trace as an as-built note under it: all seven products
    made, at least one shelf sold, the Apothecary's money higher at the end than at the
    start, and the tick loop alive through concurrent sells. Point the forage cycle's
    R6.2 seed-7 note here rather than rewriting it — this cycle moves the stream (R8.4).
    Mark the cycles README implemented with the observed numbers.
  - Correct the Linear ticket: **8 ingredients, 8 gathered**; drop linen and beeswax from
    the ingredient table; reduce the Moss bandage and Pine balm recipes to their gathered
    ingredient. Its "10" and "7" counts cannot be satisfied as written.
  - `npx vue-tsc -b --force` clean, `npm run build` clean, `npm test` green. **Stop here
    for the commit.**
  - _Requirements: R8.4, R10.1–R10.5, R11.1–R11.3_
