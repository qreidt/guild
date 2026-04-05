import type {EquippableItem} from "../adventurer/gear/EquippableItem.ts";

console.log(`[Goods] Loaded`);

export interface IGood {
    value: number;
    weight: number;
    base_class?: { new(): EquippableItem };
}

export enum GoodType {
    Good = 1,
    Equipable = 2,
}

export enum GoodID {
    Lumber = 'Lumber',
    WoodPlank = 'WoodPlank',
    IronOre = 'IronOre',
    IronIngot = 'IronIngot',

    // Weapons
    IronSword = 'IronSword',
    IronSpear = 'IronSpear',

    // Armors
    IronShield = 'IronShield',
    IronHelmet = 'IronHelmet',
    IronPlate = 'IronPlate',
    IronMail = 'IronMail',
    IronGauntlet = 'IronGauntlet',
    IronPants = 'IronPants',
    IronBoots = 'IronBoots',

    // ToDo Add rest of goods

    // Deer,
    // DeerPelt,
    // DeerMeat,
    // Boar,
    // BoarPelt,
    // BoarMeat,
    // Wolf,
    // WolfPelt,
    // WolfMeat,
    // SharpFang,
    // BeastClaw,
    // Bear,
    // BearPelt,
    // BearMeat,
    // SlimeJelly,
    // MonsterCore,
    // RustyDagger,
    // TatteredCloth,
    // RatTail,
    // ChewedLeather,
    // BoneShard,
    // BatWing,
    // EchoCrystal,
    // BoneFragment,
    // RustedSword,
    // SoulDust,
    // WispEssence,
    // GhostlightShard,
    // Spores,
    // FungalCap,
    // HealingHerb,
    // RatKingFang,
    // ToxicGland,
    // WardenBlade,
    // BoneCrest,
    // CursedAsh,
    // EmberCore,
    // FlickeringFlame,
    // ArcaneOre,
    // ShardOfAwakening,
    // FungalCrown,
    // ToxicSporeSack,
    // RegrowthExtract,
}
