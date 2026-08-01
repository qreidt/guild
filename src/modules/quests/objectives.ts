import type { ItemID } from "../items/id.ts";
import { ItemRegistry } from "../items/registry.ts";
import { findChance } from "../world/location.ts";
import type { GatherObjective, Objective, ObjectiveKind, QuestClaimant } from "./common.ts";

/**
 * The resolver registry — the one place that knows how to *read* an objective.
 *
 * Objectives are inert data (see `common.ts` and ADR 0002); everything that
 * would otherwise be a method on an objective class lives here, keyed by `kind`,
 * mirroring `ItemRegistry`. Adding an objective kind is one union member plus
 * one entry in `OBJECTIVE_RESOLVERS`: the board, the claim flow and the
 * adventurer's loop never change.
 *
 * Phase 1 ships the *fulfilment* half. `plan()` — turning an objective into the
 * next `Action` an adventurer takes — is Phase 2's addition to this same
 * interface.
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
}

const gatherResolver: ObjectiveResolver<GatherObjective> = {
    summarize: (objective) =>
        `Gather ${objective.quantity} × ${ItemRegistry[objective.item].name}`,

    isObtainable: (objective) => findChance(objective.location, objective.item) > 0,

    isFulfilled: (objective, claimant) =>
        claimant.inventory.getCount(objective.item) >= objective.quantity,

    concerns: (objective, item) => objective.item === item,
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
