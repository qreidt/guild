# Buildings And Economy Feature

## Status

Prototype, partially implemented

## Goal

Provide the first playable economic backbone of the game through building-owned workers, time-based production actions, and inventory-backed resource flows.

## Core concepts

### Building

Each building:

- has a `BuildingID`
- has a name, level, and local money counter
- owns a building-scoped inventory account service
- owns one or more workers
- decides the next action for each available worker

### Worker

Each worker can hold one active action. A worker is available when:

- it has no action, or
- its current action is finished

### Action

An action:

- has a total duration in ticks
- may validate or reserve input goods
- may emit output goods
- may gate ticking based on contextual rules such as day/night
- commits side effects when finished

### TransportAction

A transport action computes sale value from the value of its input goods and adds that value to the owning building's local money counter when finished.

## Building catalog

### Lumber Mill

Current intended role:

- gather raw lumber from trees
- convert lumber into wood planks
- sell wood planks in batches

Current worker count:

- 1

Current action selection logic:

- if `WoodPlank >= 80`, sell 80 wood planks
- else if `Lumber > 0`, convert 1 lumber into 20 wood planks
- else take down a tree

Documented design intent from `src/game/city/buildings/docs/lumber-mill.md`:

- chop tree
- transport the tree
- generate 1 lumber
- process 1 lumber into 20 wood
- transport up to 80 wood to the city and sell it

### Iron Mine

Current intended role:

- mine iron ore
- sell ore in batches

Current worker count:

- 1

Current action selection logic:

- if `IronOre >= 80`, sell 80 iron ore
- else mine more ore

### BlackSmith

Current intended role:

- refine ore into ingots
- craft iron weapons and armor
- maintain minimum stock targets across multiple item types

Current worker count:

- 2

Seeded starting inventory:

- `IronOre = 400`
- `IronSword = 1`

Current production priority order:

- Iron Sword until 12
- Iron Shield until 8
- Iron Helmet until 6
- Iron Plate until 4
- Iron Mail until 4
- Iron Pants until 8
- Iron Boots until 8
- Iron Gauntlet until 8
- Iron Spear until 4

Fallback behavior:

- if ore is available, make ingots
- otherwise wait

## Goods catalog in active economy

Items are defined in `src/modules/items/` and identified by `ItemID`. Stackable goods have `stackable = true` and are tracked by count in a `GoodLedger`. Equipment instances are tracked individually in the `instances` array.

### Raw and refined materials (`modules/items/values/goods.ts`)

| ItemID | Name | Value | Weight |
| --- | --- | ---: | ---: |
| Lumber | Lumber | 10 | 20 |
| WoodPlank | Wood Plank | 1 | 1 |
| IronOre | Iron Ore | 2 | 1 |
| IronIngot | Iron Ingot | 5 | 1 |

### Produced equipment (`modules/items/values/weapons.ts`, `armor.ts`)

The current available equipment set — all with placeholder stats pending differentiation:

**Weapons:** Iron Sword, Iron Dagger, Iron Spear, Wood Bow, Reinforced Wood Bow, Wood Staff

**Armor:** Iron Helmet, Iron Plate, Iron Mail, Iron Gauntlet, Iron Pants, Iron Boots, Iron Shield, Leather Helmet, Leather Chest, Leather Pants, Leather Glove, Leather Boots, Wood Shield, Reinforced Wood Shield

## Inventory accounting model

The active economy uses an in-memory account system.

- every building and entity gets an inventory account keyed by a string `InventoryID`
- `InventoryAccount` stores stackable goods as `GoodLedger` (`Map<ItemID, number>`) and equipment as `EquippableItem[]`
- transactions reserve goods from an origin account and commit them to a destination account on completion
- equipment instance transactions are marked as not yet implemented

## Economy rules that are already present

- item value and weight are defined on item classes in the items module
- buildings can track their own earned money
- production can branch based on current inventory state
- multiple workers can run building actions in parallel

## Known implementation gaps

- The lumber mill's `TakeDownTreeAction` is coded with an input of one `WoodPlank` and no output, which does not match the documented design intent and would block the lumber loop from bootstrapping correctly.
- Sales currently increase `building.money`, while the visible header shows `city.money`. The visible treasury therefore does not yet reflect production output.
- Some actions do not fully configure `input_origin` and `output_destination`, so transaction behavior is not yet a reliable source of truth for all recipes.
- The blacksmith's crafting flow is partially implemented at the recipe level but not yet validated as a fully correct closed-loop economy.
- Equipment transactions are explicitly marked as not implemented.
