import {ItemID} from "./id.ts";

export abstract class Item {
    abstract readonly id: ItemID;
    abstract readonly name: string;
    abstract readonly weight: number;
    abstract readonly value: number;
    readonly stackable: boolean = true;
}

export abstract class ItemInstance extends Item {
    readonly stackable: boolean = false;
}

export abstract class EquippableItem extends ItemInstance {
    public current_wear: number = 0;
    public max_durability: number = 100;

    private readonly _linear_degradation_value: number = 0.5;
    private readonly _linear_degradation_threshold: number = 0.3;

    protected constructor(wear: number = 0) {
        super();
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
}