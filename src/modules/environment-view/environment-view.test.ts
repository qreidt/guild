import { test } from "node:test";
import assert from "node:assert/strict";
import { activity } from "./environment-view.ts";
import { Action } from "../../game/city/buildings/common/Action.ts";

/**
 * A two-tick action that moves no goods, so `start()` opens no transaction and
 * the test touches nothing but the tick countdown. The mapper reads `static
 * name` as the `task` field, as every concrete action declares it.
 */
class TwoTick extends Action {
    static name = 'TwoTick';
    total_ticks = 2;
}

/** A different class, so a `next` assertion cannot pass on the wrong slot. */
class ThreeTick extends Action {
    static name = 'ThreeTick';
    total_ticks = 3;
}

function started(): TwoTick {
    const action = new TwoTick();
    action.start();
    return action;
}

function finished(): TwoTick {
    const action = started();
    action.tick();
    action.tick();
    return action;
}

test("a finished action with no next action on record reads finished at 100%", () => {
    assert.deepEqual(activity({ finished_action: null, active_action: finished() }), {
        task: 'TwoTick',
        progress: 1,
        status: 'finished',
        next: null,
    });
});

test("at a hand-off, the finished action reads 100% and names the started one as next", () => {
    const next = new ThreeTick();
    next.start();

    assert.deepEqual(activity({ finished_action: finished(), active_action: next }), {
        task: 'TwoTick',
        progress: 1,
        status: 'finished',
        next: 'ThreeTick',
    });
});

// The rows below pin behavior that predates this cycle. They pass from the
// moment `activity()` exists. They stay so the table stays whole.

test("a running action reads working, with its progress and no next action", () => {
    const action = started();
    action.tick();

    assert.deepEqual(activity({ finished_action: null, active_action: action }), {
        task: 'TwoTick',
        progress: 0.5,
        status: 'working',
        next: null,
    });
});

test("no action at all reads idle at 0%", () => {
    assert.deepEqual(activity({ finished_action: null, active_action: null }), {
        task: null,
        progress: 0,
        status: 'idle',
        next: null,
    });
});

test("an action that is assigned but not started clamps its pre-start sentinel to 0%", () => {
    assert.equal(activity({ finished_action: null, active_action: new TwoTick() }).progress, 0);
});
