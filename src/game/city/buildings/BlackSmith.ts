import {BaseBuilding} from "./common/Building.ts";
import {City} from "../City.ts";
import {GoodID} from "../../common/Good.ts";
import {Worker} from "./common/Worker.ts";
import {Action, WaitAction} from "./common/Action.ts";


export class BlackSmith extends BaseBuilding {
    level = 1;
    money = 100;

    constructor() {
        super();
        this.workers = [
            new Worker(),
            //new Worker(),
        ];
    }

    // produces = [
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronSword, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronShield, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronHelmet, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronPlate, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronMail, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronGauntlet, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronPants, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronBoot, 1)},
    //     {ingredients: $itemMap(GoodID.IronOre, 2), product: $itemMap(GoodID.IronSpear, 1)},
    // ];

    handleTick(city: City): void {
        const _city = city;
    }

    protected chooseNextAction(): Action {
        return new WaitAction();
    }
}
