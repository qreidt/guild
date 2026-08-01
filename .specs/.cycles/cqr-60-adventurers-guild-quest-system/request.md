# Request — Adventurers' Guild and the quest system (Phase 1)

> Source: [CQR-60](https://linear.app/cqr/issue/CQR-60/adventurers-guild-and-the-quest-system-phase-1).
> Reproduced here so the cycle folder is self-contained. Phase 2 is
> [CQR-61](https://linear.app/cqr/issue/CQR-61); the seeded-randomness prefactor
> was split out to [CQR-65](https://linear.app/cqr/issue/CQR-65).

## Problem statement

The Apothecary stalls and stays stalled. It starts with a seeded stack of 10
Bloodroot and 10 Manabloom, brews three Health Potions and three Mana Potions, and
then does nothing forever — nothing in the game replenishes herbs. Its own source
comment already admitted this was a placeholder waiting for "returning adventurers".

More broadly: a building has no way to ask the world for something it cannot make
itself. Every production chain in the city is closed — the LumberMill and IronMine
conjure their own inputs, the Blacksmith buys ore from the Market. There is no
mechanism for "I need something that comes from outside the walls".

And the game is named Guild, for adventurers, who do not exist in it.

## Solution

An **Adventurers' Guild** building holding a public **quest board**.

A building that needs something it cannot produce **posts** a quest describing the
objective and the reward. The reward is committed at the moment of posting, so a
quest on the board is always a funded quest. Quests sit **Open** until someone
**claims** them, become **Claimed** while being worked, and end **Fulfilled** when
the objective is satisfied and the reward paid.

Phase 1 delivers the board, the posting, and the settlement rules — everything
except the person who does the work. At the end of Phase 1 the player can open the
Adventurers' Guild and watch the Apothecary post "gather 10 Bloodroot from the
Forest, 45g" as its herb stock runs down, see the reward leave the Apothecary's
wallet, and see the quest sit open because nobody has arrived to take it yet.

## Out of scope

- **Adventurers.** Nobody claims or fulfils anything in Phase 1. Claim and fulfil
  are implemented and reachable from the console with a stubbed claimant, but no
  actor calls them.
- **Any objective kind other than gather.** Hunting, escorting and exploring wait
  for combat and the `Zone` model.
- **Quest failure, abandonment, and expiry.** Deliberately excluded — see the
  three-state decision in ADR 0003.
- **Rank or skill gating on claiming.** Wanted later, for higher-risk missions.
- **Rewards other than money.** No items, no reputation, no experience.
- **Derived reward pricing.** Author-set constants for now.
- **Enabling the day/night cycle.** The commented-out night check gets its day
  length corrected to 48 so switching it on later is right; it stays disabled.
- **Any income line for the Apothecary.** See ADR 0004.
- **Persistence.** No save or load; state still resets on process exit.
- **Player-authored quests.** Only buildings post.
- **Seeded randomness / the console `seed` command.** Moved to CQR-65 — there is
  no randomness in Phase 1, so it would have shipped dead.

## Vocabulary

The domain glossary in [`CONTEXT.md`](../../../CONTEXT.md) is load-bearing here and
is honoured in code and prose: **Quest** vs **Action**, **Adventurer** vs
**Worker**, **Gather** vs **Forage**, **Location** vs **Zone**, and the three verbs
**Post** / **Claim** / **Fulfil**. The word "task" is banned for both quests and
actions, because the environment-view DTO already uses `task` to mean the action a
worker is running.

## Relevant ADRs

All in [`docs/adr/`](../../../docs/adr/): 0001 (tick length), 0002 (board as a
module service, objectives as data), 0003 (escrow at post time), 0004 (the
Apothecary is meant to run out of money), 0005 (seeded randomness — authored here,
consumed in Phase 2).
