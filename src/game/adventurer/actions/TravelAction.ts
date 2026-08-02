import { Action } from "../../city/buildings/common/Action.ts";
import { travelCost, type Location } from "../../../modules/world/location.ts";
// Type-only on purpose: `Adventurer` imports this module for its value, so a
// value import here would close a runtime cycle. Erased at compile time.
import type { Adventurer } from "../Adventurer.ts";

/**
 * Going somewhere. The only adventurer action whose cost is a distance.
 *
 * **Not gated on night.** An adventurer can walk home in the dark — night makes
 * searching hard, not walking. Foraging is the one thing that stalls.
 *
 * The adventurer's location changes on arrival, not departure, so someone
 * halfway to the forest is still *in town* as far as everything that asks. That
 * is the honest answer while travel is a duration rather than a position, and it
 * keeps the planner's "am I there yet?" a single comparison.
 */
export class TravelAction extends Action {
    static name = 'Travel';

    public total_ticks: number;

    constructor(
        private readonly adventurer: Adventurer,
        public readonly destination: Location,
    ) {
        super();
        this.total_ticks = travelCost(adventurer.location, destination);
    }

    protected started(): void {
        console.debug(
            `[${this.adventurer.name}] set out for the ${this.destination} ` +
            `(${this.total_ticks} ticks).`
        );
    }

    protected finished(): void {
        this.adventurer.location = this.destination;
        console.debug(`[${this.adventurer.name}] arrived at the ${this.destination}.`);
    }
}
