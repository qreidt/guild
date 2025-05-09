import {IronOre} from "../../common/Good.ts";
import {BaseBuilding} from "./Building.ts";


export class IronMine extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [];
    produces = [
        {product: new Map([[IronOre, 2]])}
    ];
}
