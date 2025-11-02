import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {Inventory} from "../../common/Inventory.ts";
import {Action, TransportAction} from "./common/Action.ts";
import type {City} from "../City.ts";
import {Worker} from "./common/Worker.ts";
import {GoodID} from "../../common/Good.ts";
import InventoryService from "../../../modules/inventory/inventory.service.ts";

export class LumberMill extends BaseBuilding {
    name = "LumberMill";
    level = 1;
    money = 100;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];
    }

    handleTick(city: City) {
        super.handleTick(city);
    }

    protected chooseNextAction(): Action {
        if (this.inventory.getItem(GoodID.WoodPlank) >= 80) {
            return new SellWoodAction(80);
        }

        if (this.inventory.getItem(GoodID.Lumber) > 0) {
            return new MakeWoodAction();
        }

        return new TakeDownTreeAction();
    }
}

class TakeDownTreeAction extends Action {
    total_ticks = 6; // 3 hours
    building_id = BuildingID.LumberMill;

    protected started() {
        console.debug('LumberMill started chopping a new tree');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        InventoryService.putGood(this.building_id, GoodID.Lumber, 1);
        console.debug('LumberMill finished making lumber.');
    }
}

class MakeWoodAction extends Action {
    total_ticks = 14; // 7 hours
    building_id = BuildingID.LumberMill;

    constructor() {
        super();

        this.action_input = new Inventory(new Map([
            [GoodID.Lumber, 1]
        ]));
    };

    protected started() {
        console.debug('LumberMill started chopping lumber into wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        InventoryService.putGood(this.building_id, GoodID.WoodPlank, 20);
        console.debug('LumberMill finished making wood.');
    }
}

class SellWoodAction extends TransportAction {
    total_ticks = 44; // 22 hours
    building_id = BuildingID.LumberMill;

    constructor(amount: number) {
        super();

        this.action_input = new Inventory(new Map([
            [GoodID.WoodPlank, amount],
        ]));
    }

    protected started() {
        console.debug('LumberMill dispatched a transport to sell wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        this.getBuilding().money += this.value;
        console.debug(`LumberMill sold the wood for ${this.value} g.`);
    }
}
