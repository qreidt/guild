import {BaseBuilding} from "./common/Building.ts";
import {$itemMap} from "../../common/Inventory.ts";
import {InventoryItemIDs as ItemID} from "../../common/Inventory.ts";
import {City} from "../City.ts";


export class BlackSmith extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [ItemID.IronOre];

    constructor() {
        super();

        this.inventory.putItem(ItemID.IronOre, 10);
    }

    produces = [
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronSword, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronShield, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronHelmet, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronPlate, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronMail, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronGauntlet, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronPants, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronBoot, 1)},
        {ingredients: $itemMap(ItemID.IronOre, 2), product: $itemMap(ItemID.IronSpear, 1)},
    ];

    handleTick(city: City): void {
        const _city = city;
    }

    protected chooseNextAction(): void {
        //
    }
}
