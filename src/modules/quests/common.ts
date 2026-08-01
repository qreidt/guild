import type { ItemID } from "../items/id.ts";
import type { InventoryAccountService } from "../inventory/inventory.service.ts";
import type { BuildingID } from "../../game/city/buildings/common/Building.ts";
import type { Location } from "../world/location.ts";

/**
 * The quest vocabulary. See `CONTEXT.md` for the words themselves — a quest is
 * **posted** by a building, **claimed** by an adventurer, and **fulfilled** when
 * its objective is satisfied. Nothing here carries behaviour.
 */

/**
 * Exactly three states, one direction of travel:
 *
 *     Open -> Claimed -> Fulfilled
 *
 * There is deliberately no `Failed`, `Abandoned` or `Expired`. Those are not
 * states, they are unanswered policy questions (does the escrowed reward unlock?
 * does the poster re-post? who eats the loss?) and nothing in the game can
 * currently generate them. The enum grows in the cycle that introduces the
 * mechanic — see ADR 0003.
 */
export enum QuestStatus {
    Open = 'Open',
    Claimed = 'Claimed',
    Fulfilled = 'Fulfilled',
}

/** Stable id of a quest for the process lifetime, e.g. `quest:7`. */
export type QuestID = string;

/** Stable id of whoever claimed a quest, e.g. `adventurer:3`. */
export type ClaimantID = string;

/**
 * What must be true of the world for a quest to count as done — a serializable
 * discriminated union, never a class. The logic that reads an objective lives in
 * the resolver registry keyed by `kind` (`objectives.ts`), so adding `hunt` when
 * combat arrives is one registry entry and the board, the claim flow and the
 * adventurer's loop are untouched. See ADR 0002.
 */
export type Objective = GatherObjective;

/**
 * Shared by every objective kind: work always happens *somewhere*, and the
 * board always shows where. Declaring it once means a new kind cannot forget
 * it, and the board can read `objective.location` off the union forever.
 */
interface ObjectiveBase {
    location: Location;
}

/** End up holding `quantity` of `item`. Says nothing about how. */
export interface GatherObjective extends ObjectiveBase {
    kind: 'gather';
    item: ItemID;
    quantity: number;
}

export type ObjectiveKind = Objective['kind'];

/** Plain, inspectable board data — no methods, no engine references. */
export interface Quest {
    id: QuestID;
    /** The building that posted it. */
    poster: BuildingID;
    /** The adventurer that claimed it; null while Open. */
    claimant: ClaimantID | null;
    objective: Objective;
    /** Gold, already debited from the poster — a posted quest is a funded one. */
    reward: number;
    status: QuestStatus;
}

/**
 * Whatever a resolver may inspect about the claimant. Kept deliberately narrow —
 * what they carry, and where they are. That is everything a gather objective
 * needs to decide both "is this done?" and "what next?", and narrow enough that
 * an `Adventurer` is not the only thing that can ever satisfy the shape.
 */
export interface QuestClaimant {
    id: ClaimantID;
    inventory: InventoryAccountService;
    /** Where they are standing right now. */
    location: Location;
}

/**
 * The next thing a claimant should do about a quest — an answer, not an order.
 *
 * Deliberately a **descriptor, not an `Action` instance**. The resolvers live in
 * `modules/`, which is framework- and engine-agnostic; constructing engine
 * actions here would drag `game/` into every quest consumer and close a real
 * import cycle (`quest.service` -> `objectives` -> `DeliverAction` ->
 * `quest.service`), a failure mode this repo has already shipped once. The
 * adventurer maps a step to an action; it never learns an objective *kind*.
 * See ADR 0006.
 *
 * The verbs are shared across objective kinds by design — a future `hunt` also
 * travels and delivers — so a new kind usually adds a resolver entry and no step.
 */
export type ObjectiveStep =
    /** Go somewhere. The only step whose cost is a distance. */
    | { step: 'travel'; to: Location }
    /** Search where you stand for one item. Repeatable; may find nothing. */
    | { step: 'forage'; item: ItemID; at: Location }
    /** Hand the objective's goods to the poster and settle the quest. */
    | { step: 'deliver'; to: BuildingID }
    /** Nothing left to do — the quest is Fulfilled. */
    | { step: 'done' };

/**
 * A money holder. Structurally identical to the market's `Wallet` and
 * interchangeable with it at every call site — declared separately so the quest
 * board does not depend on the market. Callers construct one inline over
 * whatever holds their money, as `TransportAction` and `Adventurer` already do.
 * If a third *declaration* of this shape appears, lift all three into a shared
 * module rather than importing one from another.
 */
export interface Wallet {
    get(): number;
    add(n: number): void;
}

export class QuestNotFoundError extends Error {
    constructor(id: QuestID) {
        super(`No quest '${id}' on the board`);
        this.name = 'QuestNotFoundError';
    }
}

export class QuestNotClaimableError extends Error {
    constructor(id: QuestID, status: QuestStatus) {
        super(`Quest '${id}' cannot be claimed — it is ${status}, not ${QuestStatus.Open}`);
        this.name = 'QuestNotClaimableError';
    }
}

export class QuestNotFulfillableError extends Error {
    constructor(id: QuestID, reason: string) {
        super(`Quest '${id}' cannot be fulfilled — ${reason}`);
        this.name = 'QuestNotFulfillableError';
    }
}
