import {Inventory} from "../common/Inventory.ts";
import {BaseArmor} from "./gear/Armor.ts";
import {BaseWeapon} from "./gear/Weapon.ts";

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

    // Equipment
    public equipment_head: null | BaseArmor = null;
    public equipment_chest: null | BaseArmor = null;
    public equipment_gloves: null | BaseArmor = null;
    public equipment_pants: null | BaseArmor = null;
    public equipment_shoes: null | BaseArmor = null;

    // Weapons and Shield
    public first_hand_equipment: null | BaseWeapon = null;
    public second_hand_equipment: null | BaseWeapon | BaseArmor = null;
}