import {EquippableItem} from "../item.ts";
import {ItemID} from "../id.ts";

export enum WeaponType {
    Sword,
    Bow,
    Dagger,
    Spear,
    Staff,
}

export enum WeaponID {
    WoodBow,
    ReinforcedWoodBow,
    WoodStaff,
    IronSword,
    IronDagger,
    IronSpear,
    //IronArrow,
}

export abstract class Weapon extends EquippableItem {

    public static type: WeaponType;
    public static weapon_id: WeaponID;
    public static base_damage_value: number;
    public static range: number;
    public static dual_handed: boolean;
    public static can_dual_wield: boolean;

    public damage_value: number;

    constructor(wear: number = 0) {
        super(wear);
        this.damage_value = this.damageValue;
    }


    /** Shortcut to access static props from the subclass */
    protected get static(): typeof Weapon {
        return this.constructor as typeof Weapon;
    }

    /**
     * Real damage output after degradation
     */
    public get damageValue() {
        return this.static.base_damage_value * this.degradationMultiplier;
    }
}

export class WoodBow extends Weapon {
    id = ItemID.WoodBow;
    name = 'Wood Bow';
    type = WeaponType.Bow;
    value = 10;
    range = 25;
    base_damage_value = 10;
    weight = 5;
    dual_handed = true;
    can_dual_wield = false;
}

export class ReinforcedWoodBow extends Weapon {
    id = ItemID.ReinforcedWoodBow;
    name = 'Reinforced Wood Bow';
    type = WeaponType.Bow;
    value = 10;
    range = 30;
    base_damage_value = 10;
    weight = 5;
    dual_handed = true;
    can_dual_wield = false;
}

export class WoodStaff extends Weapon {
    id = ItemID.WoodStaff;
    name = 'Wood Staff';
    type = WeaponType.Staff;
    value = 30;
    range = 10;
    base_damage_value = 10;
    weight = 5;
    dual_handed = false;
    can_dual_wield = false;
}

export class IronSword extends Weapon {
    id = ItemID.IronSword;
    name = 'Iron Sword';
    type = WeaponType.Sword;
    value = 10;
    range = 2;
    base_damage_value = 10;
    weight = 5;
    dual_handed = false;
    can_dual_wield = true;
}

export class IronDagger extends Weapon {
    id = ItemID.IronDagger;
    name = 'Iron Dagger';
    type = WeaponType.Dagger;
    value = 10;
    range = 2;
    base_damage_value = 10;
    weight = 5;
    dual_handed = false;
    can_dual_wield = true;
}

export class IronSpear extends Weapon {
    id = ItemID.IronSpear;
    name = 'Iron Spear';
    type = WeaponType.Spear;
    value = 10;
    range = 4;
    base_damage_value = 10;
    weight = 5;
    dual_handed = true;
    can_dual_wield = false;
}

export const WeaponRegistry: Record<WeaponID, new () => Weapon> = {
    [WeaponID.WoodBow]: WoodBow,
    [WeaponID.ReinforcedWoodBow]: ReinforcedWoodBow,
    [WeaponID.WoodStaff]: WoodStaff,
    [WeaponID.IronSword]: IronSword,
    [WeaponID.IronDagger]: IronDagger,
    [WeaponID.IronSpear]: IronSpear,
} as const;

export default {
    WoodBow,
    ReinforcedWoodBow,
    WoodStaff,
    IronSword,
    IronDagger,
    IronSpear,
};
