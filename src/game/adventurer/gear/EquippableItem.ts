import type {IGood} from "../../common/Good.ts";

export interface IEquippableItem extends IGood {
    // buff_strength: number;
    // buff_intelligence: number;
    // buff_agility: number;
    // buff_mana: number;
    // buff_vitality: number;
    // buff_wisdom: number;
    // buff_perception: number;
    // buff_dexterity: number;
    // buff_stealth: number;
    current_wear: number;
}

export abstract class EquippableItem implements IEquippableItem {
    public value: number = 0;
    public weight: number = 0;

    public current_wear: number = 0;
    public max_durability: number = 100;

    private readonly _linear_degradation_value: number = 0.5;
    private readonly _linear_degradation_threshold: number = 0.3;

    constructor(wear: number = 0) {
        this.current_wear = wear;
    }

    /**
     * Reduce the effectiveness of the item based on the following formula:
     *
     * if damage <= linear_threshold -> use linear degradation
     * else -> use exponential degradation
     */
    protected get degradationMultiplier() {
        const damage = this.currentDamagePercentage;

        const linear_value = 1 - (damage * this._linear_degradation_value);

        // Degradation is linear
        if (damage <= this._linear_degradation_threshold) {
            return linear_value;
        }

        // Exponential
        return linear_value * Math.pow(2, (1 - damage) / this._linear_degradation_threshold);
    }

    /**
     * Get the remaining durability as %
     */
    private get currentDamagePercentage() {
        if (this.current_wear === 0) {
            return 0;
        }

        return this.current_wear / this.max_durability;
    }

    public static getGood(this: {new (): IGood}): IGood {
        const instance = new this();
        return {
            value: instance.value,
            weight: instance.weight,
        };
    }
}

class WrongEquippableItemTypeError extends Error {
    constructor(expected: string, got: string) {
        super(`[WrongEquippableItemType] Expected: ${expected} and got: ${got}.`);
    }
}
