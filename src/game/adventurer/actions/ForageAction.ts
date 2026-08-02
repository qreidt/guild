import gameController from "../../controllers/GameController.ts";
import { Action } from "../../city/buildings/common/Action.ts";
import transactionService from "../../../modules/inventory/transaction.service.ts";
import type { ItemID } from "../../../modules/items/id.ts";
import { findChance, type Location } from "../../../modules/world/location.ts";
// Type-only on purpose — see the note in `TravelAction.ts`.
import type { Adventurer } from "../Adventurer.ts";

/** One shift of searching: three hours, then you take stock of what you have. */
const FORAGE_SHIFT_TICKS = 6;

/**
 * How much skill is worth per attempt. Both bonuses are **added** to the
 * location's base chance, never multiplied by it.
 *
 * That is the whole rule and it is load-bearing: a fresh adventurer has zero
 * herbalism, so a multiplicative formula gives them a find chance of exactly
 * zero — they search forever, the quest never completes, and nothing errors. A
 * novice must be slow, not incapable.
 */
const HERBALISM_FIND_BONUS = 0.02;
const PERCEPTION_FIND_BONUS = 0.01;

/** Searching is never a certainty, however skilled the searcher. */
const MAX_FIND_CHANCE = 0.95;

/** Foraging by touch and lantern-light. Applied only when night is switched on. */
const NIGHT_FIND_PENALTY = 0.5;

/** Below this herbalism, an adventurer waits out the night rather than searching. */
const NIGHT_FORAGE_HERBALISM = 3;

/** Whatever the find chance reads off a forager. Narrow so it is easy to sample. */
export interface Forager {
    proficiency_herbalism: number;
    attribute_perception: number;
}

/** May this forager work after dark at all? */
export function canForageAtNight(forager: Forager): boolean {
    return forager.proficiency_herbalism >= NIGHT_FORAGE_HERBALISM;
}

/**
 * The chance to find one unit on one attempt, in [0, MAX_FIND_CHANCE].
 *
 * Base comes from the location/item pair — how hard it is to find *this* *here*,
 * never a property of the item. Skill is added on top.
 */
export function forageFindChance(
    location: Location,
    item: ItemID,
    forager: Forager,
    night: boolean = false,
): number {
    const base = findChance(location, item);
    if (base <= 0) return 0;

    const chance =
        base +
        forager.proficiency_herbalism * HERBALISM_FIND_BONUS +
        forager.attribute_perception * PERCEPTION_FIND_BONUS;

    return Math.min(MAX_FIND_CHANCE, night ? chance * NIGHT_FIND_PENALTY : chance);
}

/**
 * Searching a location for one item, over a fixed shift.
 *
 * **Rolls once per tick**, so progress is smooth and visible rather than a
 * single verdict at the end, and a shift that comes up short simply leads to
 * another shift — a bad roll costs time, never the quest.
 *
 * **Settlement is deferred.** A per-tick roll does not know its yield until the
 * shift ends, so this creates no transaction at start (there is no input to
 * escrow) and creates *and* commits one in `finished()`, once the total is
 * known. The alternative — opening a transaction up front and topping up its
 * goods map as finds come in — would appear to work only because the
 * transaction store keeps the same map reference it was handed, which is exactly
 * the implicit coupling that has produced bugs here before.
 *
 * Night is the existing global check every LumberMill and IronMine action
 * already guards on, not a second daylight rule. It still returns false
 * unconditionally, so none of this runs in play yet; flipping it turns night on
 * for buildings and foraging together, in one place.
 */
export class ForageAction extends Action {
    static name = 'Forage';

    public total_ticks = FORAGE_SHIFT_TICKS;

    /** Units found this shift. Zero until the first lucky tick; often zero. */
    public found = 0;

    constructor(
        private readonly adventurer: Adventurer,
        public readonly item: ItemID,
        public readonly location: Location,
    ) {
        super();
        this.output_destination = adventurer.gid;
    }

    /**
     * Night **stalls** the shift for a novice: ticks stop counting down, so they
     * wait out the dark at the forest and resume at dawn, losing time rather
     * than progress. Night is an inconvenience, not a punishment.
     */
    protected shouldTick(): boolean {
        return !gameController.isNight() || canForageAtNight(this.adventurer);
    }

    protected afterTick(): void {
        const chance = forageFindChance(
            this.location,
            this.item,
            this.adventurer,
            gameController.isNight(),
        );

        if (this.adventurer.random.chance(chance)) {
            this.found++;
        }
    }

    protected finished(): void {
        console.debug(
            `[${this.adventurer.name}] searched the ${this.location} and found ` +
            `${this.found} × ${this.item}.`
        );

        if (this.found <= 0) return;

        this.output = new Map([[this.item, this.found]]);

        // Origin null: foraged goods come from the world, not another account.
        const transaction_id = transactionService.createTransaction(
            null,
            this.output_destination!,
            null,
            { stacks: new Map(this.output) },
        );

        transactionService.commitTransaction(transaction_id);
    }
}
