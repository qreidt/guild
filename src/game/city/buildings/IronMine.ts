import transactionService from "../../../modules/inventory/transaction.service.ts";
import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Action, TransportAction} from "./common/Action.ts";
import {Worker} from "./common/Worker.ts";
import {GoodID} from "../../common/Good.ts";

export class IronMine extends BaseBuilding {
    building_id = BuildingID.IronMine;
    level = 1;
    money = 100;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];
    }

    protected chooseNextAction(): Action {
        if (this.inventory.getCount(GoodID.IronOre) >= 80) {
            return new SellOres(80);
        }

        return new MineOres();
    }
}

class MineOres extends Action {
    name = 'MineOres';
    total_ticks = 1; // 0.5 hours
    building_id = BuildingID.IronMine;

    output_destination = BuildingID.IronMine;
    output = new Map([
        [GoodID.IronOre, 1],
    ]);

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        super.finished();
        console.debug('Iron Mine mined more ore');
        // InventoryService.putGood(BuildingID.IronMine, GoodID.IronOre, 1);
    }
}

class SellOres extends TransportAction {
    name = 'SellOres';
    total_ticks = 44; // 22 hours
    building_id = BuildingID.IronMine;

    constructor(amount: number) {
        super();

        this.input_origin = this.building_id;
        this.input = new Map([
            [GoodID.IronOre, amount],
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
