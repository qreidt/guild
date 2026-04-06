import {EquippableItem, type IItem} from "../item.ts";
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

interface IWeapon extends IItem {
    type: WeaponType;
    weapon_id: WeaponID;
    base_damage_value: number;
    range: number;
    dual_handed: boolean;
    can_dual_wield: boolean;
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
    protected get static(): IWeapon {
        return this.constructor as unknown as IWeapon;
    }

    /**
     * Real damage output after degradation
     */
    public get damageValue() {
        return this.static.base_damage_value * this.degradationMultiplier;
    }
}

export class WoodBow extends Weapon {
    static id = ItemID.WoodBow;
    static name = 'Wood Bow';
    static type = WeaponType.Bow;
    static weapon_id = WeaponID.WoodBow;
    static value = 10;
    static range = 25;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = true;
    static can_dual_wield = false;
}

export class ReinforcedWoodBow extends Weapon {
    static id = ItemID.ReinforcedWoodBow;
    static name = 'Reinforced Wood Bow';
    static type = WeaponType.Bow;
    static value = 10;
    static range = 30;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = true;
    static can_dual_wield = false;
}

export class WoodStaff extends Weapon {
    static id = ItemID.WoodStaff;
    static name = 'Wood Staff';
    static type = WeaponType.Staff;
    static value = 30;
    static range = 10;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = false;
    static can_dual_wield = false;
}

export class IronSword extends Weapon {
    static id = ItemID.IronSword;
    static name = 'Iron Sword';
    static type = WeaponType.Sword;
    static value = 10;
    static range = 2;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = false;
    static can_dual_wield = true;
}

export class IronDagger extends Weapon {
    static id = ItemID.IronDagger;
    static name = 'Iron Dagger';
    static type = WeaponType.Dagger;
    static value = 10;
    static range = 2;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = false;
    static can_dual_wield = true;
}

export class IronSpear extends Weapon {
    static id = ItemID.IronSpear;
    static name = 'Iron Spear';
    static type = WeaponType.Spear;
    static value = 10;
    static range = 4;
    static base_damage_value = 10;
    static weight = 5;
    static dual_handed = true;
    static can_dual_wield = false;
}

export const WeaponRegistry: Record<WeaponID, IWeapon> = {
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
