import {EquippableItem} from "../item.ts";
import {ItemID} from "../id.ts";

export enum ArmorType {
    Head,
    Chest,
    Glove,
    Pants,
    Shoes,
    Shield,
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

export abstract class Armor extends EquippableItem {

    public static type: ArmorType;
    public static armor_id: ArmorID;
    public static base_armor_value: number = 0;

    public armor_value: number;

    constructor(wear: number = 0) {
        super(wear);
        this.armor_value = this.armorValue;
    }


    /** Shortcut to access static props from the subclass */
    protected get static(): typeof Armor {
        return this.constructor as typeof Armor;
    }

    /**
     *
     */
    public get armorValue(): number {
        return this.static.base_armor_value * this.degradationMultiplier;
    }
}

export class IronHelmet extends Armor {
    id = ItemID.IronHelmet;
    name = 'Iron Helmet';
    base_armor_value = 10;
    type = ArmorType.Head;
    value = 10;
    weight = 5;
}

export class IronPlate extends Armor {
    id = ItemID.IronPlate;
    name = 'Iron Plate';
    type = ArmorType.Chest;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class IronMail extends Armor {
    id = ItemID.IronMail;
    name = 'Iron Mail';
    type = ArmorType.Chest;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class IronPants extends Armor {
    id = ItemID.IronPants;
    name = 'Iron Pants';
    type = ArmorType.Pants;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class IronBoots extends Armor {
    id = ItemID.IronBoots;
    name = 'Iron Boot';
    type = ArmorType.Shoes;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class IronGauntlet extends Armor {
    id = ItemID.IronGauntlet;
    name = 'Iron Gauntlet';
    type = ArmorType.Glove;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class LeatherHelmet extends Armor {
    id = ItemID.LeatherHelmet;
    name = 'Leather Helmet';
    type = ArmorType.Head;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class LeatherChest extends Armor {
    id = ItemID.LeatherChest;
    name = 'Leather Chest';
    type = ArmorType.Chest;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class LeatherPants extends Armor {
    id = ItemID.LeatherPants;
    name = 'Leather Pants';
    type = ArmorType.Pants;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class LeatherBoots extends Armor {
    id = ItemID.LeatherBoots;
    name = 'Leather Boot';
    type = ArmorType.Shoes;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class LeatherGlove extends Armor {
    id = ItemID.LeatherGlove;
    name = 'Leather Glove';
    type = ArmorType.Glove;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class WoodShield extends Armor {
    id = ItemID.WoodShield;
    name = 'Wood Shield';
    type = ArmorType.Shield;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class ReinforcedWoodShield extends Armor {
    id = ItemID.ReinforcedWoodShield;
    name = 'Reinforced Wood Shield';
    type = ArmorType.Shield;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export class IronShield extends Armor {
    id = ItemID.IronShield;
    name = 'Iron Shield';
    type = ArmorType.Shield;
    base_armor_value = 10;
    value = 10;
    weight = 5;
}

export const ArmorRegistry: Record<ArmorID, new () => Armor> = {
    [ArmorID.IronHelmet]: IronHelmet,
    [ArmorID.IronPlate]: IronPlate,
    [ArmorID.IronMail]: IronMail,
    [ArmorID.IronPants]: IronPants,
    [ArmorID.IronBoot]: IronBoots,
    [ArmorID.IronGauntlet]: IronGauntlet,
    [ArmorID.LeatherHelmet]: LeatherHelmet,
    [ArmorID.LeatherChest]: LeatherChest,
    [ArmorID.LeatherPants]: LeatherPants,
    [ArmorID.LeatherBoot]: LeatherBoots,
    [ArmorID.LeatherGlove]: LeatherGlove,
    [ArmorID.WoodShield]: WoodShield,
    [ArmorID.ReinforcedWoodShield]: ReinforcedWoodShield,
    [ArmorID.IronShield]: IronShield,
} as const;

export default {
    IronHelmet,
    IronPlate,
    IronMail,
    IronPants,
    IronBoots,
    IronGauntlet,
    LeatherHelmet,
    LeatherChest,
    LeatherPants,
    LeatherBoots,
    LeatherGlove,
    WoodShield,
    ReinforcedWoodShield,
    IronShield,
};