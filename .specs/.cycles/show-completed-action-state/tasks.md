# Tasks — Show the completed action state: 100%, then the next action

> Build order follows the two commits in [`plan.md`](./plan.md): **1 → 2** is the view
> layer, **3 → 4 → 5** is the engine hand-off. Tasks read
> [`requirements.md`](./requirements.md) (R1–R6) and `plan.md`.
>
> The user makes the commits and opens the PR. The agent stops after task 2 and after
> task 5 and hands over. Commit 1 is shippable alone: it shows the finished tick at 100%
> under its own name, with no next action yet.
>
> Task 3 is the one that touches the tick loop. Pick, validate and start must stay in one
> loop iteration per worker, or a `start()` throw can kill the simulation (plan.md, "The
> hand-off, tick by tick").

## Commit 1 — view layer

- [ ] 1. View-model: the finished status, the next field, one shared activity function
  - Files: `src/modules/environment-view/types.ts`,
    `src/modules/environment-view/environment-view.ts`, `src/console.ts` (modify)
  - `WorkerStatus` gains `'finished'`. An `Activity` shape `{ task, progress, status,
    next }` that `WorkerView` and `AdventurerView` extend. One `activity(finished,
    active)` function implementing the four-row table in plan.md, called by
    `mapWorker()` and `mapAdventurer()`; the inline status logic in `mapAdventurer()`
    goes. `workerProgress()` returns `1` for a finished action and keeps its sentinel
    guards. Until task 3 exists, both mappers pass `null` for the finished slot, so a
    done active action maps to `'finished'`, `1`, `next: null`. The console
    `adventurers` command prints `-> next X` when `next` is non-null.
  - _Leverage: `workerProgress()` and `resolveTaskLabel()` as they stand; the
    `types.ts` comment on the shared triple, which becomes the `Activity` type_
  - _Requirements: R1.1–R1.7, R2.5_

- [ ] 2. Rows: the shell and the roster render the hand-off
  - Files: `src/components/environment/BuildingInterior2D.vue`,
    `src/components/adventurers/AdventurerRoster.vue` (modify)
  - Shell: `'finished'` joins `'working'` in the task-span class, the bar-fill class and
    the row-dimming binding; a muted `· next {{ worker.next }}` span between the task
    label and the percent, rendered only when `next` is non-null; delete the stale-label
    comment, which the status-driven mapper makes moot. Roster: the badge and the bar
    get the same treatment; the badge text keys on `status`. Then verify in the browser
    on the Iron Mine and the Blacksmith: the finished tick reads 100% under the action
    name, the row height does not change, idle rows are unchanged. `npx vue-tsc -b
    --force` clean. **Stop here for commit 1.**
  - _Leverage: the three existing `status === 'working'` bindings in the shell; the
    `pct()` helper_
  - _Requirements: R2.1–R2.4, R6.1, R6.3 (100% half), R6.6_

## Commit 2 — engine hand-off

- [ ] 3. The worker slot and the building hand-off
  - Files: `src/game/city/buildings/common/Worker.ts`,
    `src/game/city/buildings/common/Building.ts`,
    `src/modules/environment-view/environment-view.ts`, `src/console.ts` (modify)
  - `Worker.finished_action: Action | null`. `Worker.tick()` clears it before ticking.
    `BaseBuilding.handleTick()` gains the third step after the worker loop: for each
    worker whose active action is done, move it to the slot, `chooseNextAction()`,
    assign, `start()`, one worker per iteration. The start-of-tick branch and
    `isAvailable()` stay as they are. `mapWorker()` passes the slot. `inspect` prints
    `finished=X` on the worker line. Check R6.2 in the console before moving on.
  - _Leverage: `BaseBuilding.handleTick()`'s existing two steps; the Apothecary's
    `validateLedger` guard, which this must not weaken_
  - _Requirements: R3.1–R3.7_

- [ ] 4. The adventurer hand-off
  - Files: `src/game/adventurer/Adventurer.ts`,
    `src/modules/environment-view/environment-view.ts` (modify)
  - `Adventurer.finished_action`, cleared before the tick; the same third step inside
    the try/catch; the catch path clears both slots. `mapAdventurer()` passes both
    slots. Check R6.5: at Wren's arrival at the Forest, `adventurers` prints
    `Travel 100% -> next Forage`.
  - _Leverage: `Adventurer.handleTick()` already mirrors the building loop; task 3 as
    the template_
  - _Requirements: R4.1–R4.3, R6.5_

- [ ] 5. Docs, superseded clauses, and the determinism check
  - Files: `.specs/.cycles/cqr-53-read-only-environment-interfaces/requirements.md`,
    `.specs/.cycles/cqr-53-read-only-environment-interfaces/2d-buildings-interface/requirements.md`,
    `.specs/product.md`, `.specs/features/buildings-economy/README.md`,
    `.specs/features/interface-controls/README.md`,
    `.specs/features/console-harness/README.md`, `.specs/.cycles/README.md` (modify)
  - A pointer note on CQR-53 R1.3, R1.4 and the 2D R1.3 to this cycle's R1.4 and R1.6.
    The four doc passages named in R5.2. The cycle README status. Then R6.4: `seed 1`,
    `tick 100`, `inspect` on the Lumber Mill, the Iron Mine and the Blacksmith, before
    and after commit 2, identical; the Apothecary and Wren event log in the same order.
    `npx vue-tsc -b --force` clean. **Stop here for commit 2.**
  - _Requirements: R5.1–R5.3, R6.1, R6.4_
