import City from "../city/City.ts";

export class GameController {
    public running: boolean = false;
    public tick = 0;

    public city: City;

    constructor(public auto_tick_interval: number) {
        this.city = new City(100, 500);
    }

    private timeout_id: null | number = null;
    private autoTick(interval: number = null) {
        if (this.auto_tick_interval === 0) {
            return;
        }

        this.timeout_id = setTimeout(() => this.nextTick(), (interval ?? this.auto_tick_interval) * 1000);
    }

    public nextTick(): void {
        clearTimeout(this.timeout_id);
        console.log(`[Tick: ${this.tick}] [Running: ${this.running}]`);

        if (! this.running) {
            return;
        }

        // ToDO

        this.tick++;
        this.autoTick();
    }

    public pause(): void {
        this.running = false;
        clearTimeout(this.timeout_id);
    }

    public resume(): void {
        this.running = true;
        this.autoTick(0.5);
    }
}