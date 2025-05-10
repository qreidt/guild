import City from "../city/City.ts";

export class GameController {
    public tick = 0;

    public city: City;

    constructor() {
        this.city = new City(100, 500);
    }

    public nextTick(): void {
        // ToDO

        this.tick++;
    }
}