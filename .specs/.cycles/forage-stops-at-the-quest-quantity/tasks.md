# Tasks — Forage stops at the quest quantity

> Build order follows [`plan.md`](./plan.md): **1 → 2 → 3**, one commit. Tasks read
> [`requirements.md`](./requirements.md) (R1–R6) and `plan.md`.
>
> The user makes the commit and opens the PR. The agent stops after task 3 and hands
> over. Task 1 is the one that touches the tick path: the check runs only after a find,
> and `finished()` stays the single place a shift settles (plan.md, "The count, end to
> end").

- [x] 1. The count travels: step, resolver, pass-through, check
  - Files: `src/modules/quests/common.ts`, `src/modules/quests/objectives.ts`,
    `src/game/adventurer/Adventurer.ts`, `src/game/adventurer/actions/ForageAction.ts`
    (modify)
  - `until?: number` on the forage step, with a doc comment: hold this many, then stop;
    absent means a full shift. `gatherResolver.plan()` sets `until: objective.quantity`.
    `chooseNextAction()` passes `next.until` as the fourth constructor argument.
    `ForageAction` stores it and, in `afterTick()` after a find, sets `ticks_remaining`
    to `0` when the inventory count plus `found` reaches it; a `ponytail:` comment names
    the `finishNow()` upgrade path. Nothing else in the action changes. `npx vue-tsc -b
    --force` clean.
  - _Leverage: `Action.tick()` finishes on `ticks_remaining <= 0` right after
    `afterTick()`; `InventoryAccountService.getCount()`; the existing `found` counter_
  - _Requirements: R1.1–R1.3, R2.1–R2.6, R3.1–R3.4_

- [x] 2. The engine test and the seam rule
  - Files: `src/game/adventurer/actions/ForageAction.test.ts` (new), `CLAUDE.md`
    (modify)
  - Two cases, per R4.2 and R4.3, in the shape of `environment-view.test.ts`. Pin the
    seed with `setWorldSeed()` and name it in a comment. A fresh `Adventurer` per case,
    at the Forest, holding 8 Bloodroot through `inventory.putGood()`. Tick the action
    directly, never the controller. `npm test` green. Then the `npm test` line in
    `CLAUDE.md` reads: "Tests sit only at agreed seams: pure functions such as the
    view-model mappers, and engine actions ticked directly under a pinned seed."
  - _Leverage: `environment-view.test.ts` for `node:test` and `node:assert/strict`
    usage; `setWorldSeed()` in `src/modules/random/random.ts`_
  - _Requirements: R4.1–R4.5, R5.3, R6.1_

- [x] 3. Docs, pointers and the recorded trace
  - Files: `.specs/.cycles/cqr-61-basic-adventurer/requirements.md`,
    `.specs/architecture.md`, `.specs/.cycles/README.md`, this cycle's
    `requirements.md` (modify)
  - An as-built note on CQR-61 R4.2, R7.3 and R10.1 pointing to R1.2, R2.2 and R6.2
    here. The `ForageAction` line in `architecture.md`. Then run R6.2 and record the new
    finds per shift as an as-built note under R6.2. The cycles README status becomes
    implemented, quoting the new finds. `npx vue-tsc -b --force` clean. **Stop here for
    the commit.**
  - _Requirements: R5.1, R5.2, R5.4, R6.2_
