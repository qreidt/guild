# Requirements — Forage stops at the quest quantity

> Authored into the cycle from [`request.md`](./request.md), which also holds the
> decisions of the refinement round of 2026-09-13. No Linear issue yet; the folder is
> named by slug, per the [cycles README](../README.md). No steering docs exist, so
> "Alignment" references the canonical `.specs/` docs, `CONTEXT.md` and the ADRs.
>
> **Status: not started.** Branch `fix/max-garthering`.

## Introduction

An adventurer on a gather quest forages in shifts of six ticks. The planner checks the
quantity only between shifts, and the shift does not know it, so the last shift always
runs its full length and the adventurer carries a surplus home. This cycle hands the
objective quantity to the forage step as `until`. The shift finishes in the tick the
adventurer holds that many, counting the finds of the running shift. Every gather quest
caps its forage this way. A step without `until` runs a full shift, as today.

## Alignment with product vision

- Advances `.specs/roadmap.md` § 1, "Stabilize the prototype": the one loop the game
  has, claim, forage, deliver, wastes no ticks and leaves no dead stock in a pack.
- Honours the `CONTEXT.md` glossary: **Shift**, added in the refinement round, **Gather**
  and **Forage**. "Task" is avoided in prose.
- Keeps ADR 0006: the forage step stays a descriptor, and gains a number, not behavior.
- Keeps ADR 0005: the same seed and the same code still replay exactly.
- Keeps ADR 0003: `fulfil` still moves exactly the objective quantity.
- Amends CQR-61 R4.2, R7.3 and R10.1 by pointer, not by rewrite.

---

## R1 — The count on the forage step

**R1.1** The `forage` member of `ObjectiveStep` gains `until?: number`: the total count
of the item the claimant is to hold, at which the shift may stop.

**R1.2** WHEN the gather resolver plans a forage step THEN it sets `until` to
`objective.quantity`.

**R1.3** `Adventurer.chooseNextAction()` passes `next.until` to the `ForageAction`
constructor. It learns no objective kind, per CQR-61 R4.3.

## R2 — The shift finishes at the count

**R2.1** `ForageAction` accepts an optional `until` as its fourth constructor argument.

**R2.2** WHEN a tick's roll finds a unit AND `until` is set AND the inventory count of
the item plus `found` is at least `until` THEN the action sets `ticks_remaining` to `0`
in `afterTick()`. The base `Action.tick()` then finishes the action in the same tick:
status `FINISHED`, and `finished()` creates and commits one transaction for the shift
total.

**R2.3** WHEN `until` is not set THEN the shift runs its full `FORAGE_SHIFT_TICKS`, as
today.

**R2.4** WHEN a shift ends short of `until` THEN it runs its full length, and the
planner asks for another shift, per CQR-61 R4.2.

**R2.5** The check runs only after a find. A tick with no find, and a night-stalled
tick, run no check.

**R2.6** The base `Action` class does not change.

## R3 — What does not change

**R3.1** Settlement stays deferred: no transaction at start, one transaction created and
committed in `finished()`, whatever the finish tick. Finds are never moved into the
inventory per tick.

**R3.2** Nothing else in the action, the planner, travel or delivery changes. `fulfil`
still moves exactly the objective quantity.

**R3.3** The view-model and the components do not change. A finished shift maps to
progress `1` and status `'finished'` through the existing `activity()` function. Before
the finish, the bar shows the shift's own progress, for example 17% then 33%, and then
100%. Accepted in the round.

**R3.4** Same seed, same code, same run, per ADR 0005. Runs recorded before this cycle
are not reproduced: a capped shift makes fewer rolls, so every later roll moves.

## R4 — The engine test

**R4.1** A `node:test` file sits next to the action,
`src/game/adventurer/actions/ForageAction.test.ts`, and `npm test` runs it.

**R4.2** Capped case. Pin the world seed with `setWorldSeed()`. Construct an
`Adventurer`, set their location to `Location.Forest`, and give them 8 Bloodroot through
`inventory.putGood()`. Construct a `ForageAction` for Bloodroot at the Forest with
`until` 10, call `start()`, then `tick()` until `isDone()`, at most six times. Assert
that the action is done in fewer than six ticks and that the inventory count is exactly
10. The pinned seed is one that yields at least two finds in six ticks; the test names
it in a comment.

**R4.3** Uncapped case. The same setup without `until`. Assert that the action is not
done after five ticks, is done after the sixth, and that the inventory count is
8 plus `found`.

**R4.4** The test ticks the action directly and never the game controller.

**R4.5** `CLAUDE.md`, the `npm test` line, records the new seam: engine actions ticked
directly under a pinned seed, beside the pure view-model mappers.

## R5 — Documentation and superseded clauses

**R5.1** CQR-61 R4.2, R7.3 and R10.1 each gain an as-built note that points to this
cycle's R1.2, R2.2 and R6.2. Their text is not rewritten.

**R5.2** `.specs/architecture.md`, the `ForageAction` summary, gains "ends early at the
quest quantity".

**R5.3** `CLAUDE.md` gains the seam of R4.5.

**R5.4** `.specs/.cycles/README.md` marks the cycle implemented and quotes the new
seed-7 finds.

## R6 — Verification

**R6.1** `npx vue-tsc -b --force` is clean. `npm test` passes, including R4.

**R6.2** Console trace: `seed 7`, `tick 130`, `adventurers`, `quests`. Both quests are
`Fulfilled`, each delivery paid 45g, and the roster reads `carrying: (nothing)`. The finds
per shift are recorded here as an as-built note, replacing the request's `2 + 4 + 1 + 4`
and `4 + 2 + 2 + 4`.
