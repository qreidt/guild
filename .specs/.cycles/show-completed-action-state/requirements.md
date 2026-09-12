# Requirements — Show the completed action state: 100%, then the next action

> Authored into the cycle from [`request.md`](./request.md) and
> [`refined-brief.md`](./refined-brief.md). No Linear issue yet; the folder is named
> by slug, per the [cycles README](../README.md). No steering docs exist, so
> "Alignment" references the canonical `.specs/` docs, `CONTEXT.md` and ADR 0007.
>
> **Status: not started.** Branch `fix/show-completed-state`.

## Introduction

An action finishes inside a tick and stays on its worker until the next tick picks a
replacement. The view-model reports that window as idle at 0%, so a progress bar never
shows 100%. This cycle makes the finished tick legible: the row shows the finished action
at 100% beside the next action at 0%, then the next action takes over. The engine picks
the next action at the end of the tick in which the current one finishes, so the next
action exists at the moment the row needs it. Buildings and the adventurer roster behave
the same way.

## Alignment with product vision

- Advances `.specs/roadmap.md` § 1, "Stabilize the prototype": the simulation is legible
  at a glance, which is the stated purpose of the 2D interiors (CQR-53 R3.5).
- Honours the `CONTEXT.md` glossary entries this cycle added: **Finished**, **Next
  action** and **Hand-off**. "Completed" and "done" are avoided in prose.
- Implements ADR 0007, which records why the pick moves to the end of the tick.
- Supersedes CQR-53 parent R1.3 and R1.4 and the 2D sub-feature R1.3, which specified
  the idle-at-0% treatment this cycle replaces.

---

## R1 — The finished state in the view-model

**R1.1** `WorkerStatus` is `'idle' | 'working' | 'finished'`.

**R1.2** `WorkerView` and `AdventurerView` carry `next: string | null`: the raw name of
the next action, `constructor.name` as for `task`, non-null only at a hand-off.

**R1.3** One shared function derives `task`, `progress`, `status` and `next` from a
finished action and an active action. `mapWorker()` and `mapAdventurer()` both call it.
The duplicate inline status logic in `mapAdventurer()` is gone.

**R1.4** WHEN an action is finished THEN it maps to its raw name as `task`, progress `1`
and status `'finished'`. This supersedes CQR-53 R1.3, which mapped it to idle, null and
`0`.

**R1.5** WHEN a worker or adventurer has no action THEN it maps to status `'idle'`, a
null `task`, progress `0` and a null `next`.

**R1.6** WHEN a finished action is present THEN `next` is the raw name of the active
action. Otherwise `next` is null. After commit 1 and before commit 2 the engine has no
finished slot yet, so a done active action maps per R1.4 with a null `next`.

**R1.7** Progress stays finite and in `[0, 1]`. The `999` pre-start sentinel and the
`total_ticks <= 0` guards from CQR-53 R1.4 stay. Only the finished branch changes.

## R2 — The rows

**R2.1** WHEN a worker row has status `'finished'` THEN `BuildingInterior2D.vue` renders
the task label in the theme accent, the bar in the theme accent at full width, the
readout "100%", and no dimming.

**R2.2** WHEN `next` is non-null THEN the row shows it inline beside the task label, as
muted text in the form "· next MineOres". The row height is the same whether or not
`next` is shown.

**R2.3** Idle rows are unchanged: italic "idle", "0%", dimmed, no next text.

**R2.4** `AdventurerRoster.vue` gives the status badge and the bar the same three
treatments. The badge text keys on `status`, not on `task ?? 'Idle'`, so a finished
action shows its name and an idle adventurer shows "Idle" without a stale name.

**R2.5** The console command `adventurers` prints `next` after the progress when it is
non-null, in the form "-> next Forage".

## R3 — The hand-off in the engine

**R3.1** `Worker` holds a second slot, `finished_action: Action | null`, for the action
that finished in the current tick.

**R3.2** WHEN a worker's active action finishes during the worker loop of
`BaseBuilding.handleTick()` THEN, after that loop and in the same call, the building
moves the action to `finished_action`, calls `chooseNextAction()`, assigns the result to
`active_action` and starts it, all in one loop iteration for that worker. Workers are
served one at a time, so the second pick sees the first start's debit.

**R3.3** The start-of-tick branch stays for workers whose `active_action` is null.
`Worker.isAvailable()` keeps its current definition.

**R3.4** WHEN `Worker.tick()` runs THEN it clears `finished_action` before it ticks the
active action. A finished slot is observable for exactly one tick.

**R3.5** Completion ticks are unchanged: an action of `T` ticks finishes `T` ticks after
it starts, because it receives its first tick in the tick after the hand-off. For the
Lumber Mill, the Iron Mine and the Blacksmith, a seeded 100-tick console run yields
identical inventory and money before and after this cycle. For the Apothecary and Wren,
the same events occur in the same order; each may land one tick later per preceding
posting or delivery, as ADR 0007 accepts.

**R3.6** The tick loop survives a hand-off with contested stock. No `start()` throw
escapes `handleTick()` in a case that does not throw today.

**R3.7** The console command `inspect` prints the finished slot on the worker line when
present, in the form "finished=MineOres".

## R4 — The adventurer hand-off

**R4.1** `Adventurer` holds the same `finished_action` slot, and `Adventurer.handleTick()`
performs the same end-of-tick hand-off inside its existing try/catch: clear the slot,
tick, and if the active action finished, move it to the slot, pick and start the next.

**R4.2** WHEN the catch path runs THEN both slots are null. The adventurer reads idle,
and the start-of-tick branch recovers on the next tick, as today.

**R4.3** `mapAdventurer()` reads both slots through the shared function of R1.3.

## R5 — Documentation and superseded clauses

**R5.1** CQR-53 parent R1.3 and R1.4, and the 2D sub-feature R1.3, each gain a note
that points to this cycle's R1.4 and R1.6. Their text is not rewritten.

**R5.2** The canonical docs are updated in the same change as the engine commit:
`.specs/product.md` (the Building paragraph, "choose actions for idle workers"),
`.specs/features/buildings-economy/README.md` (the Worker availability rule),
`.specs/features/interface-controls/README.md` (the progress-row bullet and the roster
paragraph), and `.specs/features/console-harness/README.md` (the `inspect` and
`adventurers` rows).

**R5.3** `.specs/.cycles/README.md` marks the cycle implemented. `CONTEXT.md` and ADR
0007 were written during refinement and need no change.

## R6 — Verification

**R6.1** `npx vue-tsc -b --force` is clean after each of the two commits.

**R6.2** Iron Mine sequence, console: after `tick 2`, `inspect IronMine` shows the new
`MineOres` at `remaining=2/2` with `finished=MineOres`; after one more tick it shows
`remaining=1/2` and no finished slot.

**R6.3** Iron Mine sequence, browser: the row reads "MineOres 50%", then
"MineOres · next MineOres 100%" with a full accent bar, then "MineOres 50%". The row's
rendered height is equal in both states.

**R6.4** Determinism: `seed 1`, `tick 100`, then `inspect` on the Lumber Mill, the Iron
Mine and the Blacksmith, before and after commit 2. Inventory and money are identical.
The console log shows the same Apothecary and Wren events in the same order.

**R6.5** Roster: at Wren's arrival at the Forest, `adventurers` prints
"Travel 100% -> next Forage", and the roster badge reads "Travel" beside a muted
"· next Forage".

**R6.6** A worker with no action still reads idle, 0%, no next: the state before the
first tick.
