# The next action is picked when the current one finishes

When an action finishes, its worker picks and starts the next one in the same tick,
at the end of `handleTick`, right after the worker loop. The obvious shape, and the
one the code had before this change, is to pick at the start of the next tick, when
the worker is found free.

**Why.** The building interiors and the adventurer roster show a hand-off: the
finished action at 100% beside the next action at 0%, for one tick. The next action
has to exist for that. The view cannot compute it. A pick reads live stock, the
market price, the funds and the quest board, and every candidate constructor opens
an inventory account, so a peek is not free of side effects. The engine must make
the pick at the finish.

**What it costs.** The pick is one tick staler than before. It does not see the
rest of the tick in which it is made: the buildings later in the order, and the
adventurers. Two cases pay one extra `Wait` tick. The Apothecary after Wren
delivers herbs, because adventurers tick after the city. Wren after a quest is
posted, because the posting lands in the next city tick. Both events occur a few
times per hundred ticks, and both actors already carry a `Wait` between jobs by
design. Completion ticks are unchanged: an action of `T` ticks still finishes `T`
ticks after its start, because it receives its first tick in the tick after it
starts, as before.

**Why not a queued slot.** Picking at the end of the tick but starting at the next
one keeps the same lag and opens a gap between validation and `start()`.
`Action.start()` opens a transaction that throws on insufficient stock, and nothing
in the building loop catches it. Two herbalists validating a brew against four
Bloodroot would kill the tick loop on the second start. Picking and starting
together keeps validation and start adjacent, which is the guard the Apothecary
relies on today.

## Consequences

A worker carries two actions for one tick: the finished one, kept for display, and
the started one. The finished slot clears when the started one receives its first
tick. The inputs of the next action leave the shelf at the end of the tick, the
moment the next action appears in the row.

A worker is idle only before its first action, and after an adventurer drops their
work on an error. The start-of-tick pick remains for those two cases.
