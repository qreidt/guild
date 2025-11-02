import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Inventory} from "../../common/Inventory.ts";
import {City} from "../City.ts";
import {Action, TransportAction} from "./common/Action.ts";
import GameControllerSingleton from "../../controllers/GameController.ts";
import {Worker} from "./common/Worker.ts";
import {GoodID} from "../../common/Good.ts";
import InventoryService from "../../../modules/inventory/inventory.service.ts";


export class IronMine extends BaseBuilding {
    name = "IronMine";
    level = 1;
    money = 100;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];
    }

    public handleTick(city: City): void {
        super.handleTick(city);
    }

    protected chooseNextAction(): Action {
        if (InventoryService.getCount(BuildingID.IronMine, GoodID.IronOre) >= 80) {
            return new SellOres(80);
        }

        return new MineOres();
    }
}

class MineOres extends Action {
    total_ticks = 1; // 0.5 hours
    building_id = BuildingID.IronMine;

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        InventoryService.putGood(BuildingID.IronMine, GoodID.IronOre, 1);
        console.debug('Iron Mine mined more ore');
    }
}

class SellOres extends TransportAction {
    total_ticks = 44; // 22 hours
    building_id = BuildingID.IronMine;

    constructor(amount: number) {
        super();

        this.action_input = new Map([
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
        this.getBuilding().money += this.value;
        console.debug(`Iron Mine sold the ores for ${this.value} g.`);
    }
}
