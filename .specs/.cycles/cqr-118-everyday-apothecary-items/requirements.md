# Requirements — Everyday apothecary items, ingredients and recipes

> Authored into the cycle from [`request.md`](./request.md), which holds the brief as
> received and the decisions of the two refinement rounds of 2026-10-23. Source: Linear
> [CQR-118](https://linear.app/cqr/issue/CQR-118/add-everyday-apothecary-items-ingredients-and-recipes).
> No steering docs exist (`.spec-workflow/steering/` absent), so "Alignment" references
> the canonical `.specs/` docs, `CONTEXT.md` and the ADRs.
>
> **Status: specified** on 2026-10-23. Not yet built.

## Introduction

The Apothecary brews two potions from two herbs and sells nothing, so its wallet only
goes down and the quest board has exactly two errands on it. This cycle adds seven cheap
products for townsfolk, eight gathered ingredients to make them from, and the sales line
that turns them into the building's first income.

Three things carry the design and each is a trap if read quickly. **`desired_amount`
stays at 1** — it is not a stock target any more, it is the only thing making the
production list rotate, and removing it would leave the Apothecary making kelp soap
forever. **The sell check runs after the production scan**, because selling first
restores that same trap. And **only one sell may be in flight**, because the second one
throws out of the tick loop where nothing catches.

## Alignment with product vision

- Advances [`.specs/roadmap.md:108`](../../roadmap.md), "crafting chains for armor,
  weapons, and consumables" — the everyday half of the Apothecary's output.
- Gives the quest board something to say. CQR-60 and CQR-61 built a loop whose only two
  errands are Bloodroot and Manabloom; this takes it to ten.
- Honours the `CONTEXT.md` glossary: **Quest**, **Post**, **Gather**, **Forage**,
  **Action**, **Worker**. "Task" is avoided in prose for both quests and actions.
- **Amends ADR 0004** rather than reversing it: a market line for *potions* stays
  forbidden, and the reason — adventurers are meant to buy potions directly — is
  untouched. Only its claim that the Apothecary has no income stops being true.
- Keeps ADR 0002: objectives stay inert data, read through the resolver registry.
- Keeps ADR 0003: a posted quest is still a funded one, escrowed at post time.
- Keeps ADR 0006: the planner still returns steps, never actions.
- ADR 0005 still holds, but recorded traces move — see R8.4.

---

## R1 — The eight ingredients

**R1.1** Eight stackable goods SHALL exist, weight `1`, as `ItemID` entries, `Item`
subclasses in `modules/items/values/goods.ts`, and `ItemRegistry` mappings.

| `ItemID`        | `name`           | `value` |
|-----------------|------------------|--------:|
| `Kelp`          | `Kelp`           |       1 |
| `Mint`          | `Mint`           |       1 |
| `CarrageenMoss` | `Carrageen Moss` |       2 |
| `WillowBark`    | `Willow Bark`    |       2 |
| `SphagnumMoss`  | `Sphagnum Moss`  |       2 |
| `PineResin`     | `Pine Resin`     |       3 |
| `ValerianRoot`  | `Valerian Root`  |       4 |
| `Sulfur`        | `Sulfur`         |       5 |

**R1.2** Each SHALL appear in the `goods.ts` default export, or it is unreachable from
`registry.ts`.

**R1.3** They SHALL sit in their own commented section of `goods.ts`, separate from the
CQR-59 herb catalog: these are everyday ingredients, not herbs, and nothing brews a
potion from them.

**R1.4** `Mint` is a distinct item from the existing `Coldmint`. Neither replaces nor
references the other.

## R2 — The seven products

**R2.1** Seven stackable goods SHALL exist, weight `1`, in the same three places.

| `ItemID`          | `name`             | `value` |
|-------------------|--------------------|--------:|
| `KelpSoap`        | `Kelp Soap`        |       6 |
| `CoughSyrup`      | `Cough Syrup`      |       8 |
| `WillowBarkTea`   | `Willow Bark Tea`  |      10 |
| `MossBandage`     | `Moss Bandage`     |      12 |
| `PineBalm`        | `Pine Balm`        |      16 |
| `SleepingDraught` | `Sleeping Draught` |      16 |
| `SulfurOintment`  | `Sulfur Ointment`  |      20 |

**R2.2** `value` IS the sale price. The market prices every trade at
`ItemRegistry[item].value`, so no second field is added.

**R2.3** Moss bandage at 3× and Pine balm at 2.67× are correct as authored, not
arithmetic slips — see `request.md`, "Accepted trade-offs".

## R3 — Foraging and quest eligibility

**R3.1** All eight ingredients SHALL gain a `FORAGE_TABLE[Location.Forest]` entry:

| Ingredient      | Chance |
|-----------------|-------:|
| `Kelp`          |   0.6  |
| `Mint`          |   0.6  |
| `CarrageenMoss` |   0.55 |
| `WillowBark`    |   0.55 |
| `SphagnumMoss`  |   0.55 |
| `PineResin`     |   0.45 |
| `ValerianRoot`  |   0.3  |
| `Sulfur`        |   0.2  |

**R3.2** Each entry SHALL carry the authored location from the brief as a comment —
Beach, Shore rocks, Forest streams, Damp forest ground, Forest, Damp woods, Mountain
springs — so the day a Coast exists the move is a cut and paste.

**R3.3** No `Location` member, and no `TRAVEL_COST` entry, is added. Both records are
exhaustive over `Location`; neither changes.

**R3.4** WHEN an ingredient has an entry THEN `isObjectiveObtainable` returns true for a
gather objective naming it, and `forageLocationFor` returns `Location.Forest`. An
ingredient without one is silently unaskable (`reviewQuests` hits `if (!location)
continue`), so R3.1 is load-bearing for R7.

## R4 — The seven recipes

**R4.1** One `Action` subclass per product SHALL exist in `Apothecary.ts`, with
`static building_id = BuildingID.Apothecary`.

**R4.2** `input`, `input_origin`, `output` and `output_destination` SHALL be **instance**
properties. A `static output` leaves the instance null and the ingredients are consumed
for nothing — the hazard already flagged above `BrewHealthPotionAction`.

**R4.3** `total_ticks` SHALL be `6` for all seven, from one shared constant.

**R4.4** Each `input` SHALL be exactly its recipe, and each `output` exactly one product:

| Action                   | `input`                                 | `output`                 |
|--------------------------|-----------------------------------------|--------------------------|
| `MakeKelpSoapAction`     | `Kelp` ×3                               | `KelpSoap` ×1            |
| `MakeCoughSyrupAction`   | `CarrageenMoss` ×2                      | `CoughSyrup` ×1          |
| `MakeWillowBarkTeaAction`| `WillowBark` ×2, `Mint` ×1              | `WillowBarkTea` ×1       |
| `MakeMossBandageAction`  | `SphagnumMoss` ×2                       | `MossBandage` ×1         |
| `MakePineBalmAction`     | `PineResin` ×2                          | `PineBalm` ×1            |
| `MakeSleepingDraughtAction` | `ValerianRoot` ×2                    | `SleepingDraught` ×1     |
| `MakeSulfurOintmentAction` | `Sulfur` ×2                           | `SulfurOintment` ×1      |

**R4.5** They are named `Make…`, not `Brew…`. Brewing is what the Apothecary does to
potions; soap and bandages are made.

## R5 — The production list and rotation

**R5.1** `PRODUCTION_LIST` SHALL carry all nine rows — two potions, seven everyday
products — in one table, read by both `chooseNextAction` and `reviewQuests`.

**R5.2** A row's gathered reagents SHALL be **derived from its action's `input` keys**,
not restated on the row. The current `reagent: ItemID` field is removed. Restating one
ingredient already risked drifting from the action; restating a list is worse, and the
existing comment warns that a wrong reagent "brews fine and then never asks for more".

**R5.3** `desired_amount` SHALL be `1` for all seven everyday rows. Potions keep `3`.

**R5.4** **`desired_amount` SHALL NOT be removed, and SHALL NOT be `0`.**
`chooseNextAction` skips a row only when `current_amount >= desired_amount`. Products
are sold on completion (R6), so their stock sits at 0; with no target the first row
whose ingredients are in hand would win on every pass forever and the Apothecary would
make one product and nothing else. The target of 1 is what makes the existing
fall-through rotate.

**R5.5** WHEN the Apothecary runs long enough THEN it SHALL have made all seven
everyday products, not repeats of the first. This is the clause most likely to regress
silently — nothing throws when it does.

**R5.6** Two workers choosing in the same tick may both pick the same row, because a
product is not created until `finished()`. The shelf gets 2 instead of 1. Accepted: both
sell, and reserving against in-flight actions is not worth the machinery.

## R6 — Selling

**R6.1** One action extending `TransportAction` SHALL carry the everyday shelf to
market, with `static building_id = BuildingID.Apothecary` — `TransportAction.finished()`
resolves the building through it.

**R6.2** Its `input` SHALL be a snapshot of the Apothecary's current stock of the
**seven everyday products only**.

**R6.3** **Potions SHALL NOT be sold.** ADR 0004 forbids exactly this and is not amended
on that point. A sell action that reads the whole inventory would breach it silently —
the shelf snapshot is filtered by product list, never by "everything stackable".

**R6.4** `total_ticks` SHALL be `4`.

**R6.5** The sell SHALL be dispatched only **after** the production scan finds nothing
to make, replacing `WaitAction` as the fall-through. WHEN the scan selects a recipe THEN
no sale is dispatched that pass. Selling first would empty the shelf between every brew
and restore the R5.4 trap.

**R6.6** WHEN the shelf is empty THEN `WaitAction` is returned, as today.

**R6.7** **At most one sell action SHALL be in flight.** WHEN another worker is already
running one THEN `chooseNextAction` returns `WaitAction`. Two sells of the same snapshot
both reach `marketService.sell()`; the second throws `InsufficientGoodsError` out of
`takeGoods`, and `TransportAction.finished()` catches only
`MarketInsufficientFundsError`, so it escapes through `handleTick` → `City.handleTick` →
`nextTick` and **kills the tick loop**. The LumberMill never hits this because its
second worker is commented out; the Apothecary has two.

**R6.8** The guard SHALL read `Worker.active_action` across `this.workers`. Workers are
assigned one at a time inside the same `handleTick` pass, so a worker choosing second
already sees the first worker's started action.

**R6.9** WHEN the Market cannot pay THEN `TransportAction.finished()` warns and the
goods stay on the shelf, as today. The trip is wasted and the next pass retries.
Accepted; it means a broke Market reads as a stalled Apothecary.

## R7 — Gather quests

**R7.1** A pure, exported function SHALL derive the quest quantity:

```
gatherQuantityFor(unit_value, recipe_amount)
  = Math.ceil(MIN_QUEST_VALUE / (unit_value * recipe_amount)) * recipe_amount
```

with `MIN_QUEST_VALUE = 20`. It is the smallest multiple of the recipe amount whose
value reaches the floor, so nothing is left over after brewing and the trip is worth
making.

**R7.2** The derived quantities SHALL be:

| Ingredient      | Value | Recipe amount | Quantity | Reward |
|-----------------|------:|--------------:|---------:|-------:|
| `Kelp`          |     1 |             3 |       21 |    21g |
| `Mint`          |     1 |             1 |       20 |    20g |
| `CarrageenMoss` |     2 |             2 |       10 |    20g |
| `WillowBark`    |     2 |             2 |       10 |    20g |
| `SphagnumMoss`  |     2 |             2 |       10 |    20g |
| `PineResin`     |     3 |             2 |        8 |    24g |
| `ValerianRoot`  |     4 |             2 |        6 |    24g |
| `Sulfur`        |     5 |             2 |        4 |    20g |

**R7.3** The reward SHALL be `ItemRegistry[item].value × quantity`. `HERB_QUEST_QUANTITY`
and `HERB_QUEST_REWARD` are removed; the comment on the latter already named this as the
intended replacement.

**R7.4** `HERB_RESTOCK_THRESHOLD` stays at `6`.

**R7.5** One quest per gathered reagent, as today: a shortage of one ingredient must not
hide behind another, and an outstanding quest for the same item suppresses a duplicate.

**R7.6** **The potion quests change as a side effect, and this is accepted.** Deriving
uniformly rather than keeping a second rule for potions moves them from 10 Bloodroot at
45g to **9 at 27g**, and the same for Manabloom. Adventurers earn less per potion
errand; the Apothecary's runway lengthens, which ADR 0004 welcomes. A second pricing
rule for two rows was judged worse than the change.

**R7.7** Willow bark and mint are quested separately and arrive unbalanced — 10 willow
bark makes 5 teas needing 5 mint, while a mint quest brings 20. The surplus sits on the
shelf and the restock threshold stops it recurring. Accepted.

## R8 — What does not change

**R8.1** No building other than the Apothecary is touched.

**R8.2** Nothing in `src/components/` changes. These items need no new interface; they
appear through the existing inventory panel.

**R8.3** Potions are neither sold nor re-priced. Their recipes, tick costs and
`desired_amount` of 3 are untouched; only their quest quantity moves, per R7.6.

**R8.4** Determinism holds per ADR 0005 — same seed, same code, same run — but **traces
recorded before this cycle are not reproduced**. New forage entries and new quest
quantities change how many rolls each shift makes, so every later roll moves. The
seed-7 trace recorded in the forage cycle's R6.2 is superseded for runs after this one.

**R8.5** No new `Location`, no travel costs, no world expansion.

**R8.6** Quest posting *policy* — budgets, caps, shuffle bags, randomized quantities —
is out of scope and deferred to a sibling issue. This cycle only makes the per-recipe
fields it will need exist.

## R9 — The test

**R9.1** A `node:test` file `src/game/city/buildings/Apothecary.test.ts` SHALL cover
`gatherQuantityFor`, and `npm test` SHALL run it. This is the agreed pure-function seam
from `CLAUDE.md`; the rotation and the sell guard are verified by the console trace in
R11.2, not by a test.

**R9.2** Cases SHALL cover every row of the R7.2 table, plus the two potion reagents
(Bloodroot and Manabloom at value 3, recipe amount 3, giving 9).

**R9.3** A case SHALL assert the floor is reached, not merely approached: for each row,
`quantity × value >= 20` and `quantity % recipe_amount === 0`.

**R9.4** A case SHALL assert that an ingredient whose single recipe amount already
clears the floor is not rounded up past it — value 20, amount 1 gives 1, not 20.

## R10 — Documentation

**R10.1** [ADR 0004](../../../docs/adr/0004-the-apothecary-is-meant-to-run-out-of-money.md)
SHALL gain an amendment note: the Apothecary now has an income line from everyday goods;
the prohibition on selling **potions** to the market stands, and so does the reason. The
original text is not rewritten.

**R10.2** [`.specs/architecture.md`](../../architecture.md) SHALL have its Items module
line widened beyond "Lumber, WoodPlank, IronOre, IronIngot", and its World module line
noting the forage table now feeds everyday production as well as potions.

**R10.3** [`.specs/apothecary-herb-catalog.md`](../../apothecary-herb-catalog.md) SHALL
note that the Apothecary's second input catalog — the everyday ingredients — is authored
in this cycle and is deliberately not part of the herb catalog.

**R10.4** [`.specs/.cycles/README.md`](../README.md) SHALL be marked implemented with
the observed console trace.

**R10.5** The Linear ticket SHALL be corrected: **8 ingredients, 8 of them gathered**,
linen and beeswax removed from the ingredient table, and the Moss bandage and Pine balm
recipes reduced to their gathered ingredient. Its "10" and "7" counts are unreachable as
written.

## R11 — Verification

**R11.1** `npx vue-tsc -b --force` clean, `npm run build` clean, `npm test` green.

**R11.2** Console trace, recorded here as an as-built note: a pinned seed run long
enough for the Apothecary to make all seven products, sell at least one shelf, and post
at least one everyday gather quest. It SHALL record that all seven products were made
(R5.5), that the Apothecary's money is higher at the end than at the start — the first
time that has been true — and that the tick loop survived concurrent sells (R6.7).

**R11.3** The dev server renders the Apothecary interior with no console errors, and the
everyday products appear in its inventory panel and then leave it.
