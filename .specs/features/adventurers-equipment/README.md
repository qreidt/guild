# Adventurers And Equipment Feature

## Status

Domain model present, not integrated into gameplay UI

## Goal

Represent recruitable adventurers who can hold items, equip gear, improve over time, and eventually participate in missions and expeditions.

## Current implementation surface

The repository currently contains:

- an `Adventurer` class
- enums for ranks, classes, and equipment slots
- an equipment validation model
- abstract base classes for equippable items, weapons, and armor
- concrete iron and wood gear classes

The repository does not currently contain:

- an adventurer roster UI
- recruitment
- mission assignment
- combat
- leveling or trait progression
- persistence of adventurer state

## Adventurer model

### Rank ladder

- Iron
- Bronze
- Silver
- Gold
- Adamantium
- Platinum

### Classes

- Scout
- Swordsman
- Archer
- Mage
- Tank
- Healer
- Spearman

### Core stats currently modeled

- max health
- current damage
- money

### Attributes currently modeled

- Strength
- Agility
- Intelligence
- Vitality
- Wisdom
- Perception
- Luck
- Dexterity
- Stealth

### Proficiencies currently modeled

Weapons and combat:

- sword
- shield
- dual wielding
- bow
- spear

Armor:

- no armor
- light armor
- heavy armor

Magic:

- fire
- ice
- earth
- air
- lightening

Utility:

- herbalism
- survival
- tracking

## Inventory and equipment

Each adventurer currently owns:

- an `InventoryAccountService` keyed as `adventurer:{id}` (migrated from legacy `Inventory` in PR #1)
- an equipment map keyed by slot

Slots:

- Head
- Chest
- Pants
- Gloves
- Boots
- FirstArm
- SecondArm

## Equipment rules already expressed in code

- armor slots only accept armor
- armor pieces must match the slot-specific armor type
- first arm accepts weapons
- second arm rejects most armor except shields
- second arm allows only dual-wield-compatible weapons
- equipping a slot replaces and returns the previously equipped item

## Equipment catalog already defined

### Weapons

- Wood Bow
- Reinforced Wood Bow
- Wood Staff
- Iron Sword
- Iron Dagger
- Iron Spear

### Armor

- Iron Helmet
- Iron Plate
- Iron Mail
- Iron Pants
- Iron Boot
- Iron Gauntlet
- Leather Helmet
- Leather Chest
- Leather Pants
- Leather Boot
- Leather Glove
- Wood Shield
- Reinforced Wood Shield
- Iron Shield

## Durability model

Equippable items already encode:

- current wear
- max durability
- a degradation multiplier

The intent is for item effectiveness to decay with wear:

- linearly up to a threshold
- then more sharply after the threshold

## Item module location

All equipment classes now live in `src/modules/items/`:

- `modules/items/id.ts` — `ItemID` enum
- `modules/items/item.ts` — `Item`, `ItemInstance`, `EquippableItem` base classes
- `modules/items/registry.ts` — `ItemRegistry` (ItemID → constructor)
- `modules/items/values/weapons.ts` — concrete weapon classes + `WeaponType`, `WeaponID`
- `modules/items/values/armor.ts` — concrete armor classes + `ArmorType`, `ArmorID`

## Known implementation gaps

- The adventurer system is not connected to the city or UI.
- There is no combat, loadout screen, or item transfer flow between buildings and adventurers.
- The code models attributes and proficiencies, but no gameplay formulas consume them yet.
- `damage_value` and `armor_value` are stored properties set in the constructor rather than getters, so they do not update when wear increases.

## Design intent from notes

The design notes indicate that adventurers are expected to become the main downstream consumer of crafted gear and the main actors in missions, adventures, and zone exploration.
