# Randomness is seeded, with one stream per adventurer

> **Partly implemented.** The extraction, the per-actor stream and the console
> `seed` command landed with [CQR-65](https://linear.app/cqr/issue/CQR-65) —
> `mulberry32` and `RandomStream` live in `src/modules/random/random.ts`. The
> rolls that consume them arrive with the adventurer in
> [CQR-61](https://linear.app/cqr/issue/CQR-61); until then nothing in the
> simulation draws a number.

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
