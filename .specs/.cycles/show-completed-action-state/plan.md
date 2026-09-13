# Design — Show the completed action state: 100%, then the next action

> Implements [`requirements.md`](./requirements.md) (R1–R6). Reads `CONTEXT.md` for
> the vocabulary this cycle added (Finished, Next action, Hand-off) and ADR 0007 for
> the decision this design does not re-litigate.

## Shape of the change

Two layers, built top-down, each landing as its own commit. The user makes the commits;
the agent stops after each change set.

```
commit 1   view      types.ts, environment-view.ts, BuildingInterior2D.vue,   (R1, R2)
                     AdventurerRoster.vue, console `adventurers`
commit 2   engine    Worker.ts, Building.ts, Adventurer.ts, console `inspect`, (R3, R4, R5)
                     the doc deltas, the CQR-53 pointers
```

Commit 1 is shippable alone. With the engine unchanged, a done action still sits on its
worker for one tick, and the new mapper shows it at 100% under its own name with no
next action. Commit 2 adds the next action. Reverting commit 2 leaves the 100% fix in
place.

## The dependency the design turns on

The row needs the next action at the moment the current one finishes. Nothing in the
view layer can compute it. `chooseNextAction()` reads live stock, the market price, the
funds and, for the adventurer, the quest board; every candidate `new Action()` takes a
global id and opens an inventory account; the Blacksmith builds a throwaway
`MakeIngotAction` to validate. A peek is not side-effect free, and a provisional pick
could differ from the real one.

So the engine picks at the finish. ADR 0007 records the trade: one tick of staler picks,
against a visible next action and no gap between validation and `start()`.

## The hand-off, tick by tick

`BaseBuilding.handleTick()` today: serve available workers, then tick every worker. The
change adds a third step and leaves the first two alone.

```
1. availableWorkers = workers with no action            (unchanged; tick 0 only, after this change)
      pick, start
2. for each worker: worker.tick()                        (unchanged call; tick() now clears the finished slot first)
3. for each worker whose active action finished in 2:    (new)
      finished_action = active_action
      active_action   = chooseNextAction()
      active_action.start()
```

Step 3 serves workers one at a time, so the second pick sees the first start's debit.
That is the guard the Apothecary's `validateLedger` comment calls load-bearing, and it
holds exactly as it does today, because pick, validate and start stay adjacent.

`Worker.tick()` becomes: clear `finished_action`, then tick the active action. The slot
is therefore populated from the end of tick N to the start of tick N+1, which is the one
window the view samples between ticks. The mapper never sees a stale slot.

The Iron Mine, `MineOres` at 2 ticks:

| After tick | `active_action`        | `finished_action` | Row                           |
|------------|------------------------|-------------------|-------------------------------|
| 1          | A, 1 of 2 remaining    | null              | MineOres 50%                  |
| 2          | B, 2 of 2, started     | A                 | MineOres · next MineOres 100% |
| 3          | B, 1 of 2 remaining    | null              | MineOres 50%                  |

B receives its first tick in tick 3, as it did before the change. Completion ticks do
not move. What moves is the pick, from the start of tick 3 to the end of tick 2, and
the debit of B's inputs with it.

`Worker.isAvailable()` keeps its definition. After this change an active action is
never done at the start of a tick, so the first step fires only for an empty worker.

## The adventurer mirrors the building

`Adventurer.handleTick()` already mirrors the building loop. It gains the same slot and
the same third step, inside its existing try/catch:

```
try {
    if (isAvailable()) { pick, start }                     (unchanged)
    finished_action = null
    active_action?.tick()
    if (active_action?.isDone()) { hand off as step 3 }    (new)
} catch { active_action = null; finished_action = null }
```

The catch path clears both slots. The adventurer reads idle for that tick and the first
step recovers on the next, as today. The `'done'` plan step still returns a `Wait`, so
the breather between jobs keeps the same length; only the lag after a posting changes,
by one tick, as ADR 0007 says.

Six lines are duplicated between `Worker` and `Adventurer`. The alternative, an
adventurer owning a `Worker`, would smuggle building vocabulary into a class whose whole
point is having no building. `handleTick` is already duplicated for the same reason.

## The view-model

One function replaces the two inline derivations:

```
activity(finished: Action | null, active: Action | null): Activity
```

| `finished` | `active`             | `task`          | `progress`          | `status`   | `next`        |
|------------|----------------------|-----------------|---------------------|------------|---------------|
| present    | started, not ticked  | `finished.name` | `1`                 | `finished` | `active.name` |
| null       | running              | `active.name`   | `1 − rem / total`   | `working`  | null          |
| null       | done                 | `active.name`   | `1`                 | `finished` | null          |
| null       | null                 | null            | `0`                 | `idle`     | null          |

The third row is what makes commit 1 shippable alone. `Activity` is
`{ task, progress, status, next }`; `WorkerView` and `AdventurerView` both extend it,
which turns the comment in `types.ts` about the shared triple into a type. `mapWorker()`
passes `worker.finished_action` and `worker.active_action`; `mapAdventurer()` passes the
adventurer's two slots. `workerProgress()` stays exported and keeps its sentinel guards;
only its finished branch returns `1` instead of `0`.

> _As-built (commit 1):_ `activity()` takes one `ActionSlots` object,
> `{ finished_action, active_action }`, not two positional arguments. Two nullable
> `Action` parameters of one type invited a silent swap, and the object is the shape
> `Worker` and `Adventurer` carry from commit 2, so both mappers can then pass the owner
> directly. The function is one return over `shown = finished_action ?? active_action`;
> the table above is unchanged.

## The rows

`BuildingInterior2D.vue` keys everything on `status`, so `'finished'` slots in beside
`'working'` in the three existing class bindings: the task span, the bar fill and the
row dimming. The next action is one more span in the label line:

```
MineOres  · next MineOres   100%
```

Muted text, rendered only when `next` is non-null, between the task label and the
percent. It adds width to the label line and no height to the row, so a 2-tick action
whose hand-off recurs every other second does not jitter. A second line or a second bar
were rejected for exactly that jitter.

`AdventurerRoster.vue` has the same three seams: the status badge, the bar and the
label. The badge text switches from `task ?? 'Idle'` to a status-driven expression, which
also fixes today's stale name over a 0% bar for a done action.

## The console

`inspect` prints the finished slot on the worker line, `adventurers` prints `next` after
the progress. Both commands print what the panels render, so a mapper bug fails in the
terminal before anyone opens a screen. That is the only test seam this repo has, and it
is enough: the sequences in R6.2 and R6.5 are three `tick 1` commands each.

> _As-built (commit 1):_ the mapper also has a `node:test` file,
> `environment-view.test.ts`, one test per row of the table, run by `npm test` through
> the installed `tsx`. Agreed with the user at implementation as the seam for the pure
> view-model. The console stays the seam for the engine.

## What can be checked exactly, and what cannot

The Lumber Mill and the Iron Mine read only their own shelf, and the Blacksmith reads
its own shelf, its own funds and a catalog price. None of them sees another actor's
same-tick output, so a seeded 100-tick run is byte-identical before and after.

The Apothecary and Wren do see each other: adventurers tick after the city, and a
posting lands in the next city tick. For them the check is the event log, not the
snapshot: the same postings, claims, departures and deliveries in the same order, each
at most one tick later per preceding event. R6.4 is written that way on purpose.

## Import hygiene

Nothing crosses a layer it does not cross today. `Worker` and `Adventurer` stay engine
classes with no new imports. The mapper reads two fields it already had access to.
The Vue components read the DTO alone. No `three`, no engine imports in `.vue`, no new
edges in the cycle ADR 0006 warns about.
