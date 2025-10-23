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

export abstract class Weapon extends EquippableItem implements Partial<IWeapon> {

    public readonly value: number = 0;
    public readonly weight: number = 0;
    public readonly base_damage_value: number = 0;
    public readonly damage_value: number;

    constructor(wear: number = 0) {
        super(wear);
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
    //IronArrow,
}

export class WoodBow extends Weapon implements IWeapon {
    public readonly type = WeaponType.Bow;
    public readonly value = 10;
    public readonly range = 25;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}

export class ReinforcedWoodBow extends Weapon implements IWeapon {
    public readonly type = WeaponType.Bow;
    public readonly value = 10;
    public readonly range = 30;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}

export class WoodStaff extends Weapon implements IWeapon {
    public readonly type = WeaponType.Staff;
    public readonly value = 30;
    public readonly range = 10;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = false;
}

export class IronSword extends Weapon implements IWeapon {
    public readonly type = WeaponType.Sword;
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = true;
}

export class IronDagger extends Weapon implements IWeapon {
    public readonly type = WeaponType.Dagger;
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = true;
}

export class IronSpear extends Weapon implements IWeapon {
    public readonly type = WeaponType.Spear;
    public readonly value = 10;
    public readonly range = 4;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}

export const AvailableWeapons: Record<WeaponID, IWeapon> = {
    [WeaponID.WoodBow]: new WoodBow(),
    [WeaponID.ReinforcedWoodBow]: new ReinforcedWoodBow(),
    [WeaponID.WoodStaff]: new WoodStaff(),
    [WeaponID.IronSword]: new IronSword(),
    [WeaponID.IronDagger]: new IronDagger(),
    [WeaponID.IronSpear]: new IronSpear(),
}

export default {
    IronSword,
    IronSpear,
};
