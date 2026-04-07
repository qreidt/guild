import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Action, TransportAction} from "./common/Action.ts";
import {Worker} from "./common/Worker.ts";
import {ItemID} from "../../../modules/items/id.ts";

console.log(`[IronMine] Loaded`);

export class IronMine extends BaseBuilding {
    static name = "Iron Mine";
    static building_id = BuildingID.IronMine;
    level = 1;
    money = 100;

    constructor() {
        super();

        this.setup();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];

        console.log(`[IronMine] OK`);
    }

    protected chooseNextAction(): Action {
        if (this.inventory.getCount(ItemID.IronOre) >= 80) {
            return new SellOres(80);
        }

        return new MineOres();
    }
}

class MineOres extends Action {
    static name = 'MineOres';
    static building_id = BuildingID.IronMine;
    total_ticks = 2; // 1 hours

    static input_origin = BuildingID.IronMine;
    input = new Map();

    output_destination = BuildingID.IronMine;
    output = new Map([
        [ItemID.IronOre, 1],
    ]);

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        super.finished();
        console.debug('Iron Mine mined more ore');
    }
}

class SellOres extends TransportAction {
    static name = 'SellOres';
    static building_id = BuildingID.IronMine;
    total_ticks = 14; // 7 hours

    static input_origin = BuildingID.IronMine;

    constructor(amount: number) {
        super();

        this.input = new Map([
            [ItemID.IronOre, amount],
        ]);
    }

    protected started() {
        console.debug('IronMine dispatched a transport to sell iron ore.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        super.finished();
        console.debug(`Iron Mine sold the ores for ${this.value} g.`);
    }
}
