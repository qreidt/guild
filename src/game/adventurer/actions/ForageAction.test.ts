import { test } from "node:test";
import assert from "node:assert/strict";
import { setWorldSeed } from "../../../modules/random/random.ts";
import { ItemID } from "../../../modules/items/id.ts";
import { Location } from "../../../modules/world/location.ts";
import { Adventurer } from "../Adventurer.ts";
import { ForageAction } from "./ForageAction.ts";

// The engine seam agreed for this cycle: one shift, ticked directly, never through
// the game controller (its timers would keep the process alive). Each case takes a
// fresh adventurer, so the cases share no stock and no stream.

const HELD = 8;
const QUANTITY = 10;

/** An adventurer standing at the Forest, two Bloodroot short of a quest for ten. */
function twoShort(): Adventurer {
    const adventurer = new Adventurer("Test");
    adventurer.location = Location.Forest;
    adventurer.inventory.putGood(ItemID.Bloodroot, HELD);
    return adventurer;
}

test("a capped shift finishes in the tick the adventurer holds the quantity", () => {
    // Seed 1 gives this adventurer its second find on the third tick. The stream is
    // keyed by the adventurer's gid, so this case must construct the process's first
    // adventurer: keep it the first case in this file. A different seed, or a
    // different gid, is a different test, not a flaky one.
    setWorldSeed(1);
    const adventurer = twoShort();
    const shift = new ForageAction(adventurer, ItemID.Bloodroot, Location.Forest, QUANTITY);

    shift.start();
    let ticks = 0;
    while (!shift.isDone() && ticks < shift.total_ticks) {
        shift.tick();
        ticks++;
    }

    assert.equal(shift.isDone(), true);
    assert.ok(ticks < shift.total_ticks, `finished after ${ticks} ticks, not early`);
    assert.equal(adventurer.inventory.getCount(ItemID.Bloodroot), QUANTITY);
});

test("a shift without a count runs its full length", () => {
    setWorldSeed(1);
    const adventurer = twoShort();
    const shift = new ForageAction(adventurer, ItemID.Bloodroot, Location.Forest);

    shift.start();
    for (let tick = 1; tick < shift.total_ticks; tick++) {
        shift.tick();
    }
    assert.equal(shift.isDone(), false, "finished before the last tick");

    shift.tick();

    assert.equal(shift.isDone(), true);
    assert.equal(adventurer.inventory.getCount(ItemID.Bloodroot), HELD + shift.found);
});
