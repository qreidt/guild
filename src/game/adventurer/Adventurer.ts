import {Inventory} from "../common/Inventory.ts";
import {ArmorType, BaseArmor} from "./gear/Armor.ts";
import {BaseWeapon} from "./gear/Weapon.ts";
import type {EquippableItem} from "./gear/EquippableItem.ts";

export enum AdventurerRank {
    Iron,
    Bronze,
    Silver,
    Gold,
    Adamantium,
    Platinum,
}

export enum AdventurerClass {
    Scout,
    Swordsman,
    Archer,
    Mage,
    Tank,
    Healer,
    Spearman,
}

export enum AdventurerEquipmentSlot {
    Head,
    Chest,
    Pants,
    Gloves,
    Boots,
    FirstArm,
    SecondArm,
}

type AdventurerEquipment = Map<AdventurerEquipmentSlot, EquippableItem>;

export class Adventurer {
    public rank: AdventurerRank = AdventurerRank.Iron;
    public class: AdventurerClass = AdventurerClass.Scout;

    public max_health: number = 30;
    public current_damage: number = 0;

    public money = 100;

    // Attributes
    public attribute_strength: number = 1;
    public attribute_agility: number = 1;
    public attribute_intelligence: number = 5;
    public attribute_vitality: number = 3;
    public attribute_wisdom: number = 1;
    public attribute_perception: number = 1;
    public attribute_luck: number = 1;
    public attribute_dexterity: number = 1;
    public attribute_stealth: number = 1;

    // Proficiencies proficiency
    // Equipment
    public proficiency_sword: number = 0;
    public proficiency_shield: number = 0;
    public proficiency_dual_wielding: number = 0;
    public proficiency_bow: number = 0;
    public proficiency_spear: number = 0;

    // Armor
    public proficiency_no_armor: number = 0;
    public proficiency_light_armor: number = 0;
    public proficiency_heavy_armor: number = 0;

    // Magic
    public proficiency_fire: number = 0;
    public proficiency_ice: number = 0;
    public proficiency_earth: number = 0;
    public proficiency_air: number = 0;
    public proficiency_lightening: number = 0;

    // Utility
    public proficiency_herbalism: number = 0;
    public proficiency_survival: number = 0;
    public proficiency_tracking: number = 0;

    public inventory: Inventory = new Inventory();

    public equipment: AdventurerEquipment = new Map();

    /**
     * Adds an item to the desired slot.
     *
     * If another item already exists in that slot, returns the item.
     *
     * @param slot
     * @param item
     */
    public equipItem(slot: AdventurerEquipmentSlot, item: EquippableItem): null|EquippableItem {
        if (! this.validateEquipItem(slot, item)) {
            return null; // ToDo throw exception
        }

        const equipped_item = this.unEquipItem(slot);
        this.equipment.set(slot, item);

        return equipped_item;
    }

    private validateEquipItem(slot: AdventurerEquipmentSlot, item: EquippableItem): boolean {
        switch (slot) {
            case AdventurerEquipmentSlot.Head:
            case AdventurerEquipmentSlot.Chest:
            case AdventurerEquipmentSlot.Pants:
            case AdventurerEquipmentSlot.Gloves:
            case AdventurerEquipmentSlot.Boots:
                if (!(item instanceof BaseArmor)) {
                    return false;
                }

                return ({
                    [AdventurerEquipmentSlot.Head]: ArmorType.Head,
                    [AdventurerEquipmentSlot.Chest]: ArmorType.Chest,
                    [AdventurerEquipmentSlot.Pants]: ArmorType.Pants,
                    [AdventurerEquipmentSlot.Gloves]: ArmorType.Glove,
                    [AdventurerEquipmentSlot.Boots]: ArmorType.Shoes,
                }[slot]) === item.type;

            case AdventurerEquipmentSlot.FirstArm:
                if (! (item instanceof BaseWeapon)) {
                    return false;
                }

                // Check if item in the secondary hand if equipping a dual handed weapon
                if (item.dual_handed && ! this.equipment.has(AdventurerEquipmentSlot.SecondArm)) {
                    return true;
                }

                return true;

            case AdventurerEquipmentSlot.SecondArm:
                // check if the first hand has a dual handed weapon
                if (this.equipment.has(AdventurerEquipmentSlot.FirstArm)) {
                    return false;
                }

                // Only allow shield as armor
                if (item instanceof BaseArmor && item.type !== ArmorType.Shield) {
                    return false;
                }

                // Allow only items that can be dual weld.
                return item instanceof BaseWeapon && item.can_dual_wield;
        }
    }

    public unEquipItem(slot: AdventurerEquipmentSlot): null | EquippableItem {
        const item = this.equipment.get(slot) ?? null;
        this.equipment.delete(slot);

        return item;
    }
}