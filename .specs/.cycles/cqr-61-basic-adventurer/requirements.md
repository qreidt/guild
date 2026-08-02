# Requirements — The basic adventurer: claim, forage, deliver (Phase 2)

> Authored into the cycle from [`request.md`](./request.md) (CQR-61, with CQR-65
> as its prefactor sub-issue). No steering docs exist
> (`.spec-workflow/steering/` absent), so "Alignment" references the canonical
> `.specs/` docs and `CONTEXT.md`.
>
> **Status: implemented** (2026-08-01, branch `CQR-61`). As-built deltas are
> recorded inline on the clauses they touch. The two that matter most are
> **R4.1** (the planner returns steps, not actions — ADR 0006) and **R9.5** (the
> 3D guild mesh is still visually unverified).

## Introduction

CQR-60 built the place where quests are posted and the rules for settling them.
It did not build anyone to do the work. This cycle builds exactly one adventurer
and gives them one capability — completing a gather quest — so that the chain
from a building's need to a filled shelf runs end to end without the player.

## Alignment with product vision

- Advances `.specs/roadmap.md` § 3 (adventurer management) from "the place they
  will be met" to "one of them, doing work".
- Makes `game/adventurer/Adventurer.ts` reachable code for the first time.
- Honours the `CONTEXT.md` glossary, including the two verbs this cycle adds —
  **Deliver** and **Travel** — and the gather/forage distinction it turns on:
  gather is the objective (end up *holding* a quantity), forage is one act that
  can satisfy it.

---

## R0 — Prefactor: the action input origin is per-instance

**R0.1** `Action.input_origin` is an instance property, mirroring
`output_destination`. The static declaration is gone from the base class and from
every subclass.

**R0.2** The change lands as its own commit, before any adventurer code, and is
independently revertable.

**R0.3** Every existing building produces exactly as it did.

> _As-built:_ commit `2ba61ed`. 17 declaration sites across four building files
> plus three lines in the base class. `input_origin` was also removed from the
> `IAction` interface — that is what makes `this.static.input_origin` a compile
> error, since TypeScript would otherwise happily accept a subclass keeping a
> now-meaningless static. Verified by diffing a 200-tick console run
> (`inspect` × 5 + `quests`) against the same run before the change:
> byte-identical.
>
> _Verified at review:_ nothing shipped exercises the case the prefactor exists
> for — there is only one adventurer. A throwaway probe added a second and
> confirmed it: two adventurers running the same `ForageAction` class get
> distinct destinations (`adventurer:1` vs `adventurer:2`), draw visibly
> different streams from the same world seed, claim one quest each, and both
> finish paid. Under the old static declaration the second would have
> overwritten the first's origin.

## R1 — Shared seeded randomness (CQR-65)

**R1.1** `mulberry32` lives in a shared module, not in the 3D layout file.

**R1.2** The town layout imports it and places trees and houses identically.

**R1.3** A helper produces a per-actor stream seeded from an id, following the
per-cell seeding pattern the layout already uses.

**R1.4** The console gains `seed <n>`, which pins the stream.

**R1.5** `Math.random` remains absent from the simulation.

> _As-built:_ commit `69ea8a9`. `src/modules/random/random.ts` exports
> `mulberry32`, `actorSeed`, `setWorldSeed` / `getWorldSeed` and a `RandomStream`
> class. `RandomStream` is a class rather than a bare closure so `seed <n>` can
> re-pin streams that were handed out *before* the command ran — a generation
> counter, not a registry of every stream. `chance(p)` always consumes exactly
> one number, including at p ≤ 0 and p ≥ 1, so tuning the odds never shifts the
> stream out from under everything downstream. R1.2 was verified mechanically
> rather than by eye: all six derived arrays (`WALL_BOXES`, `GROUND_PATCHES`,
> `HERO_PLOTS`, `DECORATIVE_HOUSES`, `DENSE_HOUSES`, `TREES`) serialise
> byte-identically against the pre-move module. `seed` with no argument prints
> the current seed.

## R2 — Delivery is part of settlement

**R2.1** `questService.fulfil()` moves the objective's goods from the claimant to
the poster, in the same call that pays the escrowed reward.

**R2.2** What moves is decided by the objective's resolver, not by the board. A
kind that hands over nothing transfers nothing.

**R2.3** The transfer runs before the status flips, so a claimant who cannot
produce the goods leaves the quest `Claimed`.

**R2.4** A fulfilled quest cannot be settled again.

> _As-built:_ commit `05ded21`. `ObjectiveResolver.delivery(objective)` returns a
> `GoodLedger`; gather returns `{item: quantity}`. The transfer goes through
> `transactionService` rather than a take-then-put pair, so the debit is
> validated and applied in one call and the credit in the next with nothing able
> to run in between. Input and output are **separate `Map` instances**: the
> transaction store keeps whatever reference it is handed, so passing one map as
> both ends would make two supposedly independent halves the same object — the
> exact coupling `request.md` flags as a silent failure.

## R3 — The claimant shape

**R3.1** `QuestClaimant` gains the claimant's current location, and nothing else.

**R3.2** An `Adventurer` satisfies it without becoming the only thing that can.

> _As-built:_ `Adventurer` exposes a `claimant` getter rather than implementing
> the interface directly — its existing `id` is a `number` and `ClaimantID` is a
> string, so structural satisfaction was never available. The getter is also the
> narrower surface: a resolver sees what they carry and where they are, not a
> whole adventurer.

## R4 — Objective-driven planning

**R4.1** The resolver registry answers "what should the claimant do next?" from
live quest and claimant state, re-evaluated whenever the claimant is free and
never precomputed as a fixed plan.

> _As-built — deviation from the brief._ The brief specified `plan()` returning
> an `Action`. It returns an **`ObjectiveStep` descriptor** instead, and the
> adventurer maps steps to actions. Two reasons, both recorded in **ADR 0006**:
> returning an `Action` closes a real import cycle (`quest.service` →
> `objectives` → `DeliverAction` → `quest.service`, and this repo has already
> shipped a blank production page from an import cycle — `185605c`), and it puts
> engine code inside `modules/`, which is engine-agnostic by convention and is
> the whole point of ADR 0002. Everything the brief wanted from the arrangement
> survives: adding an objective kind is one union member and one resolver entry,
> and the adventurer never learns an objective kind by name.

**R4.2** The gather plan is: not at the objective's location → travel there;
objective not satisfied → forage (repeatable); not back where the poster is →
travel there; otherwise → deliver. A settled quest yields "nothing left to do".

**R4.3** The adventurer stays ignorant of objective kinds.

> _Amended at review:_ the `deliver` step originally carried `to: BuildingID`,
> which nothing read — the adventurer settles by quest id and the poster is
> derivable from the quest. Removed as speculative generality: two sources for
> one fact, with no way for a reader to tell which is authoritative.
>
> _As-built:_ the `done` short-circuit lives in `planObjective()`, the
> dispatcher, not in each resolver — "is this quest still running?" is a question
> about status, which no objective kind has an opinion about. The gather plan is
> a fall-through ladder rather than a state machine, because there is no state to
> keep: every branch asks about the world right now, so an adventurer interrupted
> anywhere resumes correctly.

**R4.4** Where the goods are handed over is derived, not hard-coded.

> _As-built:_ `buildingLocation(id)` in the world module returns `Location.Town`
> for everything. A constant today, but a *function*, so the day an outpost
> exists there is one line to change rather than a literal to find inside the
> planner.

## R5 — The adventurer

**R5.1** `Adventurer` gains a name, a current location, a current action, at most
one claimed quest, and a private seeded stream.

**R5.2** One adventurer is seeded at startup: a Scout with **zero herbalism
proficiency**, so the novice case is exercised at its worst from day one.

**R5.3** They claim the **first open quest in post order** — deterministic, and
visibly provisional.

**R5.4** With no claimable quest they wait, idling in town, without erroring or
spinning.

**R5.5** They hold at most one quest at a time.

> _As-built:_ a single `claimed_quest_id` field is the enforcement — there is no
> list to grow. The quest is released in exactly one place, the planner's `done`
> branch, which costs one waiting tick between jobs; keeping release in one place
> was judged worth the tick. `Adventurer.handleTick()` wraps its body in a
> try/catch: `claim` and `fulfil` throw (correctly, for callers outside the tick
> loop) but nothing catches inside it, and an escaped throw would kill the
> simulation for every building too. Both calls are pre-validated, so reaching
> the catch means a real bug — which should be loud and survivable, not fatal.
> The adventurer is named **Wren**. Their two inline market wallets collapsed
> into one `wallet` getter, shared with the quest board: the market and quest
> `Wallet` declarations are structurally identical and interchangeable, which
> `quests/common.ts` already says out loud.

## R6 — The roster service

**R6.1** A module service owns the roster, mirroring the quests module.

**R6.2** It is ticked from the game controller as a **sibling to the city's
tick**, not from within the city.

**R6.3** Adventurers belong to no building.

> _As-built:_ `src/modules/adventurers/adventurer.service.ts`, a reactive
> singleton like `questService`. The roster is **seeded lazily on first access**,
> for the same reason `GameController.city` is: the module sits in the engine's
> import cycle, and constructing an `Adventurer` at module scope lands in the
> class's temporal dead zone once Rollup orders the bundle — a blank page in
> every production build. Ticked **after** the city, so a quest posted this tick
> is on the board before anyone looks at it.

## R7 — The adventurer's actions

**R7.1** Three actions reusing the existing action machinery: travel, forage,
deliver.

**R7.2** **Travel** costs a tunable number of ticks read from a table, never
derived from 3D geometry.

**R7.3** **Forage** runs a fixed-length shift and rolls **once per tick**; each
success yields one unit.

**R7.4** The find chance is **additive**: a non-zero base from the location's
forage table plus bonuses from herbalism proficiency and perception. Never
multiplicative.

**R7.5** Forage **defers settlement** — no transaction at start, created and
committed on finish once the yield is known.

**R7.6** **Deliver** settles the quest, which is what moves the goods and pays
the reward.

**R7.7** Goods are held by the adventurer between foraging and delivery.

> _As-built:_ `travelCost(from, to)` derives a leg from `TRAVEL_COST`, which
> authors one-way costs *from the town* and nothing else — so a non-town leg
> routes through the town rather than inventing a distance nobody wrote down.
> Forage's shift is 6 ticks (3 hours); bonuses are 0.02/point herbalism and
> 0.01/point perception, capped at 0.95. Deferred settlement needed no `start()`
> override in the end: the base class already skips transaction creation when
> `input` is null, which forage's is — the override `TransportAction` carries
> exists because it *does* have an input. `DeliverAction` deliberately declares
> no `input`, `input_origin` or `output`; the move happens inside `fulfil`, and
> declaring it here as well would run it twice. The action carries a comment
> saying so, because its absence is the first thing a reader will question.
> The adventurer's location changes on **arrival**, not departure — someone
> halfway to the forest is still in town as far as anything that asks, which is
> the honest answer while travel is a duration rather than a position.

## R8 — Day and night, wired and left off

**R8.1** Foraging gates on the single global night check, not a second daylight
rule.

**R8.2** An adventurer whose herbalism clears a threshold may forage at night at
a reduced find chance.

**R8.3** Below it the shift **stalls** — ticks stop counting down, so they wait
out the night and resume at dawn, losing time rather than progress.

**R8.4** Travel is not gated.

**R8.5** The night check's day length reads 48 ticks, per ADR 0001.

> _As-built:_ threshold 3 herbalism, night find chance halved. R8.5 needed no
> work — CQR-60 already corrected the commented-out body from `% 24` to `% 48`.
> `isNight()` still returns `false` unconditionally, so none of R8 runs in play;
> flipping it turns night on for buildings and foraging together, in one place.

## R9 — View layer

**R9.1** A roster screen listing each adventurer with class, rank, location,
current action, progress, claimed quest, funds and carried goods.

**R9.2** It follows the worker DTO's "current task plus progress" shape.

**R9.3** A claimed quest shows the adventurer's **name** on the board.

**R9.4** The console gains `adventurers`; `quests`, `tick`, `status`, `inspect`
and `inventory` work unchanged.

**R9.5** The roster screen and the board's claimant are verified visually.

> _As-built:_ `AdventurerView` reuses `WorkerView`'s exact `task` / `progress` /
> `status` triple and `InventoryRow` for carried goods. The panel lives at
> `components/adventurers/AdventurerRoster.vue` and is **not** in
> `environment-registry.ts` — that registry is keyed by `BuildingID`, and
> adventurers belong to no building. The left menu gains a "People" section for
> the same reason: listing them under "Buildings" would say the opposite of what
> the model means. `mapAdventurer` filters zero-count rows out of `carrying`
> (emptied stacks linger in the ledger at zero; "carrying 0 Bloodroot" reads as
> progress toward a quest that is actually at nothing) — building shelves keep
> theirs, where knowing you have run out is useful.
>
> _Fixed at review:_ selecting the roster left the previously-selected building
> highlighted in the sidebar, so two rows read as selected at once. `showRoster()`
> now clears `active_building_id` — the roster is a screen of its own, not an
> overlay on a building.
>
> _R9.5 partially unmet:_ the roster screen and the board's "claimed by Wren"
> were both read out of the live production build, and the 3D city view mounts
> with a live WebGL context and no console errors. **Screenshots do not work in
> this environment** — the Browser pane is not displayed, so the page never
> composites and the capture times out. The `AdventurersGuildMesh` shipped in
> CQR-60 therefore still has not been *looked at* by anyone; its placement is
> verified numerically only. Carried forward.

## R10 — Verification scenarios

**R10.1 Full loop.** Pin the seed, run until the Apothecary's herbs are
exhausted, and confirm the whole cycle.

**R10.2 Reproducibility.** The same seed and tick count produce identical
results.

**R10.3 Novice viability.** A zero-herbalism adventurer completes a gather quest,
slowly. This is the regression test for R7.4 — a multiplicative formula fails it
by never terminating.

**R10.4 Idle.** With an empty board the adventurer waits in town; nothing errors
or spins.

**R10.5 Refactor safety.** After R0 and before any adventurer code, every
building produces exactly as it did.

> _As-built — all five pass._ At `seed 7`, tick 400: Wren claims quest:1, travels
> 4 ticks, forages four shifts (2 + 4 + 1 + 4 = 11 Bloodroot), returns, delivers,
> is paid 45g; claims quest:2 and repeats; ends holding 190g with both quests
> `Fulfilled` and the Apothecary restocked 1 → 11 of each herb. Two runs of the
> identical script diff clean (R10.2). Wren's herbalism is 0 throughout (R10.3).
> From ~tick 235 to 400 the board has no open quest and Wren waits in town,
> silent and error-free (R10.4). R10.5 is recorded under R0.3.
>
> _One story is structurally satisfied but not observable:_ "the Apothecary
> resumes brewing once herbs arrive". It caps production at 3 potions each and
> **nothing consumes potions** — adventurers buying them is explicitly out of
> scope (ADR 0004). Verified with a throwaway probe instead: remove the potions
> and tick 30 more, and the Apothecary brews on the delivered herbs (Bloodroot
> 11 → 2, HealthPotion 0 → 3). The chain restarts; it just has nothing to restart
> *for* until someone drinks.
