import { ItemID } from "../items/id.ts";

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
 * 0001). Authored now; consumed when adventurers start moving (Phase 2).
 */
export const TRAVEL_COST: Record<Location, number> = {
    [Location.Town]: 0,
    [Location.Forest]: 4, // 2 hours out, 2 hours back
};

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
 * Where `item` can be foraged, or `null` when nowhere can supply it. Returns the
 * location with the best odds so a poster asks for the errand most likely to
 * come back done.
 */
export function forageLocationFor(item: ItemID): Location | null {
    let best: Location | null = null;
    let bestChance = 0;

    for (const location of Object.values(Location)) {
        const chance = findChance(location, item);
        if (chance > bestChance) {
            best = location;
            bestChance = chance;
        }
    }

    return best;
}
