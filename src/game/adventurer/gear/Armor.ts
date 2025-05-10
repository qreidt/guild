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

export class Armor extends EquippableItem implements IArmor {
    public readonly type: ArmorType;
    public readonly base_armor_value: number;

    public armor_value: number;

    constructor(id: ArmorID) {
        super(AvailableArmors[id]);
        this.type = AvailableArmors[id].type;
        this.base_armor_value = AvailableArmors[id].base_armor_value;

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

export const AvailableArmors: Record<ArmorID, IArmor> = {
    [ArmorID.IronHelmet]: {
        value: 10,
        type: ArmorType.Head,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronPlate]: {
        value: 10,
        type: ArmorType.Chest,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronMail]: {
        value: 10,
        type: ArmorType.Chest,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronPants]: {
        value: 10,
        type: ArmorType.Pants,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronBoot]: {
        value: 10,
        type: ArmorType.Shoes,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronGauntlet]: {
        value: 10,
        type: ArmorType.Glove,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.LeatherHelmet]: {
        value: 10,
        type: ArmorType.Head,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.LeatherChest]: {
        value: 10,
        type: ArmorType.Chest,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.LeatherPants]: {
        value: 10,
        type: ArmorType.Pants,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.LeatherBoot]: {
        value: 10,
        type: ArmorType.Shoes,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.LeatherGlove]: {
        value: 10,
        type: ArmorType.Glove,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.WoodShield]: {
        value: 10,
        type: ArmorType.Shield,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.ReinforcedWoodShield]: {
        value: 10,
        type: ArmorType.Shield,
        base_armor_value: 10,
        weight: 5,
    },
    [ArmorID.IronShield]: {
        value: 10,
        type: ArmorType.Shield,
        base_armor_value: 10,
        weight: 5,
    },
} as const;

