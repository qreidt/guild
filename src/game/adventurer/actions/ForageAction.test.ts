import { test } from "node:test";
import assert from "node:assert/strict";
import { setWorldSeed } from "../../../modules/random/random.ts";
import { ItemID } from "../../../modules/items/id.ts";
import { Location } from "../../../modules/world/location.ts";
import { Adventurer } from "../Adventurer.ts";
import { ForageAction } from "./ForageAction.ts";

// Tick the action directly; the controller's timers would keep the process alive.

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
    // Seed 1 puts this adventurer's second find on the third of six ticks. The stream
    // is keyed by the adventurer's id, so keep this case first in the file.
    setWorldSeed(1);
    const adventurer = twoShort();
    const shift = new ForageAction(adventurer, ItemID.Bloodroot, Location.Forest, QUANTITY);

    shift.start();
    for (let tick = 1; tick <= 3; tick++) shift.tick();

    assert.equal(shift.isDone(), true);
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
