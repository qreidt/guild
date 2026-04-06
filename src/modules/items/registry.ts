import type {Item} from "./item.ts";
import {ItemID} from "./id.ts";
import Goods from "./values/goods.ts";
import Weapons from "./values/weapons.ts";
import Armors from "./values/armor.ts";


// Registry maps enum → constructor
export const ItemRegistry: Record<ItemID, new () => Item> = {
    // Goods
    [ItemID.Lumber]: Goods.Lumber,
    [ItemID.WoodPlank]: Goods.WoodPlank,
    [ItemID.IronOre]: Goods.IronOre,
    [ItemID.IronIngot]: Goods.IronIngot,

    // Weapons
    [ItemID.WoodBow]: Weapons.WoodBow,
    [ItemID.ReinforcedWoodBow]: Weapons.ReinforcedWoodBow,
    [ItemID.WoodStaff]: Weapons.WoodStaff,
    [ItemID.IronSword]: Weapons.IronSword,
    [ItemID.IronDagger]: Weapons.IronDagger,
    [ItemID.IronSpear]: Weapons.IronSpear,

    // Armors
    [ItemID.IronShield]: Armors.IronShield,
    [ItemID.IronHelmet]: Armors.IronHelmet,
    [ItemID.IronPlate]: Armors.IronPlate,
    [ItemID.IronMail]: Armors.IronMail,
    [ItemID.IronGauntlet]: Armors.IronGauntlet,
    [ItemID.IronPants]: Armors.IronPants,
    [ItemID.IronBoots]: Armors.IronBoots,
    [ItemID.ReinforcedWoodShield]: Armors.ReinforcedWoodShield,
    [ItemID.LeatherHelmet]: Armors.LeatherHelmet,
    [ItemID.LeatherChest]: Armors.LeatherChest,
    [ItemID.LeatherPants]: Armors.LeatherPants,
    [ItemID.LeatherBoots]: Armors.LeatherBoots,
    [ItemID.LeatherGlove]: Armors.LeatherGlove,
    [ItemID.WoodShield]: Armors.WoodShield,
} as const;