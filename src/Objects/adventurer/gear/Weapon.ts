import {EquippableItem} from "./EquippableItem.ts";


export abstract class BaseWeapon extends EquippableItem {
    public abstract readonly range: number;
    public abstract readonly base_damage_value: number;

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
    public readonly value = 10;
    public readonly range = 25;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class ReinforcedWoodBow extends BaseWeapon {
    public readonly value = 10;
    public readonly range = 30;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class WoodStaff extends BaseWeapon {
    public readonly range = 30;
    public readonly value = 10;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class IronSword extends BaseWeapon {
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class IronArrow extends BaseWeapon {
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class IronDagger extends BaseWeapon {
    public readonly value = 10;
    public readonly range = 2;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}

export class IronSpear extends BaseWeapon {
    public readonly value = 10;
    public readonly range = 4;
    public readonly base_damage_value = 10;
    public readonly weight = 5;
}
