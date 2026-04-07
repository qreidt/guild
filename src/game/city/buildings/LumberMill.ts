import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Action, TransportAction} from "./common/Action.ts";
import type {City} from "../City.ts";
import {Worker} from "./common/Worker.ts";
import {ItemID} from "../../../modules/items/id.ts";

console.log(`[LumberMill] Loaded`);

export class LumberMill extends BaseBuilding {
    static name = "LumberMill";
    static building_id = BuildingID.LumberMill;

    public level = 1;
    public money = 100;

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
        if (this.inventory.getCount(ItemID.WoodPlank) >= 80) {
            return new SellWoodAction(80);
        }

        if (this.inventory.getCount(ItemID.Lumber) > 0) {
            return new MakeWoodAction();
        }

        return new TakeDownTreeAction();
    }
}

class TakeDownTreeAction extends Action {
    static name = 'TakeDownTree';
    static building_id = BuildingID.LumberMill;
    total_ticks = 6; // 3 hours

    static input_origin = BuildingID.LumberMill;
    input = new Map([
        [ItemID.WoodPlank, 1],
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
    static name = 'MakeWood';
    static building_id = BuildingID.LumberMill;

    total_ticks = 14; // 7 hours

    static input_origin = BuildingID.LumberMill;
    static input = new Map([
        [ItemID.Lumber, 1]
    ]);

    static output_destination = BuildingID.LumberMill;
    static output = new Map([
        [ItemID.WoodPlank, 20],
    ]);

    constructor() {
        super();
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
    static name = 'SellWood';
    static building_id = BuildingID.LumberMill;

    total_ticks = 14; // 7 hours

    static input_origin = BuildingID.LumberMill;

    constructor(amount: number) {
        super();

        this.input = new Map([
            [ItemID.WoodPlank, amount],
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
