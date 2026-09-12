# Refined Request Brief: Show the completed action state

|              |                                                                                                                                                  |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| **Source**   | [`request.md`](./request.md)                                                                                                                     |
| **Linear**   | No issue yet. The folder is named by slug, per the [cycles README](../README.md). Rename it to `cqr-<n>-show-completed-action-state` when one exists. |
| **Branch**   | `fix/show-completed-state`                                                                                                                       |
| **Refined**  | 2026-09-12, one grilling round, 8 decisions                                                                                                      |
| **Delivery** | One PR, two commits: the view layer, then the engine hand-off. The user opens the PR and makes the commits. The agent stops after each change set. |

---

## Goal

When an action finishes, its row shows it at 100% for that tick, beside the next action
at 0%. On the next tick, the next action takes over the row. Building interiors and the
adventurer roster behave the same way.

**Task size:** small. Two mapper functions, one DTO field and one status value, two tick
loops, two templates, the console dump, and the docs.

---

## Scope in

1. `WorkerStatus` gains `'finished'`. `WorkerView` and `AdventurerView` gain
   `next: string | null`, the raw name of the next action, non-null only at a hand-off.
2. One shared status helper in `environment-view.ts`, used by `mapWorker()` and
   `mapAdventurer()`. `workerProgress()` returns `1` for a finished action.
3. `Worker` keeps the finished action for one tick beside the newly started one.
   `BaseBuilding.handleTick()` picks and starts the next action at the end of the tick,
   right after the worker loop, for every worker whose action finished in that tick.
   The start-of-tick branch stays, for workers with no action at all.
4. `Adventurer.handleTick()` gets the same hand-off, inside its existing try/catch.
5. `BuildingInterior2D.vue`: a finished row keeps the accent styling, a full bar and
   100%, plus a muted inline span with the next action. The roster row gets the same.
6. Console: `inspect` prints the finished slot; `adventurers` prints `next`.
7. ADR 0007, the glossary entries below, and the doc deltas below.

## Scope out

- Any 3D representation of progress.
- Humanized action labels. CQR-53 R3.2 stands.
- A look-ahead beyond the hand-off, or any queue of actions.
- Changes to action durations, recipes or throughput.
- Persistence.
- Renaming the `task` field.

---

## Decisions resolved this round

| Question                    | Decision                                                                                                                                                                  |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| When is "next" visible?     | **At the hand-off only.** A look-ahead is not feasible: a pick depends on the output of the action still running.                                                         |
| Hand-off design             | **Pick and start at the end of the tick**, in the same `handleTick`, after the worker loop. Completion ticks unchanged. One tick of staler picks accepted.                 |
| Roster                      | **In, both halves.** One shared status helper; the same hand-off in `Adventurer.handleTick()`.                                                                            |
| Name of the state           | **Finished.** Third `WorkerStatus` value. The action beside it is the **next action**, field `next`. The moment is the **hand-off**. All three are in `CONTEXT.md`.        |
| Glossary conflict           | **Action widened** to workers and adventurers. Done in `CONTEXT.md`.                                                                                                      |
| Layout                      | **Inline beside the label**, muted text, no extra height. Same in the roster.                                                                                             |
| Sequencing                  | **One PR, two commits**: view layer first, engine hand-off second. The user commits.                                                                                      |
| ADR                         | **Yes, ADR 0007**: the next action is picked when the current one finishes.                                                                                               |
| CQR-53 R1.3 and R1.4        | **A pointer to this cycle**, not a rewrite.                                                                                                                               |

---

## Key behaviors

The Iron Mine after the change. `MineOres` takes 2 ticks:

| After tick | Engine                                        | Row                                 |
|------------|-----------------------------------------------|-------------------------------------|
| 1          | A running, 1 of 2 remaining                   | MineOres, 50%                       |
| 2          | A finished; B started, 2 of 2 remaining       | MineOres, 100%, next MineOres       |
| 3          | B running, 1 of 2 remaining                   | MineOres, 50%                       |

- The hand-off happens in the same `handleTick` as the finish, after the worker loop.
  B receives its first tick in tick 3, exactly as before the change.
- Validation and `start()` stay adjacent. Workers that finish in the same tick are
  served one at a time, so the second pick sees the first start's debit. The guard the
  Apothecary relies on keeps working.
- The finished slot clears when the active action receives its first tick, in
  `Worker.tick()`. The mapper never sees a stale finished slot.
- The adventurer's catch path leaves the slots empty. The row reads idle, and the
  start-of-tick branch recovers on the next tick, as today.
- A `Wait` hands off like any other action: "Wait, 100%, next Brew". That is honest and
  stays.
- The inputs of the next action leave the shelf at the end of the tick, the moment the
  next action appears in the row.
- A worker reads idle only before its first action, and after an adventurer drops their
  work on an error.

---

## Acceptance criteria

1. WHEN an action finishes in tick N THEN, after tick N, its row SHALL show that
   action's name, 100%, the accent styling, and the next action's name inline.
2. WHEN tick N+1 runs THEN the row SHALL show the next action at `1/T` and no next text.
3. The row height SHALL be the same in both states.
4. For a 2-tick action the sequence SHALL read 50%, then 100% with next, then 50%.
   Today it reads 50%, then idle 0%, then 50%.
5. Output over 100 ticks SHALL not change. The one runnable check: `seed 1`, `tick 100`,
   then `inspect` on each production building, before and after the change. Inventory
   counts and money match.
6. The tick loop SHALL survive a hand-off with contested stock. Check: `give Apothecary
   Bloodroot 4`, then tick through a hand-off with both herbalists free. No throw.
7. The roster SHALL show the same hand-off for Wren, for example "Travel, 100%, next
   Forage".
8. A worker with no action SHALL still read idle, 0%, no next.
9. `npx vue-tsc -b --force` passes.

---

## Spec deltas

- CQR-53 parent R1.3 and R1.4, and the 2D sub-feature R1.3: add a pointer to this
  cycle. Do not rewrite them.
- `.specs/product.md`: "Buildings choose actions for idle workers on each tick" becomes
  the end-of-tick hand-off.
- `.specs/features/interface-controls/README.md`: the progress-row paragraph gains the
  hand-off.
- `.specs/features/buildings-economy/README.md`: the worker-availability rule.
- `.specs/features/city-simulation/README.md`: the tick order, if it describes the pick.
- `.specs/features/console-harness/README.md`: the `inspect` and `adventurers` rows.
- `CONTEXT.md`: done in this session. Finished, Next action and Hand-off added; Action
  widened.
- `docs/adr/0007-the-next-action-is-picked-when-the-current-one-finishes.md`: written.

---

## Notes for the spec writer

- **Commit 1, view layer:** the shared status helper, `'finished'`, progress `1`, the
  `next` field wired as `null`, the shell and roster rendering, the console rows. On its
  own it already shows the finished tick at 100% with the name, and no next action.
- **Commit 2, engine:** the `Worker` slot, the end-of-tick hand-off in
  `BaseBuilding.handleTick()` and `Adventurer.handleTick()`, the mapper reading the slot,
  the doc deltas.
- Never construct an action to peek at it. Never add a queued slot that re-validates at
  promotion. ADR 0007 has the reasons.
- Keep `isAvailable()` as it is. The start-of-tick branch stays for empty workers.
- The one-tick lag lands in two places: the Apothecary after Wren delivers, and Wren
  after a quest is posted. Both already carry a `Wait` between jobs by design.
- The agent does not run `git commit`. It stops after each change set and hands over.
