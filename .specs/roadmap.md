# Roadmap Spec

This roadmap combines explicit goals from `README.md` with the additional design notes in `_.md` and `src/game/adventurer/_.md`.

## Current maturity

The project is at prototype stage. The city produces goods, trades them through a Market, and posts quests that one adventurer fulfils. Most player-facing progression systems are still planned.

## Near-term roadmap

### Shipped since the April 2026 snapshot

- the TypeScript build passes. `npm run build` was green on 2026-09-12
- the raw building object dump is gone. Each building has a 2D interior and the city has a 3D view (CQR-53)
- the building roster grew from three to six: Market, Apothecary and Adventurers' Guild (city-market, CQR-59, CQR-60)
- building inventories and worker states are visible in each interior
- a read-only adventurer roster exists, with one seeded Scout (CQR-61)

### 1. Stabilize the prototype

- reconcile intended building recipes with actual action definitions
- make produced economic value visible at the city level
- document and normalize inventory/accounting rules

### 2. Complete the city resource loop

- support reliable production of lumber, wood, ore, ingots, and finished gear
- add building upgrades and construction decisions
- expand the building roster further

### 3. Introduce adventurer management

- recruit adventurers
- assign classes, gear, and inventories
- support traits, ranks, and leveling
- surface adventurers in the UI as managed roster entities, not only as a read-only list

### 4. Add missions and expeditions

- create missions with rank and reward expectations
- assemble adventurer groups
- resolve outcomes such as loot, kills, and damage
- connect expeditions back into the city economy

### 5. Add persistence

- save and load game state through local storage
- preserve city, building, inventory, and adventurer progression

## Planned buildings from design notes

Built:

- Mine
- Lumber Mill
- Black Smith
- Apothecary

Not yet built:

- Tannery
- Fletcher
- Hunter's Lodge

## Planned world content from design notes

### Forest zone

Expected creatures and gathering targets:

- boars
- wolves
- bears
- deer
- rabbits
- goblins
- slimes
- mushroom spawn
- bats
- bandits

### Labyrinth zone

Expected enemies:

- goblins
- slimes
- skeletons
- mushroom spawn
- giant rats
- zombies

Expected boss examples:

- Goblin Chief
- Sewer King Rat
- Flame Wisp Alpha
- Bone Warden

## Planned player systems from design notes

- adventurer ranks
- mission rank matching
- monster ranks
- loot tables
- zone danger ratings
- equipment durability
- crafting chains for armor, weapons, and consumables

## Roadmap risks

- the current economy model is not stable enough yet to support larger content additions safely
- the app needs a persistent save format before progression systems become meaningful
- the world and combat specs are broader than the current UI and architecture, so expansion should stay incremental
