import {BaseBuilding} from "./common/Building.ts";
import {$itemMap, InventoryItemIDs} from "../../common/Inventory.ts";
import {City} from "../City.ts";


export class IronMine extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [];
    produces = [
        {product: $itemMap(InventoryItemIDs.IronOre, 2)}
    ];

    private transport_amount = 50;

    public handleTick(city: City): void {

        const iron_count = this.inventory.getItem(InventoryItemIDs.IronOre);
        if (iron_count >= this.transport_amount) {
            city.transportService.newTransport({
                origin: this,
                destination: city,
                ticks_remaining: 1,
                content: this.inventory.retrieveIntoNew(
                    {[InventoryItemIDs.IronOre]: iron_count}
                )
            });
        }

        // Mine iron at the end of every tick
        this.produce(0);
    }

    protected chooseNextAction(): void {
        //
    }
}
