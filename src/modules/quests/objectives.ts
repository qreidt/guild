import type { ItemID } from "../items/id.ts";
import type { GoodLedger } from "../inventory/common.ts";
import { ItemRegistry } from "../items/registry.ts";
import { buildingLocation, findChance } from "../world/location.ts";
import {
    QuestStatus,
    type GatherObjective,
    type Objective,
    type ObjectiveKind,
    type ObjectiveStep,
    type Quest,
    type QuestClaimant,
} from "./common.ts";

/**
 * The resolver registry — the one place that knows how to *read* an objective.
 *
 * Objectives are inert data (see `common.ts` and ADR 0002); everything that
 * would otherwise be a method on an objective class lives here, keyed by `kind`,
 * mirroring `ItemRegistry`. Adding an objective kind is one union member plus
 * one entry in `OBJECTIVE_RESOLVERS`: the board, the claim flow and the
 * adventurer's loop never change.
 *
 * Two halves: *fulfilment* (is it done? could it ever be? does it concern this
 * item?) and *planning* (what should the claimant do next?). Both are pure
 * functions over data — nothing here reaches into the engine, and nothing here
 * mutates.
 */
export interface ObjectiveResolver<O extends Objective = Objective> {
    /** One-line board summary, e.g. "Gather 10 × Bloodroot". */
    summarize(objective: O): string;

    /**
     * Could this objective be satisfied at all, anywhere, as the world is
     * authored? False means nobody could ever fulfil it, so it must never
     * reach the board.
     */
    isObtainable(objective: O): boolean;

    /** Is it satisfied right now by this claimant's state? */
    isFulfilled(objective: O, claimant: QuestClaimant): boolean;

    /**
     * Does this objective concern `item`? It is how a poster asks the board
     * "am I already waiting on this?" without the board learning what a
     * gather objective looks like. Kinds that concern no item (a future
     * `escort`) simply answer false.
     */
    concerns(objective: O, item: ItemID): boolean;

    /**
     * What the claimant hands to the poster when the quest is settled. Kinds
     * that hand over nothing (a future `escort`) answer with an empty ledger.
     */
    delivery(objective: O): GoodLedger;

    /**
     * The next step, re-derived from live quest and claimant state every time
     * the claimant is free.
     *
     * Never a precomputed plan: a forage shift can come up short, so the number
     * of shifts is not knowable in advance and any fixed sequence would be
     * wrong by its second entry.
     */
    plan(objective: O, quest: Quest, claimant: QuestClaimant): ObjectiveStep;
}

const gatherResolver: ObjectiveResolver<GatherObjective> = {
    summarize: (objective) =>
        `Gather ${objective.quantity} × ${ItemRegistry[objective.item].name}`,

    isObtainable: (objective) => findChance(objective.location, objective.item) > 0,

    isFulfilled: (objective, claimant) =>
        claimant.inventory.getCount(objective.item) >= objective.quantity,

    concerns: (objective, item) => objective.item === item,

    delivery: (objective) => new Map([[objective.item, objective.quantity]]),

    /**
     * Go where it grows, search until you have enough, carry it back, hand it
     * over. Written as a fall-through ladder rather than a state machine
     * because there is no state to keep: every branch is a question about the
     * world right now, so an adventurer interrupted anywhere resumes correctly.
     */
    plan: (objective, quest, claimant) => {
        if (!gatherResolver.isFulfilled(objective, claimant)) {
            return claimant.location === objective.location
                ? { step: 'forage', item: objective.item, at: objective.location }
                : { step: 'travel', to: objective.location };
        }

        const handover = buildingLocation(quest.poster);

        return claimant.location === handover
            ? { step: 'deliver', to: quest.poster }
            : { step: 'travel', to: handover };
    },
};

/**
 * Method-shorthand parameters are bivariant in TypeScript (`strictFunctionTypes`
 * exempts them), so a resolver for one union member satisfies the widened entry
 * type without a cast. Dispatch is sound because the key and the value both come
 * from the same `objective.kind`.
 */
const OBJECTIVE_RESOLVERS: Record<ObjectiveKind, ObjectiveResolver> = {
    gather: gatherResolver,
};

function resolverFor(objective: Objective): ObjectiveResolver {
    return OBJECTIVE_RESOLVERS[objective.kind];
}

export function summarizeObjective(objective: Objective): string {
    return resolverFor(objective).summarize(objective);
}

export function isObjectiveObtainable(objective: Objective): boolean {
    return resolverFor(objective).isObtainable(objective);
}

export function isObjectiveFulfilled(objective: Objective, claimant: QuestClaimant): boolean {
    return resolverFor(objective).isFulfilled(objective, claimant);
}

export function objectiveConcerns(objective: Objective, item: ItemID): boolean {
    return resolverFor(objective).concerns(objective, item);
}

export function objectiveDelivery(objective: Objective): GoodLedger {
    return resolverFor(objective).delivery(objective);
}

/**
 * What the claimant should do next about `quest`.
 *
 * A settled quest short-circuits here rather than in every resolver: "is it
 * still running?" is a question about the quest's status, which no objective
 * kind has an opinion about.
 */
export function planObjective(quest: Quest, claimant: QuestClaimant): ObjectiveStep {
    if (quest.status === QuestStatus.Fulfilled) {
        return { step: 'done' };
    }

    return resolverFor(quest.objective).plan(quest.objective, quest, claimant);
}
