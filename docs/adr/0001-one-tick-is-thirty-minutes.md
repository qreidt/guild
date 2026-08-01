# One tick is 30 minutes; a day is 48 ticks

The codebase contained two contradictory answers. Every `total_ticks` comment
across all five building files agrees on 30 minutes per tick (`2 // 1h`,
`8 // 4 hours`, `6 // 3 hours`, `12 // 6 hours`, `14 // 7 hours` — 17 of 17
consistent), while the commented-out body of `GameController.isNight()` used
`tick % 24`, implying one hour per tick.

We resolved it in favour of **30 minutes per tick, 48 ticks per day**: the action
comments are unanimous, deliberate, and describe code that runs, whereas the
`% 24` expression is dead code that has never executed.

## Consequences

`isNight()` currently returns `false` unconditionally, so the day/night cycle is
inert. Its commented-out body has been corrected to `% 48` so that enabling it is
a one-line change. Note that enabling it is **not** cost-free: every `LumberMill`
and `IronMine` action already guards on `shouldTick(): !isNight()`, so switching
night on costs those two buildings ~37% of their output (18 of 48 ticks) the
moment it happens. That is intended behaviour, not a regression.

_As-built correction (CQR-60):_ this ADR originally named the `Apothecary` among
the guarded buildings. It is not — brewing is indoor work and CQR-59 deliberately
shipped it without a `shouldTick()` override. Five actions across two buildings
are gated, not three buildings.
