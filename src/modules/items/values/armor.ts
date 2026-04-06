import {EquippableItem, type IItem, Item} from "../item.ts";
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
}

export interface IArmor extends IItem {
    type: ArmorType;
    armor_id: ArmorID;
    base_armor_value: number;
    new (...args: any[]): Armor;
}

export abstract class Armor extends EquippableItem {

    public armor_value: number;

    constructor(wear: number = 0) {
        super(wear);
        this.armor_value = this.armorValue;
    }

    /** Shortcut to access static props from the subclass */
    protected get static(): IArmor {
        return this.constructor as unknown as IArmor;
    }

    /**
     *
     */
    public get armorValue(): number {
        return this.static.base_armor_value * this.degradationMultiplier;
    }
}

export class IronHelmet extends Armor {
    static id = ItemID.IronHelmet;
    static armor_id = ArmorID.IronHelmet;
    static name = 'Iron Helmet';
    static base_armor_value = 10;
    static type = ArmorType.Head;
    static value = 10;
    static weight = 5;
}

export class IronPlate extends Armor {
    static id = ItemID.IronPlate;
    static armor_id = ArmorID.IronPlate;
    static name = 'Iron Plate';
    static type = ArmorType.Chest;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class IronMail extends Armor {
    static id = ItemID.IronMail;
    static armor_id = ArmorID.IronMail;
    static name = 'Iron Mail';
    static type = ArmorType.Chest;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class IronPants extends Armor {
    static id = ItemID.IronPants;
    static armor_id = ArmorID.IronPants;
    static name = 'Iron Pants';
    static type = ArmorType.Pants;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class IronBoots extends Armor {
    static id = ItemID.IronBoots;
    static armor_id = ArmorID.IronBoots;
    static name = 'Iron Boot';
    static type = ArmorType.Shoes;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class IronGauntlet extends Armor {
    static id = ItemID.IronGauntlet;
    static armor_id = ArmorID.IronGauntlet;
    static name = 'Iron Gauntlet';
    static type = ArmorType.Glove;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class LeatherHelmet extends Armor {
    static id = ItemID.LeatherHelmet;
    static armor_id = ArmorID.LeatherHelmet;
    static name = 'Leather Helmet';
    static type = ArmorType.Head;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class LeatherChest extends Armor {
    static id = ItemID.LeatherChest;
    static armor_id = ArmorID.LeatherChest;
    static name = 'Leather Chest';
    static type = ArmorType.Chest;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class LeatherPants extends Armor {
    static id = ItemID.LeatherPants;
    static armor_id = ArmorID.LeatherPants;
    static name = 'Leather Pants';
    static type = ArmorType.Pants;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class LeatherBoots extends Armor {
    static id = ItemID.LeatherBoots;
    static armor_id = ArmorID.LeatherBoots;
    static name = 'Leather Boot';
    static type = ArmorType.Shoes;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class LeatherGlove extends Armor {
    static id = ItemID.LeatherGlove;
    static armor_id = ArmorID.LeatherGlove;
    static name = 'Leather Glove';
    static type = ArmorType.Glove;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class WoodShield extends Armor {
    static id = ItemID.WoodShield;
    static armor_id = ArmorID.WoodShield;
    static name = 'Wood Shield';
    static type = ArmorType.Shield;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class ReinforcedWoodShield extends Armor {
    static id = ItemID.ReinforcedWoodShield;
    static armor_id = ArmorID.ReinforcedWoodShield;
    static name = 'Reinforced Wood Shield';
    static type = ArmorType.Shield;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export class IronShield extends Armor {
    static id = ItemID.IronShield;
    static armor_id = ArmorID.IronShield;
    static name = 'Iron Shield';
    static type = ArmorType.Shield;
    static base_armor_value = 10;
    static value = 10;
    static weight = 5;
}

export const ArmorRegistry: Record<ArmorID, IArmor> = {
    [ArmorID.IronHelmet]: IronHelmet,
    [ArmorID.IronPlate]: IronPlate,
    [ArmorID.IronMail]: IronMail,
    [ArmorID.IronPants]: IronPants,
    [ArmorID.IronBoots]: IronBoots,
    [ArmorID.IronGauntlet]: IronGauntlet,
    [ArmorID.LeatherHelmet]: LeatherHelmet,
    [ArmorID.LeatherChest]: LeatherChest,
    [ArmorID.LeatherPants]: LeatherPants,
    [ArmorID.LeatherBoots]: LeatherBoots,
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