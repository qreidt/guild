import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Action, TransportAction} from "./common/Action.ts";
import type {City} from "../City.ts";
import {Worker} from "./common/Worker.ts";
import {GoodID} from "../../common/Good.ts";

console.log(`[LumberMill] Loaded`);

export class LumberMill extends BaseBuilding {
    public name = "LumberMill";
    public level = 1;
    public money = 100;

    public building_id = BuildingID.LumberMill;

    constructor() {
        super();

        this.setup();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];

        console.log(`[LumberMill] OK`);
    }

    handleTick(city: City) {
        super.handleTick(city);
    }

    protected chooseNextAction(): Action {
        if (this.inventory.getCount(GoodID.WoodPlank) >= 80) {
            return new SellWoodAction(80);
        }

        if (this.inventory.getCount(GoodID.Lumber) > 0) {
            return new MakeWoodAction();
        }

        return new TakeDownTreeAction();
    }
}

class TakeDownTreeAction extends Action {
    total_ticks = 6; // 3 hours
    building_id = BuildingID.LumberMill;

    input_origin = BuildingID.LumberMill;
    input = new Map([
        [GoodID.WoodPlank, 1],
    ]);

    protected started() {
        console.debug('LumberMill started chopping a new tree');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        console.debug('LumberMill finished making lumber.');
    }
}

class MakeWoodAction extends Action {
    total_ticks = 14; // 7 hours
    building_id = BuildingID.LumberMill;

    constructor() {
        super();

        this.input_origin = this.building_id;
        this.output_destination = this.building_id;
        this.input = new Map([
            [GoodID.Lumber, 1]
        ]);
        this.output = new Map([
            [GoodID.WoodPlank, 20],
        ]);
    };

    protected started() {
        console.debug('LumberMill started chopping lumber into wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        console.debug('LumberMill finished making wood.');
    }
}

class SellWoodAction extends TransportAction {
    total_ticks = 44; // 22 hours
    building_id = BuildingID.LumberMill;

    constructor(amount: number) {
        super();

        this.input_origin = this.building_id;
        this.input = new Map([
            [GoodID.WoodPlank, amount],
        ]);
    }

    protected started() {
        console.debug('LumberMill dispatched a transport to sell wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        super.finished();
        console.debug(`LumberMill sold the wood for ${this.value} g.`);
    }
}
