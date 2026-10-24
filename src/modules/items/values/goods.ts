import {Item} from "../item.ts";
import {ItemID} from "../id.ts";

export class Lumber extends Item {
    static id = ItemID.Lumber;
    static name = 'Lumber';
    static value = 10;
    static weight = 20;
}

export class WoodPlank extends Item {
    static id = ItemID.WoodPlank;
    static name = 'Wood Plank';
    static value = 1;
    static weight = 1;
}

export class IronOre extends Item {
    static id = ItemID.IronOre;
    static name = 'Iron Ore';
    static value = 2;
    static weight = 1;
}

export class IronIngot extends Item {
    static id = ItemID.IronIngot;
    static name = 'Iron Ingot';
    static value = 5;
    static weight = 1;
}

// ---------------------------------------------------------------------------
// Herbs — foraged reagents for the Apothecary. Stackable, all weight 1. Only
// Bloodroot and Manabloom have a recipe today; the rest are authored up-front so
// future loot/forage tables and recipes have stable ItemIDs to target. Tier
// (Common / Uncommon / Rare) is descriptive only and drives no code — it is
// reflected in the value ladder: common ≈ IronOre, uncommon ≈ IronSword, rare ≈
// WoodStaff.
// ---------------------------------------------------------------------------

export class Greycap extends Item {
    static id = ItemID.Greycap;
    static name = 'Greycap';
    static value = 2;
    static weight = 1;
}

export class Stonemoss extends Item {
    static id = ItemID.Stonemoss;
    static name = 'Stonemoss';
    static value = 2;
    static weight = 1;
}

export class Thistlewort extends Item {
    static id = ItemID.Thistlewort;
    static name = 'Thistlewort';
    static value = 2;
    static weight = 1;
}

export class Hollowreed extends Item {
    static id = ItemID.Hollowreed;
    static name = 'Hollowreed';
    static value = 2;
    static weight = 1;
}

export class Bloodroot extends Item {
    static id = ItemID.Bloodroot;
    static name = 'Bloodroot';
    static value = 3;
    static weight = 1;
}

export class Manabloom extends Item {
    static id = ItemID.Manabloom;
    static name = 'Manabloom';
    static value = 3;
    static weight = 1;
}

export class Sunleaf extends Item {
    static id = ItemID.Sunleaf;
    static name = 'Sunleaf';
    static value = 3;
    static weight = 1;
}

export class Oxroot extends Item {
    static id = ItemID.Oxroot;
    static name = 'Oxroot';
    static value = 3;
    static weight = 1;
}

export class Bitterleaf extends Item {
    static id = ItemID.Bitterleaf;
    static name = 'Bitterleaf';
    static value = 3;
    static weight = 1;
}

export class Ashcap extends Item {
    static id = ItemID.Ashcap;
    static name = 'Ashcap';
    static value = 3;
    static weight = 1;
}

export class Coldmint extends Item {
    static id = ItemID.Coldmint;
    static name = 'Coldmint';
    static value = 4;
    static weight = 1;
}

export class Sourberry extends Item {
    static id = ItemID.Sourberry;
    static name = 'Sourberry';
    static value = 4;
    static weight = 1;
}

export class Copperfern extends Item {
    static id = ItemID.Copperfern;
    static name = 'Copperfern';
    static value = 4;
    static weight = 1;
}

export class Duskbloom extends Item {
    static id = ItemID.Duskbloom;
    static name = 'Duskbloom';
    static value = 5;
    static weight = 1;
}

export class Gallnut extends Item {
    static id = ItemID.Gallnut;
    static name = 'Gallnut';
    static value = 8;
    static weight = 1;
}

export class Mirebloom extends Item {
    static id = ItemID.Mirebloom;
    static name = 'Mirebloom';
    static value = 8;
    static weight = 1;
}

export class Witchhazel extends Item {
    static id = ItemID.Witchhazel;
    static name = 'Witchhazel';
    static value = 9;
    static weight = 1;
}

export class IronbarkMoss extends Item {
    static id = ItemID.IronbarkMoss;
    static name = 'Ironbark Moss';
    static value = 10;
    static weight = 1;
}

export class Bloodcap extends Item {
    static id = ItemID.Bloodcap;
    static name = 'Bloodcap';
    static value = 10;
    static weight = 1;
}

export class Foxglove extends Item {
    static id = ItemID.Foxglove;
    static name = 'Foxglove';
    static value = 11;
    static weight = 1;
}

export class Moonwort extends Item {
    static id = ItemID.Moonwort;
    static name = 'Moonwort';
    static value = 12;
    static weight = 1;
}

export class Nightshade extends Item {
    static id = ItemID.Nightshade;
    static name = 'Nightshade';
    static value = 12;
    static weight = 1;
}

export class Emberfruit extends Item {
    static id = ItemID.Emberfruit;
    static name = 'Emberfruit';
    static value = 12;
    static weight = 1;
}

export class Amberseed extends Item {
    static id = ItemID.Amberseed;
    static name = 'Amberseed';
    static value = 14;
    static weight = 1;
}

export class Frostcap extends Item {
    static id = ItemID.Frostcap;
    static name = 'Frostcap';
    static value = 28;
    static weight = 1;
}

export class Ghostcap extends Item {
    static id = ItemID.Ghostcap;
    static name = 'Ghostcap';
    static value = 30;
    static weight = 1;
}

export class Glowspore extends Item {
    static id = ItemID.Glowspore;
    static name = 'Glowspore';
    static value = 32;
    static weight = 1;
}

export class Cryptbloom extends Item {
    static id = ItemID.Cryptbloom;
    static name = 'Cryptbloom';
    static value = 35;
    static weight = 1;
}

export class Starbloom extends Item {
    static id = ItemID.Starbloom;
    static name = 'Starbloom';
    static value = 36;
    static weight = 1;
}

export class Silverleaf extends Item {
    static id = ItemID.Silverleaf;
    static name = 'Silverleaf';
    static value = 38;
    static weight = 1;
}

export class Heartsap extends Item {
    static id = ItemID.Heartsap;
    static name = 'Heartsap';
    static value = 40;
    static weight = 1;
}

export class Emberheart extends Item {
    static id = ItemID.Emberheart;
    static name = 'Emberheart';
    static value = 42;
    static weight = 1;
}

export class Kingsroot extends Item {
    static id = ItemID.Kingsroot;
    static name = 'Kingsroot';
    static value = 45;
    static weight = 1;
}

// ---------------------------------------------------------------------------
// Everyday ingredients — what the Apothecary's townsfolk goods are made from.
// Deliberately NOT part of the herb catalog above: nothing brews a potion from
// these. `value` does double duty — it is the market price AND the per-unit
// reward the Apothecary pays to have one gathered, because the engine has one
// value field. Tuning one tunes the other. Stackable, all weight 1.
//
// Where each one grows is authored as a comment in `FORAGE_TABLE`, not here:
// every one of them forages from the Forest until a Coast exists.
// ---------------------------------------------------------------------------

export class Kelp extends Item {
    static id = ItemID.Kelp;
    static name = 'Kelp';
    static value = 1;
    static weight = 1;
}

export class Mint extends Item {
    static id = ItemID.Mint;
    static name = 'Mint';
    static value = 1;
    static weight = 1;
}

export class CarrageenMoss extends Item {
    static id = ItemID.CarrageenMoss;
    static name = 'Carrageen Moss';
    static value = 2;
    static weight = 1;
}

export class WillowBark extends Item {
    static id = ItemID.WillowBark;
    static name = 'Willow Bark';
    static value = 2;
    static weight = 1;
}

export class SphagnumMoss extends Item {
    static id = ItemID.SphagnumMoss;
    static name = 'Sphagnum Moss';
    static value = 2;
    static weight = 1;
}

export class PineResin extends Item {
    static id = ItemID.PineResin;
    static name = 'Pine Resin';
    static value = 3;
    static weight = 1;
}

export class ValerianRoot extends Item {
    static id = ItemID.ValerianRoot;
    static name = 'Valerian Root';
    static value = 4;
    static weight = 1;
}

export class Sulfur extends Item {
    static id = ItemID.Sulfur;
    static name = 'Sulfur';
    static value = 5;
    static weight = 1;
}

// ---------------------------------------------------------------------------
// Everyday goods — the Apothecary's townsfolk line, taken to market the moment
// they are made. `value` IS the sale price; the market prices every trade at
// `ItemRegistry[item].value`, so there is no second field to set.
//
// Sale price is 2× the ingredient cost, except Moss Bandage (3×) and Pine Balm
// (2.67×). Those two are authored, not slips: the brief gave them a pantry
// ingredient each — linen and beeswax — which CQR-118 dropped, taking 2g of
// cost out without changing the price. Tuned later.
// ---------------------------------------------------------------------------

export class KelpSoap extends Item {
    static id = ItemID.KelpSoap;
    static name = 'Kelp Soap';
    static value = 6;
    static weight = 1;
}

export class CoughSyrup extends Item {
    static id = ItemID.CoughSyrup;
    static name = 'Cough Syrup';
    static value = 8;
    static weight = 1;
}

export class WillowBarkTea extends Item {
    static id = ItemID.WillowBarkTea;
    static name = 'Willow Bark Tea';
    static value = 10;
    static weight = 1;
}

export class MossBandage extends Item {
    static id = ItemID.MossBandage;
    static name = 'Moss Bandage';
    static value = 12;
    static weight = 1;
}

export class PineBalm extends Item {
    static id = ItemID.PineBalm;
    static name = 'Pine Balm';
    static value = 16;
    static weight = 1;
}

export class SleepingDraught extends Item {
    static id = ItemID.SleepingDraught;
    static name = 'Sleeping Draught';
    static value = 16;
    static weight = 1;
}

export class SulfurOintment extends Item {
    static id = ItemID.SulfurOintment;
    static name = 'Sulfur Ointment';
    static value = 20;
    static weight = 1;
}

// ---------------------------------------------------------------------------
// Potions — brewed by the Apothecary. 3 herbs (9g) → 1 potion (20g), the same
// ~2× markup the LumberMill takes on Lumber → WoodPlank.
// ---------------------------------------------------------------------------

export class HealthPotion extends Item {
    static id = ItemID.HealthPotion;
    static name = 'Health Potion';
    static value = 20;
    static weight = 1;
}

export class ManaPotion extends Item {
    static id = ItemID.ManaPotion;
    static name = 'Mana Potion';
    static value = 20;
    static weight = 1;
}

export default {
    Lumber, WoodPlank, IronOre, IronIngot,
    // Herbs
    Greycap, Stonemoss, Thistlewort, Hollowreed, Bloodroot, Manabloom, Sunleaf,
    Oxroot, Bitterleaf, Ashcap, Coldmint, Sourberry, Copperfern, Duskbloom,
    Gallnut, Mirebloom, Witchhazel, IronbarkMoss, Bloodcap, Foxglove, Moonwort,
    Nightshade, Emberfruit, Amberseed, Frostcap, Ghostcap, Glowspore, Cryptbloom,
    Starbloom, Silverleaf, Heartsap, Emberheart, Kingsroot,
    // Everyday ingredients
    Kelp, Mint, CarrageenMoss, WillowBark, SphagnumMoss, PineResin,
    ValerianRoot, Sulfur,
    // Everyday goods
    KelpSoap, CoughSyrup, WillowBarkTea, MossBandage, PineBalm,
    SleepingDraught, SulfurOintment,
    // Potions
    HealthPotion, ManaPotion,
};