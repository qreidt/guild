import {Item} from "../item.ts";
import {ItemID} from "../id.ts";

export class Lumber extends Item {
    static id = ItemID.Lumber;
    static name = 'Lumber';
    static value = 10;
    static weight = 20;
}

export class WoodPlank extends Item {
    static id = ItemID.WoodPlank;
    static name = 'Wood Plank';
    static value = 1;
    static weight = 1;
}

export class IronOre extends Item {
    static id = ItemID.IronOre;
    static name = 'Iron Ore';
    static value = 2;
    static weight = 1;
}

export class IronIngot extends Item {
    static id = ItemID.IronIngot;
    static name = 'Iron Ingot';
    static value = 5;
    static weight = 1;
}

export default {Lumber, WoodPlank, IronOre, IronIngot};