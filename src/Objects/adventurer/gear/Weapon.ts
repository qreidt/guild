import {EquippableItem} from "./EquippableItem.ts";

export enum WeaponType {
    Sword,
    Bow,
    Dagger,
    Spear,
    Staff,
}

export abstract class BaseWeapon extends EquippableItem {
    public abstract readonly type: WeaponType;
    public abstract readonly range: number;
    public abstract readonly base_damage_value: number;
    public abstract readonly dual_handed: boolean;
    public abstract readonly can_dual_wield: boolean;

    public readonly max_durability: number = 100;

    public readonly damage_value: number;

    constructor() {
        super();
        this.damage_value = this.damageValue;
    }

    /**
     *
     */
    public get damageValue() {
        return this.base_damage_value * this.degradationMultiplier;
    }
}

export class WoodBow extends BaseWeapon {
    public readonly type = WeaponType.Bow
    public readonly value = 10;
    public readonly range = 25;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}

export class ReinforcedWoodBow extends BaseWeapon {
    public readonly type = WeaponType.Bow
    public readonly value = 10;
    public readonly range = 30;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}

export class WoodStaff extends BaseWeapon {
    public readonly range = 30;
    public readonly type = WeaponType.Staff
    public readonly value = 10;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = false;
}

export class IronSword extends BaseWeapon {
    public readonly type = WeaponType.Sword
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = true;
}

// export class IronArrow extends BaseWeapon {
//     public readonly type = WeaponType.Arrow
//     public readonly value = 10;
//     public readonly range = 2;
//     public readonly base_damage_value = 10;
//     public readonly weight = 5;
// }

export class IronDagger extends BaseWeapon {
    public readonly type = WeaponType.Dagger
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = false;
    public readonly can_dual_wield = true;
}

export class IronSpear extends BaseWeapon {
    public readonly type = WeaponType.Spear
    public readonly value = 10;
    public readonly range = 4;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
    public readonly dual_handed = true;
    public readonly can_dual_wield = false;
}
