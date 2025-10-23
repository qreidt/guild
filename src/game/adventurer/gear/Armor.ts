import {EquippableItem} from "./EquippableItem.ts";
import type {IEquippableItem} from "./EquippableItem.ts";

export enum ArmorType {
    Head,
    Chest,
    Glove,
    Pants,
    Shoes,
    Shield,
}

export interface IArmor extends IEquippableItem {
    type: ArmorType;
    base_armor_value: number;
}

export class Armor extends EquippableItem implements Partial<IArmor> {
    public readonly base_armor_value: number = 0;

    public armor_value: number;

    constructor(wear: number = 0) {
        super(wear);
        this.armor_value = this.armorValue;
    }

    /**
     *
     */
    public get armorValue(): number {
        return this.base_armor_value * this.degradationMultiplier;
    }
}

export enum ArmorID {
    IronHelmet,
    IronPlate,
    IronMail,
    IronPants,
    IronBoot,
    IronGauntlet,
    LeatherHelmet,
    LeatherChest,
    LeatherPants,
    LeatherBoot,
    LeatherGlove,
    WoodShield,
    ReinforcedWoodShield,
    IronShield,
}

export class IronHelmet extends Armor implements IArmor {
    public readonly type = ArmorType.Head;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronPlate extends Armor implements IArmor {
    public readonly type = ArmorType.Chest;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronMail extends Armor implements IArmor {
    public readonly type = ArmorType.Chest;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronPants extends Armor implements IArmor {
    public readonly type = ArmorType.Pants;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronBoot extends Armor implements IArmor {
    public readonly type = ArmorType.Shoes;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronGauntlet extends Armor implements IArmor {
    public readonly type = ArmorType.Glove;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherHelmet extends Armor implements IArmor {
    public readonly type = ArmorType.Head;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherChest extends Armor implements IArmor {
    public readonly type = ArmorType.Chest;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherPants extends Armor implements IArmor {
    public readonly type = ArmorType.Pants;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherBoot extends Armor implements IArmor {
    public readonly type = ArmorType.Shoes;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class LeatherGlove extends Armor implements IArmor {
    public readonly type = ArmorType.Glove;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class WoodShield extends Armor implements IArmor {
    public readonly type = ArmorType.Shield;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class ReinforcedWoodShield extends Armor implements IArmor {
    public readonly type = ArmorType.Shield;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export class IronShield extends Armor implements IArmor {
    public readonly type = ArmorType.Shield;
    public readonly value = 10;
    public readonly base_armor_value = 10;
    public readonly weight = 5;
}

export const AvailableArmors: Record<ArmorID, IArmor> = {
    [ArmorID.IronHelmet]: new IronHelmet(),
    [ArmorID.IronPlate]: new IronPlate(),
    [ArmorID.IronMail]: new IronMail(),
    [ArmorID.IronPants]: new IronPants(),
    [ArmorID.IronBoot]: new IronBoot(),
    [ArmorID.IronGauntlet]: new IronGauntlet(),
    [ArmorID.LeatherHelmet]: new LeatherHelmet(),
    [ArmorID.LeatherChest]: new LeatherChest(),
    [ArmorID.LeatherPants]: new LeatherPants(),
    [ArmorID.LeatherBoot]: new LeatherBoot(),
    [ArmorID.LeatherGlove]: new LeatherGlove(),
    [ArmorID.WoodShield]: new WoodShield(),
    [ArmorID.ReinforcedWoodShield]: new ReinforcedWoodShield(),
    [ArmorID.IronShield]: new IronShield(),
} as const;

