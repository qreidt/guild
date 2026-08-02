# Request — The basic adventurer: claim, forage, deliver (Phase 2)

> Source: [CQR-61](https://linear.app/cqr/issue/CQR-61) (Linear team `CQR`,
> project "Guild Game"), with sub-issue
> [CQR-65](https://linear.app/cqr/issue/CQR-65) — the shared seeded random
> prefactor. Blocked by CQR-60, which shipped as `ff42199`.
>
> This file records the brief **as received**. Where the build diverged, the
> divergence is recorded as an as-built delta in
> [`requirements.md`](./requirements.md) — not by editing this page.

## Problem

Phase 1 left a quest board with quests nobody can take. The Apothecary posts
"gather 10 Bloodroot from the Forest", the reward sits escrowed, and the quest
stays Open forever because no adventurer exists to claim it.

The game is named for adventurers and contains none. There is an `Adventurer`
class — rank, class, attributes, proficiencies, equipment slots, a wallet, an
inventory account, market buy/sell — and **nothing ever constructs one**. All of
it is unreachable code.

## Solution

One adventurer, capable of exactly one thing: completing a gather quest.

They look at the board, claim the first open quest, walk to the Forest, forage
for the herb over repeated shifts with an uncertain outcome, walk home, deliver
the goods to the building that posted the quest, and collect the escrowed reward.
Then they look at the board again.

That closes the loop Phase 1 opened: the Apothecary's herbs run down, it posts a
quest, an adventurer fills it, the Apothecary brews again. The city and the
adventurer are connected — which is the subject of the game.

## Scope boundaries as briefed

**In:** one seeded adventurer; the gather objective's planning half; travel,
forage and deliver actions; a per-adventurer seeded stream; a roster screen; the
`adventurers` and `seed` console commands; the night rule wired but left off.

**Out:** every objective kind except gather; combat, danger and death; rank/skill
gating on claiming; skill progression; parties and multi-questing; recruitment;
equipment; wages, food, sleep, morale; adventurers buying potions; selling
foraged goods; quest failure, abandonment and expiry; enabling the day/night
cycle; persistence; any 3D representation of an adventurer.

## Prerequisite called out in the brief

The action base class declared its input origin as a **static** property while
its output destination was an **instance** property. An adventurer's origin is
per-adventurer, so two adventurers running the same action class would overwrite
each other's. The brief requires this land as its own isolated, revertable commit
before any adventurer code.

## The open boundary inherited from Phase 1

`questService.fulfil()` paid the reward but did not move the claimant's goods to
the poster. Unreachable in play (nothing called `fulfil`) but reachable from the
console, where settling repeatedly against one held stack let a poster pay out
forever and never restock. CQR-61 must transfer the goods **inside** `fulfil`.

## Two silent failures the design interview flagged

Both are worth keeping visible because neither crashes:

- A **multiplicative** find chance gives a zero-proficiency adventurer a zero
  chance — an infinite search loop with no error.
- **Mutating an in-flight transaction's goods map** appears to work, because the
  transaction service stores the same map reference.
