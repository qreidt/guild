# Objective planning returns steps, not actions

Asked what a claimant should do next, an objective resolver answers with an
`ObjectiveStep` — a small serializable descriptor (`travel` / `forage` /
`deliver` / `done`) — not with a constructed `Action`. The adventurer maps a step
to an action; the resolver never touches the engine.

CQR-61 specified the resolver returning an `Action` directly. It does not,
for two reasons.

**It would close an import cycle.** A `DeliverAction` has to call
`questService.fulfil()`, so `quest.service -> objectives -> DeliverAction ->
quest.service`. This repo has already shipped a blank production page from an
import cycle in the engine (`185605c`), and `GameController` still carries a lazy
`city` getter as the scar. Adding another cycle on the path every quest consumer
imports is not a trade worth making for a slightly shorter call chain.

**It would put engine code in `modules/`.** Everything under `src/modules/` is
framework- and engine-agnostic by convention — `objectives.ts` is pure functions
over inert data, which is the whole point of ADR 0002. Constructing engine
actions there drags `game/` into the quest board, the console harness and the
view mappers, none of which want it.

## What this preserves

Adding an objective kind is still one union member and one resolver entry. The
adventurer still never learns an objective *kind* — it maps step kinds, and the
verbs are shared across kinds by design: a `hunt` objective also travels and also
delivers. A new kind only grows the step union when it needs a genuinely new verb
(a `fight`), and that verb needs an `Action` class written somewhere regardless.

## Consequences

There is one indirection between "what to do" and "the object that does it": a
`switch` in the adventurer. It is the price of the boundary, and it is the place
a reader looks to find every action an adventurer can take, which is a better
index than a registry spread across resolvers.

Planning stays testable without the engine — `planObjective` can be asked for the
next step from a plain claimant shape, with no `Action`, no tick loop and no
`GameController`.
