import { ItemID } from "../items/id.ts";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";

/**
 * The places someone can be, and travel between — plus what can be foraged at
 * each one. Pure authored data: no Vue, no engine references.
 *
 * A **Location** says nothing about danger or what lives there (see
 * `CONTEXT.md`). **Zone** — a dangerous area with inhabitants and encounters —
 * is deliberately NOT modelled here: it is reserved for the planned
 * world-expeditions work (`.specs/features/world-expeditions/`). Every zone will
 * be a location; the town never will be a zone.
 */

export enum Location {
    Town = 'Town',
    Forest = 'Forest',
}

/**
 * One-way travel time from the town, in ticks (one tick is 30 minutes — ADR
 * 0001).
 *
 * A table, not geometry. The 3D grid has no forest coordinate and inventing one
 * to measure against would make travel times a side effect of scenery — read
 * `travelCost` instead of this map.
 */
export const TRAVEL_COST: Record<Location, number> = {
    [Location.Town]: 0,
    [Location.Forest]: 4, // 2 hours out, 2 hours back
};

/**
 * Ticks to travel from one location to another.
 *
 * Every `TRAVEL_COST` entry is a one-way cost *from the town*, so the table
 * authors a hub and nothing else. A leg between two non-town locations
 * therefore routes through the town rather than inventing a distance nobody
 * wrote down. When somewhere is reachable without passing through the town, it
 * is this function that grows a real edge table — not its callers.
 */
export function travelCost(from: Location, to: Location): number {
    if (from === to) return 0;
    if (from === Location.Town) return TRAVEL_COST[to];
    if (to === Location.Town) return TRAVEL_COST[from];

    return TRAVEL_COST[from] + TRAVEL_COST[to];
}

/**
 * Where a building stands.
 *
 * Every building is in the town and the game cannot build anywhere else, so the
 * answer is a constant. It is a function anyway because "where do I hand this
 * over?" is a question the quest planner has to ask, and a literal
 * `Location.Town` at that call site is precisely the line nobody would find the
 * day an outpost exists.
 */
export function buildingLocation(_building: BuildingID): Location {
    return Location.Town;
}

/**
 * How hard something is to find, per **location/item pair** — never per item.
 * The same herb can be plentiful in one place and absent from another, which is
 * the whole point of keeping difficulty here: the item definitions stay
 * untouched, and their "tier is descriptive only and drives no code" comment
 * stays true.
 *
 * The value is the chance to find one unit per forage attempt, in (0, 1]. An
 * absent entry means the item cannot be foraged there at all.
 *
 * Authored in Phase 1 but read for one thing only — proving an item is
 * obtainable *somewhere* before a quest for it is posted. The chances themselves
 * are not rolled until the adventurer arrives (Phase 2).
 */
export const FORAGE_TABLE: Record<Location, Partial<Record<ItemID, number>>> = {
    // The town is a location you travel to, not a place you forage. An empty
    // table here is load-bearing: it is what makes `isObtainable` a real check
    // rather than a formality.
    [Location.Town]: {},

    [Location.Forest]: {
        // Common ground cover — easy to find, low value.
        [ItemID.Greycap]: 0.6,
        [ItemID.Stonemoss]: 0.6,
        [ItemID.Thistlewort]: 0.55,
        [ItemID.Hollowreed]: 0.55,
        // The two herbs the Apothecary actually brews with.
        [ItemID.Bloodroot]: 0.5,
        [ItemID.Manabloom]: 0.45,
        // Uncommon.
        [ItemID.Sunleaf]: 0.4,
        [ItemID.Oxroot]: 0.4,
        [ItemID.Bitterleaf]: 0.4,
        [ItemID.Ashcap]: 0.35,
        [ItemID.Coldmint]: 0.3,
        [ItemID.Sourberry]: 0.3,
        [ItemID.Copperfern]: 0.25,
        [ItemID.Duskbloom]: 0.2,
    },
};

/** Chance to find `item` at `location` per attempt; 0 when it is not there. */
export function findChance(location: Location, item: ItemID): number {
    return FORAGE_TABLE[location][item] ?? 0;
}

/**
 * Where `item` can be foraged, or `null` when nowhere can supply it.
 *
 * Reads presence only, never the odds — Phase 1 asks the forage table exactly
 * one question ("can this be had anywhere?") and the chances stay unread until
 * something rolls them. Weighting the choice by odds is Phase 2's call to make,
 * alongside the roll itself.
 */
export function forageLocationFor(item: ItemID): Location | null {
    return Object.values(Location).find((location) => findChance(location, item) > 0) ?? null;
}
