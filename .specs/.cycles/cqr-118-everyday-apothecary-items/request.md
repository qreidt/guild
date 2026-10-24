# Request — Everyday apothecary items, ingredients and recipes

|                  |                                                                                                                                                                                                                                      |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Linear [CQR-118](https://linear.app/cqr/issue/CQR-118/add-everyday-apothecary-items-ingredients-and-recipes), team `CQR`, project "Guild Game". Created 2026-10-23 from a design handoff pasted into the intake session.             |
| **Branch**       | `feat/add-everyday-apothecary-items-ingredients-and-recipes`, cut at the `cycle` commit that carries this folder.                                                                                                                                                   |
| **User framing** | "Items the apothecary makes to earn money AND create gather quests for adventurers." Simple, everyday, all-year money-makers for townsfolk — not consumables for adventurers. Do not involve other buildings. Do not add complexity. |
| **Type**         | Feature. Content and data, on machinery that already exists.                                                                                                                                                                         |
| **Refined**      | 2026-10-23, two rounds against the code, 9 decisions. Round 1 settled the catalog; round 2 settled the four values round 1 had deferred. Both folded into this file. There is no `refined-brief.md` for this cycle.                                                                                                           |

> **The Linear ticket is a lossy copy of the handoff.** Its ingredient table
> dropped `linen` and `beeswax` — which is why the Moss bandage and Pine balm
> cost rows do not multiply out — and it flipped mint's *Gathered* column to
> `Yes`. Where the two disagree the handoff is the brief, and the numbers below
> are the reconciliation.
>
> This file holds the brief as received and the decisions of the refinement
> rounds. Record divergences during the build as as-built deltas in
> [`requirements.md`](./requirements.md), not here.

## Problem

The Apothecary is the only building in the city with no income. It brews Health
and Mana potions from foraged herbs, never sells them, and since CQR-60 it pays
for gather quests as well, so its wallet only ever goes down. [ADR
0004](../../../docs/adr/0004-the-apothecary-is-meant-to-run-out-of-money.md)
accepts that as temporary and names the remedy: *"the feature that has not been
built yet."*

Separately, the quest board has exactly two things to ask for. Bloodroot and
Manabloom are the only items any building wants, both forage from the Forest,
both post at a flat 45g for 10 units. Every quest an adventurer will ever see is
one of two identical errands. The loop built across CQR-60 and CQR-61 works and
has nothing to say.

## Solution

Seven cheap items the Apothecary makes for **townsfolk** — soap, cough syrup,
tea, a bandage, a balm, a sleeping draught, an ointment. Nothing an adventurer
drinks: potions remain the adventurer-facing line and are handled separately.

Each is built on an ingredient that comes from outside the walls, so the board
gains eight new things to ask for, at eight quantities and eight rewards. They
are deliberately dull and deliberately cheap — no seasonality, no rarity, no
gating. The point is a steady trickle the city can run on all year.

## Catalog

### Ingredients

`Value` is what the Apothecary pays per unit as a gather reward. It is also the
item's market price: the engine has one `value` field and `TransportAction`
prices off it, so the two cannot be separated today.

| Item ID         | Display name   | Value | Find chance | Authored location (documentation only) |
|-----------------|----------------|------:|------------:|----------------------------------------|
| `Kelp`          | Kelp           |     1 |        0.6  | Beach                                  |
| `Mint`          | Mint           |     1 |        0.6  | Forest streams                         |
| `CarrageenMoss` | Carrageen Moss |     2 |        0.55 | Shore rocks                            |
| `WillowBark`    | Willow Bark    |     2 |        0.55 | Forest streams                         |
| `SphagnumMoss`  | Sphagnum Moss  |     2 |        0.55 | Damp forest ground                     |
| `PineResin`     | Pine Resin     |     3 |        0.45 | Forest                                 |
| `ValerianRoot`  | Valerian Root  |     4 |        0.3  | Damp woods                             |
| `Sulfur`        | Sulfur         |     5 |        0.2  | Mountain springs                       |

All eight are gathered, and all eight forage from `Location.Forest` — see
decision 1. The find chances slot into the existing value-inverse ladder in
`FORAGE_TABLE` (0.6 for the cheapest commons down to 0.2 for Duskbloom at
value 5); no new calibration is introduced.

`Mint` sits alongside the existing `Coldmint`. Distinct items, distinct IDs.

### Recipes

Each recipe makes one item. `Sells for` is the item's `value`.

| Item ID           | Display name     | Ingredients           | Cost | Sells for | Markup |
|-------------------|------------------|-----------------------|-----:|----------:|-------:|
| `KelpSoap`        | Kelp Soap        | 3 Kelp                |    3 |         6 |     2× |
| `CoughSyrup`      | Cough Syrup      | 2 Carrageen Moss      |    4 |         8 |     2× |
| `WillowBarkTea`   | Willow Bark Tea  | 2 Willow Bark, 1 Mint |    5 |        10 |     2× |
| `MossBandage`     | Moss Bandage     | 2 Sphagnum Moss       |    4 |        12 |     3× |
| `PineBalm`        | Pine Balm        | 2 Pine Resin          |    6 |        16 |  2.67× |
| `SleepingDraught` | Sleeping Draught | 2 Valerian Root       |    8 |        16 |     2× |
| `SulfurOintment`  | Sulfur Ointment  | 2 Sulfur              |   10 |        20 |     2× |

Every recipe stays profitable at a reward of 1× ingredient value, which is the
handoff's "keep each quest profitable" lever: a fulfilled quest plus a brew nets
at least the ingredient cost back.

## Decisions of the first round

Five questions were open when the brief landed. All five are closed, and every
one of them *reduced* scope.

1. **Locations are documentation only.** The handoff names seven gathering spots
   — Beach, Shore rocks, Forest streams, Damp forest ground, Forest, Damp woods,
   Mountain springs. None becomes a `Location`. All eight ingredients forage
   from `Location.Forest`, with the authored spot kept as a per-entry comment.
   No new `TRAVEL_COST` entries, no new `FORAGE_TABLE` rows.

2. **Linen and beeswax are dropped entirely.** No `ItemID`, no value, in no
   recipe. Moss bandage and Pine balm lose their second ingredient. This is what
   makes those two cost rows 4 and 6 rather than the handoff's 6 and 8, and it
   is deliberate: a pantry the Apothecary never restocks would either understate
   its costs or stall it silently (constraint 3 below).

3. **Mint is gathered.** The handoff left this open (`No*`, "location would be
   forest streams"); it was flipped to `Yes` on the ticket deliberately. Mint
   gets a forage entry like the rest, which makes it eight gathered ingredients
   rather than seven.

4. **A recipe's reagents are a list.** `PRODUCTION_LIST` carries one
   `reagent: ItemID` per row today, which cannot express Willow bark tea.

5. **No pt-BR names.** The handoff's tables are bilingual. The project has no
   i18n of any kind and `Item.name` is a single string, so bilingual naming
   stays a documentation convention and does not reach the code.

## Decisions of the second round

Round 1 deferred four values to `requirements.md` and `plan.md`. All four are
now settled. Unlike round 1, decision 7 *adds* scope.

6. **Every brew is 6 ticks; the market run is 4.** Half a potion's 12, and equal
   to the LumberMill's shortest action. Flat across all seven rather than scaled
   by value: under the rotation in decision 7 every product is made equally
   often whatever its tick cost, so a ladder would buy nothing and cost a
   constant per recipe. Two tunable numbers, not fourteen. The market run is
   shorter than the LumberMill's 14 because the Apothecary is inside the walls
   at `[-8, 1]` and the Market is at `[2, 2]`.

7. **Products are sold the moment they are made, so selling is in scope.** This
   closes the open tension below in favour of building the sales line here.
   The shelf is never stockpiled: the Apothecary makes one of each product it
   has ingredients for, then runs a single trip to market with the whole shelf.

   **`desired_amount` stays, at 1.** It is tempting to drop it when nothing is
   stockpiled, and that would break the building. `chooseNextAction` skips a
   recipe only when `current_amount >= desired_amount`; with stock permanently
   at 0 the first recipe whose ingredients are in hand would win on every pass,
   forever, and the Apothecary would make kelp soap and nothing else. A target
   of 1 is what makes the existing fall-through rotate through all seven. No new
   rotation mechanism is needed, and none should be added.

   **The sell check goes after the production scan, not before it.** Selling
   first — the LumberMill's shape — would empty the shelf between every brew and
   restore the same single-product trap. Brew whatever is under target; when
   nothing is left to brew and the shelf is not empty, sell the lot. The sale
   replaces `WaitAction` as the fall-through.

8. **Quest quantity is derived from a 20g minimum per quest**, not a fixed
   multiplier: the smallest multiple of the recipe amount whose value reaches
   20g. One floor to tune instead of eight quantities, and it keeps a trip to
   the forest worth making for the cheap ingredients.

   | Ingredient     | Value | Recipe amount | Quantity | Reward | ≈ forage shifts |
   |----------------|------:|--------------:|---------:|-------:|----------------:|
   | Kelp           |     1 |             3 |       21 |    21g |             5.8 |
   | Mint           |     1 |             1 |       20 |    20g |             5.6 |
   | Carrageen Moss |     2 |             2 |       10 |    20g |             3.0 |
   | Willow Bark    |     2 |             2 |       10 |    20g |             3.0 |
   | Sphagnum Moss  |     2 |             2 |       10 |    20g |             3.0 |
   | Pine Resin     |     3 |             2 |        8 |    24g |             3.0 |
   | Valerian Root  |     4 |             2 |        6 |    24g |             3.3 |
   | Sulfur         |     5 |             2 |        4 |    20g |             3.3 |

   Shifts are at the base find chance with no skill bonus, 6 ticks a shift.
   Every row stays profitable: 21 kelp costs 21g and makes 7 soap worth 42g; 4
   sulfur costs 20g and makes 2 ointments worth 40g.

9. **`HERB_RESTOCK_THRESHOLD` stays at 6.** Its original intent — "two brews'
   worth, a recipe consumes 3" — still holds for recipes consuming 2 or 3.

## Scope

### In scope

1. **15 new items** — 8 ingredients + 7 products — as `ItemID` entries, `Item`
   subclasses in `modules/items/values/goods.ts`, and `ItemRegistry` mappings.
   All stackable goods, weight 1.
2. **8 `FORAGE_TABLE` entries** under `Location.Forest`, so every ingredient can
   be the objective of a gather quest.
3. **7 brewing actions** on the Apothecary, with instance `input` / `output`.
4. **`PRODUCTION_LIST` reagents as a list**, so a multi-ingredient recipe can
   ask for everything it needs.
5. **Per-recipe quest quantity and reward** — quantity the smallest multiple of
   the recipe amount reaching the 20g floor, reward as ingredient value ×
   quantity.
6. **A sell action** that takes the whole everyday shelf to market, dispatched
   as the fall-through once nothing is left to brew.
7. **An amendment to ADR 0004**, which this cycle falsifies.

### Out of scope

- **Quest posting policy** — reserve floors, separate budgets, self-funded pots,
  open-quest caps, shuffle bags, weighting by need or by staleness, randomized
  quantities. Explicitly deferred by the ticket and still being designed. This
  cycle must leave the data shape open to all of them and do nothing more.
- **New locations**, travel costs, or any world expansion.
- **Linen, beeswax, honey, tallow**, and any pantry-ingredient concept.
- **Townsfolk.** Nobody buys these in-world; there is no consumer entity.
- **Seasonality, spoilage, rarity, quality tiers.**
- **Any other building.** Nothing supplies the Apothecary but adventurers.
- **i18n.**

## The open tension, resolved

Round 1 left one question unanswered: the handoff's stated goal is income —
*"items the apothecary makes to earn money"*, *"sold at the market"* — but none
of the five acceptance criteria asks for a selling action, so the cycle as
ticketed would deliver the catalog and no income.

**Decision 7 resolves it: the sales line is built here.** Three consequences
follow, and all three belong to this cycle.

- **ADR 0004 must be amended.** It forbids a market sales line **for potions**,
  on the grounds that the intended revenue is adventurers buying potions
  directly. That reasoning survives these items untouched — they are for
  townsfolk, not adventurers, and the handoff's first constraint draws exactly
  that line. But the ADR's opening claim that the Apothecary "has no income"
  stops being true the moment this ships, so the ADR gains a note recording
  what changed and what still stands. It is not reversed.
- **The pattern already exists.** `TransportAction` and
  `LumberMill.SellWoodAction` are the shape to copy, and the market prices off
  `ItemRegistry[item].value`, so there is no pricing to invent.
- **A failed sale is silent and leaves the goods put.** `TransportAction` moves
  nothing at `start()`; `finished()` calls `marketService.sell()` and catches
  `MarketInsufficientFundsError` with a `console.warn`. If the Market cannot
  pay, the trip is wasted and the shelf stays full — the next pass simply tries
  again. Acceptable, but it means a broke Market looks like a stalled
  Apothecary.

## Accepted trade-offs

- **Two items drift off the flat 2× markup.** Moss bandage lands at 3× and Pine
  balm at 2.67×, because the dropped pantry ingredients took cost out without
  changing the authored sale price. `chooseNextAction` walks `PRODUCTION_LIST`
  in priority order rather than by margin, so nothing chases it. The brief says
  "tune later"; the authored sale prices are kept.
- **Kelp, carrageen moss and sulfur forage from the forest.** The direct
  consequence of decision 1. Invisible in the sim, slightly odd in a log line,
  and a one-line forage-table move the day a Coast exists.
- **An ingredient's value does double duty** — gather reward per unit *and*
  market price — because the engine has one `value` field. Tuning one tunes the
  other.
- **Two of the ticket's acceptance criteria now count wrong.** With linen and
  beeswax dropped and mint gathered it is **8 ingredients, 8 of them gathered**,
  not "10 ingredients" and "7 gathered". The ticket needs correcting so its
  acceptance criteria stay checkable.
- **Two workers can brew the same product in the same tick.** A brew debits its
  ingredients at `start()` but creates nothing until `finished()`, so stock is
  still 0 when the second worker chooses, and both pick the recipe at the top
  of the list. The shelf gets 2 of something instead of 1. This is the existing
  behaviour with potions, it costs nothing — both get sold — and fixing it
  would mean reserving against in-flight actions. Left alone.
- **These quests pay less per hour than the existing herb quests.** Bloodroot
  pays 45g for roughly 3.3 shifts; the new ones pay 20–24g for 3 to 5.8. That
  is the 1× reward margin doing its job — the Apothecary cannot pay more per
  unit without eating the product's markup — and it makes everyday errands the
  filler work they are meant to be. Kelp and mint are the slowest at ~5.6
  shifts, the cost of a 20g floor on a 1g ingredient.

## Known engine constraints

Live behaviours the implementation must respect. Each was verified against the
code during the refinement round, not assumed.

1. **A quest can only be posted for something the forage table knows about.**
   `isObjectiveObtainable` requires `findChance > 0`, and `forageLocationFor`
   returns the first location with a non-zero chance. An ingredient with no
   `FORAGE_TABLE` entry is silently unaskable: `reviewQuests` hits
   `if (!location) continue` and the Apothecary simply never asks for it.

2. **`ItemRegistry` is `Record<ItemID, IItem>`** — exhaustive. An `ItemID`
   without a registry entry fails to compile, so an item cannot be half-added.

3. **A recipe with no stock stalls silently.** `chooseNextAction` calls
   `validateLedger` and `continue`s on failure, falling through to `WaitAction`.
   No throw, no warning. Correct behaviour, but it means a mis-wired recipe
   looks exactly like an idle building.

4. **`static output` on an action leaves the instance null** and the inputs are
   consumed for nothing. The comment above `BrewHealthPotionAction` already
   flags this; the seven new actions must use instance properties.

5. **Reagents restated on `PRODUCTION_LIST` can drift from the action's
   `input`.** The current comment warns that "an action whose reagent is wrong
   here brews fine and then never asks for more". Widening `reagent` to a list
   makes restating it more error-prone, not less — deriving the gathered
   reagents from the action's `input` keys removes the hazard outright.

6. **`HERB_QUEST_QUANTITY` (10) and `HERB_QUEST_REWARD` (45) are file-level
   constants** shared by every recipe. The comment on the reward already names
   the fix: deriving it from goods value × a margin is *"the better long-term
   answer and is a drop-in replacement later — the field is a number either
   way."* This cycle cashes that in.

7. **The market prices everything at `ItemRegistry[item].value`.** There is no
   separate sale-price field to add; the `Sells for` column *is* `value`.

## Touchpoints

| # | File                                    | Change                                                                          |
|---|-----------------------------------------|---------------------------------------------------------------------------------|
| 1 | `src/modules/items/id.ts`               | 15 new `ItemID` entries                                                         |
| 2 | `src/modules/items/values/goods.ts`     | 15 new `Item` subclasses, plus their default-export entries                     |
| 3 | `src/modules/items/registry.ts`         | 15 registry mappings                                                            |
| 4 | `src/modules/world/location.ts`         | 8 `FORAGE_TABLE[Location.Forest]` entries                                       |
| 5 | `src/game/city/buildings/Apothecary.ts` | 7 brew actions + 1 sell action; `PRODUCTION_LIST` reagents as a list; per-recipe quantity, reward and tick cost |
| 6 | `docs/adr/0004-the-apothecary-is-meant-to-run-out-of-money.md` | Amend — the Apothecary now has an income line                                                                 |

No other building is touched, and nothing in `src/components/` changes — these
items need no new interface.

## Settled values

Everything round 1 deferred. Each is one constant, and each is the only place
to tune that axis.

| Constant                   | Value | Note                                                  |
|----------------------------|------:|-------------------------------------------------------|
| Brew `total_ticks`         |     6 | Flat across all seven recipes — decision 6             |
| Market run `total_ticks`   |     4 | One trip, whole shelf                                  |
| `desired_amount`           |     1 | Per product. Load-bearing: it is the rotation          |
| Minimum quest value        |   20g | Quantity derived from it — decision 8                  |
| `HERB_RESTOCK_THRESHOLD`   |     6 | Unchanged                                              |

Nothing is left open. The remaining judgement calls are ordering and naming,
which belong to `plan.md`.

## Success criteria

- All 15 items resolve through `ItemRegistry` with the names and values above.
- The Apothecary makes all seven products, each consuming exactly its recipe.
- **It rotates.** Over a long run it makes all seven, not repeats of the first.
  This is the one thing most likely to regress silently.
- **Products reach the market and are not stockpiled.** The everyday shelf
  returns to empty after each round, and the Apothecary's money trends up
  rather than down — the first time it ever has.
- Each of the eight ingredients can be the objective of a posted gather quest,
  and an adventurer can fulfil one end to end.
- Quest quantities are the smallest multiple of the recipe amount reaching 20g,
  and rewards are ingredient value × quantity.
- No building other than the Apothecary is touched.
- ADR 0004 records what this cycle changed and what still stands.
- `npx vue-tsc -b --force` clean; `npm run build` clean; `npm test` green; no
  console errors in the dev server.

## Deferred follow-up

The handoff's second half — **how the Apothecary decides when to post** — is a
cycle of its own and should be filed as a sibling issue so the design is not
lost. It covers three groups of levers: protecting the potion budget (reserve
floor, separate budget, or a self-funded pot), capping what sits on the board
(open-quest cap, post-on-need, gradual unlock), and randomizing the order
(shuffle bag, weighting by staleness or by need, randomized quantities).

Scope item 5 above exists to serve it: with reward-per-unit, quantity and a
stock threshold as per-recipe fields, that cycle is pure policy and refactors
nothing.
