import {BaseBuilding, BuildingID} from "./common/Building.ts";
import {$itemMap, Inventory, InventoryItemIDs} from "../../common/Inventory.ts";
import {City} from "../City.ts";
import {Action, TransportAction} from "./common/Action.ts";
import GameControllerSingleton from "../../controllers/GameController.ts";
import {Worker} from "./common/Worker.ts";
import {GoodID} from "../../common/Good.ts";

export class IronMine extends BaseBuilding {
    name = "IronMine";
    level = 1;
    money = 100;

    // buys = [];
    // produces = [
    //     {product: $itemMap(GoodID.IronOre, 2)}
    // ];

    // private transport_amount = 50;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];
    }

    public handleTick(city: City): void {

        // const iron_count = this.inventory.getItem(InventoryItemIDs.IronOre);
        // if (iron_count >= this.transport_amount) {
        //     city.transportService.newTransport({
        //         origin: this,
        //         destination: city,
        //         ticks_remaining: 1,
        //         content: this.inventory.retrieveIntoNew(
        //             {[InventoryItemIDs.IronOre]: iron_count}
        //         )
        //     });
        // }
        //
        // // Mine iron at the end of every tick
        // this.produce(0);

        super.handleTick(city);
    }

    protected chooseNextAction(): Action {
        if (this.inventory.getItem(GoodID.IronOre) >= 80) {
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
        this.getBuilding().inventory.putItem(GoodID.IronOre, 1);
        console.debug('Iron Mine mined more ore');
    }
}

class SellOres extends TransportAction {
    total_ticks = 44; // 22 hours
    building_id = BuildingID.IronMine;

    constructor(amount: number) {
        super();

        this.action_input = new Inventory(new Map([
            [GoodID.IronOre, amount],
        ]));
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
