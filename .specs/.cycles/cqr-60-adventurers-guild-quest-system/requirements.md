# Requirements — Adventurers' Guild and the quest system (Phase 1)

> Authored into the cycle from [`request.md`](./request.md) (CQR-60). No steering
> docs exist (`.spec-workflow/steering/` absent), so "Alignment" references the
> canonical `.specs/` docs and `CONTEXT.md` instead.
>
> **Status: implemented** (2026-07-31, branch `CQR-60`). As-built deltas are
> recorded inline on the clauses they touch.

## Introduction

Guild's production chains are all closed. `TakeDownTreeAction` and `MineOresAction`
conjure their inputs from nothing; the Blacksmith buys ore from the Market. The
Apothecary — shipped in CQR-59 as the first building whose input comes from
*outside* — has no way to ask for more, so it brews its seeded 10 Bloodroot and 10
Manabloom into six potions and then stops forever.

This cycle gives a building a way to ask the world for something: it **posts** a
quest to a public board held by a new **Adventurers' Guild**. Phase 1 ships the
board, the posting, and the settlement rules. It does not ship the adventurer who
does the work — that is CQR-61.

## Alignment with product vision

- Advances `.specs/roadmap.md` § 3 (adventurer management) by building the place
  adventurers will be met and hired, ahead of the adventurers themselves.
- Closes the gap `.specs/README.md` records as "Not implemented yet: … quests".
- Honours the `CONTEXT.md` glossary exactly: post / claim / fulfil, quest vs
  action, adventurer vs worker, gather vs forage, location vs zone.

---

## R1 — The quest board is a module service

**R1.1** The board lives in `src/modules/quests/`, not on a building. (ADR 0002)

**R1.2** It exposes exactly: post, claim, fulfil, and four queries — the whole
board, open quests, quests by poster, and outstanding quests concerning an item.

**R1.3** It runs headless: no `City`, no Vue component, and no building lookup is
needed to post or claim.

**R1.4** It is a reactive singleton, matching `marketService`, so board writes
invalidate the panel's bindings.

> _As-built:_ `quest.service.ts` exports `reactive(new QuestService())`.
> `getOutstandingFor(item, poster?)` takes an optional poster so a building can ask
> only about its own quests — the Apothecary's dedupe needs that narrowing.

**R1.5** Quest ids are unique and stable for the process lifetime.

## R2 — Quest and objective shape

**R2.1** `QuestStatus` has exactly three members — `Open`, `Claimed`, `Fulfilled` —
and one direction of travel. No `Failed`, `Abandoned` or `Expired`. (ADR 0003)

**R2.2** A quest records the posting building, the claiming adventurer (null while
open), the objective, the funded reward, and the status. Nothing else, and no
methods.

**R2.3** An objective is a serializable discriminated union keyed on `kind`. Phase
1 ships one member: `{ kind: 'gather', item, quantity, location }`.

**R2.4** Objectives carry **no behaviour**. Everything that reads an objective lives
in a resolver registry keyed by `kind`, mirroring `ItemRegistry`. (ADR 0002)

**R2.5** Adding an objective kind is one union member plus one registry entry: the
board, the claim flow and the adventurer's loop are untouched.

> _As-built:_ two clauses were added to make R2.5 literally true rather than
> aspirational. `ObjectiveResolver.concerns(objective, item)` keeps
> `getOutstandingFor` from having to know what a gather objective looks like; and
> `location` was lifted onto a shared `ObjectiveBase` so the board can read
> `objective.location` off the union forever and a new kind cannot forget to say
> where its work happens.

**R2.6** Phase 1 ships the gather resolver's **completion** check
(`isFulfilled`). Action planning is Phase 2's addition to the same interface.

## R3 — Reward and escrow

**R3.1** Posting debits the poster's wallet immediately. A posted quest is always a
funded quest. (ADR 0003)

**R3.2** Fulfilment pays the escrowed reward to the claimant.

**R3.3** The reward amount is an author-set constant on the posting building, not
derived from item value.

**R3.4** A poster that cannot afford the reward does not post, and nothing throws.

**R3.5** Total city gold is no longer the sum of building wallets — escrowed gold
sits on open quests. Any future economy readout must count it.

## R4 — Posting policy

**R4.1** `BaseBuilding` gains a `reviewQuests()` no-op called once per tick from
`handleTick`. Any building joins the quest system by overriding it.

**R4.2** `reviewQuests()` is **not** part of `chooseNextAction()`. That runs only
when a worker is idle, so posting from there would fall silent exactly when both
workers are busy consuming the stock that is running out.

**R4.3** The Apothecary posts per herb it has a recipe for, so a Bloodroot shortage
does not hide behind a Manabloom one.

**R4.4** It posts when stock falls below a threshold **and** it holds no
outstanding (Open or Claimed) quest for that herb **and** it can afford the reward.
The middle clause is load-bearing: without it an identical quest goes up every tick.

**R4.5** A building only posts objectives that can actually be satisfied somewhere.

**R4.6** The Apothecary's starting money rises from 100 to 1000 — a test runway, not
an economic decision. (ADR 0004)

> _As-built:_ threshold is **6** (two brews' worth — a recipe consumes 3), quantity
> **10**, reward **45**. The Apothecary asks
> `forageLocationFor(herb)` where the herb grows rather than hard-coding the
> Forest. Its `production_list` was lifted to a module-level `PRODUCTION_LIST` that
> carries the reagent alongside the product, so the brew loop and the quest loop
> read one table and cannot disagree about what the building needs.

## R5 — Locations and the forage table

**R5.1** A `Location` enum with `Town` and `Forest`, plus a travel cost per
location and a forage table.

**R5.2** How hard something is to find lives on the **location/item pair**, never on
the item. The item definitions stay untouched — their "tier is descriptive only and
drives no code" comment stays true.

**R5.3** `Zone` is not used. It is reserved for world-expeditions, where it will
mean a dangerous area with inhabitants. Every zone will be a location; the town
never will be.

**R5.4** Phase 1 reads the forage table for one thing only: proving a herb is
obtainable somewhere before a quest for it is posted. The find chances are authored
now, rolled in Phase 2.

> _As-built:_ lives in `src/modules/world/location.ts`, not under `quests/` — a
> location is a world concept (`CONTEXT.md` files it under Places, not Work) and
> Phase 2's travel and foraging read it directly. The Town's forage table is
> deliberately empty, which is what makes R5.4's check do real work.

## R6 — The Adventurers' Guild building

**R6.1** A new `BuildingID.AdventurersGuild` and a building class of that name —
not `Guild` or `GuildHall`, which are permanently ambiguous with the project itself.

**R6.2** It has no workers, following `Market`'s established empty-worker shape.

**R6.3** It owns neither the quests nor the adventurers; it is where they meet.

**R6.4** Registered in the city alongside the other buildings, and therefore listed
in the buildings sidebar without any change to that component.

**R6.5** Given a 2×2 grid plot anchored near the Market, validated at module load by
the existing occupancy check.

> _As-built:_ anchor `[3, 4]` — kitty-corner to the Market plot `[2, 2]`, world
> centre `[10.5, 13.5]`. Nothing had to move: the band is clear of houses, roads and
> trees.

## R7 — View layer

**R7.1** The environment-view module gains a `QuestRow` DTO — objective summary,
location, reward, status, poster, claimant — following that module's contract:
plain serializable shapes, no methods, no engine references, mappers read-only.

**R7.2** A 3D mesh for the city view, registered as a one-line entry.

**R7.3** A read-only 2D board panel for the interior, registered as a one-line
entry.

**R7.4** The panel has **no claim control**. Claiming is an adventurer's decision;
a button would let the player do their job for them, and would put this panel in
the Market panel's controls-bearing territory.

> _As-built:_ `QuestRow` carries `posterName` as well as `poster`, resolved from the
> city so the board shows "Apothecary" rather than a raw id. The panel does not
> reuse `BuildingInterior2D` — the guild has no workers and no inventory, and the
> board replaces both — but keeps its visual language. Quests reach it through a
> `useQuestBoard()` composable reading `questService` directly, so `EnvironmentView`
> stays free of quest fields.

## R8 — Headless verification

**R8.1** The console harness gains `quests`, listing the board.

**R8.2** `quests` prints the **`QuestRow` DTO the panel consumes**, not the
service's internal objects, so a DTO bug fails in the terminal instead of hiding
until someone opens the panel.

**R8.3** `tick`, `status`, `inspect`, `inventory` and `give` work unchanged on the
new objects.

**R8.4** Scenario: seed the run, advance ~200 ticks, and confirm the Apothecary
brews until herbs run out, posts one Bloodroot quest and one Manabloom quest and no
more, its wallet drops by exactly the two rewards, both quests sit Open with the
right poster and objective, and no duplicates accumulate.

> _As-built:_ verified at tick 200 — money `1000 → 910` (exactly 2 × 45), stock
> `Bloodroot 1 / Manabloom 1 / HealthPotion 3 / ManaPotion 3`, board holds exactly
> `quest:1` Gather 10 × Bloodroot and `quest:2` Gather 10 × Manabloom, both Open,
> both posted by the Apothecary.
>
> Two commands beyond the brief: `claim <questId> <claimantId>` and
> `fulfil <questId> <claimantId>`, with a stubbed claimant and a debug purse. The
> request requires claim and fulfil to be "reachable from the console"; without
> these the whole `Open → Claimed → Fulfilled` path had no headless test surface.
>
> `seed <n>` was **not** added — moved to CQR-65 with the rest of the seeded-random
> prefactor, since Phase 1 contains no randomness for it to pin.

## R9 — Day/night

**R9.1** The cycle stays disabled. `isNight()` still returns `false`.

**R9.2** Its commented-out body is corrected from `% 24` to a 48-tick day so that
enabling it later is a one-line change. (ADR 0001)

> _As-built:_ ADR 0001 was also corrected. It claimed `LumberMill`, `IronMine` and
> `Apothecary` guard every action on `!isNight()`; the Apothecary does not — CQR-59
> deliberately shipped brewing un-gated as indoor work. Five actions across two
> buildings are gated, not three buildings.
