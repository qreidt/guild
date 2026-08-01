# Randomness is seeded, with one stream per adventurer

> **Decided, not yet implemented.** This ADR was authored during CQR-60, which
> contains no randomness for it to govern. `mulberry32` is still a private
> function inside `town-layout.ts`; the extraction, the per-actor helper and the
> console `seed` command are [CQR-65](https://linear.app/cqr/issue/CQR-65), and
> the rolls themselves arrive with the adventurer in
> [CQR-61](https://linear.app/cqr/issue/CQR-61). The decision below is what those
> cycles must build, stated in the present tense they will make true.

Foraging rolls draw from a seeded `mulberry32` stream, not `Math.random()`. The
PRNG is lifted out of `town-layout.ts` — where it already places trees and houses
deterministically from fixed seeds — into a shared module, so the project has one
philosophy of randomness rather than two.

Each adventurer gets their own stream, seeded from their id, following the pattern
`cellSeed(i, j)` already uses. A single global stream would couple unrelated
systems: a future combat roll would perturb every subsequent foraging result.

## Consequences

Seeded streams are order-dependent — adding a random call anywhere shifts every
result after it. A seed reproduces a run only against identical code, so "same
seed" does not mean "same outcome across versions". This is normal for seeded
simulations and is the price of being able to reproduce a bug at all.
