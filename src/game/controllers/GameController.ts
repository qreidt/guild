import {City} from "../city/City.ts";
import {BaseBuilding, type BuildingID} from "../city/buildings/common/Building.ts";
import adventurerService from "../../modules/adventurers/adventurer.service.ts";

console.log(`[GameController] Loaded`);

const autoTickInterval = 1;

export class GameController {
    public running: boolean = false;
    public tick = 0;

    // Built on first access rather than in the constructor. This module sits in an
    // import cycle (GameController -> City -> LumberMill/IronMine/Action/market.service
    // -> GameController), and the singleton below is constructed at module scope. Native
    // ESM evaluates City first so a constructor call would be safe in dev, but Rollup
    // orders the bundle the other way and `new City()` then hits City's temporal dead
    // zone — a blank page in every production build. Deferring the call moves it past
    // module evaluation, where every class in the cycle is initialised.
    private _city: City | null = null;
    public get city(): City {
        return (this._city ??= new City(100, 500));
    }

    constructor(public auto_tick_interval: number) {
        console.log(`[GameController] OK`);
    }

    private timeout_id: null | ReturnType<typeof setTimeout> = null;
    private autoTick(interval: null|number = null) {
        if (this.auto_tick_interval === 0) {
            return;
        }

        this.timeout_id = setTimeout(() => this.nextTick(), (interval ?? this.auto_tick_interval) * 1000);
    }

    public nextTick(force: boolean = false): void {
        this.clearTimeout();

        console.debug(`[Tick: ${this.tick}] [Running: ${this.running}] [Night: ${this.isNight() ? 'true' : 'false'}]`);

        if (! this.running && ! force) {
            return;
        }

        this.city.handleTick();

        // A sibling to the city, not a part of it: adventurers are inhabitants
        // of the world, not city property, and ticking them from inside
        // `City.handleTick()` would smuggle that dependency back in.
        //
        // After the city, so a quest posted this tick is on the board before
        // anyone looks at it — the board should never be a tick stale.
        adventurerService.handleTick();

        this.tick++;
        this.autoTick();
    }

    public pause(): void {
        this.running = false;
        this.clearTimeout();
    }

    public resume(): void {
        this.running = true;
        this.autoTick(autoTickInterval);
    }

    private clearTimeout(): void {
        if (this.timeout_id) clearTimeout(this.timeout_id);
    }

    /**
     * If it's between 20h and 05h, it's night and some people should be sleeping.
     *
     * Still inert — it returns `false` unconditionally. The commented body is
     * corrected to a 48-tick day (one tick is 30 minutes, ADR 0001; it used to
     * read `% 24`, which never ran) so that switching the cycle on is a one-line
     * change. It is not free: every `LumberMill` and `IronMine` action already
     * guards on `shouldTick(): !isNight()`, so enabling it costs those two
     * buildings ~37% of their output (18 of 48 ticks) the moment it happens.
     */
    public isNight(): boolean {
        return false;
        // const hour = (this.tick % 48) / 2;
        // return hour > 20 || hour < 5;
    }

    public getBuilding(id: BuildingID): null|BaseBuilding {
        return this.city.buildings.get(id) ?? null;
    }
}

export default new GameController(autoTickInterval);