import { test } from "node:test";
import assert from "node:assert/strict";
import { ItemID } from "../items/id.ts";
import { ItemRegistry } from "../items/registry.ts";
import { MIN_QUEST_VALUE, gatherQuantityFor } from "./sizing.ts";

// Pure: no building, no controller, no seed. The Apothecary's rotation and its
// one-sell guard are engine behaviour and are verified by the console trace
// instead — see the cycle's R11.2. They cannot be tested here, because
// importing a building module throws on the Action/Building/City import cycle.

/** Every ingredient the Apothecary quests for: recipe amount, expected quantity. */
const RECIPES: ReadonlyArray<[ItemID, number, number]> = [
    [ItemID.Kelp, 3, 21],
    [ItemID.Mint, 1, 20],
    [ItemID.CarrageenMoss, 2, 10],
    [ItemID.WillowBark, 2, 10],
    [ItemID.SphagnumMoss, 2, 10],
    [ItemID.PineResin, 2, 8],
    [ItemID.ValerianRoot, 2, 6],
    [ItemID.Sulfur, 2, 4],
    // The two potion herbs run through the same rule, which is the point of
    // deriving it — one table, one pricing rule. This is what moved them from
    // 10 Bloodroot at 45g to 9 at 27g.
    [ItemID.Bloodroot, 3, 9],
    [ItemID.Manabloom, 3, 9],
];

test("every ingredient gets the quantity the cycle authored", () => {
    for (const [item, recipe_amount, expected] of RECIPES) {
        assert.equal(
            gatherQuantityFor(ItemRegistry[item].value, recipe_amount),
            expected,
            `${item} at value ${ItemRegistry[item].value}, recipe ${recipe_amount}`,
        );
    }
});

test("every quest reaches the floor and leaves nothing over", () => {
    for (const [item, recipe_amount] of RECIPES) {
        const value = ItemRegistry[item].value;
        const quantity = gatherQuantityFor(value, recipe_amount);

        assert.ok(
            quantity * value >= MIN_QUEST_VALUE,
            `${item} pays ${quantity * value}g, under the ${MIN_QUEST_VALUE}g floor`,
        );
        assert.equal(
            quantity % recipe_amount,
            0,
            `${item} strands ${quantity % recipe_amount} after the last batch`,
        );
    }
});

test("an ingredient already worth the floor is asked for once, not twenty times", () => {
    // The ceiling rounds the multiplier, not the value.
    assert.equal(gatherQuantityFor(MIN_QUEST_VALUE, 1), 1);
    assert.equal(gatherQuantityFor(MIN_QUEST_VALUE * 5, 1), 1);
});

test("a quantity is never less than one batch, however valuable the ingredient", () => {
    assert.equal(gatherQuantityFor(1000, 2), 2);
});
