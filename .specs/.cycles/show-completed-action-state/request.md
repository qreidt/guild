# Request — Show the completed action state: 100%, then the next action

|                  |                                                                                                                                                                                                                                             |
|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**       | Chat request, 2026-09-12. No Linear issue exists yet: the Linear connector was not reachable in the session that drafted this. Create the issue on team `CQR`, project "Guild Game", then rename this folder to `cqr-<n>-<slug>`.             |
| **Branch**       | `fix/show-completed-state`, at `31fe2d1`, equal to `main`.                                                                                                                                                                                  |
| **User framing** | "When an action is completed, it just shows progress 0% and not 100%. When a task reaches 100%, it should show the current task and the next one that is about to receive progress."                                                        |
| **Type**         | Bug, with a small behavior change attached.                                                                                                                                                                                                 |

> This file records the brief **as received**. Record divergences as as-built deltas
> in [`requirements.md`](./requirements.md), not here.

## Problem

The report: when an action completes, the interface shows 0%, not 100%.

**What the engine does.** An action finishes inside the tick in which its
`ticks_remaining` reaches 0. It then stays attached to its worker, with status
`FINISHED`, until the next tick. In that next tick, `BaseBuilding.handleTick()` finds
the worker available, chooses a new action, starts it, and ticks it once. See
[`Building.ts`](../../../src/game/city/buildings/common/Building.ts) and
[`Action.ts`](../../../src/game/city/buildings/common/Action.ts).

**What the view layer does with that window.** In
[`environment-view.ts`](../../../src/modules/environment-view/environment-view.ts),
`workerProgress()` returns `0` for a finished action, and `mapWorker()` reports
`status: 'idle'` for it. `resolveTaskLabel()` still returns the action name. So the DTO
for a finished action is: the name, 0%, idle.

**What the player sees.**
[`BuildingInterior2D.vue`](../../../src/components/environment/BuildingInterior2D.vue)
keys the label on the status. The row reads italic "idle", 0%, dimmed, for one full tick.
Then it jumps to the next action's first step. The roster,
[`AdventurerRoster.vue`](../../../src/components/adventurers/AdventurerRoster.vue), keys
the label on `task` instead, so it shows the stale name over a 0% bar.

A measured trace from `npm run console`. The Iron Mine's `MineOres` takes 2 ticks:

| After tick | `inspect IronMine` shows                            | The DTO reports          | The row shows      |
|------------|-----------------------------------------------------|--------------------------|--------------------|
| 1          | `MineOres  remaining=1/2  status=0`                 | `MineOres`, 0.5, working | MineOres, 50%      |
| 2          | `MineOres  remaining=0/2  status=1`                 | `MineOres`, 0, idle      | *idle*, 0%, dimmed |
| 3          | `MineOres  remaining=1/2  status=0`, a new instance | `MineOres`, 0.5, working | MineOres, 50%      |

The bar never shows 100%. For a 2-tick action, half of the frames are the "idle 0%"
frame. For the Blacksmith's 14-tick purchase, the bar goes from 93% to "idle 0%" to 7%.

This is specified behavior, not an accident. CQR-53 requirement R1.3 in
[`requirements.md`](../cqr-53-read-only-environment-interfaces/requirements.md) says:
"IF a worker has no active action, or its action is done, THEN the worker view SHALL
report `status: 'idle'`, a null task label, and `0` progress." The 2D sub-feature R1.3
in
[`2d-buildings-interface/requirements.md`](../cqr-53-read-only-environment-interfaces/2d-buildings-interface/requirements.md)
repeats it. The code does not fully meet that rule either: the label is not null for a
done action, and the shell comment works around that. This cycle supersedes both rules.

## Requested behavior

Two halves:

1. **100% is visible.** When an action finishes in tick N, its row shows the action
   name and a full bar until tick N+1 runs.
2. **The next action is visible at the same time.** In that same window, the row also
   shows the action that is about to receive progress, at 0%.

When tick N+1 runs, the finished action leaves the row, and the next action shows its
first step, `1/T`.

## What the code allows

**Half 1 is a view-layer change.** `workerProgress()` returns `1` for a finished action.
The done tick needs a status of its own, or the shell dims it as idle. `WorkerStatus` is
`'idle' | 'working'` today.

**Half 2 needs an engine change.** The next action does not exist until
`chooseNextAction()` runs, at the start of the next tick. The view layer cannot call it
to peek:

- Each `new Action()` takes a global id and opens an inventory account.
- The Blacksmith reads the market price and the building money, and constructs a
  throwaway `MakeIngotAction` to validate.
- The Apothecary validates the ledger before it returns an action.
- The adventurer's version claims a quest on the way.

So the engine must choose the next action at the moment the current one finishes, and
expose it to the mapper.

Two hazards that the spec must handle:

- **A `start()` that throws kills the tick loop.** `Action.start()` calls
  `createTransaction()`, which throws on insufficient stock. Nothing catches it in the
  building loop. Today, choose, validate and start run back-to-back in one loop
  iteration, so the validation holds. A design that chooses at the end of tick N but
  starts at tick N+1 opens a gap. Example: two herbalists both validate a brew against 4
  Bloodroot at the end of tick N. The first `start()` debits 3. The second throws.
  Recommended: choose **and start** the next action at the end of tick N, in the same
  iteration. It then receives its first tick at N+1, as today, so the completion tick of
  every action stays the same.
- **The choice sees an older world.** A choice made at the end of a building's tick N
  does not see the rest of tick N: the buildings after it in the map, and the
  adventurers. Example: Wren delivers Bloodroot after the city ticks. Today the
  Apothecary brews from tick N+1. With the change, it chooses `Wait` at the end of tick
  N and brews from the end of tick N+1. One tick of lag, once per delivery.

Also:

- `Adventurer.handleTick()` mirrors the building loop, so the roster has the same
  window. Its next action is a plan step, per ADR 0006, but the planner claims quests on
  the way. The same rule applies: the engine exposes the next action, the view does not
  compute it.
- The 3D city view renders no progress. Out of scope.
- There is no test runner. The console commands `inspect` and `adventurers` print the
  engine state and the roster DTO. `npx vue-tsc -b --force` is the type check.

## Scope boundaries as briefed

**In:**

- the mapper: `workerProgress()`, `mapWorker()`, and the `WorkerView` DTO,
- the engine hand-off between a finished action and the next one: `Worker` and
  `BaseBuilding.handleTick()`,
- the shared 2D shell, which serves all four interiors,
- the console `inspect` output, if the worker state changes shape,
- the spec and doc deltas below.

**Out:**

- any 3D representation of progress,
- humanized action labels; CQR-53 R3.2 stands,
- animation beyond the existing bar transition,
- changes to action durations, recipes or throughput,
- persistence.

**Undecided:** the adventurer roster. See question 1.

## Acceptance criteria as briefed

1. WHEN an action finishes in tick N THEN, until tick N+1 runs, the worker row SHALL
   show that action's name and 100%.
2. In the same window, the row SHALL show the next action's name at 0%, marked as next.
3. WHEN tick N+1 runs THEN the finished action SHALL leave the row, and the next action
   SHALL show progress `1/T`.
4. An action of `T` ticks SHALL still complete `T` ticks after it starts. The output of
   each building over 100 ticks SHALL not change.
5. The tick loop SHALL survive a `start()` that would have thrown. No unhandled throw
   from the hand-off.
6. Progress SHALL stay finite and in `[0, 1]`, per the CQR-53 reliability rule.
7. `npx vue-tsc -b --force` passes. The Iron Mine, the fastest cycle, and the Blacksmith
   show the sequence in the browser.

## Spec deltas

- CQR-53 parent R1.3 and R1.4, and the 2D sub-feature R1.3: "done action means idle, 0"
  becomes "done action means 100%, then next". Point from those requirements to this
  cycle. Do not rewrite them.
- [`interface-controls/README.md`](../../features/interface-controls/README.md): the
  progress-row paragraph.
- [`buildings-economy/README.md`](../../features/buildings-economy/README.md): the
  worker-availability rule, "its current action is finished".
- [`console-harness/README.md`](../../features/console-harness/README.md): the `inspect`
  row, if the output changes.
- [`CONTEXT.md`](../../../CONTEXT.md): no change. "Task" stays banned in prose. The DTO
  field `task` keeps its name. A rename is out of scope.

## Questions to settle before the spec

One round, as `refine-request` asks. The answers go to `refined-brief.md`.

1. **Roster.** Include the adventurer roster in this cycle, or leave it for a
   follow-up? Half 1 reaches it for free. Half 2 needs the same engine hook in
   `Adventurer`.
2. **Hand-off design.** Choose-and-start at the end of tick N, which the hazards above
   recommend, or a queued slot that re-validates at promotion?
3. **Status value.** Add a third `WorkerStatus` for the finished tick, or reuse
   `'working'` with progress 1?
4. **Presentation.** Where does "next" go: a second muted line under the completed one,
   the smallest change, or a second bar?
5. **Decision lag.** Is one tick of lag in an action choice acceptable, in the cases the
   second hazard describes?
6. **Ship in two steps?** Half 1 is a one-line mapper change and can ship alone. Half 2
   is the engine change. One PR or two?
7. **Linear.** Create the issue, then rename this folder to its number.

## Vocabulary

"Action" throughout, per [`CONTEXT.md`](../../../CONTEXT.md). The user's "task" is the
DTO field `WorkerView.task`, which names the action a worker runs. "Worker" is building
labour. "Adventurer" is Wren.

## Relevant ADRs

In [`docs/adr/`](../../../docs/adr/): 0001, one tick is thirty minutes, so the done
window is 30 game minutes and 1 s at the default rate. 0006, objective planning returns
steps, not actions, which is why the adventurer's next action is also not a free peek.
