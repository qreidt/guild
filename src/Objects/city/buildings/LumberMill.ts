import {WoodPlank} from "../../common/Good.ts";
import {BaseBuilding} from "./Building.ts";

export class LumberMill extends BaseBuilding {
    level = 1;
    money = 100;

    buys = [];
    produces = [
        {product: new Map([[WoodPlank, 5]])}
    ];
}
