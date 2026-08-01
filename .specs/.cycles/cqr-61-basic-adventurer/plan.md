# Design — The basic adventurer: claim, forage, deliver (Phase 2)

> Implements [`requirements.md`](./requirements.md) (R0–R10). Reads
> `CONTEXT.md` for vocabulary and `docs/adr/0001`–`0006` for the decisions this
> design does not re-litigate.

## Shape of the change

Four layers, built bottom-up, each landing as its own commit:

```
2ba61ed  refactor   Action.input_origin: static -> instance          (R0)
69ea8a9  CQR-65     modules/random/random.ts + console `seed`        (R1)
05ded21  CQR-61     resolver.plan()/delivery(), fulfil() moves goods (R2-R4)
(this)   CQR-61     Adventurer, roster service, three actions, views (R5-R10)
```

The first two are prerequisites that touch working code for a feature that does
not otherwise involve them, which is why they are separate and revertable.

## The dependency the design turns on

An adventurer's work has to reuse the existing tick / progress / goods-transfer
machinery rather than growing a parallel copy. That machinery is `Action`, which
was written when every actor was a building. Two things had to give:

1. **`input_origin` had to stop being static** (R0). A static origin is one
   origin per class forever, which is true of a building and false of an
   adventurer.
2. **`Action` had to tolerate a null `building_id`.** It already did —
   `static building_id: BuildingID | null = null`, and only `TransportAction`
   ever calls `getBuilding()`. No change needed.

Everything else on `Action` — the tick countdown, `shouldTick()` stalling,
`start`/`finished` hooks, the transaction lifecycle — carried over unmodified.

## Where the seam between quests and the engine sits

This is the one place the design departs from the brief, and the reasoning is in
**ADR 0006**. In short:

```
modules/quests/objectives.ts   pure functions over data — returns an ObjectiveStep
                                     |
                                     v
game/adventurer/Adventurer.ts  one switch — the only place a step becomes an Action
                                     |
                                     v
game/adventurer/actions/*      Travel, Forage, Deliver
```

The alternative — resolvers constructing `Action`s — closes the cycle
`quest.service → objectives → DeliverAction → quest.service`, and puts engine
code inside `modules/`. The switch is the price, and it doubles as the index of
every verb an adventurer has.

## Import-cycle hygiene

This repo has shipped a blank production page from an import cycle (`185605c`),
so two precautions are deliberate:

- The three action modules import `Adventurer` **type-only**. Type imports are
  erased, so Rollup sees no edge at all. Each carries a comment saying so,
  because the fix for "make this a value import" is not obvious after the fact.
- `adventurerService` seeds its roster **lazily**, exactly like
  `GameController.city`. The singleton is constructed at module scope; the
  `new Adventurer()` call is not.

Verified: `npm run build` succeeds, the production preview boots with zero
console errors, and `three` stays confined to the lazy `CityGlobalView3D` chunk
(887 kB) while the entry bundle is 121 kB.

## Forage: why a per-tick roll and deferred settlement

Rolling once per tick rather than once per shift buys two things. Progress is
smooth and visible, so the roster's progress bar means something. And a shift
that comes up short is not a failure — it is a shift, followed by another shift.
A bad roll costs time, never the quest.

The cost is that the yield is unknown until the last tick, so the action cannot
open a transaction at start. It creates and commits one in `finished()`. The
tempting alternative — open a transaction up front and top up its goods map as
finds come in — happens to work only because the transaction store keeps the same
map reference it was handed. That is the failure mode `request.md` names, and the
design avoids depending on it here *and* in `questService.deliver()`, which
passes distinct `Map` instances for input and output.

## The find chance, and why it is additive

```
chance = base(location, item)
       + herbalism   × 0.02
       + perception  × 0.01
       capped at 0.95, halved at night
```

`base` is non-zero by construction: a quest only reaches the board if
`isObtainable` proved the item is findable at that location. Multiplying by
proficiency instead of adding would give a fresh adventurer — herbalism 0 —
exactly zero, and they would search forever while nothing errored. A novice must
be slow, not incapable. The seeded Scout has herbalism 0 precisely so this is
exercised from tick one rather than after the first promotion.

## Night

Foraging gates on `GameController.isNight()`, the same global check the
LumberMill and IronMine already guard every action with. Below the herbalism
threshold, `shouldTick()` returns false — the existing **stall** mechanic — so
ticks stop counting down and the adventurer waits out the dark at the forest,
losing time rather than progress. Above it, they work at half the find chance.
Travel is not gated: night makes searching hard, not walking.

None of it runs today; `isNight()` still returns `false` unconditionally.

## Claim policy

First open quest in post order. Deterministic, so console runs are assertable,
and obviously arbitrary, so nobody mistakes it for a design decision. "Highest
reward" was rejected because it is a preference model that would quietly survive
into the cycle that introduces rank- and skill-matched claiming, and fight with
it.

## View layer

`AdventurerView` reuses `WorkerView`'s `task` / `progress` / `status` triple
verbatim — an adventurer's work is judged the same way a worker's is, even though
they are nothing else alike — and `InventoryRow` for carried goods.

The panel is **not** in `environment-registry.ts`: that registry is keyed by
`BuildingID`, and the whole point of an adventurer is that they have none. The
left menu grows a "People" section for the same reason.

## Testing

Same single seam as Phase 1: the console harness command table. `adventurers`
prints the same `AdventurerView` DTO the panel renders, so a mapper bug fails in
the terminal rather than hiding until someone opens the screen — the reason
`quests` already prints `QuestRow`.

The seeded per-adventurer stream is what makes any of it assertable. A fixed seed
plus a fixed tick count produces the same forage results every run, against
identical code (ADR 0005 records the order-dependence that qualifies).
