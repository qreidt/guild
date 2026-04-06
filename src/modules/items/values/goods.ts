import {Item} from "../item.ts";
import {GoodID} from "../../../game/common/Good.ts";

export class Lumber extends Item {
    id = GoodID.Lumber;
    name = 'Lumber';
    value = 10;
    weight = 20;
}

export class WoodPlank extends Item {
    id = GoodID.WoodPlank;
    name = 'Wood Plank';
    value = 1;
    weight = 1;
}

export class IronOre extends Item {
    id = GoodID.IronOre;
    name = 'Iron Ore';
    value = 2;
    weight = 1;
}

export class IronIngot extends Item {
    id = GoodID.IronIngot;
    name = 'Iron Ingot';
    value = 5;
    weight = 1;
}

export default {Lumber, WoodPlank, IronOre, IronIngot};