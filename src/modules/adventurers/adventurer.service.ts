import { reactive } from 'vue';
import { Adventurer, AdventurerClass } from '../../game/adventurer/Adventurer.ts';
import type { ClaimantID } from '../quests/common.ts';

/**
 * The roster.
 *
 * A plain service, mirroring `questService`. Adventurers belong to no building —
 * not even the Adventurers' Guild, which is only where they and the quests meet
 * (ADR 0002) — so the roster lives here, depends on nothing, and is reachable
 * from anywhere that wants to list or tick it.
 *
 * Ticked by `GameController` as a **sibling to the city**, not from inside it.
 * Ticking adventurers from `City.handleTick()` would make them city property
 * again through the back door, which is the one thing this arrangement exists to
 * prevent.
 */
class AdventurerService {
    /**
     * Built on first access rather than at module scope, for the same reason
     * `GameController.city` is: this module sits in the engine's import cycle
     * and the singleton below is constructed while modules are still evaluating.
     * Native ESM would tolerate `new Adventurer()` here; Rollup orders the bundle
     * the other way and it lands in the class's temporal dead zone — a blank page
     * in every production build (see `185605c`). Deferring moves it past module
     * evaluation, when every class in the cycle exists.
     */
    private _roster: Adventurer[] | null = null;

    private get roster(): Adventurer[] {
        return (this._roster ??= seedRoster());
    }

    /** Everyone, in the order they joined. */
    public getAll(): readonly Adventurer[] {
        return this.roster;
    }

    public get(id: ClaimantID): Adventurer | null {
        return this.roster.find((a) => a.gid === id) ?? null;
    }

    public handleTick(): void {
        for (const adventurer of this.roster) {
            adventurer.handleTick();
        }
    }
}

/**
 * Exactly one adventurer, and deliberately the worst case: a Scout with **zero
 * herbalism proficiency**. If the loop closes for them it closes for everyone,
 * and the additive find chance is exercised at the value that would break a
 * multiplicative one from the first tick rather than the first promotion.
 *
 * Recruitment is a later cycle. Nothing here grows the roster.
 */
function seedRoster(): Adventurer[] {
    return [new Adventurer('Wren', AdventurerClass.Scout)];
}

// Reactive singleton, matching `questService`: engine writes (a location change,
// a new action, a claimed quest) flow through the Vue proxy so the roster screen
// re-renders instead of staying frozen.
export default reactive(new AdventurerService()) as AdventurerService;
