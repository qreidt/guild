# Design — Forage stops at the quest quantity

> Implements [`requirements.md`](./requirements.md) (R1–R6). Reads `CONTEXT.md` for
> **Shift**, **Gather** and **Forage**, ADR 0006 for why the count rides on the step,
> and ADR 0005 for why the seeded stream moves.

## Shape of the change

One commit. The user makes it. Four small touches, one test, and the doc deltas.

```
modules   common.ts        the `until?` field on the forage step                 (R1.1)
          objectives.ts    the gather resolver sets it                            (R1.2)
engine    Adventurer.ts    the switch passes it through                           (R1.3)
          ForageAction.ts  the check after a find                                 (R2)
test      ForageAction.test.ts                                                    (R4)
docs      CQR-61 pointers, architecture.md, CLAUDE.md, the cycles README          (R5)
```

## The dependency the design turns on

Settlement is deferred, so the finds of a running shift live in `found` on the action,
not in the inventory, and the planner's `isFulfilled` cannot stop a shift halfway. The
count therefore travels to the action, instead of the finds travelling to the inventory
per tick. The reasons are in [`request.md`](./request.md), "The shape of the change".

## The count, end to end

```
gatherResolver.plan()          → { step: 'forage', item, at, until: objective.quantity }
Adventurer.chooseNextAction()  → new ForageAction(this, next.item, next.at, next.until)
ForageAction.afterTick()       → roll; on a find: found++
                                 if (until !== undefined
                                     && adventurer.inventory.getCount(item) + found >= until)
                                     ticks_remaining = 0
Action.tick()                  → ticks_remaining <= 0 → FINISHED → finished()
ForageAction.finished()        → one transaction, origin null → the adventurer, { item: found }; commit
```

Setting `ticks_remaining` to `0` is the whole mechanism. The base class already finishes
an action on `ticks_remaining <= 0` right after `afterTick()`, so no hook is needed. A
`finishNow()` method on `Action` would be one more seam for one caller. Mark the line in
the action with a `ponytail:` comment naming that upgrade path, and promote it only when
a second action needs an early finish.

## Tick by tick

Wren holds 8 of 10 Bloodroot, stands at the Forest, and a shift starts. An illustration,
not a seeded trace:

| Shift tick | Roll | `found` | held + `found` | `ticks_remaining` after the tick | Row                    |
|------------|------|---------|----------------|----------------------------------|------------------------|
| 1          | miss | 0       | 8              | 5                                | Forage 17%             |
| 2          | find | 1       | 9              | 4                                | Forage 33%             |
| 3          | find | 2       | 10             | 0, set by the check              | Forage 100%, finished  |
| next tick  |      |         | inventory 10   |                                  | Travel to Town starts  |

Without `until`, the same shift runs to tick 6 and may find up to four more.

The action is finished inside `tick()`, exactly as a shift that runs out. Today
`Adventurer.handleTick()` finds it done at the start of the next tick and plans travel.
When the ADR 0007 hand-off lands, it picks travel at the end of the same tick instead.
Neither cares why the action finished, so this cycle and that one do not collide.

## The uncapped path stays

`until` is optional by decision. A step without it, and none exists today, runs the fixed
shift. The check is one guarded `if`. There is no second code path, and nothing else in
the action changes.

## The test

The first engine test in the repo. Its design follows from four facts:

- **The module graph loads under tsx.** The console harness imports the whole engine
  through the same runner, and the existing mapper test already imports the `Action`
  base.
- **Tick the action, never the controller.** The controller's constructor starts no
  timer. `nextTick()` and `resume()` do, and a pending one-second timeout would keep the
  test process alive. The action reads `gameController.isNight()`, which returns false,
  and nothing else from it.
- **Pin the seed with `setWorldSeed()`.** Streams derive from `actorSeed(gid, world_seed)`
  and rebuild when the seed changes, so the call may come before or after the adventurer
  exists. Pick one seed at authoring that yields two finds within six ticks, and name it
  in a comment. A different seed is a different test, not a flaky one.
- **Each case gets a fresh adventurer.** Every `new Adventurer()` takes a new gid and
  opens its own inventory account, so cases share no stock.

Two cases, per R4.2 and R4.3: capped, done in fewer than six ticks with exactly 10 held;
uncapped, not done after five ticks, done after six, holding 8 plus `found`. Shape and
imports follow `environment-view.test.ts`: `node:test`, `node:assert/strict`, no
framework.

## Determinism and the trace

A capped shift makes fewer rolls, so the stream moves from the first capped shift on.
R6.2 re-records the seed-7 finds; CQR-61 R10.1 keeps its numbers with a pointer here.

## Import hygiene

No file gains an import edge: a number on a type, a field set from data the resolver
already holds, a constructor argument passed through, and a test under `src/game/`.
