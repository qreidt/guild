import {EquippableItem} from "./EquippableItem.ts";

export enum ArmorType {
    Head,
    Chest,
    Glove,
    Pants,
    Shoes,
}

export abstract class BaseArmor extends EquippableItem {
    public abstract readonly type: ArmorType;
    public abstract readonly base_armor_value: number;

    public readonly armor_value: number;
    public readonly max_durability: number = 100;

    constructor() {
        super();
        this.armor_value = this.armorValue;
    }

    /**
     *
     */
    public get armorValue() {
        return this.base_armor_value * this.degradationMultiplier;
    }
}


export class IronHelmet extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Head;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronPlate extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Chest;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronMail extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Chest;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronPants extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Pants;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronBoot extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Shoes;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronGauntlet extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Glove;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherHelmet extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Head;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherChest extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Chest;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherPants extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Pants;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherBoot extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Shoes;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherGlove extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Glove;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}


export class WoodShield extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Glove;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class ReinforcedWoodShield extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Glove;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronShield extends BaseArmor {
    public readonly value = 10;
    public readonly type = ArmorType.Glove;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}


