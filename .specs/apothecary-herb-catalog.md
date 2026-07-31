# Apothecary — Herb Catalog (draft)

**Date:** 2026-07-31
**Status:** Brainstorm notes. Not a spec, not a cycle. Holding place for the raw
ingredient catalog until the Apothecary cycle is opened.

## Decisions locked so far

- **Building name:** `Apothecary`. ~~Note `roadmap.md` calls this "Alchemist's Lab" —
  reconcile that line when the cycle is written.~~ **Done (2026-07-31, CQR-59):**
  `roadmap.md` now reads "Apothecary". The original design notes in the repo-root
  `_.md` still say "Alchemist's Lab"; those are historical intake and stay as-is.
- **Scope:** herbs → potions only. Meat/pelts deferred to the planned **Hunter's Lodge**
  and **Tannery** (both already on the roadmap).
- **Ingredients:** foraged only for now. Monster-harvested reagents (slime residue,
  spore caps, bones) come in a later pass.
- **Output:** potions **stockpile** in the building's inventory. No sales line, no
  `TransportAction` — same accumulate-in-place behaviour as the Blacksmith's equipment.
- **Supply:** adventurers will deliver ingredients. No worker gathers them. Until
  adventurers exist, seed the inventory (the Blacksmith seeds `IronOre = 400`).

## Catalog

| Herb | Tier | Value |
|---|---|---:|
| Greycap | Common | 2 |
| Stonemoss | Common | 2 |
| Thistlewort | Common | 2 |
| Hollowreed | Common | 2 |
| Bloodroot | Common | 3 |
| Manabloom | Common | 3 |
| Sunleaf | Common | 3 |
| Oxroot | Common | 3 |
| Bitterleaf | Common | 3 |
| Ashcap | Common | 3 |
| Coldmint | Common | 4 |
| Sourberry | Common | 4 |
| Copperfern | Common | 4 |
| Duskbloom | Common | 5 |
| Gallnut | Uncommon | 8 |
| Mirebloom | Uncommon | 8 |
| Witchhazel | Uncommon | 9 |
| Ironbark Moss | Uncommon | 10 |
| Bloodcap | Uncommon | 10 |
| Foxglove | Uncommon | 11 |
| Moonwort | Uncommon | 12 |
| Nightshade | Uncommon | 12 |
| Emberfruit | Uncommon | 12 |
| Amberseed | Uncommon | 14 |
| Frostcap | Rare | 28 |
| Ghostcap | Rare | 30 |
| Glowspore | Rare | 32 |
| Cryptbloom | Rare | 35 |
| Starbloom | Rare | 36 |
| Silverleaf | Rare | 38 |
| Heartsap | Rare | 40 |
| Emberheart | Rare | 42 |
| Kingsroot | Rare | 45 |

### Value calibration

Anchored to the existing economy: `IronOre` 2, `IronIngot` 5, `IronSword` 10,
`WoodStaff` 30. A common herb sits at ore level, an uncommon at sword level, a rare
at roughly a staff.

## Design hooks worth keeping

- **Duskbloom** is foragable only at night, which is why it is priced above the other
  commons — its scarcity is time, not tier. `GameController.isNight()` already exists
  but is stubbed to `return false`; production actions gate on `!isNight()`. A
  night-only herb is the first real reason to switch the day/night cycle back on.
- **Greycap** is deliberately unremarkable — abundant and cheap, so that quantity
  rather than rarity is the constraint. The WoodPlank of herbs.
- **Bitterleaf** and **Sourberry** both spoil quickly. If a spoilage mechanic is ever
  wanted, these two are where it lives. Not planned.
- **Cryptbloom**, **Ghostcap** and **Emberheart** sit in the Labyrinth and Flame Wisp
  territory, so rare supply is gated behind expedition depth rather than a separate
  rarity roll.
- Rarity tiers double as the foraging progression axis, pairing with the **Herbalism**
  proficiency already defined in `src/game/adventurer/_.md`.

## Habitat notes (commons)

Kept for flavour and for differentiating forage sub-areas later.

| Herb | Part | Habitat |
|---|---|---|
| Bloodroot | root | Forest floor, shade |
| Manabloom | flower | Damp shade |
| Sunleaf | leaf | Clearings, full sun |
| Oxroot | root | Meadow, clearing edges |
| Bitterleaf | leaf | Forest floor |
| Greycap | fungus | Rotting logs, deadfall |
| Ashcap | fungus | Old burn sites |
| Thistlewort | stem | Disturbed ground, forest edge |
| Sourberry | berry | Hedgerow, forest edge |
| Coldmint | leaf | Streamside |
| Hollowreed | stem | Riverbank, marsh |
| Stonemoss | moss | Rocky outcrops |
| Duskbloom | flower | Clearings, after dark |
| Copperfern | frond | Deep shade, north slopes |

## Open / not yet decided

> **Resolved (2026-07-31) by [CQR-59](./.cycles/cqr-59-apothecary-herbs-and-potions/).**
> All four questions below are answered; the section is kept for the record rather
> than deleted. See that cycle's `requirements.md` R3 and R4.

- ~~Which herbs brew into which potions (next brainstorm).~~ → **Bloodroot ×3 →
  Health Potion ×1; Manabloom ×3 → Mana Potion ×1**, 12 ticks each. The other 31
  herbs ship with no recipe.
- ~~Whether an intermediate essence stage sits between herb and potion.~~ → **No.**
  Considered and deferred: its value is smoothing bursty adventurer deliveries, and
  until adventurers exist the supply is a flat seeded stack with nothing to smooth.
- ~~How many potion lines ship in v1.~~ → **Two** (health and mana).
- ~~Which subset of the catalog actually gets `ItemID` entries in the first cycle.~~
  → **The full catalog.** All 33 herbs plus both potions are `ItemID` entries,
  stackable `Item` subclasses in `values/goods.ts`, and `ItemRegistry` mappings, so
  later loot/forage tables have stable ids to target.

Also settled by that cycle: the roadmap's "Alchemist's Lab" line now reads
**"Apothecary"**, closing the reconciliation flagged under *Decisions locked so far*.

### Still open

- Recipes for the remaining 31 herbs.
- Monster-harvested reagents (slime residue, spore caps, bones).
- Potion **consumption** — nothing drinks potions yet, so the Apothecary idles once
  it holds 3 of each.
- Adventurer delivery of ingredients (supply is seeded: `Bloodroot 10`,
  `Manabloom 10`).
