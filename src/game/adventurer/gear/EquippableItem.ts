import {BaseGood} from "../../common/Good.ts";

export abstract class EquippableItem extends BaseGood {
    public current_damage: number = 0;
    public abstract readonly max_durability: number;

    private readonly _linear_degradation_value: number = 0.5;
    private readonly _linear_degradation_threshold: number = 0.3;

    public readonly buff_strength: number = 0;
    public readonly buff_intelligence: number = 0;
    public readonly buff_agility: number = 0;
    public readonly buff_mana: number = 0;
    public readonly buff_vitality: number = 0;
    public readonly buff_wisdom: number = 0;
    public readonly buff_perception: number = 0;
    public readonly buff_dexterity: number = 0;
    public readonly buff_stealth: number = 0;

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
        if (this.current_damage === 0) {
            return 0;
        }

        return this.current_damage / this.max_durability;
    }
}