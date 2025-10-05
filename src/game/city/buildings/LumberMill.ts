import GameControllerSingleton from "../../controllers/GameController.ts";
import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {$itemMap, $itemsMap, InventoryItemIDs} from "../../common/Inventory.ts";
import {BaseAction} from "./common/BaseAction.ts";
import type {City} from "../City.ts";
import {Worker} from "./common/worker.ts";

export class LumberMill extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [];
    produces = [
        {product: $itemMap(InventoryItemIDs.WoodPlank, 5)},
    ];

    constructor() {
        super();
        this.workers = [
            new Worker(),
            new Worker(),
        ];
    }

    handleTick(_city: City) {
        super.handleTick(_city);
    }

    protected chooseNextAction(): BaseAction {
        if (this.inventory.getItem(InventoryItemIDs.WoodPlank) >= 80) {
            return new SellWoodAction(80);
        }

        if (this.inventory.getItem(InventoryItemIDs.Lumber) > 0) {
            return new MakeWoodAction();
        }

        return new TakeDownTreeAction();
    }
}

class TakeDownTreeAction extends BaseAction {
    //total_ticks = 6; // 3 hours
    total_ticks = 2; // 3 hours
    building_id = BuildingID.LumberMill;

    protected started() {
        console.debug('LumberMill started chopping a new tree');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        this.getBuilding().inventory.putItem(InventoryItemIDs.Lumber, 1);
        console.debug('LumberMill finished making lumber.');
    }
}

class MakeWoodAction extends BaseAction {
    //total_ticks = 14; // 7 hours
    total_ticks = 2; // 7 hours
    building_id = BuildingID.LumberMill;

    action_input = new Map([
        [InventoryItemIDs.Lumber, 1]
    ]);

    protected started() {
        console.debug('LumberMill started chopping lumber into wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        this.getBuilding().inventory.putItem(InventoryItemIDs.WoodPlank, 20);
        console.debug('LumberMill finished making wood.');
    }
}

class SellWoodAction extends BaseAction {
    //total_ticks = 44; // 22 hours
    total_ticks = 10; // 22 hours
    building_id = BuildingID.LumberMill;

    constructor(amount: number) {
        super();

        this.action_input = new Map([
            [InventoryItemIDs.WoodPlank, amount],
        ]);
    }

    protected started() {
        console.debug('LumberMill dispatched a transport to sell wood.');
    }

    protected shouldTick(): boolean {
        return ! GameControllerSingleton.isNight();
    }

    protected finished() {
        this.getBuilding().inventory.putItem(InventoryItemIDs.WoodPlank, 20);
        console.debug('LumberMill sold the wood.');
    }
}
