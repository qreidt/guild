import {City} from "../city/City.ts";
import {BaseBuilding, type BuildingID} from "../city/buildings/common/Building.ts";

export class GameController {
    public running: boolean = false;
    public tick = 5;

    public city: City;

    constructor(public auto_tick_interval: number) {
        this.city = new City(100, 500);
    }

    private timeout_id: null | number = null;
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

        // ToDO
        this.city.handleTick();

        this.tick++;
        this.autoTick();
    }

    public pause(): void {
        this.running = false;
        this.clearTimeout();
    }

    public resume(): void {
        this.running = true;
        this.autoTick(0.5);
    }

    private clearTimeout(): void {
        if (this.timeout_id) clearTimeout(this.timeout_id);
    }

    /**
     * If it's between 20h and 05h, it's night and some people should be sleeping.
     */
    public isNight(): boolean {
        return false;
        // const hour = this.tick % 24;
        // return hour > 20 || hour < 5;
    }

    public getBuilding(id: BuildingID): null|BaseBuilding {
        return this.city.buildings.get(id) ?? null;
    }
}

export default new GameController(2);