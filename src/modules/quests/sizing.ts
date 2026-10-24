/**
 * How big a gather quest should be.
 *
 * Pure policy over numbers — no engine, no building, no item lookup. It lives
 * here rather than on the Apothecary for two reasons: sizing an errand is a
 * question about quests, not about apothecaries, and a building module cannot
 * be imported on its own. `Action.ts`, `Building.ts` and `City.ts` form an
 * import cycle, so entering the graph at a building throws "Cannot access
 * 'Action' before initialization" before a line runs. Keeping this here is what
 * makes it testable.
 */

/**
 * The least a gather quest may be worth, in gold.
 *
 * One floor instead of a quantity authored per ingredient. It exists because a
 * reward is the ingredient's own value per unit: a quest for 3 kelp would pay
 * 3g, which is not worth the walk to the forest and back. Raising this makes
 * every errand both bigger and better paid.
 */
export const MIN_QUEST_VALUE = 20;

/**
 * How many units to ask for: the smallest multiple of `recipe_amount` whose
 * value reaches `MIN_QUEST_VALUE`.
 *
 * A multiple of the recipe amount so nothing is stranded after the last batch —
 * 21 kelp is exactly 7 soaps, where 20 would leave 2 on the shelf with no third
 * kelp coming. The ceiling rounds the *multiplier*, never the value, so an
 * ingredient already worth the floor on its own is asked for once rather than
 * twenty times.
 */
export function gatherQuantityFor(unit_value: number, recipe_amount: number): number {
    return Math.ceil(MIN_QUEST_VALUE / (unit_value * recipe_amount)) * recipe_amount;
}
