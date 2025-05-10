import {EquippableItem} from "./EquippableItem.ts";
import type {IEquippableItem} from "./EquippableItem.ts";

export enum WeaponType {
    Sword,
    Bow,
    Dagger,
    Spear,
    Staff,
}

export interface IWeapon extends IEquippableItem {
    type: WeaponType;
    range: number;
    base_damage_value: number;
    dual_handed: boolean;
    can_dual_wield: boolean;
}

export class Weapon extends EquippableItem implements IWeapon {
    public readonly type: WeaponType;
    public readonly range: number;
    public readonly base_damage_value: number;
    public readonly dual_handed: boolean;
    public readonly can_dual_wield: boolean;

    public readonly damage_value: number;

    constructor(id: WeaponID) {
        super(AvailableWeapons[id]);

        this.type = AvailableWeapons[id].type;
        this.range = AvailableWeapons[id].range;
        this.base_damage_value = AvailableWeapons[id].base_damage_value;
        this.dual_handed = AvailableWeapons[id].dual_handed;
        this.can_dual_wield = AvailableWeapons[id].can_dual_wield;

        this.damage_value = this.damageValue;
    }

    /**
     *
     */
    public get damageValue() {
        return this.base_damage_value * this.degradationMultiplier;
    }
}

export enum WeaponID {
    WoodBow,
    ReinforcedWoodBow,
    WoodStaff,
    IronSword,
    IronDagger,
    IronSpear,
    // IronArrow,
}

export const AvailableWeapons: Record<WeaponID, IWeapon> = {
    [WeaponID.WoodBow]: {
        type: WeaponType.Bow,
        value: 10,
        range: 25,
        base_damage_value: 10,
        weight: 5,
        dual_handed: true,
        can_dual_wield: false,
    },
    [WeaponID.ReinforcedWoodBow]: {
        type: WeaponType.Bow,
        value: 10,
        range: 30,
        base_damage_value: 10,
        weight: 5,
        dual_handed: true,
        can_dual_wield: false,
    },
    [WeaponID.WoodStaff]: {
        range: 30,
        type: WeaponType.Staff,
        value: 10,
        base_damage_value: 10,
        weight: 5,
        dual_handed: false,
        can_dual_wield: false,
    },
    [WeaponID.IronSword]: {
        type: WeaponType.Sword,
        value: 10,
        range: 2,
        base_damage_value: 10,
        weight: 5,
        dual_handed: false,
        can_dual_wield: true,
    },
    [WeaponID.IronDagger]: {
        type: WeaponType.Dagger,
        value: 10,
        range: 2,
        base_damage_value: 10,
        weight: 5,
        dual_handed: false,
        can_dual_wield: true,
    },
    [WeaponID.IronSpear]: {
        type: WeaponType.Spear,
        value: 10,
        range: 4,
        base_damage_value: 10,
        weight: 5,
        dual_handed: true,
        can_dual_wield: false,
    },
    // [WeaponID.IronArrow]: {
    //     type: WeaponType.Arrow,
    //     value: 10,
    //     range: 2,
    //     base_damage_value: 10,
    //     weight: 5,
    // },
}
