# Request — Forage stops at the quest quantity

|                  |                                                                                                                                                                                                                                                                                             |
|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Chat request, 2026-09-12. No Linear issue exists yet: the Linear connector was not reachable in the session that drafted this. Create the issue on team `CQR`, project "Guild Game", then rename this folder to `cqr-<n>-<slug>`.                                                           |
| **Branch**       | `fix/max-garthering`, at `c9e6bba`, equal to `origin/main`.                                                                                                                                                                                                                                 |
| **User framing** | "When an adventurer is gathering for x amount, they can over gather products. The right behaviour should be the adventurer stop at the max amount of the task but only for when the task is gathering natural resources. Maybe in this case a flag can be used in the task for the action." |
| **Type**         | Bug in the engine, <br/>ith one small addition to the plan step.                                                                                                                                                                                                                            |
| **Refined**      | 2026-09-13, one grilling round, 7 decisions. Folded into this file at the user's request. There is no `refined-brief.md` for this cycle.                                                                                                                                                    |

> This file holds the brief as received and the decisions of the refinement round.
> Record divergences during the build as as-built deltas in
> [`requirements.md`](./requirements.md), not here.

## Problem

The report: an adventurer on a gather quest for a quantity forages past that quantity.

**What the engine does.** The gather resolver in
[`objectives.ts`](../../../src/modules/quests/objectives.ts) plans one step at a time.
While the adventurer holds less than the objective quantity, and stands at the
objective's location, it answers `{ step: 'forage', item, at }`. The step carries the
item and the place. It does not carry the quantity.
[`Adventurer.chooseNextAction()`](../../../src/game/adventurer/Adventurer.ts) maps that
step to a new
[`ForageAction`](../../../src/game/adventurer/actions/ForageAction.ts). The action runs
a fixed shift of 6 ticks, rolls once per tick, and counts each find in `found`.
Settlement is deferred: the shift creates and commits one transaction in `finished()`,
for the shift total. The action does not know the quest quantity. The planner runs only
between shifts.

So the last shift of every gather quest runs its full 6 ticks. Every find after the
quantity is met is surplus.

**A measured trace.** `npm run console`, with `seed 7`, `tick 130`, `adventurers`,
`quests`. Both quests ask for 10 units. Wren has zero herbalism and one perception.

| Quest     | Objective             | Finds per shift | Held after the last shift | Surplus |
|-----------|-----------------------|-----------------|---------------------------|---------|
| `quest:1` | Gather 10 × Bloodroot | 2 + 4 + 1 + 4   | 11                        | 1       |
| `quest:2` | Gather 10 × Manabloom | 4 + 2 + 2 + 4   | 12                        | 2       |

Before the last shift of `quest:1`, Wren held 7 and needed 3. The shift found 4. Before
the last shift of `quest:2`, Wren held 8 and needed 2. The shift found 4. After both
deliveries the roster reads `carrying: Bloodroot×1, Manabloom×2`.

**Where the surplus goes.** `questService.fulfil()` moves exactly the objective
quantity, per CQR-61 R2.2. The surplus stays with the adventurer. Adventurers do not
sell foraged goods, out of scope in CQR-61, so the surplus sits in the pack. It counts
toward the next gather quest for the same item, because `isFulfilled` reads the total
count. It never reaches the poster.

**The time cost.** Every tick of the last shift after the quantity is met is a tick the
adventurer does not spend on the walk home. At one roll per tick and a find chance near
one half, that is up to 5 ticks and up to 5 units per quest.

**Is this specified?** CQR-61 R7.3 in
[`requirements.md`](../cqr-61-basic-adventurer/requirements.md) says: "Forage runs a
fixed-length shift and rolls once per tick; each success yields one unit." R4.2 says:
"objective not satisfied → forage (repeatable)". The fixed length is specified. The
surplus is a consequence nobody specified. This cycle amends R7.3.

## Decisions of the refinement round

| Question                                    | Decision                                                                                                                                                                                                  |
|---------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| What does "natural resources" exclude?      | **Nothing.** Every gather quest caps its forage, whatever the item, as the default behavior. No item class, no item attribute.                                                                             |
| What does the count mean?                   | **The total to hold**, the objective quantity. The same predicate as `isFulfilled`, extended with the finds of the running shift.                                                                          |
| What happens in the tick the count is met?  | **The shift finishes in that tick.** The action sets its remaining ticks to zero; the base class finishes it and commits. The remaining ticks are saved, not idled.                                        |
| The seeded stream moves. Accept?            | **Accepted.** Fewer rolls per capped shift move every later roll. The seed-7 trace above goes stale and is re-recorded. Same seed, same code still replays exactly, per ADR 0005.                          |
| Glossary                                    | **Shift added** to `CONTEXT.md`, done in the round. Forage keeps its definition.                                                                                                                          |
| Shape of the count on the forage step       | **`until?: number`, optional.** The gather resolver always sets it. A step without it runs the full shift, uncapped.                                                                                       |
| The runnable check                          | **The console trace plus one engine test** under `node:test`, the first test outside the view-model seam. The CLAUDE.md seam rule gains this seam.                                                        |

Settled by fact, not by decision:

- **No sequencing constraint.** Branch `fix/show-completed-state` holds nothing beyond
  `main`; its content merged as `c9e6bba`. Tasks 3 to 5 of
  [`show-completed-action-state`](../show-completed-action-state/tasks.md), the engine
  hand-off of ADR 0007, are not built anywhere yet. The hand-off keys on `isDone()`,
  which an early finish sets in the same tick, so the two changes do not collide.
- **No ADR.** The change is one optional field and one check, easy to reverse, and a
  comment on the field explains it. Two of the three ADR tests fail. The rule lives in
  this cycle's requirements and in as-built pointers on CQR-61.
- **Delivery.** One commit, which the user makes. The Linear issue is the user's to
  create.

## Requested behavior, as decided

1. **The shift ends when the quantity is held.** When the adventurer holds the quest
   quantity, counting the finds of the running shift, the forage shift finishes in that
   tick. It does not run to the end of the fixed shift.
2. **Every gather quest caps its forage.** The count rides on the forage step, as
   `until`. The gather resolver sets it to the objective quantity. A forage step without
   `until` runs the full shift. This is the user's "flag in the task for the action",
   reduced to a count.
3. **Nothing else moves.** The 6-tick shift when not capped, the roll per tick, the
   additive find chance, the deferred settlement, the night stall, travel and delivery
   all stay as they are.

## The shape of the change

**The check lives in the action.** Settlement is deferred, so the finds of the running
shift are not in the inventory. The planner's `isFulfilled` cannot see them. Only
`ForageAction.found` knows them. So the count travels from the resolver to the action.

**The path is short.** Four touches, in
[`common.ts`](../../../src/modules/quests/common.ts),
[`objectives.ts`](../../../src/modules/quests/objectives.ts),
[`Adventurer.ts`](../../../src/game/adventurer/Adventurer.ts) and
[`ForageAction.ts`](../../../src/game/adventurer/actions/ForageAction.ts):

1. The `forage` member of `ObjectiveStep` gains `until?: number`: hold this many, then
   stop.
2. The gather resolver's `plan()` sets `until` to `objective.quantity`.
3. The `Adventurer` switch passes `next.until` to the `ForageAction` constructor.
4. In `afterTick()`, after a find, when `until` is set and the inventory count plus
   `found` reaches it, the action sets `ticks_remaining` to `0`. The base `Action.tick()`
   in [`Action.ts`](../../../src/game/city/buildings/common/Action.ts) checks
   `ticks_remaining <= 0` right after `afterTick()`, so the action finishes in the same
   tick: status `FINISHED`, then `finished()` commits the shift total.

The base class does not change. `workerProgress()` returns `1` for a done action, so the
row shows 100% in the finished tick. Before that tick the bar shows the shift progress,
for example 17% then 33%, and then jumps to 100%. Accepted.

**ADR 0006 holds.** The step stays a serializable descriptor. It gains a number, not
behavior. The resolver stays a pure function over data.

Hazards that stay for the spec:

- **Deferred settlement stays.** The count decides when the shift ends. `finished()`
  still creates and commits one transaction for the total. Do not move finds into the
  inventory per tick so that the planner sees them. The CQR-61 brief flagged the
  mutated-map hazard on that path.
- **The night stall.** A stalled tick makes no roll and runs no check. Nothing changes.
- **The stale trace.** CQR-61 R10.1 recorded `2 + 4 + 1 + 4 = 11` at seed 7. After this
  change the same seed yields different shifts. Give R10.1 an as-built pointer, and record
  the new trace in this cycle's requirements.

Rejected in the round:

- **A one-tick shift, re-planned every tick.** Each tick becomes an action: a hand-off
  every tick, a log line every tick, and the shift disappears.
- **A shift length computed from the find chance.** Rolls are random. No fixed length
  is right.
- **Run the shift out and drop the surplus.** Keeps the fixed length and the old stream,
  and wastes the very ticks this cycle exists to save.
- **Cap by an item class.** Needs a new item attribute; the herb tier is descriptive
  only and drives no code.
- **The action reads the quest itself.** Breaks CQR-61 R4.3: the adventurer and its
  actions stay ignorant of objective kinds.

## The checks

Two, as decided.

1. **The console trace.** `seed 7`, `tick 130`, `adventurers`, `quests`. Both quests
   `Fulfilled`, 10 delivered each, and an empty `carrying` line. The spec records the new
   finds per shift as this cycle's trace.
2. **One engine test**, under `node:test`, next to the action. Pin the world seed. An
   adventurer stands at the Forest and holds 8 Bloodroot. A forage action with `until`
   10 starts, and the test ticks the action until it is done. Assert that it finishes
   before its sixth tick and that the adventurer then holds exactly 10. Facts for the
   author: the game controller starts no timer at import, only from `nextTick()` and
   `resume()`, so tick the action and never the controller. `isNight()` returns false.
   The existing mapper test already imports the `Action` base, and the console harness
   proves the whole engine loads under tsx.

## Scope boundaries, as decided

**In:**

- the `forage` step: `until?: number`,
- the gather resolver's `plan()`, which sets it,
- the `Adventurer` switch, which passes it through,
- `ForageAction`, which runs the check,
- the engine test,
- the spec and doc deltas below.

**Out:**

- adventurers who sell surplus goods,
- changes to find chances, the shift length, travel costs, quest quantities or rewards,
- new objective kinds,
- the engine hand-off, which belongs to `show-completed-action-state`,
- interface changes beyond what the progress bar does today,
- persistence.

## Acceptance criteria

1. WHEN an adventurer on a gather quest for quantity `Q` holds `Q` of the item, the
   inventory count plus the finds of the running shift, THEN the forage shift SHALL
   finish in that tick.
2. At the end of the last shift the adventurer SHALL hold exactly `Q` of the item,
   never more.
3. A forage step without `until` SHALL run the full 6-tick shift, as today.
4. A shift that ends short of `Q` SHALL run its full length and lead to another shift,
   per CQR-61 R4.2 and R7.3.
5. Settlement SHALL stay deferred: one transaction per shift, created and committed at
   the finish, whatever the finish tick.
6. Travel, delivery and the reward SHALL not change. `fulfil` still moves exactly `Q`.
7. The seed-7 run SHALL fulfil both quests, 10 delivered each, with an empty `carrying`
   line after the deliveries. The new finds per shift are recorded in the spec.
8. The engine test SHALL pass under `npm test`. `npx vue-tsc -b --force` passes.

## Spec deltas

- CQR-61 R4.2, the forage step, R7.3, the fixed-length shift, and R10.1, the seed-7
  trace: add an as-built pointer to this cycle. Do not rewrite them.
- [`CLAUDE.md`](../../../CLAUDE.md), the `npm test` line: the seam rule gains the forage
  action under a pinned seed.
- [`architecture.md`](../../architecture.md), the `ForageAction` line: the shift ends
  early at the quest quantity.
- [`CONTEXT.md`](../../../CONTEXT.md): **Shift** added on 2026-09-13, in the round.
  Forage unchanged.
- [`console-harness/README.md`](../../features/console-harness/README.md): no change.
  No command changes shape.
- [`.cycles/README.md`](../README.md): the entry exists. Its status line still reads
  "requested"; update it when the spec lands.
- ADR: none. See the facts above.

## Vocabulary

Per [`CONTEXT.md`](../../../CONTEXT.md). The user's "gathering for x amount" is a
**gather** quest with an objective quantity. The user's "task" is the quest, in "the
task is gathering", and the plan step, in "a flag in the task for the action". The
user's "products" is the item. The user's "action" is the `ForageAction`. The user's
"natural resources" resolved to every gathered item, so it needs no term. A forage
action is a **shift**, now in the glossary. `until` is a field name, not a term: it is
the objective quantity, carried to the action.

## Relevant ADRs

In [`docs/adr/`](../../../docs/adr/): 0003, rewards are escrowed and `fulfil` moves
exactly the quantity, unchanged. 0005, one seeded stream per adventurer, which is why a
capped shift moves every later roll. 0006, planning returns steps, not actions, which is
why the count rides on the step. 0007, the next action is picked at the finish, which
an early finish also is.
