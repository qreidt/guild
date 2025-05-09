import {IronOre} from "../../common/Good.ts";
import {IronSpear, IronSword} from "../../adventurer/gear/Weapon.ts";
import {
    IronBoot,
    IronGauntlet,
    IronHelmet,
    IronMail,
    IronPants,
    IronPlate,
    IronShield
} from "../../adventurer/gear/Armor.ts";
import {BaseBuilding} from "./Building.ts";


export class BlackSmith extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [IronOre];

    constructor() {
        super();

        this.inventory.putItem(IronOre, 10);
    }

    produces = [
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronSword, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronShield, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronHelmet, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronPlate, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronMail, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronGauntlet, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronPants, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronBoot, 1]])},
        {ingredients: new Map([[IronOre, 2]]), product: new Map([[IronSpear, 1]])},
    ];
}
