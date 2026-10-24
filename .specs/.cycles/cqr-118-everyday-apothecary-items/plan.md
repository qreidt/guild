# Design — Everyday apothecary items, ingredients and recipes

> Implements [`requirements.md`](./requirements.md) (R1–R11). Reads
> [`request.md`](./request.md) for the catalog and the nine decisions, `CONTEXT.md` for
> **Gather**, **Forage**, **Action** and **Worker**, and ADR 0004 for what this cycle
> amends and what it leaves standing.

## Shape of the change

Six commits. Five files of code, one new test, five documents.

```
items     id.ts             15 ItemID entries                                  (R1, R2)
          goods.ts          15 Item subclasses, own section, default export     (R1, R2)
          registry.ts       15 mappings — exhaustive, so this cannot be skipped (R1, R2)
world     location.ts       8 FORAGE_TABLE entries under Forest                 (R3)
engine    Apothecary.ts     7 make actions, 1 sell action, the list, the quests (R4–R7)
test      Apothecary.test.ts  gatherQuantityFor                                 (R9)
docs      ADR 0004, architecture.md, herb catalog, cycles README, Linear        (R10)
```

Nothing outside `Apothecary.ts` learns that everyday goods exist. No file gains an
import edge.

## The three traps

Everything hard about this cycle is in `chooseNextAction`. The data entry is data entry.

### 1. Rotation lives in `desired_amount`

The building sells on completion, so everyday stock is 0 almost always. The existing
scan is:

```ts
for (const recipe of PRODUCTION_LIST) {
    const current_amount = list.get(recipe.product) ?? 0;
    if (current_amount >= recipe.desired_amount) continue;
    ...
    return action;
}
```

With `desired_amount` gone, or 0, `current_amount >= 0` is never true, the first row
with ingredients in hand returns on every pass, and the Apothecary makes kelp soap until
the kelp runs out — then cough syrup until that runs out. It never looks broken. It
throws nothing. It just quietly becomes a soap factory.

`desired_amount: 1` keeps the skip meaningful: one of each is made, then the scan falls
through. That is the rotation, free, in a line that already exists.

### 2. The sell check goes last, not first

The LumberMill's shape is sell-first:

```ts
if (this.inventory.getCount(ItemID.WoodPlank) >= 80) return new SellWoodAction(80);
```

Copying that here reintroduces trap 1 from the other side: shelf empties → every row is
under target again → first row wins → soap factory, with a market trip between each
batch. The scan has to run first and the sale has to be the fall-through:

```
for each row in PRODUCTION_LIST:
    if stock(product) >= desired_amount: continue
    if !validateLedger(action.input): continue
    return action                                   ← something to make
if a sell is already in flight: return WaitAction   ← R6.7
if the everyday shelf is not empty: return SellAction(shelf)
return WaitAction
```

Read top to bottom that is the whole building: make what is missing, otherwise take the
shelf to market, otherwise wait.

### 3. The second sell kills the tick loop

This is the one that crashes, and it is reachable on an ordinary run.

`TransportAction.start()` is overridden to move nothing — goods stay with the seller
until `finished()`, where `marketService.sell()` creates and commits the transaction.
So a sell action in flight has not debited the shelf. Two workers both falling through
to a sale in the same pass both snapshot the same stock. The first `finished()` succeeds
and empties the shelf. The second reaches `takeGoods`, which throws
`InsufficientGoodsError`.

`TransportAction.finished()` catches only `MarketInsufficientFundsError` and rethrows
anything else. Nothing above catches at all:

```
Worker.tick() → Action.tick() → finished() → throw
  ↑ BaseBuilding.handleTick → City.handleTick → GameController.nextTick → dead
```

The LumberMill has this bug too and cannot hit it — its second worker is commented out.
The Apothecary runs two, and with seven products both workers reach the fall-through
together on a regular cadence.

The guard is cheap because `Worker.active_action` is public and `handleTick` assigns
workers one at a time:

```ts
const selling = this.workers.some(
    (w) => w.active_action instanceof SellEverydayGoodsAction && !w.active_action.isDone(),
);
```

Worker A is assigned and started before worker B chooses, so B sees A's action. Note
this is only safe because assignment and `start()` happen in the same loop iteration —
if `handleTick` ever assigns all workers before starting any, the guard still holds
(`active_action` is set at assignment) but the reasoning changes. A comment should say
so.

## Reagents are derived, not restated

`PRODUCTION_LIST` currently carries `reagent: ItemID` beside the action, with a comment
warning they can drift. Three recipes now have two ingredients, so the field would have
to become `reagents: ItemID[]` — a longer thing to keep in step with the same action.

Derive it instead:

```ts
function reagentsOf(action: IAction & { new (): Action }): ItemID[] {
    return [...new action().input!.keys()];
}
```

One construction per review pass, of an object that is already cheap, and the drift
class disappears. `reviewQuests` iterates `reagentsOf(recipe.action)` instead of
`[recipe.reagent]`.

> `ponytail:` constructing an action to read its recipe is a touch wasteful. If the
> review pass ever shows up in a profile, lift the input map to a static beside the
> instance property — but **not** by making `input` itself static, which is the
> footgun above `BrewHealthPotionAction`.

## The quest quantity

```
gatherQuantityFor(unit_value, recipe_amount)
  = Math.ceil(MIN_QUEST_VALUE / (unit_value * recipe_amount)) * recipe_amount
```

Pure, exported from `Apothecary.ts` for the test. `MIN_QUEST_VALUE = 20`.

Worked through for every reagent, including the two potion herbs:

| Ingredient     | Value | Amount | `ceil(20/(v·a))` | Quantity | Reward |
|----------------|------:|-------:|-----------------:|---------:|-------:|
| Kelp           |     1 |      3 |                7 |       21 |    21g |
| Mint           |     1 |      1 |               20 |       20 |    20g |
| Carrageen Moss |     2 |      2 |                5 |       10 |    20g |
| Willow Bark    |     2 |      2 |                5 |       10 |    20g |
| Sphagnum Moss  |     2 |      2 |                5 |       10 |    20g |
| Pine Resin     |     3 |      2 |                4 |        8 |    24g |
| Valerian Root  |     4 |      2 |                3 |        6 |    24g |
| Sulfur         |     5 |      2 |                2 |        4 |    20g |
| Bloodroot      |     3 |      3 |                3 |        9 |    27g |
| Manabloom      |     3 |      3 |                3 |        9 |    27g |

The last two rows are the potion delta of R7.6: 10 at 45g becomes 9 at 27g. Keeping the
old constants for those two rows would mean two pricing rules living in one table, which
is how the `reagent` field drifted in the first place.

## A round in the life of the building

Two workers, ingredients in stock, shelf empty. Brews are 6 ticks, the market run is 4.

| Tick | Worker A            | Worker B            | Shelf after            |
|------|---------------------|---------------------|------------------------|
| 1    | Make Kelp Soap      | Make Kelp Soap      | —                      |
| 7    | Make Cough Syrup    | Make Cough Syrup    | 2 soap                 |
| 13   | Make Willow Bark Tea| Make Willow Bark Tea| 2 soap, 2 syrup        |
| …    | …                   | …                   | …                      |
| 43   | Sell (14 items)     | Wait — R6.7         | 14 items, in flight    |
| 47   | Make Kelp Soap      | Make Kelp Soap      | empty, money up        |

Both workers pick the same row because a product does not exist until `finished()`
(R5.6). Two of each is fine — both sell. The guard at tick 43 is the difference between
this table and a dead tick loop.

## Determinism

The new forage entries and the new quest quantities both change how many rolls a shift
makes, so the stream moves from the first everyday quest on. ADR 0005 holds — same seed,
same code, same run — but the seed-7 trace recorded in the forage cycle's R6.2 belongs
to the old world. R11.2 records a new one; the old note gains a pointer rather than a
rewrite.

## Import hygiene

`Apothecary.ts` already imports `ItemID`, `questService`, `forageLocationFor`,
`InventoryAccountService` and the action base. The sell action needs `TransportAction`,
which lives in the same `common/Action.ts` the file already imports. The test imports
`Apothecary.ts`, which pulls the engine graph — the same graph `ForageAction.test.ts`
already pulls under tsx, and the module-scope `console.log('[Apothecary] Loaded')` is
noise in the test output, not a failure.

Nothing in `modules/` learns about everyday goods beyond the items themselves and eight
forage rows. The quest board, the resolvers and the adventurer are untouched: a gather
quest for kelp is a gather quest.

## Build order

The order is chosen so each commit leaves a running game and the risky change lands
alone.

1. **Items.** Inert: 15 goods nothing produces or consumes. Compiles, changes nothing.
2. **Forage entries.** Still inert — no row asks for them yet.
3. **Prefactor: derived reagents + derived quest quantity**, with only the two potions in
   the list. This is where the R7.6 potion delta lands, by itself, revertable, before any
   new product exists to confuse the diff.
4. **The seven make actions and rotation.** The shelf starts filling. No income yet.
5. **The sell action and the guard.** The crash risk, alone, in its own commit.
6. **Docs and the Linear correction.**

Steps 3 and 5 are the two that can break a running game. Neither shares a commit with
anything else.
