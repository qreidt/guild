import {BaseBuilding} from "./Building.ts";
import type City from "../City.ts";
import {$itemMap, InventoryItemIDs} from "../../common/Inventory.ts";

export class LumberMill extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [];
    produces = [
        {product: $itemMap(InventoryItemIDs.WoodPlank, 5)},
    ];

    handleTick(city: City): void {
        const _city = city;
    }
}
